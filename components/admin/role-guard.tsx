'use client';
import type { UserRole } from '@/types/user';
import { useAuthStore } from '@/stores/authStore';

interface RoleGuardProps {
  allow: UserRole | UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allow, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const allowed = Array.isArray(allow) ? allow : [allow];
  if (!user || !allowed.includes(user.role)) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>Akses ditolak</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          Halaman ini hanya untuk peran: {allowed.join(', ')}.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
