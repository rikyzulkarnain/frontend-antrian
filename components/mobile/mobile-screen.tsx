'use client';
import { useEffect, useMemo, useState } from 'react';
import { COUNTERS, SERVICES, type Counter } from '@/lib/constants';
import { counterApi } from '@/lib/api/counter';
import { queueApi } from '@/lib/api/queue';
import { useTicket } from '@/hooks/useTicket';
import { useQueueEvents } from '@/hooks/useQueueEvents';
import { MobileStatusBar } from './mobile-status-bar';
import { StatusView } from './status-view';
import { SKMView } from './skm-view';
import type { QueueItem } from '@/types/queue';

interface MobileScreenProps {
  ticketId: string;
}

export function MobileScreen({ ticketId }: MobileScreenProps) {
  return <MobileLoader key={ticketId} ticketId={ticketId} />;
}

function MobileLoader({ ticketId }: MobileScreenProps) {
  const { ticket, loading, error } = useTicket(ticketId);

  if (loading) {
    return (
      <div className="mobile screen" data-screen-label="04 Mobile">
        <MobileStatusBar />
        <div style={{ padding: 32, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-3)' }}>
          Memuat status antrian…
        </div>
        <div className="home-ind" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mobile screen" data-screen-label="04 Mobile">
        <MobileStatusBar />
        <div style={{ padding: 32, textAlign: 'center', fontSize: 14, color: 'var(--ink-2)' }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>Tiket tidak ditemukan</p>
          <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Pastikan QR/link masih berlaku atau ambil nomor baru di kiosk.
          </p>
        </div>
        <div className="home-ind" />
      </div>
    );
  }

  return <MobileContent ticket={ticket} />;
}

function MobileContent({ ticket }: { ticket: QueueItem }) {
  const [override, setOverride] = useState<QueueItem | null>(null);
  const current = override && override.id === ticket.id ? override : ticket;
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [counters, setCounters] = useState<Counter[]>(COUNTERS);

  useEffect(() => {
    let alive = true;
    queueApi
      .current()
      .then((data) => {
        if (alive) setQueues(data);
      })
      .catch(() => undefined);
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

  useQueueEvents({
    onCreated: (q) => upsert(setQueues, q),
    onCalled: (q) => {
      upsert(setQueues, q);
      if (q.id === ticket.id) setOverride(q);
    },
    onServing: (q) => {
      upsert(setQueues, q);
      if (q.id === ticket.id) setOverride(q);
    },
    onCompleted: (q) => {
      upsert(setQueues, q);
      if (q.id === ticket.id) setOverride(q);
    },
    onSkipped: (q) => {
      upsert(setQueues, q);
      if (q.id === ticket.id) setOverride(q);
    },
  });

  const svc = SERVICES.find((s) => s.key === current.service_type);
  const counter = counters.find((c) => c.id === current.counter_id);
  const ahead = useMemo(
    () =>
      queues.filter(
        (q) =>
          q.service_type === current.service_type &&
          q.status === 'waiting' &&
          q.created_at < current.created_at &&
          q.id !== current.id,
      ).length,
    [queues, current],
  );

  return (
    <div className="mobile screen" data-screen-label="04 Mobile">
      <MobileStatusBar />
      {current.status === 'completed' ? (
        <SKMView ticket={current} svc={svc} counter={counter} alreadyRated={current.rating != null} />
      ) : (
        <StatusView
          ticket={current}
          svc={svc}
          ahead={ahead}
          counter={counter}
          counters={counters}
          queues={queues}
        />
      )}
      <div className="home-ind" />
    </div>
  );
}

function upsert(
  setter: (updater: (prev: QueueItem[]) => QueueItem[]) => void,
  item: QueueItem,
): void {
  setter((prev) =>
    prev.some((q) => q.id === item.id)
      ? prev.map((q) => (q.id === item.id ? item : q))
      : [...prev, item],
  );
}
