'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { videoApi } from '@/lib/api/video';
import type { Video, VideoTarget } from '@/types/video';

const REFRESH_MS = 5 * 60 * 1000;

export interface VideoPlaylist {
  videos: Video[];
  current: Video | null;
  index: number;
  total: number;
  advance: () => void;
  /**
   * Menandai satu video sebagai tak bisa diputar (link CDN mati/kadaluarsa,
   * codec tidak didukung). Video itu dibuang dari playlist sampai poll
   * berikutnya, jadi layar tidak terkunci pada sumber yang rusak.
   */
  markFailed: (id: string) => void;
}

export function useVideoPlaylist(target: VideoTarget): VideoPlaylist {
  const [videos, setVideos] = useState<Video[]>([]);
  const [index, setIndex] = useState(0);
  // Id video yang gagal dimuat. Dikosongkan tiap poll agar host yang sempat
  // down (mis. kuota CDN habis lalu dipulihkan) otomatis dicoba lagi.
  const [failed, setFailed] = useState<Record<string, true>>({});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const list = await videoApi.list(target);
        if (!alive) return;
        const active = list
          .filter((v) => v.is_active && v.url)
          .sort((a, b) => a.display_order - b.display_order);
        setVideos(active);
        setFailed((f) => (Object.keys(f).length === 0 ? f : {}));
        setIndex((i) => (active.length === 0 ? 0 : i % active.length));
      } catch {
        // ignore — fallback rendering handles empty list
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [target]);

  const playable = useMemo(() => videos.filter((v) => !failed[v.id]), [videos, failed]);

  const advance = useMemo(
    () => () => setIndex((i) => (playable.length === 0 ? 0 : (i + 1) % playable.length)),
    [playable.length],
  );

  const markFailed = useCallback((id: string) => {
    setFailed((f) => (f[id] ? f : { ...f, [id]: true }));
  }, []);

  // Membuang video yang gagal bisa membuat index melewati batas; bungkus di
  // sini agar current selalu menunjuk item yang ada.
  const safeIndex = playable.length > 0 ? index % playable.length : 0;

  return {
    videos: playable,
    current: playable.length > 0 ? playable[safeIndex] ?? null : null,
    index: safeIndex,
    total: playable.length,
    advance,
    markFailed,
  };
}
