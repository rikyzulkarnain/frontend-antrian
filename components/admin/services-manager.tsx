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

  const openEdit = (s: Service) => {
    setEditing(s);
    setModalOpen(true);
  };

  const handleSaved = (saved: Service) => {
    setServices((prev) => prev.map((x) => (x.key === saved.key ? saved : x)));
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 880 }}>
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="ttl">Layanan terdaftar</div>
            <div className="sub">
              Edit nama, SOP, URL PDF, dan QR Code. Key/kode layanan tidak dapat diubah.
            </div>
          </div>
        </div>
        <div className="panel-body">
          {loading && (
            <div style={{ padding: 14, color: 'var(--ink-3)', fontSize: 13 }}>Memuat…</div>
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
