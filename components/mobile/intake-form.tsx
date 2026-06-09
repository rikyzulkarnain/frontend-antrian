'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { queueApi } from '@/lib/api/queue';
import { toastError } from '@/lib/toast';
import type { QueueItem } from '@/types/queue';
import { MobileStatusBar } from './mobile-status-bar';

interface IntakeFormProps {
  token: string;
  serviceKey: string;
  serviceName: string;
}

const IntakeSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(120),
  purpose: z.string().trim().min(1, 'Keperluan wajib diisi').max(300),
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 12px',
  borderRadius: 12,
  border: '1px solid var(--line-2)',
  background: 'var(--surface)',
  fontSize: 14,
};

export function IntakeForm({ token, serviceKey, serviceName }: IntakeFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<QueueItem | null>(null);
  const [checking, setChecking] = useState(true);

  const label = serviceName || 'Layanan';

  // Redirect to the waiting/monitoring page as soon as a ticket is available
  useEffect(() => {
    if (ticket) {
      router.replace(`/m/${ticket.id}`);
    }
  }, [ticket, router]);

  // If this token already has a ticket (e.g. the visitor refreshed after
  // submitting), redirect straight away instead of showing a blank form.
  useEffect(() => {
    let alive = true;
    queueApi
      .getGuest(token)
      .then((q) => {
        if (alive && q) setTicket(q);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const submit = () => {
    if (submitting) return;
    if (!serviceKey) {
      setFormError('Layanan tidak dikenali. Pindai ulang QR di kiosk.');
      return;
    }
    const parsed = IntakeSchema.safeParse({ name, purpose });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Form belum lengkap.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    void (async () => {
      try {
        const q = await queueApi.createGuest({
          serviceType: serviceKey,
          token,
          name: parsed.data.name,
          purpose: parsed.data.purpose,
        });
        setTicket(q); // triggers redirect via the useEffect above
      } catch (err) {
        setFormError(
          err instanceof Error && err.message ? err.message : 'Gagal mengirim formulir. Coba lagi.',
        );
        toastError(err, 'Gagal mengirim formulir.');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  // Show a brief loading state while the redirect is in progress
  if (ticket) {
    return (
      <div className="mobile screen" data-screen-label="04 Mobile">
        <MobileStatusBar />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            textAlign: 'center',
            gap: 14,
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>Mengalihkan ke halaman antrian…</div>
        </div>
        <div className="home-ind" />
      </div>
    );
  }

  return (
    <div className="mobile screen" data-screen-label="04 Mobile">
      <MobileStatusBar />
      <div className="mobile-head">
        <div className="greet">{label}</div>
        <h1>Formulir Kunjungan</h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.45 }}>
          Isi data berikut untuk mendapatkan nomor antrian {label}.
        </p>
      </div>
      {checking ? (
        <div style={{ padding: 32, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-3)' }}>
          Memuat…
        </div>
      ) : (
        <form
          className="mobile-body"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
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
            <div className="h">Keperluan kunjungan</div>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Mis. mengurus dokumen, koordinasi proyek, konsultasi layanan…"
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
              maxLength={300}
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
            disabled={submitting}
          >
            {submitting ? 'Mengirim…' : 'Ambil Nomor Antrian'}
          </button>
        </form>
      )}
      <div className="home-ind" />
    </div>
  );
}
