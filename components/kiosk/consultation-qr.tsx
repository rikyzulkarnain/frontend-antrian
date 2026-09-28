'use client';
import { useState } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useClock } from '@/hooks/useClock';
import { fmtTime } from '@/lib/format';
import { CALL_CENTER_WA } from '@/lib/constants';
import { makeConsultationId } from '@/lib/consultation';

interface ConsultationQRProps {
  onBack: () => void;
}

/**
 * Layar Layanan Konsultasi. Tidak menerbitkan nomor antrian: pengunjung
 * memindai QR, mengisi formulir di HP, lalu diteruskan ke WhatsApp call center
 * dengan pesan yang sudah terformat. Karena itu layar ini tidak melakukan
 * polling ke backend seperti GuestWait.
 */
export function ConsultationQR({ onBack }: ConsultationQRProps) {
  const clock = useClock();
  // Dibuat sekali saat mount (client-only, sama seperti GuestWait) supaya ID
  // yang tampil di kiosk sama dengan yang dibawa QR ke HP pengunjung.
  const [refId] = useState(() => makeConsultationId());
  const url =
    `${window.location.origin}/m/konsultasi?ref=${encodeURIComponent(refId)}`;

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
          Layanan Konsultasi
        </div>
        <h1>
          Pindai QR untuk isi
          <br />
          formulir konsultasi.
        </h1>
      </div>
      <div className="kiosk-body" style={{ paddingTop: 16 }}>
        <div className="sop-head">
          <div
            className="glyph-lg"
            style={{
              background: 'oklch(0.95 0.045 175)',
              color: 'oklch(0.42 0.13 175)',
              border: '1px solid oklch(0.88 0.06 175)',
            }}
          >
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path
                d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.9-.9L3 20.5l1.6-4.8A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2>Konsultasi lewat Call Center</h2>
            <div className="meta">
              Layanan ini tidak memakai nomor antrian. Permohonan Anda diteruskan ke WhatsApp call
              center BBPJN Sumsel.
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
            <li>
              Isi <b>nama</b>, <b>nomor HP</b>, <b>topik</b>, dan <b>keperluan</b> Anda.
            </li>
            <li>
              Tekan kirim — WhatsApp terbuka dengan pesan yang sudah terisi, tinggal Anda kirim.
            </li>
          </ol>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 28,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: 24,
            padding: '18px 22px',
            borderRadius: 16,
            border: '1px solid var(--line-2)',
            background: 'var(--surface-2)',
          }}
        >
          <div>
            <div style={{ fontSize: 16, color: 'var(--ink-3)' }}>ID Permohonan</div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {refId}
            </div>
          </div>
          <div style={{ width: 1, height: 44, background: 'var(--line-2)' }} />
          <div>
            <div style={{ fontSize: 16, color: 'var(--ink-3)' }}>WhatsApp Call Center</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600 }}>
              {CALL_CENTER_WA.display}
            </div>
          </div>
        </div>
      </div>
      <div className="kiosk-foot" style={{ borderTop: 0, paddingTop: 0 }}>
        <div className="kiosk-cta-row" style={{ width: '100%' }}>
          <button className="kiosk-cta" onClick={onBack}>
            &larr; Kembali ke daftar layanan
          </button>
        </div>
      </div>
    </>
  );
}
