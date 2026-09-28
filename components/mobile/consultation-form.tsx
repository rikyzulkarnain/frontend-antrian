'use client';
import { useState } from 'react';
import { z } from 'zod';
import { CALL_CENTER_WA, CONSULTATION_TOPICS } from '@/lib/constants';
import {
  buildConsultationMessage,
  buildConsultationWaUrl,
  makeConsultationId,
  type ConsultationPayload,
} from '@/lib/consultation';
import { MobileStatusBar } from './mobile-status-bar';

interface ConsultationFormProps {
  /** ID Permohonan yang dibawa QR kiosk. Kosong bila halaman dibuka langsung. */
  refId: string;
  /** Topik awal (opsional) bila QR sudah membawa kategori tertentu. */
  topic?: string;
}

const ConsultationSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(120),
  phone: z
    .string()
    .trim()
    .min(9, 'Nomor HP minimal 9 digit')
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, 'Nomor HP hanya boleh berisi angka'),
  org: z.string().trim().max(120),
  topic: z.string().trim().min(1, 'Topik wajib dipilih'),
  purpose: z.string().trim().min(1, 'Keperluan wajib diisi').max(500),
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 12px',
  borderRadius: 12,
  border: '1px solid var(--line-2)',
  background: 'var(--surface)',
  fontSize: 14,
};

export function ConsultationForm({ refId, topic: initialTopic }: ConsultationFormProps) {
  // Bila halaman dibuka tanpa ID dari QR (mis. tautan dibagikan ulang), buat
  // satu di sini supaya call center tetap punya acuan permohonan.
  const [ref] = useState(() => refId || makeConsultationId());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [org, setOrg] = useState('');
  const [topic, setTopic] = useState(
    initialTopic && CONSULTATION_TOPICS.includes(initialTopic)
      ? initialTopic
      : CONSULTATION_TOPICS[0],
  );
  const [purpose, setPurpose] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ConsultationPayload | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = () => {
    const parsed = ConsultationSchema.safeParse({ name, phone, org, topic, purpose });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Form belum lengkap.');
      return;
    }
    setFormError(null);
    setPayload({ refId: ref, ...parsed.data });
  };

  // Langkah 2: tinjau pesan, lalu buka WhatsApp lewat ketukan pengguna sendiri
  // supaya tidak diblokir sebagai pop-up.
  if (payload) {
    const waUrl = buildConsultationWaUrl(payload);
    const message = buildConsultationMessage(payload);
    return (
      <div className="mobile screen" data-screen-label="05 Konsultasi">
        <MobileStatusBar />
        <div className="mobile-head">
          <div className="greet">Layanan Konsultasi</div>
          <h1>Permohonan siap dikirim</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.45 }}>
            Tekan tombol di bawah untuk membuka WhatsApp. Pesan sudah terisi otomatis, Anda tinggal
            menekan kirim.
          </p>
        </div>
        <div className="mobile-body">
          <div className="m-section">
            <div className="h">ID Permohonan</div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '0.02em',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--line-2)',
                background: 'var(--surface-2)',
              }}
            >
              {payload.refId}
            </div>
          </div>

          <div className="m-section">
            <div className="h">Pesan yang akan dikirim</div>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'inherit',
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--ink-2)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid var(--line-2)',
                background: 'var(--surface)',
              }}
            >
              {message}
            </pre>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              padding: 14,
              fontSize: 14,
              marginTop: 4,
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Kirim lewat WhatsApp Call Center
          </a>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
            Call Center {CALL_CENTER_WA.display}
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: 12, fontSize: 13 }}
            onClick={() => {
              void navigator.clipboard
                ?.writeText(message)
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => undefined);
            }}
          >
            {copied ? 'Pesan disalin' : 'Salin pesan'}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: 12, fontSize: 13 }}
            onClick={() => setPayload(null)}
          >
            &larr; Ubah data
          </button>
        </div>
        <div className="home-ind" />
      </div>
    );
  }

  return (
    <div className="mobile screen" data-screen-label="05 Konsultasi">
      <MobileStatusBar />
      <div className="mobile-head">
        <div className="greet">Layanan Konsultasi</div>
        <h1>Formulir Konsultasi</h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.45 }}>
          Isi data berikut, lalu permohonan Anda diteruskan ke WhatsApp call center BBPJN Sumsel.
        </p>
      </div>
      <form
        className="mobile-body"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="m-section">
          <div className="h">ID Permohonan</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--ink-2)',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px dashed var(--line-2)',
              background: 'var(--surface-2)',
            }}
          >
            {ref}
          </div>
        </div>

        <div className="m-section">
          <div className="h">Nama lengkap</div>
          <input
            type="text"
            placeholder="Nama Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            maxLength={120}
            autoFocus
          />
        </div>

        <div className="m-section">
          <div className="h">Nomor HP / WhatsApp</div>
          <input
            type="tel"
            inputMode="tel"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            maxLength={20}
          />
        </div>

        <div className="m-section">
          <div className="h">Instansi / asal (opsional)</div>
          <input
            type="text"
            placeholder="Mis. Dinas PUPR, PT Karya Jaya, Umum"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            style={inputStyle}
            maxLength={120}
          />
        </div>

        <div className="m-section">
          <div className="h">Topik konsultasi</div>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} style={inputStyle}>
            {CONSULTATION_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="m-section">
          <div className="h">Keperluan / pertanyaan</div>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Jelaskan singkat hal yang ingin Anda tanyakan."
            style={{
              width: '100%',
              minHeight: 96,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--line-2)',
              background: 'var(--surface)',
              resize: 'none',
              fontSize: 14,
            }}
            maxLength={500}
          />
        </div>

        {formError && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--danger)',
              padding: '8px 10px',
              borderRadius: 8,
              background: 'oklch(0.96 0.04 30)',
            }}
          >
            {formError}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: 14, fontSize: 14, marginTop: 4 }}
        >
          Lanjut ke WhatsApp Call Center
        </button>
      </form>
      <div className="home-ind" />
    </div>
  );
}
