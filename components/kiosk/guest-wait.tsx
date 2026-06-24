'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useClock } from '@/hooks/useClock';
import { fmtTime } from '@/lib/format';
import { getSvcBg, getSvcBorder, getSvcFg, type Service } from '@/lib/constants';
import { queueApi } from '@/lib/api/queue';
import type { QueueItem } from '@/types/queue';

// Cadence for polling the guest ticket. This is the only read here that the
// backend can't serve from cache (it waits for a row that doesn't exist yet),
// so every tick is a real DB query. 6s keeps the UX responsive while cutting
// DB hits ~2.4x versus the old 2.5s, helping the Neon compute stay suspended.
const POLL_MS = 6000;

interface GuestWaitProps {
  svc: Service;
  onTicket: (ticket: QueueItem) => void;
  onBack: () => void;
}

/**
 * Registration step shown for every service. Displays a QR pointing at the
 * mobile intake form (/m/daftar/{token}?svc=...); the visitor fills name +
 * purpose on their phone. We poll for the ticket the submission creates and
 * hand it back to the kiosk once it appears.
 */
export function GuestWait({ svc, onTicket, onBack }: GuestWaitProps) {
  const clock = useClock();
  // Generated once on first render. Safe to read `crypto`/`window` here because
  // this step only ever mounts client-side (the kiosk starts at `idle`).
  const [token] = useState(() => crypto.randomUUID());
  const url =
    `${window.location.origin}/m/daftar/${token}` +
    `?svc=${encodeURIComponent(svc.key)}&nm=${encodeURIComponent(svc.name)}`;

  // Keep the latest callback in a ref so the polling effect can depend only on
  // `token` — useClock re-renders every second and would otherwise reset the
  // interval before it ever fires.
  const onTicketRef = useRef(onTicket);
  useEffect(() => {
    onTicketRef.current = onTicket;
  }, [onTicket]);

  // Poll for the ticket created when the visitor submits the mobile form.
  useEffect(() => {
    if (!token) return;
    let alive = true;
    let done = false;
    const tick = async () => {
      // Don't poll a backgrounded kiosk tab — the visitor isn't looking, and
      // every skipped tick is one fewer query keeping the database awake.
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const q = await queueApi.getGuest(token);
        if (alive && !done && q) {
          done = true;
          onTicketRef.current(q);
        }
      } catch {
        // 404 until the visitor submits — keep polling.
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [token]);

  const bg = svc.color_bg ?? getSvcBg(svc.key);
  const fg = svc.color_fg ?? getSvcFg(svc.key);
  const border = svc.color_border ?? getSvcBorder(svc.key);

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
        <div className="h-eyebrow" style={{ fontSize: 18 }}>
          Langkah 3 — Isi Formulir
        </div>
        <h1>
          Pindai QR untuk isi
          <br />
          formulir kunjungan.
        </h1>
      </div>
      <div className="kiosk-body" style={{ paddingTop: 16 }}>
        <div className="sop-head">
          <div
            className="glyph-lg"
            style={{ background: bg, color: fg, border: `1px solid ${border}` }}
          >
            {svc.glyph}
          </div>
          <div>
            <h2>{svc.name}</h2>
            <div className="meta">
              Nomor antrian akan otomatis muncul di layar ini setelah formulir terkirim.
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 32,
            alignItems: 'center',
            marginTop: 24,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 16,
              border: '1px solid var(--line-2)',
            }}
          >
            <QRCodeSVG value={url} size={220} level="M" marginSize={2} />
          </div>
          <ol
            style={{
              fontSize: 20,
              lineHeight: 1.6,
              color: 'var(--ink-2)',
              maxWidth: 420,
              paddingLeft: 22,
              margin: 0,
            }}
          >
            <li>Buka kamera HP, arahkan ke kode QR di samping.</li>
            <li>Isi <b>nama</b> dan <b>keperluan</b> kunjungan Anda.</li>
            <li>Tekan kirim — nomor antrian muncul di HP dan layar ini.</li>
          </ol>
        </div>
        <div className="sop-confirm" style={{ marginTop: 24 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 8v5M12 16h.01M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" strokeLinecap="round" />
          </svg>
          <span>Menunggu formulir Anda dikirim dari HP…</span>
        </div>
      </div>
      <div className="kiosk-foot" style={{ borderTop: 0, paddingTop: 0 }}>
        <div className="kiosk-cta-row" style={{ width: '100%' }}>
          <button className="kiosk-cta" onClick={onBack}>
            ← Kembali ke SOP
          </button>
        </div>
      </div>
    </>
  );
}
