import type { QueueItem, ServiceType } from '@/types/queue';
import { apiBase } from './api';
import { getAccessToken } from './auth';

export interface QueueEventHandlers {
  onCreated?: (q: QueueItem) => void;
  onCalled?: (q: QueueItem) => void;
  onServing?: (q: QueueItem) => void;
  onCompleted?: (q: QueueItem) => void;
  onSkipped?: (q: QueueItem) => void;
  onError?: (e: Event) => void;
}

export interface QueueEventFilter {
  counterId?: number;
  serviceType?: ServiceType;
  ticketId?: string;
}

export function subscribeQueueEvents(
  handlers: QueueEventHandlers,
  filter?: QueueEventFilter,
): () => void {
  const url = new URL(`${apiBase}/stream`);
  if (filter?.counterId !== undefined) url.searchParams.set('counter_id', String(filter.counterId));
  if (filter?.serviceType) url.searchParams.set('service_type', filter.serviceType);
  if (filter?.ticketId) url.searchParams.set('ticket_id', filter.ticketId);

  const token = getAccessToken();
  if (token) url.searchParams.set('token', token);

  const es = new EventSource(url.toString(), { withCredentials: true });

  // Expose the active EventSource so E2E tests can poll readyState.
  // Harmless in production; only useful under test orchestration where
  // Playwright's waitForResponse fires unreliably for SSE on Chromium.
  if (typeof window !== 'undefined') {
    (window as unknown as { __lastSSE?: EventSource }).__lastSSE = es;
  }

  const bind = (event: string, cb?: (q: QueueItem) => void) => {
    if (!cb) return;
    es.addEventListener(event, (e: MessageEvent) => {
      try {
        cb(JSON.parse(e.data) as QueueItem);
      } catch (err) {
        console.error(`sse: bad payload for ${event}`, err);
      }
    });
  };

  bind('queue.created', handlers.onCreated);
  bind('queue.called', handlers.onCalled);
  bind('queue.serving', handlers.onServing);
  bind('queue.completed', handlers.onCompleted);
  bind('queue.skipped', handlers.onSkipped);

  if (handlers.onError) es.addEventListener('error', handlers.onError);

  return () => es.close();
}

/** Kept for callers that previously used the generic opener. */
export function openEventStream(path: string, token?: string): EventSource {
  const url = new URL(`${apiBase}${path}`);
  const t = token ?? getAccessToken();
  if (t) url.searchParams.set('token', t);
  return new EventSource(url.toString(), { withCredentials: true });
}
