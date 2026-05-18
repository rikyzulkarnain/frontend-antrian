'use client';
import { useEffect } from 'react';
import {
  subscribeQueueEvents,
  type QueueEventFilter,
  type QueueEventHandlers,
} from '@/lib/sse';

export function useQueueEvents(handlers: QueueEventHandlers, filter?: QueueEventFilter): void {
  useEffect(() => {
    const unsubscribe = subscribeQueueEvents(handlers, filter);
    return unsubscribe;
    // Re-subscribe only when filter changes; handlers are intentionally re-bound each effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.counterId, filter?.serviceType, filter?.ticketId]);
}
