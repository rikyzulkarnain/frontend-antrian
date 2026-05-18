'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }
    if (next !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    if (next === current) {
      setError('Password baru harus berbeda dari yang lama.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword(current, next);
      toastSuccess('Password berhasil diubah. Silakan login ulang.');
      clearAuth();
      router.push('/admin/login');
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'INVALID_CREDENTIALS'
          ? 'Password saat ini salah.'
          : 'Gagal mengubah password.';
      setError(msg);
      toastError(err, msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="ttl">Profil saya</div>
            <div className="sub">
              {user?.name} · {user?.email}
            </div>
          </div>
        </div>
        <div className="panel-body">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label>Password saat ini</label>
              <input
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Password baru</label>
              <input
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={8}
              />
              <small style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>
                Minimal 8 karakter, kombinasi huruf & angka direkomendasikan.
              </small>
            </div>
            <div className="field">
              <label>Konfirmasi password baru</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {error && (
              <div role="alert" style={{ fontSize: 12, color: 'var(--danger,#b91c1c)' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '12px', marginTop: 4 }}
            >
              {submitting ? 'Menyimpan…' : 'Ubah Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
