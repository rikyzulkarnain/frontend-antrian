'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useClock } from '@/hooks/useClock';
import { fmtTime } from '@/lib/format';
import { useCurrentQueues } from '@/hooks/useCurrentQueues';
import { useVideoPlaylist } from '@/hooks/useVideoPlaylist';

export function IdleScreen() {
  const clock = useClock();
  const queues = useCurrentQueues();
  const { current, index, total, advance } = useVideoPlaylist('kiosk');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const waitingCount = queues.filter((q) => q.status === 'waiting').length;
  const callingNow = queues.find((q) => q.status === 'calling');

  useEffect(() => {
    const el = videoRef.current;
    if (el && current) {
      el.load();
      el.play().catch(() => undefined);
    }
  }, [current?.id, current]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !audioOn;
    if (audioOn) {
      el.play().catch(() => undefined);
    }
  }, [audioOn, current?.id]);

  return (
    <div className="screensaver">
      <div
        style={{
          position: 'absolute',
          top: 48,
          left: 64,
          right: 64,
          zIndex: 5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'rgba(255,255,255,.1)',
            backdropFilter: 'blur(12px)',
            padding: '12px 18px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,.18)',
          }}
        >
          <Image
            src="/assets/bbpjn-sumsel.png"
            alt="BBPJN"
            width={44}
            height={44}
            style={{ width: 'auto', height: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.95 }}
          />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,.3)' }} />
          <Image
            src="/assets/pu-logo.png"
            alt="PU"
            width={40}
            height={40}
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAudioOn((v) => !v);
            }}
            aria-label={audioOn ? 'Matikan suara' : 'Aktifkan suara'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 999,
              background: audioOn ? 'rgba(243,180,25,.18)' : 'rgba(255,255,255,.1)',
              border: `1px solid ${audioOn ? 'rgba(243,180,25,.45)' : 'rgba(255,255,255,.22)'}`,
              backdropFilter: 'blur(12px)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.02em',
              cursor: 'pointer',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: audioOn ? 'var(--gold-2)' : 'rgba(255,255,255,.5)',
                boxShadow: audioOn ? '0 0 10px var(--gold-2)' : 'none',
              }}
            />
            {audioOn ? 'Suara aktif' : 'Aktifkan suara'}
          </button>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 22,
              color: 'rgba(255,255,255,.85)',
              letterSpacing: '0.04em',
            }}
          >
            {fmtTime(clock)}
          </div>
        </div>
      </div>
      <div className="vid-stage">
        {current ? (
          <video
            key={current.id}
            ref={videoRef}
            src={current.url}
            autoPlay
            muted={!audioOn}
            playsInline
            onEnded={advance}
            onError={advance}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#06090f',
            }}
          />
        ) : (
          <>
            <div className="vid-fake" />
            <div className="vid-grain" />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: "url('/assets/songket-motif.svg')",
                backgroundSize: '140px 140px',
                backgroundRepeat: 'repeat',
                opacity: 0.05,
                mixBlendMode: 'screen',
              }}
            />
          </>
        )}
        <div
          className="vid-overlay"
          style={
            current
              ? { background: 'linear-gradient(180deg, transparent 35%, rgba(6,9,15,.85))' }
              : undefined
          }
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 24,
              fontSize: 22,
              opacity: 0.85,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'oklch(0.7 0.16 35)',
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              {current
                ? `SEDANG TAYANG · ${current.title}${total > 1 ? ` · ${index + 1}/${total}` : ''}`
                : 'SEDANG TAYANG · PROFIL LAYANAN 2026'}
            </span>
          </div>
          {!current && (
            <>
              <h2>
                Selamat datang.
                <br />
                Layanan dimulai dari sentuhan Anda.
              </h2>
              <p>
                Sistem antrian digital ini membantu Anda memilih layanan, membaca SOP, dan
                mendapatkan nomor antrian dalam beberapa detik.
              </p>
            </>
          )}
        </div>
      </div>
      <div className="vid-bottom">
        <div className="vid-queues">
          <span>Antrian menunggu</span>
          <b>{waitingCount}</b>
          <span style={{ opacity: 0.4, margin: '0 8px' }}>·</span>
          <span>Sedang dipanggil</span>
          <b>{callingNow ? callingNow.queue_number : '—'}</b>
          <span style={{ opacity: 0.4, margin: '0 8px' }}>·</span>
          <span>{fmtTime(clock)}</span>
        </div>
        <div className="vid-tap">
          <span className="vid-pulse" />
          Sentuh layar untuk ambil antrian
        </div>
      </div>
    </div>
  );
}
