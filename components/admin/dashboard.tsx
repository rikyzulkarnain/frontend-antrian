'use client';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
} from 'recharts';
import {
  analyticsApi,
  type AnalyticsOverview,
  type HourlyPoint,
  type IssueDistribution,
  type RatingFeedback,
  type ServiceDistribution,
  type StaffPerf,
} from '@/lib/api/analytics';
import { Icons } from './admin-icons';
import { cn } from '@/lib/utils';

interface KpiProps {
  lbl: string;
  val: string | number;
  delta?: number;
  sub?: string;
}

function Kpi({ lbl, val, delta, sub }: KpiProps) {
  return (
    <div className="kpi">
      <div className="lbl">{lbl}</div>
      <div className="val">{val}</div>
      {delta != null && (
        <div className={cn('delta', delta >= 0 ? 'up' : 'down')}>
          {delta >= 0 ? Icons.up : Icons.down}
          <span>{Math.abs(delta)}% vs kemarin</span>
        </div>
      )}
      {sub && delta == null && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

const SERVICE_COLOR: Record<string, string> = {
  UMUM: 'oklch(0.52 0.16 252)',
  LAB: 'oklch(0.55 0.13 155)',
  AMP: 'oklch(0.62 0.18 38)',
  UTIL: 'oklch(0.66 0.14 85)',
  SEWA: 'oklch(0.52 0.16 305)',
};

const ISSUE_META: Record<string, { label: string; color: string }> = {
  PETUGAS: { label: 'Petugas', color: 'oklch(0.55 0.18 28)' },
  FASILITAS: { label: 'Fasilitas', color: 'oklch(0.6 0.15 60)' },
  PROSEDUR: { label: 'Prosedur', color: 'oklch(0.58 0.14 268)' },
  WAKTU: { label: 'Waktu', color: 'oklch(0.62 0.14 200)' },
  LAINNYA: { label: 'Lainnya', color: 'oklch(0.65 0.04 270)' },
};

export function Dashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [byService, setByService] = useState<ServiceDistribution[]>([]);
  const [staff, setStaff] = useState<StaffPerf[]>([]);
  const [feedback, setFeedback] = useState<RatingFeedback[]>([]);
  const [issues, setIssues] = useState<IssueDistribution[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      analyticsApi.overview(),
      analyticsApi.byHour(),
      analyticsApi.byService(),
      analyticsApi.staff(),
      analyticsApi.ratings(6),
      analyticsApi.issues(),
    ]).then((results) => {
      if (!alive) return;
      const [ov, hr, sv, st, fb, iss] = results;
      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (hr.status === 'fulfilled') setHourly(hr.value);
      if (sv.status === 'fulfilled') setByService(sv.value);
      if (st.status === 'fulfilled') setStaff(st.value);
      if (fb.status === 'fulfilled') setFeedback(fb.value);
      if (iss.status === 'fulfilled') setIssues(iss.value);
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length === results.length) {
        setError('Gagal memuat data analitik.');
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const donutSlices = byService.map((s) => ({
    k: s.service,
    v: s.count,
    c: SERVICE_COLOR[s.service] ?? 'var(--ink-3)',
  }));
  const donutTotal = donutSlices.reduce((a, s) => a + s.v, 0);
  const hourlyData = hourly.map((h) => ({ h: h.hour, v: h.count }));
  const waitData = hourly.map((h) => ({ h: h.hour, v: h.avg_wait_minutes }));

  const issueSlices = issues.map((i) => ({
    k: i.category,
    label: ISSUE_META[i.category]?.label ?? i.category,
    v: i.count,
    c: ISSUE_META[i.category]?.color ?? 'var(--ink-3)',
  }));
  const issueTotal = issueSlices.reduce((a, s) => a + s.v, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div className="card" style={{ padding: 12, color: 'var(--danger, #b91c1c)' }} role="alert">
          {error}
        </div>
      )}

      <div className="kpi-grid">
        <Kpi
          lbl="Total antrian hari ini"
          val={overview?.total_today ?? '—'}
          delta={overview?.total_delta_pct}
        />
        <Kpi
          lbl="Sedang menunggu"
          val={overview?.waiting ?? '—'}
          sub={overview ? `estimasi ${overview.est_wait_minutes}m` : undefined}
        />
        <Kpi
          lbl="Selesai dilayani"
          val={overview?.completed ?? '—'}
          delta={overview?.completed_delta_pct}
        />
        <Kpi
          lbl="Rating rata-rata"
          val={overview ? overview.avg_rating.toFixed(1) : '—'}
          sub={overview ? `dari ${overview.rating_count} review` : undefined}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="ttl">Antrian per jam</div>
              <div className="sub">Hari ini · semua kategori</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="chip chip-ink" style={{ cursor: 'pointer' }}>Hari ini</span>
              <span className="chip" style={{ cursor: 'pointer' }}>7 hari</span>
              <span className="chip" style={{ cursor: 'pointer' }}>30 hari</span>
            </div>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourlyData} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
                <XAxis
                  dataKey="h"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-3)' }}
                />
                <Bar dataKey="v" fill="var(--primary)" radius={[2, 2, 0, 0]} />
              </BarChart>
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
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <div style={{ width: 160, height: 160, position: 'relative' }}>
                <PieChart width={160} height={160}>
                  <Pie
                    data={donutSlices}
                    dataKey="v"
                    nameKey="k"
                    innerRadius={48}
                    outerRadius={76}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {donutSlices.map((s) => (
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
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: 18,
                        color: 'var(--ink)',
                      }}
                    >
                      {donutTotal}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>total</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {donutSlices.map((s) => (
                  <div
                    key={s.k}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}
                  >
                    <span
                      style={{ width: 10, height: 10, borderRadius: 3, background: s.c }}
                    />
                    <span style={{ fontWeight: 500, minWidth: 50 }}>{s.k}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--ink-3)',
                        flex: 1,
                      }}
                    >
                      {donutTotal ? Math.round((s.v / donutTotal) * 100) : 0}%
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{s.v}</span>
                  </div>
                ))}
                {!donutSlices.length && (
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Belum ada data.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="ttl">Waktu tunggu rata-rata</div>
              <div className="sub">Menit · per jam</div>
            </div>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={waitData} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
                <XAxis
                  dataKey="h"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-3)' }}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'white', stroke: 'var(--primary)', strokeWidth: 1.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="ttl">Kinerja staff</div>
              <div className="sub">Hari ini · top 5</div>
            </div>
          </div>
          <div className="panel-body" style={{ paddingTop: 6 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Petugas</th>
                  <th>Loket</th>
                  <th>Dilayani</th>
                  <th>Rata-rata</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {staff.slice(0, 5).map((s) => (
                  <tr key={`${s.user_id}-${s.counter}`}>
                    <td>{s.name}</td>
                    <td>{s.counter}</td>
                    <td><span className="num">{s.served}</span></td>
                    <td><span className="num">{formatDuration(s.avg_serve_seconds)}</span></td>
                    <td>
                      <span className="num">{s.rating.toFixed(1)}</span>
                      <span style={{ color: 'oklch(0.6 0.17 85)', marginLeft: 6 }}>★</span>
                    </td>
                  </tr>
                ))}
                {!staff.length && (
                  <tr>
                    <td colSpan={5} style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: 14 }}>
                      Belum ada data staff.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="ttl">Umpan balik terakhir</div>
              <div className="sub">Rating dari pengunjung yang sudah dilayani</div>
            </div>
          </div>
          <div
            className="panel-body"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}
          >
          {feedback.map((f) => (
            <div
              key={f.queue_id}
              style={{
                padding: 14,
                background: 'var(--bg)',
                borderRadius: 12,
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
                  {f.queue_number} · {f.service}
                </span>
                <span style={{ color: 'oklch(0.6 0.17 85)', fontSize: 13 }}>
                  {'★'.repeat(f.rating)}
                  <span style={{ color: 'var(--line-2)' }}>{'★'.repeat(5 - f.rating)}</span>
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                {f.comment ?? '—'}
              </div>
              {f.rated_by && (
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>— {f.rated_by}</div>
              )}
            </div>
          ))}
            {!feedback.length && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Belum ada umpan balik.</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="ttl">Kategori masalah</div>
              <div className="sub">Distribusi keluhan · hari ini</div>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <div style={{ width: 140, height: 140, position: 'relative' }}>
                <PieChart width={140} height={140}>
                  <Pie
                    data={issueSlices}
                    dataKey="v"
                    nameKey="k"
                    innerRadius={40}
                    outerRadius={66}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {issueSlices.map((s) => (
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
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: 16,
                        color: 'var(--ink)',
                      }}
                    >
                      {issueTotal}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>keluhan</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {issueSlices.map((s) => (
                  <div
                    key={s.k}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}
                  >
                    <span
                      style={{ width: 10, height: 10, borderRadius: 3, background: s.c, flexShrink: 0 }}
                    />
                    <span style={{ fontWeight: 500, flex: 1 }}>{s.label}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--ink-3)',
                        minWidth: 32,
                        textAlign: 'right',
                      }}
                    >
                      {issueTotal ? Math.round((s.v / issueTotal) * 100) : 0}%
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', minWidth: 20, textAlign: 'right' }}>
                      {s.v}
                    </span>
                  </div>
                ))}
                {!issueSlices.length && (
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Belum ada keluhan tercatat.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}
