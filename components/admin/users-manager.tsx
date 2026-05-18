'use client';
import { useEffect, useState } from 'react';
import { userApi } from '@/lib/api/user';
import { toastError, toastSuccess } from '@/lib/toast';
import type { User } from '@/types/user';
import { cn } from '@/lib/utils';
import { UserFormModal } from './user-form-modal';

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    userApi
      .list()
      .then((list) => {
        if (alive) setUsers(list);
      })
      .catch((err) => toastError(err, 'Gagal memuat daftar pengguna.'))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };
  const openEdit = (u: User) => {
    setEditing(u);
    setModalOpen(true);
  };

  const handleSaved = (saved: User) => {
    setUsers((prev) => {
      const exists = prev.some((x) => x.id === saved.id);
      return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved];
    });
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Hapus pengguna "${u.name}"?`)) return;
    try {
      await userApi.remove(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toastSuccess('Pengguna dihapus.');
    } catch (err) {
      toastError(err, 'Gagal menghapus pengguna.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 980 }}>
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="ttl">Pengguna</div>
            <div className="sub">Daftar akun staff dan admin</div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 12px', fontSize: 12.5 }}
            onClick={openCreate}
          >
            + Tambah Pengguna
          </button>
        </div>
        <div className="panel-body" style={{ paddingTop: 8 }}>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Nama</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div
                      className="av"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'oklch(0.93 0.02 250)',
                        color: 'oklch(0.4 0.16 250)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    >
                      {initials(u.name)}
                    </div>
                  </td>
                  <td>{u.name}</td>
                  <td style={{ color: 'var(--ink-3)' }}>{u.email}</td>
                  <td>
                    <span className={cn('chip', u.role === 'admin' && 'chip-ink')}>{u.role}</span>
                  </td>
                  <td>
                    <span className={cn('chip', u.is_active && 'chip-ok')}>
                      {u.is_active ? 'aktif' : 'nonaktif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => openEdit(u)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => handleDelete(u)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 16, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                    Belum ada pengguna.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 16, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                    Memuat…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
