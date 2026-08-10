'use client';
import { useEffect, useState } from 'react';
import { videoApi } from '@/lib/api/video';
import { driveFileId } from '@/lib/video-url';
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
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Video | undefined>(undefined);
  const [newTitle, setNewTitle] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newTarget, setNewTarget] = useState<VideoTarget>('both');
  const [adding, setAdding] = useState(false);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adding) return;
    const link = newLink.trim();
    if (!driveFileId(link)) {
      toastError(null, 'Tautan tidak dikenali sebagai berkas Google Drive.');
      return;
    }
    setAdding(true);
    try {
      await videoApi.create({
        title: newTitle.trim(),
        url: link,
        target_screen: newTarget,
        is_active: true,
      });
      toastSuccess('Video ditambahkan.');
      setNewTitle('');
      setNewLink('');
      await refresh();
    } catch (err) {
      toastError(err, 'Gagal menambahkan video.');
    } finally {
      setAdding(false);
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
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="ttl">Tambah video dari Google Drive</div>
            <div className="sub">
              Unggah berkas ke Google Drive Anda, atur berbagi ke &quot;Siapa saja yang memiliki
              link&quot;, lalu tempel tautannya di sini
            </div>
          </div>
        </div>
        <div className="panel-body">
          <form
            onSubmit={handleAdd}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}
          >
            <div className="field" style={{ marginBottom: 0 }}>
              <label>
                Judul<span style={{ color: 'var(--danger,#b91c1c)' }}> *</span>
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Video anti gratifikasi BBPJN Sumsel"
                required
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>
                Tautan Google Drive<span style={{ color: 'var(--danger,#b91c1c)' }}> *</span>
              </label>
              <input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/1AbC.../view?usp=sharing"
                required
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Target tayangan</label>
              <select
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value as VideoTarget)}
              >
                <option value="kiosk">Kiosk</option>
                <option value="display">Display TV</option>
                <option value="both">Keduanya</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={adding}>
                {adding ? 'Menambahkan…' : 'Tambah video'}
              </button>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                Berkas yang belum dibagikan publik akan gagal diputar di TV.
              </span>
            </div>
          </form>
        </div>
      </div>

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
