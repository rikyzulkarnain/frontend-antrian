'use client';
import { useCallback, useEffect, useState } from 'react';
import type { InfoSlide } from '@/lib/constants';

interface InfoGalleryProps {
  slides: InfoSlide[];
  onClose: () => void;
}

/**
 * Papan informasi layanan sebagai lapisan di atas layar kiosk — sengaja tidak
 * berpindah halaman supaya pengunjung tidak kehilangan langkah pemilihan
 * layanan, dan tidak ada cara keluar dari aplikasi kiosk lewat tab baru.
 *
 * Dipasang-lepas oleh induknya, bukan disembunyikan lewat prop `open`, supaya
 * lembar yang sedang dibuka ikut hilang saat ditutup — pengunjung berikutnya
 * selalu mulai dari lembar pertama.
 */
export function InfoGallery({ slides, onClose }: InfoGalleryProps) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const total = slides.length;

  const go = useCallback(
    (step: number) => {
      if (total === 0) return;
      setLoaded(false);
      setIndex((i) => (i + step + total) % total);
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, go]);

  if (total === 0) return null;
  const slide = slides[index]!;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Informasi layanan"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(8,10,20,.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 28,
          width: '100%',
          maxWidth: 900,
          // Tinggi pasti, bukan maxHeight: area gambar memakai flex:1 dan
          // gambarnya diposisikan absolut, jadi tanpa tinggi yang sudah pasti
          // tidak ada ruang tersisa untuk dibagi dan area itu jadi nol.
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0,0,0,.35)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            padding: '24px 28px',
            borderBottom: '1px solid var(--line-2)',
          }}
        >
          <div>
            <div
              className="h-eyebrow"
              style={{ fontSize: 14 }}
            >{`Informasi ${index + 1} dari ${total}`}</div>
            <h2 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>
              {slide.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup informasi layanan"
            style={{
              flexShrink: 0,
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '1px solid var(--line-2)',
              background: 'var(--surface)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div
          style={{
            position: 'relative',
            flex: '1 1 0',
            minHeight: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--bg-2)',
          }}
        >
          {!loaded && (
            <div style={{ position: 'absolute', fontSize: 18, color: 'var(--ink-3)' }}>
              Memuat gambar…
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.title}
            onLoad={() => setLoaded(true)}
            style={{
              // Diposisikan absolut supaya ukuran aslinya tidak ikut menambah
              // tinggi kotak: gambar aslinya potret dan besar, dan dalam alur
              // normal ia mendorong tombol navigasi keluar layar.
              position: 'absolute',
              inset: 20,
              width: 'calc(100% - 40px)',
              height: 'calc(100% - 40px)',
              objectFit: 'contain',
              borderRadius: 12,
              opacity: loaded ? 1 : 0,
              transition: 'opacity .2s ease',
            }}
          />
        </div>

        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            padding: '20px 28px',
            borderTop: '1px solid var(--line-2)',
          }}
        >
          <button
            type="button"
            className="kiosk-cta"
            onClick={() => go(-1)}
            style={{ flex: 'none', padding: '18px 28px', fontSize: 20, borderRadius: 16 }}
          >
            ← Sebelumnya
          </button>

          <div style={{ display: 'flex', gap: 10 }} aria-hidden="true">
            {slides.map((s, i) => (
              <span
                key={s.src}
                style={{
                  width: i === index ? 30 : 12,
                  height: 12,
                  borderRadius: 999,
                  background: i === index ? 'var(--navy)' : 'var(--line-2)',
                  transition: 'width .2s ease, background .2s ease',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            className="kiosk-cta kiosk-cta-primary"
            onClick={() => go(1)}
            style={{ flex: 'none', padding: '18px 28px', fontSize: 20, borderRadius: 16 }}
          >
            Selanjutnya →
          </button>
        </footer>
      </div>
    </div>
  );
}
