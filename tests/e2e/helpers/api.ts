import type { APIRequestContext } from '@playwright/test';

export const API_BASE = 'http://localhost:8080/api/v1';

export interface QueueItem {
  id: string;
  queue_number: string;
  service_type: string;
  status: string;
  counter_id: number | null;
  staff: string | null;
  created_at: string;
}

/** Unwraps the standard `{data: T}` envelope. */
async function unwrap<T>(resp: { json(): Promise<unknown>; ok(): boolean; status(): number }): Promise<T> {
  const body = (await resp.json()) as { data?: T; error?: { code: string; message: string } };
  if (!resp.ok() || !body.data) {
    throw new Error(`API ${resp.status()}: ${JSON.stringify(body.error ?? body)}`);
  }
  return body.data;
}

export async function createQueue(req: APIRequestContext, serviceType = 'UMUM'): Promise<QueueItem> {
  const r = await req.post(`${API_BASE}/queues`, { data: { service_type: serviceType } });
  return unwrap<QueueItem>(r);
}

/** Returns the oldest waiting ticket for a service, or null if none. The
 *  backend's CallNext picks this row (FIFO with FOR UPDATE SKIP LOCKED). */
export async function oldestWaiting(
  req: APIRequestContext,
  serviceType: string,
): Promise<QueueItem | null> {
  const r = await req.get(`${API_BASE}/queues?status=waiting&service_type=${serviceType}`);
  const list = await unwrap<QueueItem[]>(r);
  if (!list.length) return null;
  // List is already ordered by created_at ASC server-side.
  return list[0];
}

export async function loginAsAdmin(req: APIRequestContext): Promise<string> {
  const r = await req.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@local', password: 'admin123' },
  });
  const body = await unwrap<{ access_token: string }>(r);
  return body.access_token;
}

/** Logs in as admin and pushes the resulting refresh cookie + access token
 *  into the given browser context. After this returns, page.goto to any
 *  protected route will hydrate successfully via /auth/refresh. */
export async function authenticateAdmin(
  page: import('@playwright/test').Page,
  req: APIRequestContext,
): Promise<void> {
  // POST /auth/login, then grab the Set-Cookie header directly off the
  // response — storageState() roundtrips don't reliably surface cookies
  // from the request fixture into the page's context in Playwright 1.60.
  const r = await req.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@local', password: 'admin123' },
  });
  if (!r.ok()) {
    throw new Error(`login HTTP ${r.status()}: ${await r.text()}`);
  }
  const setCookie = r.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie');
  if (!setCookie) {
    throw new Error('login response missing Set-Cookie');
  }
  const parsed = parseSetCookie(setCookie.value);
  // Minimal addCookies — just name/value/url. Extra fields trigger silent
  // rejection in Playwright 1.60 when something downstream doesn't like
  // the combination (HttpOnly + url? sameSite case? — opaque).
  try {
    await page.context().addCookies([
      { name: parsed.name, value: parsed.value, url: 'http://localhost:8080/' },
    ]);
  } catch (e) {
    throw new Error(`addCookies failed: ${(e as Error).message}; parsed=${JSON.stringify(parsed)}`);
  }

  const cookies = await page.context().cookies('http://localhost:8080/');
  if (!cookies.some((c) => c.name === 'refresh_token')) {
    throw new Error(
      `refresh cookie not stored. parsed=${JSON.stringify(parsed)}; got=${JSON.stringify(cookies)}`,
    );
  }
}

// Minimal Set-Cookie parser tailored to our backend output:
//   refresh_token=abc; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=2592000
function parseSetCookie(raw: string): {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
} {
  const parts = raw.split(';').map((p) => p.trim());
  const [first, ...attrs] = parts;
  const eq = first.indexOf('=');
  if (eq < 0) throw new Error(`invalid Set-Cookie: ${raw}`);
  const out: {
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  } = {
    name: first.slice(0, eq),
    value: first.slice(eq + 1),
    domain: 'localhost',
    path: '/',
  };
  for (const a of attrs) {
    const [k, v] = a.split('=');
    const key = k.toLowerCase();
    if (key === 'path') out.path = v;
    else if (key === 'httponly') out.httpOnly = true;
    else if (key === 'secure') out.secure = true;
    else if (key === 'samesite') {
      const s = v?.toLowerCase();
      out.sameSite = s === 'strict' ? 'Strict' : s === 'none' ? 'None' : 'Lax';
    }
  }
  return out;
}

/** Waits for the page's EventSource (used by useQueueEvents/useCurrentQueues)
 *  to reach readyState=OPEN. Playwright's waitForResponse does not fire
 *  reliably for SSE in Chromium, so we poll the DOM-side EventSource
 *  registry directly. The frontend exposes the active stream as
 *  window.__lastSSE for this purpose (see lib/sse.ts). */
export async function waitForSSE(page: import('@playwright/test').Page, timeoutMs = 10_000): Promise<void> {
  await page.waitForFunction(
    () => {
      const es = (window as unknown as { __lastSSE?: EventSource }).__lastSSE;
      return !!es && es.readyState === 1; // 1 = OPEN
    },
    null,
    { timeout: timeoutMs },
  );
}

export async function completeQueue(
  req: APIRequestContext,
  token: string,
  id: string,
): Promise<QueueItem> {
  const r = await req.post(`${API_BASE}/queues/${encodeURIComponent(id)}/complete`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<QueueItem>(r);
}

export async function callNext(
  req: APIRequestContext,
  token: string,
  counterID: number,
  serviceType?: string,
): Promise<QueueItem> {
  const data: Record<string, unknown> = { counter_id: counterID };
  if (serviceType) data.service_type = serviceType;
  const r = await req.post(`${API_BASE}/queues/call`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<QueueItem>(r);
}
