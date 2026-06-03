'use client';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { fmtTime } from '@/lib/format';
import { queueApi } from '@/lib/api/queue';
import { toastError } from '@/lib/toast';
import type { Counter, Service } from '@/lib/constants';
import type { QueueItem } from '@/types/queue';
import { cn } from '@/lib/utils';

interface SKMViewProps {
  ticket: QueueItem;
  svc: Service | undefined;
  counter: Counter | undefined;
  alreadyRated?: boolean;
}

const TAGS = ['Petugas ramah', 'Cepat dilayani', 'Ruangan bersih', 'SOP jelas', 'Antrian rapi'];
const RATING_LABELS = ['Buruk', 'Kurang', 'Cukup', 'Baik', 'Sangat baik'];

const CATEGORIES = [
  { key: 'PETUGAS', label: 'Pelayanan petugas' },
  { key: 'FASILITAS', label: 'Sarana & fasilitas' },
  { key: 'PROSEDUR', label: 'Prosedur layanan' },
  { key: 'WAKTU', label: 'Waktu tunggu' },
  { key: 'LAINNYA', label: 'Lainnya' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

const SKMSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    tags: z.array(z.string()),
    comment: z.string().max(500).optional(),
    respondent_name: z.string().max(80).optional(),
    respondent_phone: z
      .string()
      .max(20)
      .regex(/^[0-9+\-\s]*$/, 'No HP tidak valid')
      .optional(),
    issue_category: z
      .enum(['PETUGAS', 'FASILITAS', 'PROSEDUR', 'WAKTU', 'LAINNYA'])
      .optional(),
  })
  .refine((d) => d.rating > 3 || !!d.issue_category, {
    message: 'Pilih kategori masalah saat rating ≤ 3',
    path: ['issue_category'],
  });

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--line-2)',
  background: 'var(--surface)',
  fontSize: 13,
};

