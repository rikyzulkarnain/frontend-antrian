'use client';
import { useEffect } from 'react';
import { queueApi } from '@/lib/api/queue';
import { useQueueStore } from '@/stores/queueStore';
import { useQueueEvents } from './useQueueEvents';
import type { QueueItem } from '@/types/queue';

export function useCurrentQueues(): QueueItem[] {
  const queues = useQueueStore((s) => s.queues);
  const setQueues = useQueueStore((s) => s.setQueues);
  const upsertQueue = useQueueStore((s) => s.upsertQueue);

  useEffect(() => {
    let alive = true;
    const load = () =>
      queueApi
        .current()
        .then((data) => {
          if (alive) setQueues(data);
        })
        .catch((err) => {
          console.error('useCurrentQueues: fetch failed', err);
        });
    load();
    // Safety net: periodically reconcile the board with the server so a
    // dropped/missed SSE event can't leave a Display TV showing stale numbers.
    // SSE remains the low-latency path; this just guarantees convergence, so a
    // slow cadence is enough. Kept long (90s) so idle boards don't keep the
    // database awake — the backend serves this read from cache between writes,
    // letting Neon compute suspend when nothing is happening.
    const id = setInterval(load, 90_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [setQueues]);

  useQueueEvents({
    onCreated: upsertQueue,
    onCalled: upsertQueue,
    onServing: upsertQueue,
    onCompleted: upsertQueue,
    onSkipped: upsertQueue,
  });

  return queues;
}
