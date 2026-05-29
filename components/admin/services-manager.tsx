'use client';
import { useEffect, useState } from 'react';
import { serviceApi } from '@/lib/api/service';
import { toastError, toastSuccess } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/service';
import { ServiceFormModal } from './service-form-modal';

export function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | undefined>(undefined);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    serviceApi
      .list()
      .then((list) => {
        if (alive && Array.isArray(list)) setServices(list);
      })
      .catch((err) => toastError(err, 'Gagal memuat daftar layanan.'))
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

  const openEdit = (s: Service) => {
    setEditing(s);
    setModalOpen(true);
  };

  const handleSaved = (saved: Service, isNew: boolean) => {
    if (isNew) {
      setServices((prev) => [...prev, saved].sort((a, b) => a.display_order - b.display_order));
    } else {
      setServices((prev) => prev.map((x) => (x.key === saved.key ? saved : x)));
    }
  };

  const toggleActive = async (s: Service) => {
    try {
      const updated = await serviceApi.update(s.key, { is_active: !s.is_active });
      setServices((prev) => prev.map((x) => (x.key === s.key ? updated : x)));
      toastSuccess(`${updated.name} ${updated.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (err) {
      toastError(err, 'Gagal memperbarui layanan.');
    }
  };

  const deleteService = async (s: Service) => {
    const confirmed = window.confirm(
      `Hapus layanan "${s.name}" (${s.key})?\n\nLayanan tidak dapat dihapus jika masih ada riwayat antrian yang merujuk ke key ini.`,
    );
    if (!confirmed) return;
    setDeletingKey(s.key);
    try {
      await serviceApi.delete(s.key);
      setServices((prev) => prev.filter((x) => x.key !== s.key));
      toastSuccess(`${s.name} dihapus.`);
    } catch (err) {
      toastError(err, 'Gagal menghapus layanan (mungkin masih dipakai antrian).');
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 880 }}>
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="ttl">Layanan terdaftar</div>
            <div className="sub">
              Tambah, edit, atau hapus layanan. Key/kode jadi identitas permanen — jangan
              dihapus jika sudah ada riwayat antrian.
            </div>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            + Tambah Layanan
          </button>
        </div>
        <div className="panel-body">
          {loading && (
            <div style={{ padding: 14, color: 'var(--ink-3)', fontSize: 13 }}>Memuat…</div>
          )}
          {!loading && services.length === 0 && (
            <div style={{ padding: 14, color: 'var(--ink-3)', fontSize: 13 }}>
              Belum ada layanan. Klik "Tambah Layanan" untuk membuat.
            </div>
          )}
          {services.map((s) => (
            <div key={s.key} className="list-row">
              <div
                className="av"
                style={{ background: s.color_bg, color: s.color_fg, borderColor: s.color_border }}
              >
                {s.glyph}
              </div>
              <div>
                <div className="nm">
                  {s.name}{' '}
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-3)',
                      fontFamily: 'var(--font-mono)',
                      marginLeft: 6,
                    }}
                  >
                    {s.key} · {s.code}
                  </span>
                </div>
                <div className="sub">
                  {s.sop_steps.length} langkah SOP · ~{s.avg_wait_min}m
                  {s.sop_pdf_url ? ' · PDF ✓' : ''}
                  {s.qr_url ? ' · QR ✓' : ''}
                </div>
              </div>
              <span className={cn('chip', s.is_active && 'chip-ok')}>
                {s.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn"
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => openEdit(s)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={cn('toggle', s.is_active && 'on')}
                  onClick={() => toggleActive(s)}
                  aria-label="toggle service"
                />
                <button
                  className="btn btn-danger"
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => deleteService(s)}
                  disabled={deletingKey === s.key}
                >
                  {deletingKey === s.key ? '…' : 'Hapus'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ServiceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
