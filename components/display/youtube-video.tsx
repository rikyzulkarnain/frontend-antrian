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
  getPlayerState(): number;
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

// Video di sini hanya latar; pengumuman nomor antrian yang harus terdengar.
// Volume dasar sengaja jauh di bawah penuh, lalu diredam lagi selama panggilan.
const NORMAL_VOLUME = 35;
const DUCKED_VOLUME = 5;

// Menyalakan suara bisa melanggar kebijakan autoplay browser, dan YouTube tidak
// melaporkannya: pemutaran berhenti diam-diam sementara getPlayerState() tetap
// bilang PLAYING. Satu-satunya penanda yang jujur adalah posisi waktu yang tidak
// bergerak. Jadi: nyalakan suara, lalu pastikan waktu benar-benar maju; kalau
// tidak, kembalikan ke bisu dan putar lagi supaya layar tidak membeku di 00:00.
const AUDIO_PROBE_MS = 1000;
const PROBE_MIN_ADVANCE = 0.05;

function tryEnableAudio(player: YTPlayer, volume: number): void {
  let before: number;
  try {
    before = player.getCurrentTime();
  } catch {
    return;
  }
  // Volume harus diset di sini, bukan hanya saat status redam berubah: pemutar
  // yang baru di-unmute kembali ke bawaan YouTube (100) dan menenggelamkan
  // pengumuman antrian.
  player.setVolume(volume);
  player.unMute();
  player.playVideo();
  setTimeout(() => {
    // Pemutar bisa sudah dibuang saat timer menyala (video berganti / halaman
    // pindah); pemanggilannya lalu melempar.
    try {
      if (player.getCurrentTime() > before + PROBE_MIN_ADVANCE) return;
      player.mute();
      player.playVideo();
    } catch {
      // pemutar sudah tidak ada — tidak ada yang perlu dipulihkan
    }
  }, AUDIO_PROBE_MS);
}

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
  // Percobaan menyalakan suara hanya sekali per video; tanpa penjaga ini setiap
  // kembali ke status PLAYING akan memicu probe lagi.
  const audioTried = useRef(false);

  const volume = ducked ? DUCKED_VOLUME : NORMAL_VOLUME;

  // Callback disimpan di ref agar pemutar tidak dibangun ulang tiap render
  // induk — membangun ulang berarti video mulai lagi dari awal.
  const handlers = useRef({ onEnded, onError, onProgress, loop, audioEnabled, volume });
  useEffect(() => {
    handlers.current = { onEnded, onError, onProgress, loop, audioEnabled, volume };
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
            // Wajib bisu sejak awal: browser hanya mengizinkan autoplay tanpa
            // interaksi kalau video bisu. Suara dinyalakan belakangan oleh
            // tryEnableAudio(), dengan pengaman kalau ternyata ditolak.
            mute: 1,
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
              playerRef.current = e.target;
              // Mulai bisu tanpa syarat: hanya bentuk inilah yang dijamin boleh
              // autoplay. Suara menyusul setelah pemutaran terbukti berjalan.
              e.target.mute();
              e.target.playVideo();
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) {
                if (handlers.current.audioEnabled && !audioTried.current) {
                  audioTried.current = true;
                  tryEnableAudio(e.target, handlers.current.volume);
                }
                return;
              }
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
      audioTried.current = false;
      player?.destroy();
    };
  }, [videoId]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (!audioEnabled) {
      p.mute();
      return;
    }
    if (audioTried.current) return;
    audioTried.current = true;
    tryEnableAudio(p, handlers.current.volume);
  }, [audioEnabled]);

  // Cadangan bila autoplay bersuara ditolak: nyalakan suara pada interaksi
  // pertama apa pun (sentuh layar / keyboard / remote). Layar tanpa interaksi
  // tetap berjalan bisu, bukan membeku.
  useEffect(() => {
    if (!audioEnabled) return;
    const unmute = () => {
      const p = playerRef.current;
      if (!p) return;
      p.setVolume(handlers.current.volume);
      p.unMute();
      p.playVideo();
    };
    const opts = { passive: true } as const;
    window.addEventListener('pointerdown', unmute, opts);
    window.addEventListener('keydown', unmute, opts);
    window.addEventListener('touchstart', unmute, opts);
    return () => {
      window.removeEventListener('pointerdown', unmute);
      window.removeEventListener('keydown', unmute);
      window.removeEventListener('touchstart', unmute);
    };
  }, [audioEnabled]);

  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);

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
