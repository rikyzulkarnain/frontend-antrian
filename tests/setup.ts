import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';

// MSW lifecycle. `error` on unhandled requests makes accidental real fetches
// loud during tests instead of silently hanging.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Components call NEXT_PUBLIC_API_URL at module load. Set it explicitly so
// MSW's handlers (registered against http://localhost:8080) match.
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080/api/v1';

// next/navigation isn't available in jsdom. We expose stable spies so tests
// can assert on navigation calls via routerMock.push.mock.calls.
export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  redirect: vi.fn(),
}));

// Reset router spies between tests so call counts don't leak.
afterEach(() => {
  Object.values(routerMock).forEach((fn) => fn.mockClear());
});

// HeroUI's toast renders into a portal we don't mount during tests.
// Stub the entry points so calls become silent no-ops instead of crashing.
vi.mock('@heroui/react', async () => {
  return {
    toast: {
      success: vi.fn(),
      danger: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  };
});
