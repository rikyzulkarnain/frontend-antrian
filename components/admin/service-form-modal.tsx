'use client';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/modal';
import { serviceApi } from '@/lib/api/service';
import { toastError, toastSuccess } from '@/lib/toast';
import type { Service, ServicePatch } from '@/types/service';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Service;
  onSaved: (s: Service) => void;
}

const MAX_STEPS = 20;
const MAX_STEP_LEN = 300;

export function ServiceFormModal({ open, onClose, initial, onSaved }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [glyph, setGlyph] = useState('');
  const [colorBg, setColorBg] = useState('');
  const [colorFg, setColorFg] = useState('');
  const [colorBorder, setColorBorder] = useState('');
  const [avgWait, setAvgWait] = useState<number>(0);
  const [sopPdfUrl, setSopPdfUrl] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !initial) return;
    setName(initial.name);
    setDescription(initial.description);
    setGlyph(initial.glyph);
    setColorBg(initial.color_bg);
    setColorFg(initial.color_fg);
    setColorBorder(initial.color_border);
    setAvgWait(initial.avg_wait_min);
    setSopPdfUrl(initial.sop_pdf_url ?? '');
    setQrUrl(initial.qr_url ?? '');
    setSteps([...initial.sop_steps]);
  }, [open, initial]);

  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const addStep = () => {
    if (steps.length >= MAX_STEPS) return;
    setSteps((s) => [...s, '']);
  };
  const setStep = (i: number, val: string) =>
    setSteps((s) => s.map((v, idx) => (idx === i ? val : v)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initial || submitting) return;
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (cleanSteps.some((s) => s.length > MAX_STEP_LEN)) {
      toastError(new Error('Salah satu langkah SOP terlalu panjang (max 300 karakter).'));
      return;
    }
    setSubmitting(true);
    try {
      const patch: ServicePatch = {
        name,
        description,
        glyph,
        color_bg: colorBg,
        color_fg: colorFg,
        color_border: colorBorder,
        avg_wait_min: avgWait,
        sop_steps: cleanSteps,
        sop_pdf_url: sopPdfUrl.trim() === '' ? null : sopPdfUrl.trim(),
        qr_url: qrUrl.trim() === '' ? null : qrUrl.trim(),
      };
      const saved = await serviceApi.update(initial.key, patch);
      toastSuccess('Layanan diperbarui.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toastError(err, 'Gagal menyimpan layanan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!initial) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Layanan — ${initial.key} (${initial.code})`}
      maxWidth={720}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="service-form"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <form
        id="service-form"
        onSubmit={submit}
        style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 16 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Nama layanan" required>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </Field>
          <Field label="Deskripsi singkat">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
            <Field label="Glyph">
              <input
                value={glyph}
                onChange={(e) => setGlyph(e.target.value)}
                maxLength={2}
                required
              />
            </Field>
            <Field label="Estimasi tunggu (menit)">
              <input
                type="number"
                value={avgWait}
                onChange={(e) => setAvgWait(parseInt(e.target.value, 10) || 0)}
                min={0}
                max={999}
              />
            </Field>
          </div>
          <Field label="Warna latar (oklch)">
            <input value={colorBg} onChange={(e) => setColorBg(e.target.value)} required />
          </Field>
          <Field label="Warna teks (oklch)">
            <input value={colorFg} onChange={(e) => setColorFg(e.target.value)} required />
          </Field>
          <Field label="Warna garis (oklch)">
            <input value={colorBorder} onChange={(e) => setColorBorder(e.target.value)} required />
          </Field>
          <Field label="URL PDF SOP lengkap (opsional)">
            <input
              type="url"
              value={sopPdfUrl}
              onChange={(e) => setSopPdfUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="URL QR Code (opsional)">
            <input
              type="url"
              value={qrUrl}
              onChange={(e) => setQrUrl(e.target.value)}
              placeholder="https://binamarga.pu.go.id/balai-sumsel/gomusi_app"
            />
          </Field>

          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                Langkah SOP ({steps.length}/{MAX_STEPS})
              </span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span
                    style={{
                      width: 22,
                      textAlign: 'right',
                      fontSize: 12,
                      color: 'var(--ink-3)',
                    }}
                  >
                    {i + 1}.
                  </span>
                  <input
                    style={{ flex: 1 }}
                    value={step}
                    onChange={(e) => setStep(i, e.target.value)}
                    maxLength={MAX_STEP_LEN}
                  />
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '2px 6px', fontSize: 12 }}
                    onClick={() => moveStep(i, -1)}
                    disabled={i === 0}
                    aria-label="naik"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '2px 6px', fontSize: 12 }}
                    onClick={() => moveStep(i, 1)}
                    disabled={i === steps.length - 1}
                    aria-label="turun"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '2px 6px', fontSize: 12 }}
                    onClick={() => removeStep(i)}
                    aria-label="hapus"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn"
                style={{ padding: '4px 10px', fontSize: 12, alignSelf: 'flex-start' }}
                onClick={addStep}
                disabled={steps.length >= MAX_STEPS}
              >
                + Tambah langkah
              </button>
            </div>
          </div>
        </div>

        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
            paddingTop: 6,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              fontSize: 32,
              fontWeight: 700,
              background: colorBg || 'var(--bg-2)',
              color: colorFg || 'var(--ink)',
              border: `1px solid ${colorBorder || 'var(--line)'}`,
            }}
          >
            {glyph || initial.glyph}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Preview QR</div>
          {qrUrl.trim() ? (
            <QRCodeSVG value={qrUrl.trim()} size={120} />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                border: '1px dashed var(--line)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 11,
                color: 'var(--ink-3)',
                textAlign: 'center',
                padding: 8,
              }}
            >
              Isi URL untuk preview
            </div>
          )}
        </aside>
      </form>
    </Modal>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label>
        {label}
        {required && <span style={{ color: 'var(--danger,#b91c1c)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}
