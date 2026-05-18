'use client';
import Image from 'next/image';
import { useEffect } from 'react';
import { FauxQR } from '@/components/ui/faux-qr';
import { COUNTERS, SERVICES } from '@/lib/constants';
import type { Counter, Service } from '@/lib/constants';
import type { QueueItem } from '@/types/queue';
import { cn } from '@/lib/utils';

interface StatusViewProps {
  ticket: QueueItem;
  svc: Service | undefined;
  ahead: number;
  counter: Counter | undefined;
  counters?: Counter[];
  queues?: QueueItem[];
}

const STATUS_LABEL: Record<QueueItem['status'], string> = {
  waiting: 'Menunggu giliran',
  calling: 'Anda sedang dipanggil!',
  serving: 'Sedang dilayani',
  skipped: 'Dilewati — silakan ke loket',
  completed: 'Layanan selesai',
};

export function StatusView({
  ticket,
  svc,
  ahead,
  counter,
  counters = COUNTERS,
  queues = [],
}: StatusViewProps) {
  const isCalling = ticket.status === 'calling';
  const totalFront = ahead + 1;
  const progress = Math.max(0, Math.min(100, 100 - (ahead / Math.max(totalFront, 1)) * 100));

  // Vibration when status = calling (PRD requirement)
  useEffect(() => {
    if (isCalling && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 300]);
    }
  }, [isCalling]);

  return (
    <>
      <div className="mobile-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Image src="/assets/bbpjn-sumsel.png" alt="BBPJN" width={22} height={22} style={{ width: 'auto', height: 'auto' }} />
          <div style={{ width: 1, height: 16, background: 'var(--line-2)' }} />
          <Image src="/assets/pu-logo.png" alt="PU" width={20} height={20} style={{ width: 'auto', height: 'auto' }} />
        </div>
        <div className="greet">Selamat datang di Hub Layanan</div>
        <h1>Pantau antrian Anda</h1>
      </div>
      <div className="mobile-body">
        <div
          className="m-ticket"
          style={
            isCalling
              ? {
                  background:
                    'linear-gradient(140deg, oklch(0.97 0.04 38), oklch(0.99 0.02 38))',
                  borderColor: 'oklch(0.85 0.1 38)',
                }
              : undefined
          }
        >
          <div className="top">
            <div>
              <div className="lbl">Nomor Antrian</div>
              <div className="num">{ticket.queue_number}</div>
              <div className="svc">{svc?.name}</div>
            </div>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 10,
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                padding: 5,
              }}
            >
              <FauxQR seed={ticket.queue_number} />
            </div>
          </div>
          <div className="m-progress" style={{ marginTop: 18 }}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
              fontSize: 11,
              color: 'var(--ink-3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>tiba</span>
            <span>{ahead === 0 ? 'giliran Anda' : `${ahead} antrian di depan`}</span>
            <span>loket</span>
          </div>
        </div>

        <div
          className="m-status"
          style={
            isCalling
              ? { background: 'var(--ink)', color: 'var(--bg)', borderColor: 'var(--ink)' }
              : undefined
          }
        >
          <div style={{ flex: 1 }}>
            <div className="lbl" style={isCalling ? { color: 'rgba(255,255,255,.6)' } : undefined}>
              Status
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginTop: 3,
                letterSpacing: '-0.01em',
              }}
            >
              {STATUS_LABEL[ticket.status]}
            </div>
            <div className="meta" style={isCalling ? { color: 'rgba(255,255,255,.7)' } : undefined}>
              {counter ? `Menuju ${counter.name}` : 'Belum ada loket'}
            </div>
          </div>
          {isCalling && (
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 24 }}>
              {[40, 100, 60, 80].map((h, i) => (
                <i
                  key={i}
                  style={{
                    width: 3,
                    background: 'oklch(0.7 0.18 38)',
                    borderRadius: 2,
                    animation: `bars 1s infinite ${i * 0.15}s`,
                    height: `${h}%`,
                    display: 'block',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="m-section">
          <div className="h">Sedang dipanggil di depan Anda</div>
          {counters
            .filter((c) => c.active)
            .slice(0, 4)
            .map((c) => {
              const cur = queues.find(
                (q) =>
                  q.counter_id === c.id && (q.status === 'serving' || q.status === 'calling'),
              );
              const svcName = SERVICES.find((s) => s.key === c.service)?.name;
              return (
                <div key={c.id} className="m-row">
                  <div>
                    <div className="num">{cur ? cur.queue_number : '—'}</div>
                    <div className="ctr">
                      {c.name} · {svcName}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'chip',
                      cur && cur.status === 'calling' && 'chip-call',
                      !cur && 'chip-warn',
                    )}
                    style={{ fontSize: 10 }}
                  >
                    {cur ? (cur.status === 'calling' ? 'dipanggil' : 'dilayani') : 'idle'}
                  </span>
                </div>
              );
            })}
        </div>

        <div className="m-tip">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 6v3M8 11h.01" strokeLinecap="round" />
          </svg>
          <span>Tetap di area antrian. HP Anda akan bergetar saat nomor mendekati giliran.</span>
        </div>
      </div>
    </>
  );
}
