import type { IssueCategory, ServiceType } from '@/types/queue';
import { downloadFile, http } from '../api';

export interface ReportFilter {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  service?: string;
  counter?: number;
  staff?: string;
  rating?: number;
  issue?: string;
}

export interface ReportSummary {
  total: number;
  completed: number;
  skipped: number;
  waiting: number;
  avg_wait_min: number;
  avg_serve_sec: number;
  avg_rating: number;
  rating_count: number;
  ikm_index: number;
  ikm_grade: string;
  ikm_grade_label: string;
}

export interface ServiceVolume {
  service: ServiceType;
  count: number;
  completed: number;
  skipped: number;
  avg_rating: number;
}

export interface TrendPoint {
  date: string;
  count: number;
  completed: number;
}

export interface ReportStaffPerf {
  user_id: string;
  name: string;
  counter: string;
  served: number;
  avg_serve_seconds: number;
  rating: number;
}

export interface IKMElement {
  key: string;
  label: string;
  issues: number;
}

export interface IKMReport {
  index: number;
  grade: string;
  grade_label: string;
  rating_count: number;
  elements: IKMElement[];
}

export interface IssueDistribution {
  category: Exclude<IssueCategory, 'TIDAK_ADA'>;
  count: number;
}

export interface Complaint {
  queue_number: string;
  service: ServiceType;
  rating: number;
  issue_category: IssueCategory | null;
  comment: string | null;
  respondent_name: string | null;
  respondent_phone: string | null;
  completed_at: string;
}

export interface GuestEntry {
  queue_number: string;
  guest_name: string | null;
  guest_purpose: string | null;
  service: ServiceType;
  status: string;
  created_at: string;
}

export interface SkippedEntry {
  queue_number: string;
  service: ServiceType;
  counter: string | null;
  created_at: string;
}

export interface ReportBundle {
  summary: ReportSummary;
  by_service: ServiceVolume[];
  trend: TrendPoint[];
  staff: ReportStaffPerf[];
  ikm: IKMReport;
  issues: IssueDistribution[];
  complaints: Complaint[];
  guest_book: GuestEntry[];
  skipped: SkippedEntry[];
}

export interface SKMDetailItem {
  queue_number: string;
  service: ServiceType;
  rating: number;
  comment: string | null;
  issue_category: IssueCategory | null;
  respondent_name: string | null;
  respondent_phone: string | null;
  staff: string | null;
  counter: string | null;
  completed_at: string;
}

export interface SKMDetailPage {
  items: SKMDetailItem[];
  total: number;
  page: number;
  size: number;
}

/** Serialises a filter to a query string, omitting empty optional fields. */
function toQuery(f: ReportFilter, extra: Record<string, string | number> = {}): string {
  const p = new URLSearchParams();
  p.set('from', f.from);
  p.set('to', f.to);
  if (f.service) p.set('service', f.service);
  if (f.counter != null) p.set('counter', String(f.counter));
  if (f.staff) p.set('staff', f.staff);
  if (f.rating != null) p.set('rating', String(f.rating));
  if (f.issue) p.set('issue', f.issue);
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
  return p.toString();
}

export const reportsApi = {
  generate(filter: ReportFilter): Promise<ReportBundle> {
    return http.get<ReportBundle>(`/reports?${toQuery(filter)}`);
  },

  skmDetail(filter: ReportFilter, page = 1, size = 25): Promise<SKMDetailPage> {
    return http.get<SKMDetailPage>(`/reports/skm-detail?${toQuery(filter, { page, size })}`);
  },

  downloadExcel(filter: ReportFilter): Promise<void> {
    const filename = `laporan-antrian-${filter.from}_${filter.to}.xlsx`;
    return downloadFile(`/reports/export.xlsx?${toQuery(filter)}`, filename);
  },
};
