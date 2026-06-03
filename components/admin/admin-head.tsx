'use client';
import { usePathname } from 'next/navigation';
import { useClock } from '@/hooks/useClock';
import { fmtTimeSec } from '@/lib/format';
import type { AdminView } from './admin-sidebar';

const TITLES: Record<AdminView, [string, string]> = {
  staff: ['Panggil Antrian', 'Operasional · Loket'],
  dashboard: ['Dashboard Analitik', 'Manajemen · Laporan harian'],
  counters: ['Manajemen Loket', 'Manajemen · Konfigurasi'],
  services: ['Manajemen Layanan', 'Manajemen · SOP, PDF, & QR'],
  users: ['Pengguna & Staff', 'Manajemen · Akses & peran'],
  videos: ['Konten Video', 'Manajemen · Playlist Kiosk & Display'],
  analytics: ['Analitik', 'Manajemen · Tren & insight'],
  reports: ['Laporan', 'Manajemen · Rekap, SKM, & ekspor'],
  profile: ['Profil saya', 'Akun · Ubah password'],
};

function viewFromPath(pathname: string): AdminView {
  if (pathname.startsWith('/admin/queue')) return 'staff';
  if (pathname.startsWith('/admin/counters')) return 'counters';
  if (pathname.startsWith('/admin/services')) return 'services';
  if (pathname.startsWith('/admin/users')) return 'users';
  if (pathname.startsWith('/admin/videos')) return 'videos';
  if (pathname.startsWith('/admin/analytics')) return 'analytics';
  if (pathname.startsWith('/admin/reports')) return 'reports';
  if (pathname.startsWith('/admin/profile')) return 'profile';
  return 'dashboard';
}

export function AdminHead() {
  const pathname = usePathname();
  const clock = useClock();
  const view = viewFromPath(pathname);
  const [title, crumb] = TITLES[view];

  return (
    <div className="admin-head">
      <div>
        <div className="ttl">{title}</div>
        <div className="crumb">{crumb}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="live-pill">
          <span className="pulse" />
          SSE · Terhubung
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>
          {fmtTimeSec(clock)}
        </span>
      </div>
    </div>
  );
}
