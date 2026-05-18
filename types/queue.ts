export type QueueStatus =
  | 'waiting'
  | 'calling'
  | 'serving'
  | 'completed'
  | 'skipped';

export type ServiceType = 'UMUM' | 'LAB' | 'AMP' | 'UTIL' | 'SEWA';

export type IssueCategory =
  | 'TIDAK_ADA'
  | 'PETUGAS'
  | 'FASILITAS'
  | 'PROSEDUR'
  | 'WAKTU'
  | 'LAINNYA';

export interface QueueItem {
  id: string;
  queue_number: string;
  service_type: ServiceType;
  status: QueueStatus;
  counter_id: number | null;
  staff: string | null;
  rating: 1 | 2 | 3 | 4 | 5 | null;
  feedback?: string | null;
  respondent_name?: string | null;
  respondent_phone?: string | null;
  issue_category?: IssueCategory | null;
  created_at: string;
  called_at: string | null;
  completed_at: string | null;
}
