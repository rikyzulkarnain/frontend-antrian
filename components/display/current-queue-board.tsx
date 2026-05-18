'use client';
import Image from 'next/image';
import { useClock } from '@/hooks/useClock';
import { fmtDate, fmtTime } from '@/lib/format';
import { COUNTERS, type Counter } from '@/lib/constants';
import type { QueueItem } from '@/types/queue';
import { cn } from '@/lib/utils';

interface CurrentQueueBoardProps {
  queues?: QueueItem[];
  counters?: Counter[];
}

export function CurrentQueueBoard({ queues = [], counters = COUNTERS }: CurrentQueueBoardProps) {
  const clock = useClock();
  const calling = queues.find((q) => q.status === 'calling');
  const serving = queues.filter((q) => q.status === 'serving');
  const cur: QueueItem | undefined = calling ?? serving[0];

  const others: QueueItem[] = serving
    .slice(calling ? 0 : 1)
    .concat(queues.filter((q) => q.status === 'waiting').slice(0, 4))
    .slice(0, 6);

  const dateOnly = fmtDate(clock).split(',')[0];

  return (
    <div className="display-board">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '4px 0 8px',
          borderBottom: '1px solid var(--line)',
          marginBottom: 4,
        }}
      >
        <Image src="/assets/bbpjn-sumsel.png" alt="BBPJN" width={36} height={36} style={{ width: 'auto', height: 'auto' }} />
        <div style={{ width: 1, height: 28, background: 'var(--line-2)' }} />
        <Image src="/assets/pu-logo.png" alt="PU" width={32} height={32} style={{ width: 'auto', height: 'auto' }} />
        <div style={{ marginLeft: 8, lineHeight: 1.1 }}>
          <div
            style={{
              fontSize: 10,
              color: 'var(--ink-3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            BBPJN Sumsel
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Hub Layanan Terpadu
          </div>
        </div>
      </div>

      <div className="display-board-head">
        <div className="ttl">Antrian saat ini</div>
        <div className="clock">
          {fmtTime(clock)} · {dateOnly}
        </div>
      </div>

      <div className={cn('display-now', calling && 'is-calling')}>
        <span className="badge">{calling ? 'Sedang dipanggil' : 'Sedang dilayani'}</span>
        <div className="num">{cur ? cur.queue_number : '—'}</div>
        <div className="row">
          <div>
            <div className="lbl">Loket</div>
            <div className="val">
              {cur ? counters.find((c) => c.id === cur.counter_id)?.name ?? '—' : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="lbl">Petugas</div>
            <div className="val" style={{ fontSize: 22, fontWeight: 500 }}>
              {cur ? cur.staff ?? '—' : '—'}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="h-eyebrow" style={{ marginBottom: 10, fontSize: 12 }}>
          Antrian aktif lainnya
        </div>
        <div className="display-queue-list">
          {others.map((q) => {
            const counter = counters.find((c) => c.id === q.counter_id);
            return (
              <div key={q.id} className="item">
                <div>
                  <div className="num">{q.queue_number}</div>
                  <div className="ctr">{counter ? counter.name : 'Menunggu'}</div>
                </div>
                <span className="badge">{q.status === 'waiting' ? 'Tunggu' : q.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
