'use client';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { videoApi } from '@/lib/api/video';
import { toastError, toastSuccess } from '@/lib/toast';
import type { Video, VideoTarget } from '@/types/video';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Video;
  onSaved: (v: Video) => void;
}

export function VideoEditModal({ open, onClose, initial, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [targetScreen, setTargetScreen] = useState<VideoTarget>('both');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !initial) return;
    setTitle(initial.title);
    setTargetScreen(initial.target_screen);
    setDisplayOrder(initial.display_order);
    setIsActive(initial.is_active);
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !initial) return;
    setSubmitting(true);
    try {
      const saved = await videoApi.update(initial.id, {
        title,
        target_screen: targetScreen,
        display_order: displayOrder,
        is_active: isActive,
      });
      toastSuccess('Video diperbarui.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toastError(err, 'Gagal menyimpan video.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Video"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="video-form"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <form
        id="video-form"
        onSubmit={submit}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <Field label="Judul" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="Target tayangan" required>
          <select
            value={targetScreen}
            onChange={(e) => setTargetScreen(e.target.value as VideoTarget)}
          >
            <option value="kiosk">Kiosk</option>
            <option value="display">Display TV</option>
            <option value="both">Keduanya</option>
          </select>
        </Field>
        <Field label="Urutan tampil" required>
          <input
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            required
          />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
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
