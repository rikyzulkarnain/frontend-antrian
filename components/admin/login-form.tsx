'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('admin@local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user, accessToken } = await authApi.login(email, password);
      setAuth(user, accessToken);
      router.push('/admin');
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 401
          ? 'Email atau password salah.'
          : err instanceof Error
            ? err.message
            : 'Login gagal';
      setError(msg);
      toastError(err, msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <Image src="/assets/bbpjn-sumsel.png" alt="BBPJN" width={36} height={36} style={{ width: 'auto', height: 'auto' }} />
          <div style={{ width: 1, height: 26, background: 'var(--line-2)' }} />
          <Image src="/assets/pu-logo.png" alt="PU" width={32} height={32} style={{ width: 'auto', height: 'auto' }} />
        </div>
        <h2>Masuk ke Panel</h2>
        <p>Gunakan akun staff atau admin yang sudah terdaftar.</p>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-pass">Password</label>
          <input
            id="login-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <label
            style={{
              fontSize: 12,
              color: 'var(--ink-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <input type="checkbox" defaultChecked /> Ingat saya di komputer ini
          </label>
          <Link href="/admin/forgot-password" style={{ fontSize: 12, color: 'var(--primary)' }}>
            Lupa password?
          </Link>
        </div>
        {error && (
          <div style={{ fontSize: 12, color: 'var(--danger, #b91c1c)', marginTop: 10 }} role="alert">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 20, padding: '12px' }}
          disabled={submitting}
        >
          {submitting ? 'Memproses…' : 'Masuk'}
        </button>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', textAlign: 'center', marginTop: 14 }}>
          Sesi dilindungi JWT · Auto-logout 8 jam tidak aktif
        </div>
      </form>
    </div>
  );
}
