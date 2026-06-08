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

// Reconnect if no traffic (events or server `ping`s) arrives for this long.
// The server pings every 15s, so 45s means ~3 missed pings — long enough to
// avoid false positives, short enough to recover a wall-mounted Display TV
// without a manual refresh. Catches "silently dead" connections (proxy keeps
// the socket open but stops delivering) that EventSource never errors on.
const SSE_STALE_MS = 45_000;
const SSE_RECONNECT_DELAY_MS = 3_000;

export function subscribeQueueEvents(
  handlers: QueueEventHandlers,
  filter?: QueueEventFilter,
): () => void {
  let es: EventSource | null = null;
  let watchdog: ReturnType<typeof setTimeout> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const buildUrl = (): string => {
    const url = new URL(`${apiBase}/stream`);
    if (filter?.counterId !== undefined) url.searchParams.set('counter_id', String(filter.counterId));
    if (filter?.serviceType) url.searchParams.set('service_type', filter.serviceType);
    if (filter?.ticketId) url.searchParams.set('ticket_id', filter.ticketId);
    const token = getAccessToken();
    if (token) url.searchParams.set('token', token);
    return url.toString();
  };

  const armWatchdog = () => {
    if (watchdog) clearTimeout(watchdog);
    watchdog = setTimeout(reconnect, SSE_STALE_MS);
  };

  const reconnect = () => {
    if (closed) return;
    if (es) {
      es.close();
      es = null;
    }
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, SSE_RECONNECT_DELAY_MS);
  };

  const connect = () => {
    if (closed) return;
    const source = new EventSource(buildUrl(), { withCredentials: true });
    es = source;

    // Expose the active EventSource so E2E tests can poll readyState.
    // Harmless in production; only useful under test orchestration where
    // Playwright's waitForResponse fires unreliably for SSE on Chromium.
    if (typeof window !== 'undefined') {
      (window as unknown as { __lastSSE?: EventSource }).__lastSSE = source;
    }

    // Any inbound traffic — open, ping, or a real event — proves the
    // connection is alive and resets the staleness watchdog.
    source.addEventListener('open', armWatchdog);
    source.addEventListener('ping', armWatchdog);

    const bind = (event: string, cb?: (q: QueueItem) => void) => {
      source.addEventListener(event, (e: MessageEvent) => {
        armWatchdog();
        if (!cb) return;
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

    source.addEventListener('error', (e: Event) => {
      handlers.onError?.(e);
      // EventSource retries transient drops on its own. But once it gives up
      // (readyState CLOSED) it never recovers — rebuild it ourselves so the
      // screen keeps updating without human intervention.
      if (source.readyState === EventSource.CLOSED) reconnect();
    });

    armWatchdog();
  };

  connect();

  return () => {
    closed = true;
    if (watchdog) clearTimeout(watchdog);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (es) es.close();
  };
}

/** Kept for callers that previously used the generic opener. */
export function openEventStream(path: string, token?: string): EventSource {
  const url = new URL(`${apiBase}${path}`);
  const t = token ?? getAccessToken();
  if (t) url.searchParams.set('token', t);
  return new EventSource(url.toString(), { withCredentials: true });
}
