'use client';
import { useEffect, useRef, useState } from 'react';
import { videoApi } from '@/lib/api/video';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toastError, toastSuccess } from '@/lib/toast';
import type { Video, VideoTarget } from '@/types/video';
import { cn } from '@/lib/utils';
import { VideoEditModal } from './video-edit-modal';

type Filter = 'all' | VideoTarget;
const FILTERS: Filter[] = ['all', 'kiosk', 'display', 'both'];

export function VideoManager() {
  const [filter, setFilter] = useState<Filter>('all');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Video | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const list = await videoApi.list();
      setVideos(list);
    } catch (err) {
      toastError(err, 'Gagal memuat daftar video.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    videoApi
      .list()
      .then((list) => {
        if (alive) setVideos(list);
      })
      .catch((err) => toastError(err, 'Gagal memuat daftar video.'))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleUpload = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    setProgress(0);
    try {
      const sig = await videoApi.uploadSignature();
      const result = await uploadToCloudinary(file, sig, setProgress);
      await videoApi.create({
        title: file.name.replace(/\.[^.]+$/, ''),
        url: result.secure_url,
        target_screen: 'both',
        duration_seconds: result.duration ? Math.round(result.duration) : null,
        is_active: true,
      });
      toastSuccess('Video berhasil diunggah.');
      await refresh();
    } catch (err) {
      toastError(err, 'Upload video gagal.');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleToggle = async (v: Video) => {
    try {
      const updated = await videoApi.update(v.id, { is_active: !v.is_active });
      setVideos((prev) => prev.map((x) => (x.id === v.id ? updated : x)));
    } catch (err) {
      toastError(err, 'Gagal mengubah status video.');
    }
  };

  const handleReorder = async (v: Video, direction: 'up' | 'down') => {
    const delta = direction === 'up' ? -1 : 1;
    try {
      const updated = await videoApi.update(v.id, {
        display_order: v.display_order + delta,
      });
      setVideos((prev) =>
        prev
          .map((x) => (x.id === v.id ? updated : x))
          .sort((a, b) => a.display_order - b.display_order),
      );
    } catch (err) {
      toastError(err, 'Gagal mengubah urutan.');
    }
  };

  const openEdit = (v: Video) => {
    setEditing(v);
    setEditOpen(true);
  };

  const handleSaved = (saved: Video) => {
    setVideos((prev) =>
      prev
        .map((x) => (x.id === saved.id ? saved : x))
        .sort((a, b) => a.display_order - b.display_order),
    );
  };

  const handleDelete = async (v: Video) => {
    if (!confirm(`Hapus video "${v.title}"?`)) return;
    try {
      await videoApi.remove(v.id);
      setVideos((prev) => prev.filter((x) => x.id !== v.id));
      toastSuccess('Video dihapus.');
    } catch (err) {
      toastError(err, 'Gagal menghapus video.');
    }
  };

  const vids = videos.filter((v) =>
    filter === 'all' ? true : v.target_screen === filter || v.target_screen === 'both',
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label className="upload-zone" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm"
          style={{ display: 'none' }}
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f);
          }}
        />
        <div className="big">
          {uploading
            ? `↑ Mengunggah… ${Math.round(progress)}%`
            : '↑ Tarik video ke sini, atau klik untuk pilih file'}
        </div>
        <div className="small">
          Format yang didukung: MP4, WebM · Maks 500 MB per file · Upload disimpan ke Cloudinary
        </div>
      </label>

      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="ttl">Playlist konten</div>
            <div className="sub">Atur urutan tayang untuk Kiosk dan Display TV</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={cn('chip', filter === f && 'chip-ink')}
                style={{ cursor: 'pointer' }}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Semua' : f}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              Memuat…
            </div>
          ) : (
            <div className="video-grid">
              {vids.map((v) => (
                <div key={v.id} className="video-tile">
                  <div
                    className="thumb"
                    style={{ background: 'linear-gradient(140deg, var(--ink-3), var(--ink))' }}
                  >
                    <div className="play">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5 3.5v9l8-4.5-8-4.5z" />
                      </svg>
                    </div>
                    <span className="dur">{formatDuration(v.duration_seconds)}</span>
                  </div>
                  <div className="body">
                    <div className="ttl">{v.title}</div>
                    <div className="meta">
                      <span>{v.target_screen.toUpperCase()}</span>
                      <button
                        type="button"
                        className={cn('toggle', v.is_active && 'on')}
                        onClick={() => handleToggle(v)}
                        aria-label="toggle active"
                      />
                    </div>
                    <div className="actions">
                      <a
                        className="btn"
                        style={{ flex: 1, textAlign: 'center' }}
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pratinjau
                      </a>
                      <button className="btn" onClick={() => openEdit(v)} aria-label="edit video">
                        ✎
                      </button>
                      <button className="btn" onClick={() => handleReorder(v, 'up')}>↑</button>
                      <button className="btn" onClick={() => handleReorder(v, 'down')}>↓</button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 8px' }}
                        onClick={() => handleDelete(v)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!vids.length && (
                <div style={{ padding: 24, color: 'var(--ink-3)', fontSize: 13 }}>
                  Belum ada video. Unggah pertama Anda di atas.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <VideoEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
