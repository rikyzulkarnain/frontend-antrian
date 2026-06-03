'use client';
import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis } from 'recharts';
import {
  reportsApi,
  type ReportBundle,
  type ReportFilter,
  type SKMDetailPage,
} from '@/lib/api/reports';
import { serviceApi } from '@/lib/api/service';
import { counterApi } from '@/lib/api/counter';
import { userApi } from '@/lib/api/user';
import type { Service } from '@/types/service';
import type { Counter } from '@/lib/constants';
import type { User } from '@/types/user';
import { toastError } from '@/lib/toast';

const ISSUE_META: Record<string, { label: string; color: string }> = {
  PETUGAS: { label: 'Petugas', color: 'oklch(0.55 0.18 28)' },
  FASILITAS: { label: 'Fasilitas', color: 'oklch(0.6 0.15 60)' },
  PROSEDUR: { label: 'Prosedur', color: 'oklch(0.58 0.14 268)' },
  WAKTU: { label: 'Waktu', color: 'oklch(0.62 0.14 200)' },
  LAINNYA: { label: 'Lainnya', color: 'oklch(0.65 0.04 270)' },
};

const SERVICE_PALETTE = [
  'oklch(0.52 0.16 252)',
  'oklch(0.55 0.13 155)',
  'oklch(0.62 0.18 38)',
  'oklch(0.66 0.14 85)',
  'oklch(0.52 0.16 305)',
  'oklch(0.5 0.15 40)',
];

const GRADE_COLOR: Record<string, string> = {
  A: 'oklch(0.42 0.13 155)',
  B: 'oklch(0.52 0.16 252)',
  C: 'oklch(0.6 0.15 60)',
  D: 'var(--danger)',
  '-': 'var(--ink-3)',
};

const DETAIL_SIZE = 25;

function fmtDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'dd-MM-yyyy HH:mm');
}

function fmtDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function Reports() {
  const today = new Date();
  const [filter, setFilter] = useState<ReportFilter>({
    from: format(subDays(today, 29), 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  });

  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);

  const [bundle, setBundle] = useState<ReportBundle | null>(null);
  const [detail, setDetail] = useState<SKMDetailPage | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [applied, setApplied] = useState<ReportFilter | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load filter dropdown sources once.
  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      serviceApi.list(),
      counterApi.list(),
      userApi.list(),
    ]).then(([sv, ct, us]) => {
      if (!alive) return;
      if (sv.status === 'fulfilled') setServices(sv.value);
      if (ct.status === 'fulfilled') setCounters(ct.value);
      if (us.status === 'fulfilled') setStaffList(us.value.filter((u) => u.role === 'staff'));
    });
    return () => {
      alive = false;
    };
  }, []);

  const generate = async (f: ReportFilter, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const [b, d] = await Promise.all([
        reportsApi.generate(f),
        reportsApi.skmDetail(f, page, DETAIL_SIZE),
      ]);
      setBundle(b);
      setDetail(d);
      setApplied(f);
      setDetailPage(page);
    } catch (err) {
      setError('Gagal memuat laporan. Periksa filter dan coba lagi.');
      toastError(err, 'Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetailPage = async (page: number) => {
    if (!applied) return;
    try {
      const d = await reportsApi.skmDetail(applied, page, DETAIL_SIZE);
      setDetail(d);
      setDetailPage(page);
    } catch (err) {
      toastError(err, 'Gagal memuat halaman detail.');
    }
  };

  const exportExcel = async () => {
    if (!applied) return;
    setExporting(true);
    try {
      await reportsApi.downloadExcel(applied);
    } catch (err) {
      toastError(err, 'Gagal mengekspor Excel.');
    } finally {
      setExporting(false);
    }
  };

  const update = (patch: Partial<ReportFilter>) => setFilter((f) => ({ ...f, ...patch }));

  const summary = bundle?.summary;
  const totalDetailPages = detail ? Math.max(1, Math.ceil(detail.total / DETAIL_SIZE)) : 1;

  const serviceColor = (key: string) => {
    const idx = services.findIndex((s) => s.key === key);
    return SERVICE_PALETTE[(idx >= 0 ? idx : key.length) % SERVICE_PALETTE.length];
  };
  const serviceName = (key: string) => services.find((s) => s.key === key)?.name ?? key;

  const donut = (bundle?.by_service ?? []).map((s) => ({ k: s.service, v: s.count, c: serviceColor(s.service) }));
  const donutTotal = donut.reduce((a, s) => a + s.v, 0);
  const trendData = (bundle?.trend ?? []).map((t) => ({ d: t.date.slice(5), v: t.count }));
  const issueSlices = (bundle?.issues ?? []).map((i) => ({
    k: i.category,
    label: ISSUE_META[i.category]?.label ?? i.category,
    v: i.count,
    c: ISSUE_META[i.category]?.color ?? 'var(--ink-3)',
  }));
  const issueTotal = issueSlices.reduce((a, s) => a + s.v, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Print-only header (kop laporan) */}
      <div className="report-print-head" style={{ display: 'none' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Laporan Sistem Antrian — BBPJN Sumsel</h1>
        {applied && (
          <p style={{ margin: '4px 0 0', fontSize: 12 }}>
            Periode {applied.from} s/d {applied.to} · Dicetak {format(new Date(), 'dd-MM-yyyy HH:mm')}
          </p>
        )}
      </div>

      {/* Filter bar */}
      <div className="panel no-print">
        <div className="panel-head">
          <div>
            <div className="ttl">Laporan</div>
            <div className="sub">Atur filter lalu tampilkan laporan & ekspor</div>
          </div>
        </div>
        <div className="panel-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <Field label="Dari tanggal">
              <input
                type="date"
                className="report-input"
                value={filter.from}
                max={filter.to}
                onChange={(e) => update({ from: e.target.value })}
              />
            </Field>
            <Field label="Sampai tanggal">
              <input
                type="date"
                className="report-input"
                value={filter.to}
                min={filter.from}
                onChange={(e) => update({ to: e.target.value })}
              />
            </Field>
            <Field label="Layanan">
              <select
                className="report-input"
                value={filter.service ?? ''}
                onChange={(e) => update({ service: e.target.value || undefined })}
              >
                <option value="">Semua layanan</option>
                {services.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Loket">
              <select
                className="report-input"
                value={filter.counter ?? ''}
                onChange={(e) => update({ counter: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Semua loket</option>
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Petugas">
              <select
                className="report-input"
                value={filter.staff ?? ''}
                onChange={(e) => update({ staff: e.target.value || undefined })}
              >
                <option value="">Semua petugas</option>
                {staffList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Rating">
              <select
                className="report-input"
                value={filter.rating ?? ''}
                onChange={(e) => update({ rating: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Semua rating</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} bintang
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kategori masalah">
              <select
                className="report-input"
                value={filter.issue ?? ''}
                onChange={(e) => update({ issue: e.target.value || undefined })}
              >
                <option value="">Semua kategori</option>
                {Object.entries(ISSUE_META).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" disabled={loading} onClick={() => generate(filter)}>
              {loading ? 'Memuat…' : 'Tampilkan Laporan'}
            </button>
            <button
              className="btn btn-ghost"
              disabled={!applied || exporting}
              onClick={exportExcel}
              title="Unduh berkas Excel"
            >
              {exporting ? 'Mengekspor…' : 'Export Excel'}
            </button>
            <button
              className="btn btn-ghost"
              disabled={!applied}
              onClick={() => window.print()}
              title="Cetak / simpan sebagai PDF"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="card no-print" style={{ padding: 12, color: 'var(--danger, #b91c1c)' }} role="alert">
          {error}
        </div>
      )}

      {!bundle && !loading && (
        <div className="panel no-print">
          <div className="panel-body" style={{ color: 'var(--ink-3)', fontSize: 13 }}>
            Pilih filter di atas lalu klik <b>Tampilkan Laporan</b> untuk membuat laporan.
          </div>
        </div>
      )}

      {bundle && summary && (
        <div className="report-output" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPI cards */}
          <div className="kpi-grid">
            <Kpi lbl="Total antrian" val={summary.total} />
            <Kpi lbl="Selesai dilayani" val={summary.completed} />
            <Kpi lbl="Terlewat (skipped)" val={summary.skipped} />
            <Kpi
              lbl="Rating rata-rata"
              val={summary.avg_rating.toFixed(1)}
              sub={`dari ${summary.rating_count} penilaian`}
            />
          </div>
          <div className="kpi-grid">
            <Kpi lbl="Masih menunggu" val={summary.waiting} />
            <Kpi lbl="Rata-rata tunggu" val={`${summary.avg_wait_min}m`} />
            <Kpi lbl="Rata-rata layanan" val={fmtDuration(summary.avg_serve_sec)} />
            <div className="kpi">
              <div className="lbl">Indeks IKM</div>
              <div className="val" style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                {summary.rating_count ? summary.ikm_index.toFixed(2) : '—'}
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                    color: 'white',
                    background: GRADE_COLOR[summary.ikm_grade] ?? 'var(--ink-3)',
                  }}
                >
                  {summary.ikm_grade}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>
                Mutu {summary.ikm_grade_label}
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="ttl">Tren antrian harian</div>
                  <div className="sub">Jumlah antrian per tanggal</div>
                </div>
              </div>
              <div className="panel-body">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
                    <XAxis
                      dataKey="d"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-3)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: 'white', stroke: 'var(--primary)', strokeWidth: 1.5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="ttl">Distribusi layanan</div>
                  <div className="sub">Berdasarkan kategori</div>
                </div>
              </div>
              <div className="panel-body">
                <DonutLegend slices={donut} total={donutTotal} nameOf={serviceName} unit="total" />
              </div>
            </div>
          </div>

          {/* Volume table + IKM elements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="ttl">Volume per layanan</div>
                  <div className="sub">Total, selesai, terlewat & rating</div>
                </div>
              </div>
              <div className="panel-body" style={{ paddingTop: 6 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Layanan</th>
                      <th>Total</th>
                      <th>Selesai</th>
                      <th>Terlewat</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.by_service.map((s) => (
                      <tr key={s.service}>
                        <td>{serviceName(s.service)}</td>
                        <td><span className="num">{s.count}</span></td>
                        <td><span className="num">{s.completed}</span></td>
                        <td><span className="num">{s.skipped}</span></td>
                        <td><span className="num">{s.avg_rating ? s.avg_rating.toFixed(1) : '—'}</span></td>
                      </tr>
                    ))}
                    <EmptyRow show={!bundle.by_service.length} cols={5} />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="ttl">IKM per unsur pelayanan</div>
                  <div className="sub">Jumlah keluhan per unsur (pendekatan)</div>
                </div>
              </div>
              <div className="panel-body" style={{ paddingTop: 6 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Unsur pelayanan</th>
                      <th>Keluhan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.ikm.elements.map((e) => (
                      <tr key={e.key}>
                        <td>{e.label}</td>
                        <td><span className="num">{e.issues}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Staff performance */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="ttl">Kinerja petugas & loket</div>
                <div className="sub">Periode terpilih</div>
              </div>
            </div>
            <div className="panel-body" style={{ paddingTop: 6 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Petugas</th>
                    <th>Loket</th>
                    <th>Dilayani</th>
                    <th>Rata-rata layanan</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {bundle.staff.map((s) => (
                    <tr key={`${s.user_id}-${s.counter}`}>
                      <td>{s.name}</td>
                      <td>{s.counter}</td>
                      <td><span className="num">{s.served}</span></td>
                      <td><span className="num">{fmtDuration(s.avg_serve_seconds)}</span></td>
                      <td><span className="num">{s.rating ? s.rating.toFixed(1) : '—'}</span></td>
                    </tr>
                  ))}
                  <EmptyRow show={!bundle.staff.length} cols={5} />
                </tbody>
              </table>
            </div>
          </div>

          {/* SKM detail (paginated) */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="ttl">Detail penilaian SKM</div>
                <div className="sub">{detail?.total ?? 0} penilaian dari pemohon</div>
              </div>
            </div>
            <div className="panel-body" style={{ paddingTop: 6, overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Antrian</th>
                    <th>Layanan</th>
                    <th>Rating</th>
                    <th>Komentar</th>
                    <th>Kategori</th>
                    <th>Nama Pemohon</th>
                    <th>No. HP</th>
                    <th>Petugas</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail?.items ?? []).map((d, i) => (
                    <tr key={`${d.queue_number}-${i}`}>
                      <td><span className="num">{d.queue_number}</span></td>
                      <td>{serviceName(d.service)}</td>
                      <td style={{ color: 'oklch(0.6 0.17 85)', whiteSpace: 'nowrap' }}>
                        {'★'.repeat(d.rating)}
                        <span style={{ color: 'var(--line-2)' }}>{'★'.repeat(5 - d.rating)}</span>
                      </td>
                      <td style={{ maxWidth: 220 }}>{d.comment ?? '—'}</td>
                      <td>{d.issue_category ? ISSUE_META[d.issue_category]?.label ?? d.issue_category : '—'}</td>
                      <td>{d.respondent_name ?? '—'}</td>
                      <td><span className="num">{d.respondent_phone ?? '—'}</span></td>
                      <td>{d.staff ?? '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(d.completed_at)}</td>
                    </tr>
                  ))}
                  <EmptyRow show={!detail?.items.length} cols={9} />
                </tbody>
              </table>
            </div>
            {totalDetailPages > 1 && (
              <div
                className="no-print"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '12px 22px' }}
              >
                <button className="btn btn-ghost" disabled={detailPage <= 1} onClick={() => loadDetailPage(detailPage - 1)}>
                  ‹ Sebelumnya
                </button>
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                  Hal {detailPage} / {totalDetailPages}
                </span>
                <button
                  className="btn btn-ghost"
                  disabled={detailPage >= totalDetailPages}
                  onClick={() => loadDetailPage(detailPage + 1)}
                >
                  Berikutnya ›
                </button>
              </div>
            )}
          </div>

          {/* Complaints + issue donut */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="ttl">Keluhan untuk tindak lanjut</div>
                  <div className="sub">Penilaian rating ≤ 3 + kontak pemohon</div>
                </div>
              </div>
              <div className="panel-body" style={{ paddingTop: 6, overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>No. Antrian</th>
                      <th>Layanan</th>
                      <th>Rating</th>
                      <th>Kategori</th>
                      <th>Komentar</th>
                      <th>Nama</th>
                      <th>No. HP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.complaints.map((c, i) => (
                      <tr key={`${c.queue_number}-${i}`}>
                        <td><span className="num">{c.queue_number}</span></td>
                        <td>{serviceName(c.service)}</td>
                        <td><span className="num">{c.rating}</span></td>
                        <td>{c.issue_category ? ISSUE_META[c.issue_category]?.label ?? c.issue_category : '—'}</td>
                        <td style={{ maxWidth: 200 }}>{c.comment ?? '—'}</td>
                        <td>{c.respondent_name ?? '—'}</td>
                        <td><span className="num">{c.respondent_phone ?? '—'}</span></td>
                      </tr>
                    ))}
                    <EmptyRow show={!bundle.complaints.length} cols={7} />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="ttl">Kategori masalah</div>
                  <div className="sub">Distribusi keluhan</div>
                </div>
              </div>
              <div className="panel-body">
                <DonutLegend slices={issueSlices} total={issueTotal} unit="keluhan" />
              </div>
            </div>
          </div>

          {/* Guest book + skipped */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="ttl">Buku tamu</div>
                  <div className="sub">Log kunjungan tamu</div>
                </div>
              </div>
              <div className="panel-body" style={{ paddingTop: 6, overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>No. Antrian</th>
                      <th>Nama Tamu</th>
                      <th>Keperluan</th>
                      <th>Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.guest_book.map((g, i) => (
                      <tr key={`${g.queue_number}-${i}`}>
                        <td><span className="num">{g.queue_number}</span></td>
                        <td>{g.guest_name ?? '—'}</td>
                        <td style={{ maxWidth: 240 }}>{g.guest_purpose ?? '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(g.created_at)}</td>
                      </tr>
                    ))}
                    <EmptyRow show={!bundle.guest_book.length} cols={4} />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="ttl">Antrian terlewat</div>
                  <div className="sub">Status skipped</div>
                </div>
              </div>
              <div className="panel-body" style={{ paddingTop: 6, overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>No. Antrian</th>
                      <th>Layanan</th>
                      <th>Loket</th>
                      <th>Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.skipped.map((s, i) => (
                      <tr key={`${s.queue_number}-${i}`}>
                        <td><span className="num">{s.queue_number}</span></td>
                        <td>{serviceName(s.service)}</td>
                        <td>{s.counter ?? '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(s.created_at)}</td>
                      </tr>
                    ))}
                    <EmptyRow show={!bundle.skipped.length} cols={4} />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

function Kpi({ lbl, val, sub }: { lbl: string; val: string | number; sub?: string }) {
  return (
    <div className="kpi">
      <div className="lbl">{lbl}</div>
      <div className="val">{val}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function EmptyRow({ show, cols }: { show: boolean; cols: number }) {
  if (!show) return null;
  return (
    <tr>
      <td colSpan={cols} style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: 14 }}>
        Belum ada data.
      </td>
    </tr>
  );
}

interface Slice {
  k: string;
  v: number;
  c: string;
  label?: string;
}

function DonutLegend({
  slices,
  total,
  unit,
  nameOf,
}: {
  slices: Slice[];
  total: number;
  unit: string;
  nameOf?: (k: string) => string;
}) {
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
      <div style={{ width: 150, height: 150, position: 'relative' }}>
        <PieChart width={150} height={150}>
          <Pie
            data={slices}
            dataKey="v"
            nameKey="k"
            innerRadius={44}
            outerRadius={72}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {slices.map((s) => (
              <Cell key={s.k} fill={s.c} />
            ))}
          </Pie>
        </PieChart>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 17, color: 'var(--ink)' }}>
              {total}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{unit}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {slices.map((s) => (
          <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.c, flexShrink: 0 }} />
            <span style={{ fontWeight: 500, flex: 1 }}>{s.label ?? (nameOf ? nameOf(s.k) : s.k)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', minWidth: 32, textAlign: 'right' }}>
              {total ? Math.round((s.v / total) * 100) : 0}%
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', minWidth: 20, textAlign: 'right' }}>{s.v}</span>
          </div>
        ))}
        {!slices.length && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Belum ada data.</div>}
      </div>
    </div>
  );
}
