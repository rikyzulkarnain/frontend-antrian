'use client';
import { useEffect } from 'react';

/**
 * Masuk ke mode layar penuh (Fullscreen API) saat halaman dibuka.
 *
 * Browser memblokir requestFullscreen() tanpa user gesture, jadi kalau
 * percobaan saat mount ditolak, kita pasang listener satu kali untuk
 * interaksi pertama (klik/tap/tombol) lalu masuk layar penuh dari situ.
 */
export function useAutoFullscreen(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const enter = async (): Promise<boolean> => {
      const el = document.documentElement;
      if (document.fullscreenElement || !el.requestFullscreen) return true;
      try {
        await el.requestFullscreen();
        return true;
      } catch {
        return false;
      }
    };

    let disposed = false;

    const onGesture = () => {
      void enter();
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener('pointerdown', onGesture);
      document.removeEventListener('keydown', onGesture);
      document.removeEventListener('touchstart', onGesture);
    };

    void enter().then((ok) => {
      if (disposed || ok) return;
      // Ditolak (butuh gesture): tunggu interaksi pertama pengguna.
      document.addEventListener('pointerdown', onGesture, { once: true });
      document.addEventListener('keydown', onGesture, { once: true });
      document.addEventListener('touchstart', onGesture, { once: true });
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [enabled]);
}
