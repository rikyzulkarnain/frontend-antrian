'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminHead } from '@/components/admin/admin-head';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAuthStore } from '@/stores/authStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isHydrated, hydrate } = useAuthStore();
  const isLoginRoute = pathname === '/admin/login';
  const isPublicRoute = isLoginRoute || pathname === '/admin/forgot-password';

  useEffect(() => {
    if (!isHydrated) void hydrate();
  }, [isHydrated, hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user && !isPublicRoute) router.push('/admin/login');
    if (user && isLoginRoute) router.push('/admin');
  }, [isHydrated, user, isPublicRoute, isLoginRoute, router]);

  if (isPublicRoute) {
    return <section className="min-h-screen">{children}</section>;
  }

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Memuat sesi…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="live-shell">
      <div className="admin screen" data-screen-label="03 Admin & Staff">
        <AdminSidebar />
        <main className="admin-main">
          <AdminHead />
          <div className="admin-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
