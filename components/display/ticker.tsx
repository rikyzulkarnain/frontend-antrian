const TICKER_TEXT =
  'Selamat datang di Hub Layanan Terpadu · Loket 6 (Sewa Alat) sedang tutup sementara · ' +
  'Mohon scan QR Code pada tiket untuk pemantauan dari HP · ' +
  'Loket 3 (Lab) menerima sampel hingga pukul 15.30 · ' +
  'Berikan rating layanan setelah selesai dilayani — masukan Anda membantu kami menjadi lebih baik ·';

export function DisplayTicker() {
  return (
    <div className="display-ticker">
      <div className="left">
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.7 0.18 35)' }} />
        <span>BERITA LOKET</span>
      </div>
      <div className="scroll">
        <span>{TICKER_TEXT}</span>
        <span>{TICKER_TEXT}</span>
      </div>
    </div>
  );
}
