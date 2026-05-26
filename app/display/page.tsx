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
import { counterApi } from '@/lib/api/counter';
import { COUNTERS, type Counter } from '@/lib/constants';

export default function DisplayPage() {
  const queues = useCurrentQueues();
  const [counters, setCounters] = useState<Counter[]>(COUNTERS);
  const [banner, setBanner] = useState<CallBanner | null>(null);
  const [audioActivated, setAudioActivated] = useState(false);

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
        <VideoBackground />
        <CurrentQueueBoard queues={queues} counters={counters} />
        <DisplayTicker />
        <QueueAnnouncement banner={banner} onDismiss={() => setBanner(null)} />
        {!audioActivated && (
          <button
            className="btn btn-primary"
            onClick={() => {
              primeTTS();
              setAudioActivated(true);
            }}
            style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}
          >
            Aktifkan suara pengumuman
          </button>
        )}
      </div>
    </main>
  );
}
