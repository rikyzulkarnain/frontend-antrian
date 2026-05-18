import { NextResponse } from 'next/server';

// Edge auth check is intentionally absent. The refresh-token cookie is set
// by the backend on localhost:8080 (or the API domain in production); the
// browser scopes it to that origin and never sends it on requests to the
// Next.js frontend at localhost:3000. A middleware here can never see it.
//
// Client-side auth is handled in app/admin/layout.tsx: AdminLayout calls
// useAuthStore.hydrate() on mount, which posts to /api/v1/auth/refresh
// (cross-origin with credentials:'include' so the cookie IS sent), and
// redirects to /admin/login when no session is recoverable.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
