'use client';
import Image from 'next/image';
import { useClock } from '@/hooks/useClock';
import { fmtTime } from '@/lib/format';
import { useCurrentQueues } from '@/hooks/useCurrentQueues';

export function IdleScreen() {
  const clock = useClock();
  const queues = useCurrentQueues();
  const waitingCount = queues.filter((q) => q.status === 'waiting').length;
  const callingNow = queues.find((q) => q.status === 'calling');

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
      <div className="vid-stage">
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
        <div className="vid-overlay">
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
              SEDANG TAYANG · PROFIL LAYANAN 2026
            </span>
          </div>
          <h2>
            Selamat datang.
            <br />
            Layanan dimulai dari sentuhan Anda.
          </h2>
          <p>
            Sistem antrian digital ini membantu Anda memilih layanan, membaca SOP, dan mendapatkan
            nomor antrian dalam beberapa detik.
          </p>
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
