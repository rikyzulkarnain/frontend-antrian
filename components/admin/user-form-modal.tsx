'use client';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { userApi } from '@/lib/api/user';
import { toastError, toastSuccess } from '@/lib/toast';
import type { User, UserRole } from '@/types/user';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: User;
  onSaved: (u: User) => void;
}

export function UserFormModal({ open, onClose, initial, onSaved }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setEmail(initial?.email ?? '');
    setPassword('');
    setRole(initial?.role ?? 'staff');
    setIsActive(initial?.is_active ?? true);
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const saved = isEdit
        ? await userApi.update(initial!.id, {
            name,
            email,
            role,
            is_active: isActive,
            ...(password ? { password } : {}),
          })
        : await userApi.create({ name, email, password, role, is_active: isActive });
      toastSuccess(isEdit ? 'Pengguna diperbarui.' : 'Pengguna ditambahkan.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toastError(err, 'Gagal menyimpan pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="user-form"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <form
        id="user-form"
        onSubmit={submit}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <Field label="Nama lengkap" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field
          label={isEdit ? 'Password baru (kosongkan jika tidak diganti)' : 'Password'}
          required={!isEdit}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isEdit}
            minLength={8}
          />
        </Field>
        <Field label="Peran" required>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="staff">Staff (loket)</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Aktif (bisa login)
        </label>
      </form>
    </Modal>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label>
        {label}
        {required && <span style={{ color: 'var(--danger,#b91c1c)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}
