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
    queueApi
      .current()
      .then((data) => {
        if (alive) setQueues(data);
      })
      .catch((err) => {
        console.error('useCurrentQueues: fetch failed', err);
      });
    return () => {
      alive = false;
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
