'use client';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { queueApi } from '@/lib/api/queue';
import { useQueueEvents } from './useQueueEvents';
import type { QueueItem } from '@/types/queue';

interface TicketState {
  ticket: QueueItem | null;
  loading: boolean;
  error: ApiError | null;
}

const INITIAL: TicketState = { ticket: null, loading: true, error: null };

/**
 * Loads a ticket by id and keeps it in sync with SSE. The consumer is expected
 * to remount this hook (via `key={ticketId}`) when switching between tickets so
 * the initial state reset doesn't have to happen inside an effect.
 */
export function useTicket(ticketId: string): TicketState {
  const [state, setState] = useState<TicketState>(INITIAL);

  useEffect(() => {
    let alive = true;
    queueApi
      .get(ticketId)
      .then((ticket) => {
        if (alive) setState({ ticket, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const error = err instanceof ApiError ? err : new ApiError(0, 'NETWORK', String(err));
        setState({ ticket: null, loading: false, error });
      });
    return () => {
      alive = false;
    };
  }, [ticketId]);

  useQueueEvents(
    {
      onCalled: (q) => setState((s) => (s.ticket && s.ticket.id === q.id ? { ...s, ticket: q } : s)),
      onServing: (q) => setState((s) => (s.ticket && s.ticket.id === q.id ? { ...s, ticket: q } : s)),
      onCompleted: (q) =>
        setState((s) => (s.ticket && s.ticket.id === q.id ? { ...s, ticket: q } : s)),
      onSkipped: (q) => setState((s) => (s.ticket && s.ticket.id === q.id ? { ...s, ticket: q } : s)),
    },
    { ticketId },
  );

  return state;
}
