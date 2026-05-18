'use client';
import { useEffect, useRef } from 'react';

export interface CallBanner {
  queue_number: string;
  counter_name: string;
  ts: number;
}

interface QueueAnnouncementProps {
  banner: CallBanner | null;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 4200;

let voicesReady = false;
let primed = false;

function ensureVoicesReady(): Promise<void> {
  return new Promise((resolve) => {
    if (voicesReady) return resolve();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesReady = true;
      return resolve();
    }
    const handler = () => {
      voicesReady = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve();
    }, 1500);
  });
}

export function primeTTS(): void {
  if (primed) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    window.speechSynthesis.speak(u);
    primed = true;
  } catch {
    /* silent */
  }
}

async function speak(text: string): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    await ensureVoicesReady();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID';
    u.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.startsWith('id'));
    if (idVoice) u.voice = idVoice;
    u.onerror = (e) => console.warn('[TTS] error', e);
    window.speechSynthesis.speak(u);
  } catch (err) {
    console.warn('[TTS] failed', err);
  }
}

export function QueueAnnouncement({ banner, onDismiss }: QueueAnnouncementProps) {
  const lastTs = useRef<number | null>(null);

  useEffect(() => {
    if (!banner) return;
    if (lastTs.current === banner.ts) return;
    lastTs.current = banner.ts;
    void speak(
      `Nomor ${banner.queue_number.replace('-', ' ')}, silakan menuju ${banner.counter_name}`,
    );
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [banner, onDismiss]);

  if (!banner) return null;

  return (
    <div className="call-overlay">
      <div className="card-call">
        <div className="lbl">Nomor antrian dipanggil</div>
        <div className="num">{banner.queue_number}</div>
        <div className="ctr-info">
          <span style={{ fontSize: 24, color: 'var(--ink-2)' }}>menuju</span>
          <span className="arrow">→</span>
          <span className="ctr">{banner.counter_name}</span>
        </div>
        <div className="audio">
          <span className="audio-bars">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            Pengumuman suara · &quot;Nomor {banner.queue_number.replace('-', ' ')}, silakan menuju{' '}
            {banner.counter_name}&quot;
          </span>
        </div>
      </div>
    </div>
  );
}
