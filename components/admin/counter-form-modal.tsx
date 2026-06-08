'use client';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { counterApi } from '@/lib/api/counter';
import { userApi } from '@/lib/api/user';
import { toastError, toastSuccess } from '@/lib/toast';
import { SERVICES, type Counter } from '@/lib/constants';
import type { ServiceType } from '@/types/queue';
import type { User } from '@/types/user';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Counter;
  onSaved: (c: Counter) => void;
}

export function CounterFormModal({ open, onClose, initial, onSaved }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState('');
  const [service, setService] = useState<ServiceType | ''>('');
  const [staffId, setStaffId] = useState<string>('');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [staffOptions, setStaffOptions] = useState<User[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setService((initial?.service ?? '') as ServiceType | '');
    setStaffId(initial?.staff_id ?? '');
    setActive(initial?.active ?? true);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    userApi
      .list()
      .then((list) => {
        if (alive) setStaffOptions(list.filter((u) => u.role === 'staff' && u.is_active));
      })
      .catch(() => {
        // silent — staff dropdown still works with current value
      });
    return () => {
      alive = false;
    };
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        name,
        service: (service || null) as Counter['service'],
        staff_id: staffId || null,
        active,
      };
      const saved = isEdit
        ? await counterApi.update(initial!.id, payload)
        : await counterApi.create(payload);
      toastSuccess(isEdit ? 'Loket diperbarui.' : 'Loket ditambahkan.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toastError(err, 'Gagal menyimpan loket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Loket' : 'Tambah Loket'}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="counter-form"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <form
        id="counter-form"
        onSubmit={submit}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <Field label="Nama loket" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="Loket 1"
          />
        </Field>
        <Field label="Spesialisasi (opsional) — kosongkan jika loket melayani semua jenis">
          <select
            value={service}
            onChange={(e) => setService(e.target.value as ServiceType | '')}
          >
            <option value="">— Semua jenis —</option>
            {SERVICES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Staff">
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">Belum ditetapkan</option>
            {staffOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
            {staffId && !staffOptions.some((u) => u.id === staffId) && (
              <option value={staffId}>{initial?.staff ?? staffId}</option>
            )}
          </select>
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Aktif
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
