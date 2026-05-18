'use client';
import { useEffect, useState } from 'react';
import { counterApi } from '@/lib/api/counter';
import { toastError, toastSuccess } from '@/lib/toast';
import { COUNTERS, SERVICES, getSvcBg, getSvcFg, type Counter } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CounterFormModal } from './counter-form-modal';

export function CountersManager() {
  const [counters, setCounters] = useState<Counter[]>(COUNTERS);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Counter | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    counterApi
      .list()
      .then((list) => {
        if (alive && Array.isArray(list)) setCounters(list);
      })
      .catch((err) => toastError(err, 'Gagal memuat daftar loket.'))
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
  const openEdit = (c: Counter) => {
    setEditing(c);
    setModalOpen(true);
  };

  const handleSaved = (saved: Counter) => {
    setCounters((prev) => {
      const exists = prev.some((x) => x.id === saved.id);
      return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved];
    });
  };

  const handleDelete = async (c: Counter) => {
    if (!confirm(`Hapus loket "${c.name}"?`)) return;
    try {
      await counterApi.remove(c.id);
      setCounters((prev) => prev.filter((x) => x.id !== c.id));
      toastSuccess('Loket dihapus.');
    } catch (err) {
      toastError(err, 'Gagal menghapus loket.');
    }
  };

  const toggleActive = async (c: Counter) => {
    try {
      const updated = await counterApi.update(c.id, { active: !c.active });
      setCounters((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
      toastSuccess(`${updated.name} ${updated.active ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (err) {
      toastError(err, 'Gagal memperbarui loket.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 880 }}>
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="ttl">Loket terdaftar</div>
            <div className="sub">Aktifkan/nonaktifkan loket sesuai kondisi operasional</div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 12px', fontSize: 12.5 }}
            onClick={openCreate}
          >
            + Tambah Loket
          </button>
        </div>
        <div className="panel-body">
          {loading && (
            <div style={{ padding: 14, color: 'var(--ink-3)', fontSize: 13 }}>Memuat…</div>
          )}
          {counters.map((c) => {
            const svc = SERVICES.find((s) => s.key === c.service);
            return (
              <div key={c.id} className="list-row">
                <div
                  className="av"
                  style={{ background: getSvcBg(c.service), color: getSvcFg(c.service) }}
                >
                  {svc?.glyph}
                </div>
                <div>
                  <div className="nm">{c.name}</div>
                  <div className="sub">
                    {svc?.name ?? 'Semua jenis'} · {c.staff || 'Belum ditetapkan'}
                  </div>
                </div>
                <span className={cn('chip', c.active && 'chip-ok')}>
                  {c.active ? 'Aktif' : 'Nonaktif'}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => handleDelete(c)}
                  >
                    Hapus
                  </button>
                  <button
                    type="button"
                    className={cn('toggle', c.active && 'on')}
                    onClick={() => toggleActive(c)}
                    aria-label="toggle counter"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CounterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
