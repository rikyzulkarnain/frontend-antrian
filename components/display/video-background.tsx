'use client';
import { useEffect, useRef, useState } from 'react';
import { useVideoPlaylist } from '@/hooks/useVideoPlaylist';

export function VideoBackground() {
  const { current, index, total, advance } = useVideoPlaylist('display');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [progress, setProgress] = useState({ played: 0, duration: 0 });

  useEffect(() => {
    setProgress({ played: 0, duration: 0 });
    const el = videoRef.current;
    if (el && current) {
      el.load();
      el.play().catch(() => undefined);
    }
  }, [current?.id, current]);

  return (
    <div className="display-vid">
      {current ? (
        <video
          ref={videoRef}
          src={current.url}
          autoPlay
          muted
          playsInline
          onEnded={advance}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setProgress({ played: v.currentTime, duration: v.duration || 0 });
          }}
          onError={advance}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            background: '#050818',
          }}
        />
      ) : (
        <>
          <div className="vid-bg" />
          <div className="vid-grain" />
        </>
      )}
      <div
        className="vid-content"
        style={current ? { background: 'linear-gradient(180deg, transparent 40%, rgba(5,8,24,.85))' } : undefined}
      >
        <div className="vid-top">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.7 0.18 35)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            {current ? 'SEDANG TAYANG' : 'PROFIL LAYANAN'}
          </span>
          {total > 0 && (
            <>
              <span style={{ opacity: 0.5 }}>·</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                VIDEO {index + 1} / {total}
              </span>
            </>
          )}
        </div>
        <div className="vid-title">
          {current ? current.title : 'Pelayanan publik yang lebih cepat, lebih jelas.'}
          {!current && (
            <p>
              Sistem antrian terintegrasi membantu Anda mendapatkan layanan tanpa kebingungan. Pindai
              QR Code di tiket Anda untuk memantau antrian dari telepon genggam.
            </p>
          )}
        </div>
        {current && progress.duration > 0 ? (
          <div className="vid-progress">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, opacity: 0.7 }}>
              {fmtClock(progress.played)}
            </span>
            <div className="bar">
              <i style={{ width: `${(progress.played / progress.duration) * 100}%` }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, opacity: 0.7 }}>
              {fmtClock(progress.duration)}
            </span>
          </div>
        ) : (
          <div className="vid-progress">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, opacity: 0.7 }}>—:—</span>
            <div className="bar">
              <i style={{ width: '0%' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, opacity: 0.7 }}>—:—</span>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
