import type { QueueItem, ServiceType } from '@/types/queue';

export const SUPPORT_CONTACT = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'bbpjnsumsel06@gmail.com',
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WA ?? '',
  hours: 'Senin–Jumat, 08.00–16.00 WIB',
};

export interface Service {
  key: ServiceType;
  code: string;
  name: string;
  glyph: string;
  desc: string;
  sop: string[];
  avgWait: number;
  // Optional fields populated when sourced from API (workflow 08).
  sop_pdf_url?: string | null;
  qr_url?: string | null;
  color_bg?: string;
  color_fg?: string;
  color_border?: string;
  is_active?: boolean;
}

export interface Counter {
  id: number;
  name: string;
  service: ServiceType | null;
  active: boolean;
  staff: string | null;
}

export interface VideoItem {
  id: string;
  title: string;
  target: 'kiosk' | 'display' | 'both';
  dur: string;
  active: boolean;
  c1: string;
  c2: string;
  plays: number;
}

export const SERVICES: Service[] = [
  {
    key: 'UMUM', code: 'A', name: 'Pelayanan Umum', glyph: 'A',
    desc: 'Pendaftaran, informasi, dan layanan administrasi umum.',
    sop: [
      'Siapkan kartu identitas (KTP/SIM) dan dokumen pendukung.',
      'Pastikan formulir permohonan sudah diisi lengkap.',
      'Cetak nomor antrian, lalu tunggu di area yang disediakan.',
      'Saat nomor Anda dipanggil, segera menuju loket sesuai layar TV.',
      'Estimasi waktu pelayanan: 5–10 menit per pengunjung.',
    ],
    avgWait: 8,
  },
  {
    key: 'LAB', code: 'B', name: 'Layanan Lab', glyph: 'B',
    desc: 'Pemeriksaan, kalibrasi, dan pengujian sampel laboratorium.',
    sop: [
      'Bawa formulir permintaan uji dan sampel dalam wadah steril.',
      'Petugas akan memverifikasi data sampel sebelum diregistrasi.',
      'Pembayaran dilakukan di loket setelah verifikasi sampel.',
      'Estimasi waktu serah-terima: 10–15 menit per sampel.',
    ],
    avgWait: 14,
  },
  {
    key: 'AMP', code: 'C', name: 'Layanan AMP', glyph: 'C',
    desc: 'Pengaduan, mediasi, dan permohonan AMP.',
    sop: [
      'Sertakan dokumen pendukung sesuai jenis permohonan.',
      'Petugas akan mengarahkan ke loket yang sesuai.',
      'Beberapa permohonan memerlukan janji temu lanjutan.',
    ],
    avgWait: 12,
  },
  {
    key: 'UTIL', code: 'D', name: 'Layanan Utilitas', glyph: 'D',
    desc: 'Permintaan layanan teknis utilitas dan fasilitas.',
    sop: [
      'Isi formulir permintaan utilitas dengan jelas.',
      'Cantumkan lokasi dan kontak teknisi penanggung jawab.',
      'Konfirmasi jadwal pelaksanaan dengan petugas loket.',
    ],
    avgWait: 6,
  },
  {
    key: 'SEWA', code: 'E', name: 'Sewa Alat', glyph: 'E',
    desc: 'Peminjaman dan pengembalian peralatan operasional.',
    sop: [
      'Sertakan surat permohonan dan jaminan identitas asli.',
      'Periksa kondisi alat bersama petugas sebelum keluar gudang.',
      'Pengembalian wajib dalam kondisi sesuai serah-terima awal.',
    ],
    avgWait: 9,
  },
];

export const COUNTERS: Counter[] = [
  { id: 1, name: 'Loket 1', service: null, active: true, staff: null },
  { id: 2, name: 'Loket 2', service: null, active: true, staff: null },
];

export const MOCK_VIDEOS: VideoItem[] = [
  { id: 'v1', title: 'Profil Layanan 2026',     target: 'both',    dur: '2:14', active: true,  c1: '#1a3a8f', c2: '#06090f', plays: 312 },
  { id: 'v2', title: 'Tips Membawa Sampel Lab', target: 'kiosk',   dur: '1:08', active: true,  c1: '#2a6f4b', c2: '#0a1c14', plays: 188 },
  { id: 'v3', title: 'Mengenal SOP AMP',        target: 'kiosk',   dur: '1:42', active: true,  c1: '#7a3f9a', c2: '#1a0c2b', plays: 145 },
  { id: 'v4', title: 'Pemandangan Alam — Loop', target: 'display', dur: '4:30', active: true,  c1: '#0f5a86', c2: '#04161e', plays: 502 },
  { id: 'v5', title: 'Promo Sewa Alat Q2',      target: 'display', dur: '0:42', active: true,  c1: '#a35a18', c2: '#1f0e02', plays: 421 },
  { id: 'v6', title: 'Highlight Bulan Mei',     target: 'both',    dur: '1:58', active: false, c1: '#5a2a2a', c2: '#1a0606', plays: 64 },
];

function makeId(seed: number): string {
  return (seed * 2654435761 >>> 0).toString(36).padStart(8, '0').slice(0, 8);
}

const baseTs = 1747400000000;

