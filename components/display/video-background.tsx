'use client';
import { useEffect, useRef, useState } from 'react';
import { useVideoPlaylist } from '@/hooks/useVideoPlaylist';

const PLAYBACK_RATES = [1, 2, 4, 8] as const;
type PlaybackRate = (typeof PLAYBACK_RATES)[number];

// Volume video saat ada panggilan nomor antrian (di-ducking agar suara
// panggilan terdengar jelas) vs. volume normal.
const DUCKED_VOLUME = 0.12;
const NORMAL_VOLUME = 1;

export function VideoBackground({
  audioEnabled = false,
  ducked = false,
  showDebugControls = false,
}: {
  audioEnabled?: boolean;
  ducked?: boolean;
  showDebugControls?: boolean;
}) {
  const { current, index, total, advance } = useVideoPlaylist('display');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [progress, setProgress] = useState({ played: 0, duration: 0 });
  const [rate, setRate] = useState<PlaybackRate>(1);

  useEffect(() => {
    setProgress({ played: 0, duration: 0 });
    const el = videoRef.current;
    if (el && current) {
      el.load();
      el.play().catch(() => undefined);
    }
  }, [current?.id, current]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !audioEnabled;
    if (audioEnabled) {
      el.play().catch(() => undefined);
    }
  }, [audioEnabled, current?.id]);

  // Ducking: kecilkan suara video selama panggilan nomor antrian diumumkan.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = ducked ? DUCKED_VOLUME : NORMAL_VOLUME;
  }, [ducked, current?.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = rate;
  }, [rate, current?.id]);

  return (
    <div className="display-vid">
      {current ? (
        <video
          key={current.id}
          ref={videoRef}
          src={current.url}
          autoPlay
          muted={!audioEnabled}
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
            objectFit: 'contain',
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
      {showDebugControls && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 12,
            background: 'rgba(0,0,0,.55)',
            border: '1px solid rgba(255,255,255,.18)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <span style={{ opacity: 0.7, letterSpacing: '0.06em' }}>DEBUG</span>
          {PLAYBACK_RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRate(r)}
              style={{
                padding: '4px 9px',
                borderRadius: 6,
                background: rate === r ? 'var(--gold-2)' : 'rgba(255,255,255,.1)',
                color: rate === r ? '#000' : 'white',
                border: '1px solid rgba(255,255,255,.2)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {r}x
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const el = videoRef.current;
              if (el && el.duration > 1) {
                el.currentTime = Math.max(0, el.duration - 0.5);
              } else {
                advance();
              }
            }}
            disabled={total < 2}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: total < 2 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.18)',
              color: 'white',
              border: '1px solid rgba(255,255,255,.25)',
              fontSize: 12,
              fontWeight: 600,
              cursor: total < 2 ? 'not-allowed' : 'pointer',
              opacity: total < 2 ? 0.5 : 1,
            }}
          >
            Skip »
          </button>
        </div>
      )}
    </div>
  );
}

function fmtClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
