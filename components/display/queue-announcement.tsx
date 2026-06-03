'use client';
import { useEffect, useRef } from 'react';
import { apiBase } from '@/lib/api';

export interface CallBanner {
  queue_number: string;
  counter_name: string;
  ts: number;
}

interface QueueAnnouncementProps {
  banner: CallBanner | null;
  onDismiss: () => void;
}

// Lebih panjang agar mencakup bel + latensi TTS cloud + pengumuman tenang.
const AUTO_DISMISS_MS = 8000;

let voicesReady = false;
let primed = false;
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

// Bunyi bel "bing-bong" khas pengumuman bandara sebelum suara panggilan.
function playAirportChime(): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getAudioCtx();
    if (!ctx) return resolve();
    const now = ctx.currentTime;
    // Dua nada turun (C6 -> G5) — lembut seperti gong bandara.
    const notes = [
      { freq: 1046.5, start: 0 },
      { freq: 783.99, start: 0.5 },
    ];
    const master = ctx.createGain();
    master.gain.value = 0.2;
    master.connect(ctx.destination);
    for (const { freq, start } of notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + start;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 1.3);
    }
    // Resolusi setelah nada kedua mereda.
    setTimeout(resolve, 1600);
  });
}

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
    getAudioCtx(); // siapkan AudioContext untuk bunyi bel (harus dalam gesture user)
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    window.speechSynthesis.speak(u);
    primed = true;
  } catch {
    /* silent */
  }
}

// Nama-nama suara WANITA yang umum (Windows / Google / Edge / Azure neural).
const FEMALE_HINTS = [
  'female',
  'wanita',
  'perempuan',
  'gadis', // id-ID Gadis (neural wanita) — paling natural di Edge
  'damayanti',
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
// Nama suara PRIA yang harus dihindari (jangan dianggap wanita).
const MALE_HINTS = ['male', 'pria', 'andika', 'ardi', 'gilang', 'david', 'mark', 'guy'];

// Suara neural/online jauh lebih natural daripada suara lokal SAPI.
function isNatural(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
  return n.includes('natural') || n.includes('online') || n.includes('neural') || !v.localService;
}

function pickFemaleVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const name = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
  const isId = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith('id');
  const isMale = (v: SpeechSynthesisVoice) => MALE_HINTS.some((h) => name(v).includes(h));
  const isFemale = (v: SpeechSynthesisVoice) =>
    !isMale(v) && FEMALE_HINTS.some((h) => name(v).includes(h));

  // Skor lebih tinggi = lebih disukai. Prioritas: wanita > Indonesia > neural/natural.
  const score = (v: SpeechSynthesisVoice): number => {
    let s = 0;
    if (isFemale(v)) s += 100;
    if (isId(v)) s += 40;
    if (isNatural(v)) s += 20;
    if (name(v).includes('gadis')) s += 30; // neural wanita id-ID paling natural
    if (name(v).includes('google')) s += 10; // network voice Chrome, cukup natural
    if (isMale(v)) s -= 200; // jangan pernah pilih suara pria
    return s;
  };

  const ranked = [...voices].sort((a, b) => score(b) - score(a));
  const best = ranked[0];
  // Hanya pakai bila benar-benar suara yang masuk akal (bukan skor negatif).
  return best && score(best) > 0 ? best : voices.find(isId);
}

// Cache audio ElevenLabs per-teks (mis. saat recall nomor yang sama) supaya
// tidak menembak API berulang & hemat kuota gratis. Key: teks, value: objectURL.
const ttsCache = new Map<string, string>();
let ttsDisabled = false; // jadi true bila backend belum dikonfigurasi (503) → langsung fallback

// fetchCloudAudio mengambil MP3 dari backend (ElevenLabs). Mengembalikan
// objectURL siap putar, atau null bila gagal/nonaktif (akan di-fallback).
async function fetchCloudAudio(text: string): Promise<string | null> {
  if (ttsDisabled) return null;
  const cached = ttsCache.get(text);
  if (cached) return cached;
  try {
    const res = await fetch(`${apiBase}/tts?text=${encodeURIComponent(text)}`);
    if (res.status === 503) {
      ttsDisabled = true; // API key belum diset — berhenti mencoba sesi ini
      return null;
    }
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size) return null;
    const url = URL.createObjectURL(blob);
    ttsCache.set(text, url);
    return url;
  } catch {
    return null;
  }
}

function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const a = new Audio(url);
      a.volume = 1; // pengumuman selalu volume penuh
      a.onended = () => resolve();
      a.onerror = () => resolve();
      void a.play().catch(() => resolve());
    } catch {
      resolve();
    }
  });
}

// Fallback: suara browser (Web Speech) bila TTS cloud tidak tersedia.
function speakViaWebSpeech(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID';
    u.rate = 0.86; // tempo tenang & jelas seperti pengumuman bandara
    u.pitch = 1.05; // suara wanita yang natural, tidak melengking
    u.volume = 1;
    const female = pickFemaleVoice();
    if (female) u.voice = female;
    u.onerror = (e) => console.warn('[TTS] web-speech error', e);
    window.speechSynthesis.speak(u);
  } catch (err) {
    console.warn('[TTS] web-speech failed', err);
  }
}

async function speak(text: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    // Pastikan suara fallback siap & hentikan pengumuman sebelumnya.
    await ensureVoicesReady();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // Ambil audio ElevenLabs paralel dengan bunyi bel agar latensi tertutup.
    const audioPromise = fetchCloudAudio(text);
    await playAirportChime(); // bel "bing-bong" dulu
    const url = await audioPromise;

    if (url) {
      await playAudioUrl(url); // suara wanita natural dari ElevenLabs
    } else {
      speakViaWebSpeech(text); // fallback suara browser
    }
  } catch (err) {
    console.warn('[TTS] failed', err);
    speakViaWebSpeech(text);
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
