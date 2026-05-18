import Link from 'next/link';

const screens = [
  { href: '/kiosk', label: 'Kiosk', sub: '1080 × 1920 · touchscreen layanan' },
  { href: '/display', label: 'Display TV', sub: '1920 × 1080 · layar antrian' },
  { href: '/admin', label: 'Admin & Staff', sub: '1440 × 900 · panel operator' },
  { href: '/m/demo', label: 'Mobile pengunjung', sub: '390 × 844 · QR scan' },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-3">
          Hub Layanan · BBPJN Sumatera Selatan
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Sistem Antrian Digital
        </h1>
        <p className="max-w-xl text-ink-2">
          Pilih mode di bawah untuk memasuki salah satu antarmuka.
        </p>
      </header>

      <nav className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {screens.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex flex-col gap-1 rounded-lg border border-line bg-surface px-6 py-5 shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          >
            <span className="text-lg font-semibold tracking-[-0.01em] text-ink">
              {s.label}
            </span>
            <span className="text-sm text-ink-3">{s.sub}</span>
          </Link>
        ))}
      </nav>

      <footer className="font-mono text-xs text-ink-3">
        v0.1 · placeholder · workflow 02 selesai
      </footer>
    </main>
  );
}
