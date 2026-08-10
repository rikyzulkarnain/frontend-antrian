'use client';
import { useEffect, useRef, useState } from 'react';
import { VideoBackground } from '@/components/display/video-background';
import { CurrentQueueBoard } from '@/components/display/current-queue-board';
import { DisplayTicker } from '@/components/display/ticker';
import {
  QueueAnnouncement,
  primeTTS,
  type CallBanner,
} from '@/components/display/queue-announcement';
import { useCurrentQueues } from '@/hooks/useCurrentQueues';
import { useLastQueue } from '@/hooks/useLastQueue';
import { useQueueEvents } from '@/hooks/useQueueEvents';
import { useAutoFullscreen } from '@/hooks/useAutoFullscreen';
import { counterApi } from '@/lib/api/counter';
import { COUNTERS, type Counter } from '@/lib/constants';

export default function DisplayPage() {
  const queues = useCurrentQueues();
  const lastQueue = useLastQueue();
  const [counters, setCounters] = useState<Counter[]>(COUNTERS);
  const [banner, setBanner] = useState<CallBanner | null>(null);
  // Display TV biasanya tanpa mouse: suara langsung aktif. Agar benar-benar
  // jalan tanpa interaksi, jalankan browser dengan flag autoplay (lihat README).
  const [audioActivated, setAudioActivated] = useState(true);

  useAutoFullscreen();

  // Prime TTS/AudioContext saat load, lalu prime ulang pada interaksi pertama
  // apa pun (sentuh layar, keyboard, remote) sebagai cadangan bila browser
  // memblokir audio tanpa gesture.
  useEffect(() => {
    primeTTS();
    const activate = () => {
      primeTTS();
      setAudioActivated(true);
    };
    const opts = { passive: true } as const;
    window.addEventListener('pointerdown', activate, opts);
    window.addEventListener('keydown', activate, opts);
    window.addEventListener('touchstart', activate, opts);
    return () => {
      window.removeEventListener('pointerdown', activate);
      window.removeEventListener('keydown', activate);
      window.removeEventListener('touchstart', activate);
    };
  }, []);

  // Keep the latest counters in a ref so the (once-bound) SSE handler below
  // always resolves the current loket name, not the COUNTERS fallback captured
  // on first render.
  const countersRef = useRef(counters);
  countersRef.current = counters;

  useEffect(() => {
    let alive = true;
    counterApi
      .list()
      .then((list) => {
        if (alive && Array.isArray(list) && list.length) setCounters(list);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useQueueEvents({
    onCalled: (q) => {
      const counter = countersRef.current.find((c) => c.id === q.counter_id);
      setBanner({
        queue_number: q.queue_number,
        counter_name: counter?.name ?? 'Loket',
        ts: Date.now(),
      });
    },
  });

  return (
    <main className="live-shell">
      <div className="display screen" data-screen-label="02 Display TV">
        <VideoBackground audioEnabled={audioActivated} ducked={!!banner} showDebugControls />
        <CurrentQueueBoard queues={queues} counters={counters} lastQueue={lastQueue} />
        <DisplayTicker />
        <QueueAnnouncement banner={banner} onDismiss={() => setBanner(null)} />
      </div>
    </main>
  );
}
