'use client';
import { useEffect, useRef } from 'react';

/**
 * Pemutar YouTube untuk layar Kiosk dan Display TV.
 *
 * Memakai IFrame Player API, bukan embed polos, karena layar antrian butuh dua
 * hal yang tidak disediakan iframe biasa: peristiwa "video selesai" untuk
 * lanjut ke video berikutnya, dan kendali volume agar suara video diredam saat
 * nomor antrian diumumkan.
 */

interface YTPlayer {
  playVideo(): void;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  getVolume(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: YTPlayerEvent) => void;
        onStateChange?: (e: YTPlayerEvent) => void;
        onError?: (e: YTPlayerEvent) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Skrip API hanya boleh dimuat sekali per halaman, sementara komponen ini bisa
// dipasang berkali-kali; simpan promise-nya di tingkat modul.
let apiPromise: Promise<YTNamespace> | null = null;

function loadPlayerApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube IFrame API dimuat tanpa YT.Player'));
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('Gagal memuat YouTube IFrame API'));
    document.head.appendChild(script);
  });
  return apiPromise;
}

export interface YouTubeVideoProps {
  videoId: string;
  /** Suara aktif; saat false pemutar dibisukan. */
  audioEnabled: boolean;
  /** Redam suara video selama pengumuman nomor antrian. */
  ducked?: boolean;
  /** Ulang video yang sama saat selesai (playlist berisi satu video). */
  loop?: boolean;
  playbackRate?: number;
  onEnded: () => void;
  onError: () => void;
  onProgress?: (played: number, duration: number) => void;
  style?: React.CSSProperties;
}

const DUCKED_VOLUME = 12;
const NORMAL_VOLUME = 100;

export function YouTubeVideo({
  videoId,
  audioEnabled,
  ducked = false,
  loop = false,
  playbackRate = 1,
  onEnded,
  onError,
  onProgress,
  style,
}: YouTubeVideoProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  // Callback disimpan di ref agar pemutar tidak dibangun ulang tiap render
  // induk — membangun ulang berarti video mulai lagi dari awal.
  const handlers = useRef({ onEnded, onError, onProgress, loop, audioEnabled });
  useEffect(() => {
    handlers.current = { onEnded, onError, onProgress, loop, audioEnabled };
  });

  useEffect(() => {
    let cancelled = false;
    let player: YTPlayer | null = null;

    loadPlayerApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        player = new YT.Player(hostRef.current, {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (e) => {
              // Autoplay bersuara diblokir browser tanpa interaksi; mulai bisu
              // lalu efek di bawah menyalakan suara begitu diizinkan.
              e.target.mute();
              e.target.playVideo();
              playerRef.current = e.target;
              if (handlers.current.audioEnabled) e.target.unMute();
            },
            onStateChange: (e) => {
              if (e.data !== YT.PlayerState.ENDED) return;
              if (handlers.current.loop) e.target.playVideo();
              else handlers.current.onEnded();
            },
            onError: () => handlers.current.onError(),
          },
        });
      })
      .catch(() => {
        if (!cancelled) handlers.current.onError();
      });

    return () => {
      cancelled = true;
      playerRef.current = null;
      player?.destroy();
    };
  }, [videoId]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (audioEnabled) p.unMute();
    else p.mute();
  }, [audioEnabled]);

  useEffect(() => {
    playerRef.current?.setVolume(ducked ? DUCKED_VOLUME : NORMAL_VOLUME);
  }, [ducked]);

  useEffect(() => {
    playerRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  // YouTube tidak memancarkan peristiwa kemajuan pemutaran, jadi bilah progres
  // diisi dengan polling ringan.
  useEffect(() => {
    if (!onProgress) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const duration = p.getDuration();
      if (duration > 0) handlers.current.onProgress?.(p.getCurrentTime(), duration);
    }, 1000);
    return () => clearInterval(id);
  }, [onProgress]);

  // Pembungkus dipakai agar YT.Player boleh mengganti elemen di dalamnya
  // dengan iframe tanpa mengusik simpul yang dikelola React.
  //
  // pointerEvents dimatikan karena video di sini hanya latar: iframe YouTube
  // yang menutup layar akan menelan sentuhan "Sentuh layar untuk ambil antrian"
  // di kiosk, dan membuka kendali pemutar YouTube di TV.
  return (
    <div style={{ pointerEvents: 'none', ...style }}>
      <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