export function SKMView({ ticket, svc, counter, alreadyRated }: SKMViewProps) {
  const [submitted, setSubmitted] = useState(Boolean(alreadyRated));
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  // Reuse the name the visitor already entered on the intake form so they don't
  // type it twice. Both live on the same ticket row, so the survey response is
  // inherently tied to that identity.
  const [respondentName, setRespondentName] = useState(ticket.guest_name ?? '');
  const [respondentPhone, setRespondentPhone] = useState('');
  const [issueCategory, setIssueCategory] = useState<CategoryKey | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const ratingHeroRef = useRef<HTMLDivElement>(null);

  const categoryRequired = rating > 0 && rating <= 3;

  const toggleTag = (tag: string) => {
    setSelectedTags((s) => (s.includes(tag) ? s.filter((t) => t !== tag) : [...s, tag]));
  };

  const submit = () => {
    if (submitting) return;
    if (rating === 0) {
      setFormError('Beri rating bintang terlebih dahulu.');
      ratingHeroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const parsed = SKMSchema.safeParse({
      rating,
      tags: selectedTags,
      comment,
      respondent_name: respondentName,
      respondent_phone: respondentPhone,
      issue_category: issueCategory || undefined,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Form belum lengkap.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    // Run outside the form-submit event so React 19's async action tracking
    // and any in-flight view transition can't keep the button pinned in the
    // pending state. The try/catch+finally guarantees `submitting` resets.
    void (async () => {
      try {
        await queueApi.rate(ticket.id, {
          rating: parsed.data.rating as 1 | 2 | 3 | 4 | 5,
          tags: parsed.data.tags,
          comment: parsed.data.comment || undefined,
          respondent_name: parsed.data.respondent_name || undefined,
          respondent_phone: parsed.data.respondent_phone || undefined,
          issue_category: parsed.data.issue_category || undefined,
        });
        setSubmitted(true);
      } catch (err) {
        console.error('SKM submit failed', err);
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'Gagal mengirim penilaian. Coba lagi.';
        setFormError(msg);
        toastError(err, 'Gagal mengirim penilaian.');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  if (submitted) {
    return (
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
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'oklch(0.96 0.04 155)',
            color: 'oklch(0.4 0.13 155)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, margin: 0, fontWeight: 600, letterSpacing: '-0.015em' }}>
          Terima kasih!
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0, maxWidth: 300, lineHeight: 1.5 }}>
          Penilaian Anda untuk layanan <b>{svc?.name}</b> sudah kami terima dan diteruskan ke tim
          terkait.
        </p>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 14 }}>
          Tiket {ticket.queue_number} · {fmtTime(new Date())}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mobile-head">
        <div className="greet">Layanan selesai</div>
        <h1>Survei Kepuasan Masyarakat</h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.45 }}>
          Penilaian Anda membantu kami meningkatkan kualitas layanan publik.
        </p>
      </div>
      <form
        className="mobile-body"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="rating-hero" ref={ratingHeroRef}>
          <div className="ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2>Anda baru saja dilayani</h2>
            <p>
              Nomor <b style={{ color: 'var(--ink)' }}>{ticket.queue_number}</b> ·{' '}
              {counter?.name || 'Loket'} · {svc?.name}
            </p>
          </div>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                type="button"
                key={i}
                className={cn(i <= rating && 'on')}
                onClick={() => setRating(i)}
                aria-label={`Beri ${i} bintang`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={i <= rating ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path
                    d="M12 2.5l2.9 6.1 6.7.8-5 4.7 1.4 6.6L12 17.4l-6 3.3L7.4 14l-5-4.7 6.7-.8L12 2.5z"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            {rating ? RATING_LABELS[rating - 1] : 'Ketuk bintang untuk menilai'}
          </div>
        </div>

        <div className="m-section">
          <div className="h">Apa yang membuat layanan ini baik?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TAGS.map((t) => (
              <button
                type="button"
                key={t}
                className={cn('chip', selectedTags.includes(t) && 'chip-ink')}
                style={{ cursor: 'pointer', padding: '6px 10px', fontSize: 12 }}
                onClick={() => toggleTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="m-section">
          <div className="h">
            Kategori masalah{' '}
            {categoryRequired ? (
              <span style={{ color: 'var(--danger)' }}>*</span>
            ) : (
              <small style={{ color: 'var(--ink-3)' }}> (opsional)</small>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.key}
                className={cn('chip', issueCategory === c.key && 'chip-ink')}
                style={{ cursor: 'pointer', padding: '6px 10px', fontSize: 12 }}
                onClick={() => setIssueCategory(issueCategory === c.key ? '' : c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="m-section">
          <div className="h">Komentar (opsional)</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ceritakan pengalaman Anda…"
            style={{
              width: '100%',
              minHeight: 80,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--line-2)',
              background: 'var(--surface)',
              resize: 'none',
              fontSize: 13.5,
            }}
          />
        </div>

        <div className="m-section">
          <div className="h">Identitas (opsional)</div>
          {ticket.guest_name && (
            <p style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>
              Nama diambil dari formulir kunjungan Anda — ubah bila perlu.
            </p>
          )}
          <input
            type="text"
            placeholder="Nama lengkap"
            value={respondentName}
            onChange={(e) => setRespondentName(e.target.value)}
            style={inputStyle}
            maxLength={80}
          />
          <input
            type="tel"
            placeholder="No. HP / WhatsApp (08xxx)"
            value={respondentPhone}
            onChange={(e) => setRespondentPhone(e.target.value)}
            style={{ ...inputStyle, marginTop: 8 }}
            pattern="[0-9+\-\s]*"
            maxLength={20}
          />
          <p style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>
            Identitas hanya dipakai jika kami perlu tindak lanjut. Tidak ditampilkan publik.
          </p>
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
          disabled={submitting || rating === 0}
        >
          {submitting ? 'Mengirim…' : 'Kirim Penilaian'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: 10, fontSize: 13 }}
          onClick={() => setSubmitted(true)}
        >
          Lewati
        </button>
      </form>
    </>
  );
}
