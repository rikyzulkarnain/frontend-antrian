'use client';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useClock } from '@/hooks/useClock';
import { fmtTime } from '@/lib/format';
import { getSvcBg, getSvcBorder, getSvcFg, type Service } from '@/lib/constants';

interface SOPViewerProps {
  svc: Service;
  onConfirm: () => void;
  onBack: () => void;
  /**
   * Buku Tamu mode: the confirm button advances to the guest-registration QR
   * step instead of issuing a number directly. The service's portal QR is
   * hidden here to avoid clashing with the registration QR on the next step.
   */
  guestMode?: boolean;
}

export function SOPViewer({ svc, onConfirm, onBack, guestMode = false }: SOPViewerProps) {
  const clock = useClock();
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
          Langkah 2 dari 3 — Standar Operasional
        </div>
      </div>
      <div className="kiosk-body" style={{ paddingTop: 32 }}>
        <div className="sop-head">
          <div
            className="glyph-lg"
            style={{
              background: bg,
              color: fg,
              border: `1px solid ${border}`,
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
        {(svc.sop_pdf_url || (svc.qr_url && !guestMode)) && (
          <div
            className="sop-extras"
            style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-start' }}
          >
            {svc.sop_pdf_url && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a
                  href={svc.sop_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kiosk-cta"
                >
                  Lihat SOP lengkap (PDF) →
                </a>
                <a
                  href={svc.sop_pdf_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kiosk-cta"
                >
                  ↓ Unduh SOP
                </a>
              </div>
            )}
            {/* QR unduh SOP: isinya persis link tombol "Unduh SOP" di atas, agar
                pengunjung bisa membawa berkasnya di HP tanpa printer kiosk. */}
            {svc.sop_pdf_url && (
              <div style={{ textAlign: 'center' }}>
                <QRCodeSVG value={svc.sop_pdf_url} size={132} />
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
                  Pindai untuk unduh SOP
                </div>
              </div>
            )}
            {svc.qr_url && !guestMode && (
              <div style={{ textAlign: 'center' }}>
                <QRCodeSVG value={svc.qr_url} size={132} />
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
                  Scan untuk akses aplikasi/portal
                </div>
              </div>
            )}
          </div>
        )}
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
            {guestMode
              ? 'Nomor antrian diterbitkan setelah Anda mengisi formulir kunjungan (nama & keperluan) lewat QR di langkah berikutnya.'
              : 'Dengan menekan tombol di bawah, Anda menyatakan telah membaca dan memahami SOP layanan ini.'}
          </span>
        </div>
      </div>
      <div className="kiosk-foot" style={{ borderTop: 0, paddingTop: 0 }}>
        <div className="kiosk-cta-row" style={{ width: '100%' }}>
          <button className="kiosk-cta" onClick={onBack}>
            ← Pilih layanan lain
          </button>
          <button className="kiosk-cta kiosk-cta-primary" onClick={onConfirm}>
            {guestMode ? 'Lanjut isi formulir' : 'Ambil nomor antrian'}
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
