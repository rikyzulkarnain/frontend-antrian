'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { COUNTERS, MOCK_VIDEOS, SEED_QUEUES, STAFF_PERF } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/authApi';
import { Icons } from './admin-icons';
import { cn } from '@/lib/utils';

export type AdminView =
  | 'staff'
  | 'dashboard'
  | 'counters'
  | 'services'
  | 'users'
  | 'videos'
  | 'analytics'
  | 'reports'
  | 'profile';

const ROUTES: Record<AdminView, string> = {
  staff: '/admin/queue',
  dashboard: '/admin',
  counters: '/admin/counters',
  services: '/admin/services',
  users: '/admin/users',
  videos: '/admin/videos',
  analytics: '/admin/analytics',
  reports: '/admin/reports',
  profile: '/admin/profile',
};

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const waiting = SEED_QUEUES.filter((q) => q.status === 'waiting').length;
  const activeVideos = MOCK_VIDEOS.filter((v) => v.active).length;
  const isAdmin = user?.role === 'admin';

  const isActive = (view: AdminView) =>
    view === 'dashboard' ? pathname === ROUTES.dashboard : pathname === ROUTES[view];

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear local state anyway
    }
    clearAuth();
    router.push('/admin/login');
  };

  return (
    <aside className="admin-side">
      <div
        className="brand"
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
          padding: '4px 6px 14px',
          borderBottom: '1px solid var(--line)',
          marginBottom: 14,
        }}
      >
        <Image src="/assets/bbpjn-sumsel.png" alt="BBPJN" width={30} height={30} style={{ width: 'auto', height: 'auto' }} />
        <div
          style={{
            fontSize: 10.5,
            color: 'var(--ink-3)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Panel Antrian · BBPJN Sumsel
        </div>
      </div>

      <div className="admin-nav">
        <div className="group">Operasional</div>
        <NavItem
          href={ROUTES.staff}
          icon={Icons.rows}
          label="Panggil Antrian"
          active={isActive('staff')}
          count={waiting}
        />

        <div className="group">Manajemen</div>
        <NavItem
          href={ROUTES.dashboard}
          icon={Icons.dashboard}
          label="Dashboard"
          active={isActive('dashboard')}
        />
        {isAdmin && (
          <>
            <NavItem
              href={ROUTES.counters}
              icon={Icons.counters}
              label="Loket"
              active={isActive('counters')}
              count={COUNTERS.length}
            />
            <NavItem
              href={ROUTES.services}
              icon={Icons.services}
              label="Layanan"
              active={isActive('services')}
              count={5}
            />
            <NavItem
              href={ROUTES.users}
              icon={Icons.users}
              label="Pengguna"
              active={isActive('users')}
              count={STAFF_PERF.length}
            />
            <NavItem
              href={ROUTES.videos}
              icon={Icons.videos}
              label="Konten Video"
              active={isActive('videos')}
              count={activeVideos}
            />
            <NavItem
              href={ROUTES.reports}
              icon={Icons.reports}
              label="Laporan"
              active={isActive('reports')}
            />
          </>
        )}
        <NavItem
          href={ROUTES.profile}
          icon={Icons.profile}
          label="Profil"
          active={isActive('profile')}
        />
      </div>

      <div className="admin-side-foot">
        <div className="av">{user ? user.name.slice(0, 2).toUpperCase() : 'AD'}</div>
        <div>
          <div className="nm">{user?.name ?? 'Admin'}</div>
          <div className="em">{user?.email ?? '—'}</div>
        </div>
        <button
          className="btn-ghost btn"
          style={{ marginLeft: 'auto', padding: '4px 8px' }}
          onClick={handleLogout}
          title="Logout"
        >
          {Icons.logout}
        </button>
      </div>
    </aside>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
}

function NavItem({ href, icon, label, active, count }: NavItemProps) {
  return (
    <Link href={href} className={cn('item', active && 'is-active')} style={{ textDecoration: 'none' }}>
      <span className="glyph">{icon}</span>
      <span>{label}</span>
      {count != null && <span className="count">{count}</span>}
    </Link>
  );
}
