'use client';
import { useEffect, useState } from 'react';
import { VideoBackground } from '@/components/display/video-background';
import { CurrentQueueBoard } from '@/components/display/current-queue-board';
import { DisplayTicker } from '@/components/display/ticker';
import {
  QueueAnnouncement,
  primeTTS,
  type CallBanner,
} from '@/components/display/queue-announcement';
import { useCurrentQueues } from '@/hooks/useCurrentQueues';
import { useQueueEvents } from '@/hooks/useQueueEvents';
import { useAutoFullscreen } from '@/hooks/useAutoFullscreen';
import { counterApi } from '@/lib/api/counter';
import { COUNTERS, type Counter } from '@/lib/constants';

export default function DisplayPage() {
  const queues = useCurrentQueues();
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
      const counter = counters.find((c) => c.id === q.counter_id);
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
        <CurrentQueueBoard queues={queues} counters={counters} />
        <DisplayTicker />
        <QueueAnnouncement banner={banner} onDismiss={() => setBanner(null)} />
      </div>
    </main>
  );
}