export const SEED_QUEUES: QueueItem[] = [
  { svc: 'UMUM', n: 'A-018', status: 'serving',   counter: 1,    waitMin: 7,  staff: 'Sari W.'  as string | null },
  { svc: 'LAB',  n: 'B-007', status: 'serving',   counter: 3,    waitMin: 11, staff: 'Rian H.' },
  { svc: 'AMP',  n: 'C-005', status: 'calling',   counter: 4,    waitMin: 9,  staff: 'Bagas N.' },
  { svc: 'UMUM', n: 'A-019', status: 'waiting',   counter: null, waitMin: 3,  staff: null },
  { svc: 'UMUM', n: 'A-020', status: 'waiting',   counter: null, waitMin: 1,  staff: null },
  { svc: 'LAB',  n: 'B-008', status: 'waiting',   counter: null, waitMin: 4,  staff: null },
  { svc: 'UTIL', n: 'D-003', status: 'waiting',   counter: null, waitMin: 6,  staff: null },
  { svc: 'SEWA', n: 'E-002', status: 'waiting',   counter: null, waitMin: 2,  staff: null },
  { svc: 'UMUM', n: 'A-021', status: 'waiting',   counter: null, waitMin: 0,  staff: null },
  { svc: 'AMP',  n: 'C-006', status: 'waiting',   counter: null, waitMin: 1,  staff: null },
  { svc: 'UMUM', n: 'A-017', status: 'completed', counter: 1,    waitMin: 6,  staff: 'Sari W.', rating: 5 as 1|2|3|4|5 },
  { svc: 'LAB',  n: 'B-006', status: 'completed', counter: 3,    waitMin: 13, staff: 'Rian H.', rating: 4 as 1|2|3|4|5 },
  { svc: 'UMUM', n: 'A-016', status: 'completed', counter: 2,    waitMin: 5,  staff: 'Dewi P.', rating: 5 as 1|2|3|4|5 },
].map((r, i): QueueItem => ({
  id: makeId(i + 1),
  queue_number: r.n,
  service_type: r.svc as ServiceType,
  status: r.status as QueueItem['status'],
  counter_id: r.counter ?? null,
  staff: r.staff ?? null,
  rating: ('rating' in r ? r.rating : null) as QueueItem['rating'],
  feedback: null,
  created_at: new Date(baseTs + i * 60000).toISOString(),
  called_at: r.status === 'serving' || r.status === 'calling' || r.status === 'completed'
    ? new Date(baseTs + i * 60000 + 3 * 60000).toISOString() : null,
  completed_at: r.status === 'completed'
    ? new Date(baseTs + i * 60000 + 8 * 60000).toISOString() : null,
}));

export interface ChartPoint { h: string; v: number; }
export const CHART_HOURLY: ChartPoint[] = [
  { h: '09', v: 6 }, { h: '10', v: 11 }, { h: '11', v: 14 }, { h: '12', v: 8 },
  { h: '13', v: 9 }, { h: '14', v: 16 }, { h: '15', v: 13 }, { h: '16', v: 7 },
];
export const CHART_WAIT: ChartPoint[] = [
  { h: '09', v: 5 }, { h: '10', v: 8 }, { h: '11', v: 12 }, { h: '12', v: 14 },
  { h: '13', v: 11 }, { h: '14', v: 18 }, { h: '15', v: 15 }, { h: '16', v: 10 },
];

export interface StaffPerfRow {
  name: string;
  counter: string;
  served: number;
  avgServe: string;
  rating: number;
}
export const STAFF_PERF: StaffPerfRow[] = [
  { name: 'Sari Wulandari', counter: 'Loket 1', served: 24, avgServe: '4m 12s', rating: 4.8 },
  { name: 'Dewi Pratiwi',   counter: 'Loket 2', served: 18, avgServe: '5m 03s', rating: 4.6 },
  { name: 'Rian Hidayat',   counter: 'Loket 3', served: 14, avgServe: '6m 48s', rating: 4.7 },
  { name: 'Bagas Nugroho',  counter: 'Loket 4', served: 11, avgServe: '7m 21s', rating: 4.5 },
  { name: 'Ica Maharani',   counter: 'Loket 5', served: 9,  avgServe: '3m 56s', rating: 4.9 },
];

// Service category colors used for SOP glyph-lg + counter avatar (kiosk.jsx getters).
// Pass null to get a neutral fallback for un-assigned counters.
export function getSvcBg(k: ServiceType | null): string {
  if (!k) return 'oklch(0.96 0 0)';
  const map: Record<string, string> = {
    UMUM: 'oklch(0.96 0.04 250)',
    LAB:  'oklch(0.96 0.04 155)',
    AMP:  'oklch(0.96 0.05 35)',
    UTIL: 'oklch(0.96 0.05 85)',
    SEWA: 'oklch(0.96 0.04 305)',
  };
  return map[k] ?? 'oklch(0.96 0 0)';
}
export function getSvcFg(k: ServiceType | null): string {
  if (!k) return 'oklch(0.45 0 0)';
  const map: Record<string, string> = {
    UMUM: 'oklch(0.4 0.16 250)',
    LAB:  'oklch(0.4 0.13 155)',
    AMP:  'oklch(0.5 0.16 35)',
    UTIL: 'oklch(0.45 0.13 85)',
    SEWA: 'oklch(0.42 0.16 305)',
  };
  return map[k] ?? 'oklch(0.45 0 0)';
}
export function getSvcBorder(k: ServiceType | null): string {
  if (!k) return 'oklch(0.9 0 0)';
  const map: Record<string, string> = {
    UMUM: 'oklch(0.9 0.05 250)',
    LAB:  'oklch(0.9 0.05 155)',
    AMP:  'oklch(0.9 0.05 35)',
    UTIL: 'oklch(0.9 0.06 85)',
    SEWA: 'oklch(0.9 0.05 305)',
  };
  return map[k] ?? 'oklch(0.9 0 0)';
}
