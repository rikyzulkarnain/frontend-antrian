'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useClock } from '@/hooks/useClock';
import { fmtTime } from '@/lib/format';
import { QRCodeSVG } from 'qrcode.react';
import { type Service } from '@/lib/constants';
import { queueApi } from '@/lib/api/queue';
import type { QueueItem } from '@/types/queue';

interface TicketDisplayProps {
  ticket: QueueItem;
  svc: Service;
  onDone: () => void;
}

export function TicketDisplay({ ticket, svc, onDone }: TicketDisplayProps) {
  const clock = useClock();
  const [ahead, setAhead] = useState<number | null>(null);
  const [trackUrl, setTrackUrl] = useState<string>(`/m/${ticket.id}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTrackUrl(`${window.location.origin}/m/${ticket.id}`);
    }
  }, [ticket.id]);

  useEffect(() => {
    let alive = true;
    queueApi
      .list({ status: 'waiting', serviceType: svc.key })
      .then((list) => {
        if (!alive) return;
        const before = list.filter((q) => q.created_at < ticket.created_at && q.id !== ticket.id).length;
        setAhead(before);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [svc.key, ticket.created_at, ticket.id]);

  const aheadShown = ahead ?? 0;
  const eta = (aheadShown + 1) * Math.round(svc.avgWait / 2);

  return (
    <>
      <div className="kiosk-head" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/assets/bbpjn-sumsel.png" alt="BBPJN" width={56} height={56} style={{ width: 'auto', height: 'auto' }} />
          <div style={{ width: 1, height: 42, background: 'var(--line-2)' }} />
          <Image src="/assets/pu-logo.png" alt="PU" width={48} height={48} style={{ width: 'auto', height: 'auto' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--ink)', fontWeight: 600 }}>
          {fmtTime(clock)}
        </div>
      </div>
      <div className="kiosk-title">
        <div className="h-eyebrow" style={{ fontSize: 18, color: 'oklch(0.4 0.13 155)' }}>
          ✓ Langkah 3 — Nomor antrian Anda
        </div>
        <h1 style={{ fontSize: 52 }}>
          Terima kasih.
          <br />
          Silakan menunggu panggilan.
        </h1>
      </div>
      <div className="kiosk-body" style={{ paddingTop: 24 }}>
        <div className="ticket">
          <div
            style={{
              fontSize: 22,
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Nomor Antrian
          </div>
          <div className="ticket-number" data-testid="ticket-number">{ticket.queue_number}</div>
          <div className="ticket-service">{svc.name}</div>
          <div className="ticket-meta-grid">
            <div className="cell">
              <div className="lbl">Antrian di depan</div>
              <div className="val">{ahead ?? '—'}</div>
            </div>
            <div className="cell">
              <div className="lbl">Estimasi tunggu</div>
              <div className="val">~{eta} mnt</div>
            </div>
            <div className="cell">
              <div className="lbl">Waktu cetak</div>
              <div className="val">{fmtTime(clock)}</div>
            </div>
          </div>
          <div className="ticket-qr">
            <div className="qr-box">
              <QRCodeSVG
                value={trackUrl}
                level="M"
                marginSize={2}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
            <div className="hint">
              <b>Pindai untuk pantau di HP</b>
              Lihat status antrian secara langsung tanpa harus berdiri di depan layar. Anda juga
              dapat memberi rating setelah dilayani.
            </div>
          </div>
        </div>
      </div>
      <div className="kiosk-foot">
        <div style={{ fontSize: 18 }}>Tiket akan tertutup otomatis dalam beberapa detik…</div>
        <button
          className="btn btn-primary"
          style={{ fontSize: 18, padding: '14px 22px' }}
          onClick={onDone}
        >
          Selesai
        </button>
      </div>
    </>
  );
}
