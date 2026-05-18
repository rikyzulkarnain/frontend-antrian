import Link from 'next/link';
import { SUPPORT_CONTACT } from '@/lib/constants';

export default function ForgotPasswordPage() {
  const waLink = SUPPORT_CONTACT.whatsapp
    ? `https://wa.me/${SUPPORT_CONTACT.whatsapp}?text=${encodeURIComponent('Halo Admin, mohon bantuan reset password akun saya.')}`
    : null;

  return (
    <div className="login-shell">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <h2 style={{ marginTop: 0 }}>Lupa Password</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          Untuk keamanan, reset password hanya bisa dilakukan oleh admin internal.
          Silakan hubungi admin dengan menyebutkan <b>nama lengkap</b> dan <b>email akun</b> Anda.
        </p>

        <div style={{
          background: 'var(--bg)', borderRadius: 10, padding: 14,
          marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <Row label="Email admin">
            <a href={`mailto:${SUPPORT_CONTACT.email}?subject=Reset%20Password%20Akun`}
               style={{ color: 'var(--primary)' }}>
              {SUPPORT_CONTACT.email}
            </a>
          </Row>
          {waLink && (
            <Row label="WhatsApp">
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                Hubungi via WhatsApp
              </a>
            </Row>
          )}
          <Row label="Jam layanan">
            <span>{SUPPORT_CONTACT.hours}</span>
          </Row>
        </div>

        <div style={{
          background: 'oklch(0.97 0.02 80)', borderRadius: 10, padding: 12,
          marginTop: 14, fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5,
        }}>
          <b>Setelah admin mereset:</b><br />
          Anda akan menerima password sementara. Login menggunakan password tersebut, lalu segera
          ubah di menu <i>Profil saya</i> &rarr; <i>Ubah Password</i>.
        </div>

        <Link href="/admin/login" className="btn" style={{
          width: '100%', marginTop: 16, padding: '12px', textAlign: 'center', display: 'block',
        }}>
          Kembali ke halaman masuk
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{children}</span>
    </div>
  );
}
