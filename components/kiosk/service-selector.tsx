'use client';
import Image from 'next/image';
import { useClock } from '@/hooks/useClock';
import { fmtDate, fmtTime } from '@/lib/format';
import { SERVICES, type Service } from '@/lib/constants';
import { ServiceCard } from './service-card';

interface ServiceSelectorProps {
  onPick: (svc: Service) => void;
  onCancel: () => void;
}

export function ServiceSelector({ onPick, onCancel }: ServiceSelectorProps) {
  const clock = useClock();
  return (
    <>
      <div className="kiosk-head" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Image src="/assets/bbpjn-sumsel.png" alt="BBPJN" width={72} height={72} style={{ width: 'auto', height: 'auto' }} />
          <div style={{ width: 1, height: 56, background: 'var(--line-2)' }} />
          <Image src="/assets/pu-logo.png" alt="PU" width={64} height={64} style={{ width: 'auto', height: 'auto' }} />
          <div>
            <div
              style={{
                fontSize: 14,
                letterSpacing: '0.1em',
                color: 'var(--ink-3)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              BBPJN Sumatera Selatan
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
              Hub Layanan Terpadu
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--ink-2)' }}>
            {fmtDate(clock)}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 28,
              color: 'var(--ink)',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {fmtTime(clock)}
          </div>
        </div>
      </div>
      <div className="kiosk-title">
        <div className="h-eyebrow" style={{ fontSize: 18 }}>
          Langkah 1 dari 3 — Pilih layanan
        </div>
        <h1>
          Layanan apa yang
          <br />
          Anda butuhkan hari ini?
        </h1>
        <p>
          Ketuk salah satu kategori di bawah. Anda akan diberi pilihan: baca SOP terlebih dahulu
          atau langsung mengambil nomor antrian.
        </p>
      </div>
      <div className="kiosk-body">
        <div className="service-grid">
          {SERVICES.map((s) => (
            <ServiceCard key={s.key} service={s} onPick={onPick} />
          ))}
          <div
            className="service-card"
            style={{ background: 'var(--bg-2)', borderStyle: 'dashed', cursor: 'default' }}
          >
            <div style={{ fontSize: 22, color: 'var(--ink-3)', fontWeight: 500 }}>
              Butuh bantuan?
            </div>
            <div style={{ fontSize: 18, color: 'var(--ink-2)', lineHeight: 1.4 }}>
              Tekan tombol bel di samping kiosk untuk memanggil petugas resepsionis. Tersedia kursi
              prioritas untuk lansia dan disabilitas.
            </div>
          </div>
        </div>
      </div>
      <div className="kiosk-foot">
        <button
          className="btn btn-ghost"
          style={{ fontSize: 18, padding: '14px 22px' }}
          onClick={onCancel}
        >
          ← Kembali ke layar utama
        </button>
        <div style={{ fontFamily: 'var(--font-mono)' }}>v2.0 · Hub Layanan</div>
      </div>
    </>
  );
}
