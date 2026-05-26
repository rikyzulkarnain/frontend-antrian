'use client';
import { useEffect, useMemo, useState } from 'react';
import { videoApi } from '@/lib/api/video';
import type { Video, VideoTarget } from '@/types/video';

const REFRESH_MS = 5 * 60 * 1000;

export interface VideoPlaylist {
  videos: Video[];
  current: Video | null;
  index: number;
  total: number;
  advance: () => void;
}

export function useVideoPlaylist(target: VideoTarget): VideoPlaylist {
  const [videos, setVideos] = useState<Video[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [forTarget, forBoth] = await Promise.all([
          videoApi.list(target).catch(() => [] as Video[]),
          videoApi.list('both').catch(() => [] as Video[]),
        ]);
        if (!alive) return;
        const merged = [...forTarget, ...forBoth]
          .filter((v) => v.is_active && v.url)
          .sort((a, b) => a.display_order - b.display_order);
        setVideos(merged);
        setIndex((i) => (merged.length === 0 ? 0 : i % merged.length));
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

  const advance = useMemo(
    () => () => setIndex((i) => (videos.length === 0 ? 0 : (i + 1) % videos.length)),
    [videos.length],
  );

  return {
    videos,
    current: videos.length > 0 ? videos[index] ?? null : null,
    index,
    total: videos.length,
    advance,
  };
}
