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

// Kata kunci nama suara wanita yang umum pada Windows / Google / Edge TTS.
const FEMALE_HINTS = [
  'female',
  'wanita',
  'perempuan',
  'gadis',
  'damayanti',
  'andika', // Microsoft Andika (id-ID) bersuara wanita
  'sri',
  'maya',
  'ratih',
  'siti',
  'dewi',
  'ayu',
  'zira',
  'hazel',
  'aria',
  'jenny',
  'sonia',
  'natasha',
];

function pickFemaleVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const idVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('id'));
  const isFemale = (v: SpeechSynthesisVoice) =>
    FEMALE_HINTS.some((h) => v.name.toLowerCase().includes(h));

  // 1) Suara Bahasa Indonesia yang teridentifikasi wanita.
  const idFemale = idVoices.find(isFemale);
  if (idFemale) return idFemale;
  // 2) Suara Google Bahasa Indonesia (default-nya wanita).
  const googleId = idVoices.find((v) => v.name.toLowerCase().includes('google'));
  if (googleId) return googleId;
  // 3) Suara Bahasa Indonesia apa pun.
  if (idVoices[0]) return idVoices[0];
  // 4) Fallback: suara wanita bahasa lain.
  return voices.find(isFemale);
}

async function speak(text: string): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    await ensureVoicesReady();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID';
    u.rate = 0.95;
    u.pitch = 1.15; // sedikit lebih tinggi agar terdengar lebih jelas sebagai suara wanita
    u.volume = 1; // panggilan nomor antrian selalu volume penuh
    const female = pickFemaleVoice();
    if (female) u.voice = female;
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
