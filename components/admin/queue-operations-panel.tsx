'use client';
import { useEffect, useState } from 'react';
import { useClock } from '@/hooks/useClock';
import { useCurrentQueues } from '@/hooks/useCurrentQueues';
import { useQueueEvents } from '@/hooks/useQueueEvents';
import { counterApi } from '@/lib/api/counter';
import { queueApi } from '@/lib/api/queue';
import { ApiError } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import { COUNTERS, SERVICES, type Counter } from '@/lib/constants';
import type { QueueItem, ServiceType } from '@/types/queue';
import { Icons } from './admin-icons';
import { cn } from '@/lib/utils';

interface MiniStatProps {
  lbl: string;
  val: string | number;
  sub?: string;
}

function MiniStat({ lbl, val, sub }: MiniStatProps) {
  return (
    <div style={{ padding: '10px 0' }}>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--ink-3)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {lbl}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 24,
          fontWeight: 600,
          marginTop: 4,
          letterSpacing: '-0.02em',
        }}
      >
        {val}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function QueueOperationsPanel() {
  const [counterId, setCounterId] = useState<number>(1);
  const [counters, setCounters] = useState<Counter[]>(COUNTERS);
  const [history, setHistory] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<ServiceType | ''>('');
  const queues = useCurrentQueues();
  const now = useClock(60000).getTime();

  useEffect(() => {
    let alive = true;
    counterApi
      .list()
      .then((list) => {
        if (alive && Array.isArray(list) && list.length) setCounters(list);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    queueApi
      .list({ status: 'completed' })
      .then((list) => {
        if (alive) setHistory(list);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [counterId]);

  useQueueEvents({
    onCompleted: (q) => {
      if (q.counter_id === counterId) {
        setHistory((prev) => [q, ...prev.filter((p) => p.id !== q.id)].slice(0, 10));
      }
    },
  });

  const counter = counters.find((c) => c.id === counterId);
  const cur = queues.find(
    (q) => q.counter_id === counterId && (q.status === 'serving' || q.status === 'calling'),
  );
  const waiters = queues.filter(
    (q) =>
      q.status === 'waiting' &&
      (serviceFilter === '' || q.service_type === serviceFilter),
  );
  const myDone = history.filter((q) => q.counter_id === counterId).length;
  const skipped = queues.filter((q) => q.status === 'skipped');

  const handle = async (action: () => Promise<QueueItem>, successMessage: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      toastSuccess(successMessage);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'QUEUE_EMPTY') {
        toastError(err, 'Antrian kosong.');
      } else {
        toastError(err, 'Aksi gagal. Coba lagi.');
      }
    } finally {
      setBusy(false);
    }
  };

  const callNext = () =>
    handle(
      () =>
        queueApi.call({
          counter_id: counterId,
          service_type: serviceFilter || undefined,
        }),
      'Antrian dipanggil.',
    );
  const recall = () => {
    if (!cur) return;
    return handle(() => queueApi.recall(cur.id), 'Antrian dipanggil ulang.');
  };
  const skip = () => {
    if (!cur) return;
    return handle(() => queueApi.skip(cur.id), 'Antrian dilewati.');
  };
  const complete = () => {
    if (!cur) return;
    return handle(() => queueApi.complete(cur.id), 'Antrian diselesaikan.');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="h-eyebrow">Bertugas di</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {counters
              .filter((c) => c.active)
              .map((c) => (
                <button
                  key={c.id}
                  className={cn('btn', c.id === counterId && 'btn-primary')}
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  onClick={() => setCounterId(c.id)}
                >
                  {c.name}{c.service ? ` · ${c.service}` : ''}
                </button>
              ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="h-eyebrow">Filter layanan</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value as ServiceType | '')}
              className="select"
              style={{ padding: '6px 10px', fontSize: 12 }}
            >
              <option value="">Semua layanan</option>
              {SERVICES.map((s) => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="staff-now">
          <div>
            <div className="lbl">
              {cur
                ? cur.status === 'calling'
                  ? 'Sedang dipanggil di Display TV'
                  : 'Sedang dilayani'
                : 'Tidak ada antrian aktif'}
            </div>
            <div className="num">{cur ? cur.queue_number : '—'}</div>
            <div className="meta">
              <span>
                Loket: <b style={{ color: 'var(--ink)' }}>{counter ? counter.name : '—'}</b>
              </span>
              <span>
                Layanan:{' '}
                <b style={{ color: 'var(--ink)' }}>
                  {counter?.service
                    ? SERVICES.find((s) => s.key === counter.service)?.name
                    : serviceFilter
                      ? SERVICES.find((s) => s.key === serviceFilter)?.name
                      : 'Semua layanan'}
                </b>
              </span>
              <span>
                Petugas: <b style={{ color: 'var(--ink)' }}>{counter ? counter.staff : '—'}</b>
              </span>
            </div>
          </div>
          <div className="staff-actions">
            <button
              className="btn btn-primary"
              disabled={busy || !waiters.length}
              onClick={callNext}
            >
              {Icons.bell} Panggil berikutnya
            </button>
            <button className="btn" disabled={busy || !cur} onClick={recall}>
              Panggil ulang
            </button>
            <button className="btn" disabled={busy || !cur} onClick={skip}>
              Lewati
            </button>
            <button
              className="btn btn-accent"
              disabled={busy || !cur}
              onClick={complete}
              style={{ gridColumn: '1 / 3' }}
            >
              {Icons.check} Tandai Selesai
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="ttl">Sesi hari ini</div>
              <div className="sub">Statistik untuk {counter ? counter.name : '—'}</div>
            </div>
            <span className="chip">Shift · 08:00 – 16:00</span>
          </div>
          <div
            className="panel-body"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}
          >
            <MiniStat lbl="Dilayani" val={myDone} />
            <MiniStat lbl="Antrean menunggu" val={waiters.length} />
            <MiniStat lbl="Skip / no-show" val={skipped.length} />
            <MiniStat
              lbl="Status loket"
              val={counter?.active ? 'Aktif' : 'Nonaktif'}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="ttl">Riwayat pelayanan</div>
              <div className="sub">10 terakhir</div>
            </div>
          </div>
          <div className="panel-body" style={{ paddingTop: 6 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Layanan</th>
                  <th>Mulai</th>
                  <th>Selesai</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((q) => (
                  <tr key={q.id}>
                    <td><span className="num">{q.queue_number}</span></td>
                    <td>{SERVICES.find((s) => s.key === q.service_type)?.name ?? q.service_type}</td>
                    <td><span className="num">{formatTime(q.called_at)}</span></td>
                    <td><span className="num">{formatTime(q.completed_at)}</span></td>
                    <td>
                      {q.rating ? (
                        <>
                          {'★'.repeat(q.rating)}
                          <span style={{ color: 'var(--line-2)' }}>{'★'.repeat(5 - q.rating)}</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--ink-3)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!history.length && (
                  <tr>
                    <td colSpan={5} style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: 14 }}>
                      Belum ada riwayat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="ttl">Antrean menunggu</div>
              <div className="sub">
                {serviceFilter
                  ? `${SERVICES.find((s) => s.key === serviceFilter)?.name ?? serviceFilter} · diurutkan FIFO`
                  : 'Semua layanan · diurutkan FIFO'}
              </div>
            </div>
            <span className="chip-ink chip">{waiters.length} orang</span>
          </div>
          <div className="panel-body" style={{ paddingTop: 8 }}>
            <div className="staff-side-list">
              {waiters.slice(0, 8).map((q, i) => {
                const minsAgo = Math.max(
                  0,
                  Math.round((now - new Date(q.created_at).getTime()) / 60000),
                );
                return (
                  <div className="item" key={q.id}>
                    <div>
                      <div className="num">{q.queue_number}</div>
                      <div className="svc">
                        {SERVICES.find((s) => s.key === q.service_type)?.name ?? q.service_type}
                        {' · '}Tiba {minsAgo}m yang lalu
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div className="wait">#{i + 1}</div>
                      {i === 0 && <span className="chip chip-warn">selanjutnya</span>}
                    </div>
                  </div>
                );
              })}
              {!waiters.length && (
                <div
                  style={{
                    padding: 14,
                    fontSize: 12.5,
                    color: 'var(--ink-3)',
                    textAlign: 'center',
                  }}
                >
                  Tidak ada antrean. Semua sudah dilayani.
                </div>
              )}
            </div>
          </div>
        </div>

        {!!skipped.length && (
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="ttl">Dilewati</div>
                <div className="sub">Bisa dipanggil ulang</div>
              </div>
            </div>
            <div className="panel-body" style={{ paddingTop: 8 }}>
              {skipped.slice(0, 3).map((q) => (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'var(--bg)',
                    borderRadius: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                    {q.queue_number}
                  </span>
                  <button
                    className="btn"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => handle(() => queueApi.recall(q.id), 'Antrian dipanggil ulang.')}
                    disabled={busy}
                  >
                    Panggil ulang
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="panel" style={{ background: 'oklch(0.99 0.005 250)' }}>
          <div className="panel-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                className="ic16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3.5l2.2 1.3" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              <b style={{ color: 'var(--ink)' }}>Tip:</b> Tekan{' '}
              <kbd
                style={{
                  padding: '1px 5px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                }}
              >
                Spasi
              </kbd>{' '}
              untuk Panggil Berikutnya ·{' '}
              <kbd
                style={{
                  padding: '1px 5px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                }}
              >
                R
              </kbd>{' '}
              untuk Panggil Ulang.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}
