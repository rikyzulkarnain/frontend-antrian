'use client';
import Image from 'next/image';
import { useClock } from '@/hooks/useClock';
import { fmtTime } from '@/lib/format';
import { getSvcBg, getSvcBorder, getSvcFg, type Service } from '@/lib/constants';

interface ServiceChoiceProps {
  svc: Service;
  onPickSOP: () => void;
  onPickDirect: () => void;
  onBack: () => void;
}

export function ServiceChoice({ svc, onPickSOP, onPickDirect, onBack }: ServiceChoiceProps) {
  const clock = useClock();
  return (
    <>
      <div className="kiosk-head" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image
            src="/assets/bbpjn-sumsel.png"
            alt="BBPJN"
            width={56}
            height={56}
            style={{ width: 'auto', height: 'auto' }}
          />
          <div style={{ width: 1, height: 42, background: 'var(--line-2)' }} />
          <Image
            src="/assets/pu-logo.png"
            alt="PU"
            width={48}
            height={48}
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 24,
            color: 'var(--ink)',
            fontWeight: 600,
          }}
        >
          {fmtTime(clock)}
        </div>
      </div>
      <div className="kiosk-title">
        <div className="h-eyebrow" style={{ fontSize: 18 }}>
          Langkah 2 dari 3 — Pilih cara lanjut
        </div>
        <h1>
          Anda memilih <b>{svc.name}</b>.
          <br />
          Mau bagaimana selanjutnya?
        </h1>
      </div>
      <div className="kiosk-body">
        <div className="service-grid">
          <div
            className="service-card"
            onClick={onPickSOP}
            style={{ minHeight: 240, cursor: 'pointer' }}
          >
            <div
              className="glyph"
              style={{
                background: getSvcBg(svc.key),
                color: getSvcFg(svc.key),
                borderColor: getSvcBorder(svc.key),
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
                  strokeLinejoin="round"
                />
                <path d="M14 3v6h5" strokeLinejoin="round" />
                <path d="M9 13h6M9 17h6" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Baca SOP dulu</h3>
            <p className="desc">
              Pelajari prosedur layanan sebelum mengambil nomor antrian.
            </p>
            <div className="meta">
              <span>Direkomendasikan untuk pengunjung baru</span>
            </div>
          </div>
          <div
            className="service-card"
            onClick={onPickDirect}
            style={{ minHeight: 240, cursor: 'pointer' }}
          >
            <div
              className="glyph"
              style={{
                background: getSvcBg(svc.key),
                color: getSvcFg(svc.key),
                borderColor: getSvcBorder(svc.key),
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V8z"
                  strokeLinejoin="round"
                />
                <path d="M14 6v2M14 11v2M14 16v2" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Langsung ambil nomor</h3>
            <p className="desc">
              Saya sudah paham prosedurnya. Cetak nomor antrian sekarang.
            </p>
            <div className="meta">
              <span>Untuk pengunjung yang sudah familier</span>
            </div>
          </div>
        </div>
      </div>
      <div className="kiosk-foot">
        <button
          className="btn btn-ghost"
          style={{ fontSize: 18, padding: '14px 22px' }}
          onClick={onBack}
        >
          ← Kembali pilih layanan
        </button>
        <div style={{ fontFamily: 'var(--font-mono)' }}>v2.0 · Hub Layanan</div>
      </div>
    </>
  );
}
