'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useClock } from '@/hooks/useClock';
import { fmtDate, fmtTime } from '@/lib/format';
import { INFO_LAYANAN_SLIDES, type Service } from '@/lib/constants';
import { ServiceCard } from './service-card';
import { InfoGallery } from './info-gallery';

interface ServiceSelectorProps {
  services: Service[];
  onPick: (svc: Service) => void;
  onConsult: () => void;
  onCancel: () => void;
}

export function ServiceSelector({ services, onPick, onConsult, onCancel }: ServiceSelectorProps) {
  const clock = useClock();
  const [infoOpen, setInfoOpen] = useState(false);
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
          Ketuk salah satu kategori di bawah. Anda akan membaca SOP, lalu mengisi formulir singkat
          (nama &amp; keperluan) lewat QR di HP sebelum nomor antrian terbit.
        </p>
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          style={{
            marginTop: 22,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 18,
            padding: '18px 30px 18px 22px',
            borderRadius: 18,
            border: '1px solid var(--line-2)',
            background: 'var(--surface)',
            boxShadow: 'var(--sh-sm)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'oklch(0.95 0.05 85)',
              color: 'oklch(0.45 0.14 85)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v11A1.5 1.5 0 0 1 14.5 18h-9A1.5 1.5 0 0 1 4 16.5z M18 7.5h.5A1.5 1.5 0 0 1 20 9v9.5a1.5 1.5 0 0 1-1.5 1.5H9 M7 8h6 M7 11.5h6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <span style={{ display: 'block', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
              Informasi Layanan
            </span>
            <span style={{ display: 'block', fontSize: 16, color: 'var(--ink-3)', marginTop: 2 }}>
              Standar pelayanan, alur, dan SKM · {INFO_LAYANAN_SLIDES.length} lembar
            </span>
          </span>
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            style={{ marginLeft: 6, color: 'var(--ink-3)' }}
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="kiosk-body">
        <div className="service-grid">
          {services.map((s) => (
            <ServiceCard key={s.key} service={s} onPick={onPick} />
          ))}
          {/*
            Konsultasi tidak lewat loket, jadi kartunya bukan bagian dari
            `services` (yang berasal dari API antrian) melainkan pintu masuk
            terpisah ke formulir konsultasi + WhatsApp call center.
          */}
          <div className="service-card" data-key="KONSUL" onClick={onConsult}>
            <div
              className="glyph"
              style={{
                background: 'oklch(0.95 0.045 175)',
                color: 'oklch(0.42 0.13 175)',
                borderColor: 'oklch(0.88 0.06 175)',
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path
                  d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.9-.9L3 20.5l1.6-4.8A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>Layanan Konsultasi</h3>
            <p className="desc">
              Tanya informasi layanan atau pengaduan langsung ke call center lewat WhatsApp.
            </p>
            <div className="meta">
              <span>Ketuk untuk pindai QR</span>
              <span>
                <span className="big" aria-hidden="true">→</span>
              </span>
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
      {infoOpen && (
        <InfoGallery slides={INFO_LAYANAN_SLIDES} onClose={() => setInfoOpen(false)} />
      )}
    </>
  );
}
