import { getAccessToken, setAccessToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

export const apiBase = BASE;

type ApiSuccess<T> = { data: T };
type ApiFailure = { error: { code: string; message: string } };
type ApiBody<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
  /** When true, do not attempt refresh-and-retry on 401. */
  skipAuthRetry?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const body = (await res.json()) as ApiBody<{ access_token: string }>;
      if ('error' in body) return null;
      const token = body.data.access_token;
      setAccessToken(token);
      return token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function send<T>(path: string, opts: ApiOptions): Promise<T> {
  const { body, token, headers, skipAuthRetry, ...rest } = opts;
  const authToken = token ?? getAccessToken();

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (res.status === 401 && !skipAuthRetry && authToken) {
    const fresh = await tryRefresh();
    if (fresh) {
      return send<T>(path, { ...opts, token: fresh, skipAuthRetry: true });
    }
    setAccessToken(null);
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/admin/login')) {
      window.location.href = '/admin/login';
    }
  }

  const text = await res.text();
  const parsed = text ? ((): ApiBody<T> | null => {
    try {
      return JSON.parse(text) as ApiBody<T>;
    } catch {
      return null;
    }
  })() : null;

  if (!res.ok || (parsed && 'error' in parsed)) {
    const fallback = { code: 'HTTP_ERROR', message: res.statusText || `HTTP ${res.status}` };
    const err = parsed && 'error' in parsed ? parsed.error : fallback;
    throw new ApiError(res.status, err.code, err.message);
  }

  if (!parsed || !('data' in parsed)) {
    throw new ApiError(res.status, 'INVALID_RESPONSE', 'Respons API tidak valid');
  }

  return parsed.data;
}

/**
 * Low-level fetch — kept for callers that still pass legacy `{ method, body: JSON.stringify(...) }`.
 * Newer code should use the resource modules under `lib/api/` or the `http` helper below.
 */
export async function api<T>(
  path: string,
  opts: Omit<RequestInit, 'body'> & { body?: BodyInit | null; token?: string } = {},
): Promise<T> {
  const { body, token, headers, ...rest } = opts;
  const parsedBody: unknown =
    typeof body === 'string'
      ? safeJsonParse(body)
      : body === undefined || body === null
        ? undefined
        : body;
  return send<T>(path, { ...rest, body: parsedBody, token, headers });
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export const http = {
  get: <T>(path: string, opts: Omit<ApiOptions, 'body' | 'method'> = {}) =>
    send<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts: Omit<ApiOptions, 'body' | 'method'> = {}) =>
    send<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts: Omit<ApiOptions, 'body' | 'method'> = {}) =>
    send<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts: Omit<ApiOptions, 'body' | 'method'> = {}) =>
    send<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T>(path: string, opts: Omit<ApiOptions, 'body' | 'method'> = {}) =>
    send<T>(path, { ...opts, method: 'DELETE' }),
};
