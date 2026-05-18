export function VideoBackground() {
  return (
    <div className="display-vid">
      <div className="vid-bg" />
      <div className="vid-grain" />
      <div className="vid-content">
        <div className="vid-top">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.7 0.18 35)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            SEDANG TAYANG — PROFIL LAYANAN 2026
          </span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>VIDEO 1 / 4</span>
        </div>
        <div className="vid-title">
          Pelayanan publik yang lebih cepat, lebih jelas.
          <p>
            Sistem antrian terintegrasi membantu Anda mendapatkan layanan tanpa kebingungan. Pindai
            QR Code di tiket Anda untuk memantau antrian dari telepon genggam.
          </p>
        </div>
        <div className="vid-progress">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, opacity: 0.7 }}>00:48</span>
          <div className="bar">
            <i style={{ width: '36%' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, opacity: 0.7 }}>02:14</span>
        </div>
      </div>
    </div>
  );
}
