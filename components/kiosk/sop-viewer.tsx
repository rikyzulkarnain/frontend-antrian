'use client';
import Image from 'next/image';
import { useClock } from '@/hooks/useClock';
import { fmtTime } from '@/lib/format';
import { getSvcBg, getSvcBorder, getSvcFg, type Service } from '@/lib/constants';

interface SOPViewerProps {
  svc: Service;
  onConfirm: () => void;
  onBack: () => void;
}

export function SOPViewer({ svc, onConfirm, onBack }: SOPViewerProps) {
  const clock = useClock();
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
          Langkah 2 dari 3 — Standar Operasional
        </div>
      </div>
      <div className="kiosk-body" style={{ paddingTop: 32 }}>
        <div className="sop-head">
          <div
            className="glyph-lg"
            style={{
              background: getSvcBg(svc.key),
              color: getSvcFg(svc.key),
              border: `1px solid ${getSvcBorder(svc.key)}`,
            }}
          >
            {svc.glyph}
          </div>
          <div>
            <h2>{svc.name}</h2>
            <div className="meta">
              Mohon baca prosedur berikut sebelum mengambil nomor antrian.
            </div>
          </div>
        </div>
        <div className="sop-steps">
          {svc.sop.map((line, i) => (
            <div className="sop-step" key={i}>
              <span className="num">{i + 1}</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
        <div className="sop-confirm">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 8v5M12 16h.01M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" strokeLinecap="round" />
          </svg>
          <span>
            Dengan menekan tombol di bawah, Anda menyatakan telah membaca dan memahami SOP layanan
            ini.
          </span>
        </div>
      </div>
      <div className="kiosk-foot" style={{ borderTop: 0, paddingTop: 0 }}>
        <div className="kiosk-cta-row" style={{ width: '100%' }}>
          <button className="kiosk-cta" onClick={onBack}>
            ← Pilih layanan lain
          </button>
          <button className="kiosk-cta kiosk-cta-primary" onClick={onConfirm}>
            Ambil nomor antrian
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
