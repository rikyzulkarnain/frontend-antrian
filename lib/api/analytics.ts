import type { IssueCategory, ServiceType } from '@/types/queue';
import { http } from '../api';

export interface AnalyticsOverview {
  total_today: number;
  total_delta_pct: number;
  waiting: number;
  est_wait_minutes: number;
  completed: number;
  completed_delta_pct: number;
  avg_rating: number;
  rating_count: number;
}

export interface ServiceDistribution {
  service: ServiceType;
  count: number;
}

export interface HourlyPoint {
  hour: string;
  count: number;
  avg_wait_minutes: number;
}

export interface StaffPerf {
  user_id: string;
  name: string;
  counter: string;
  served: number;
  avg_serve_seconds: number;
  rating: number;
}

export interface IssueDistribution {
  category: Exclude<IssueCategory, 'TIDAK_ADA'>;
  count: number;
}

export interface RatingFeedback {
  queue_id: string;
  queue_number: string;
  service: ServiceType;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  rated_by: string | null;
  rated_at: string;
}

export const analyticsApi = {
  overview(): Promise<AnalyticsOverview> {
    return http.get<AnalyticsOverview>('/analytics/overview');
  },

  byService(): Promise<ServiceDistribution[]> {
    return http.get<ServiceDistribution[]>('/analytics/by-service');
  },

  byHour(): Promise<HourlyPoint[]> {
    return http.get<HourlyPoint[]>('/analytics/by-hour');
  },

  staff(): Promise<StaffPerf[]> {
    return http.get<StaffPerf[]>('/analytics/staff');
  },

  ratings(limit = 10): Promise<RatingFeedback[]> {
    return http.get<RatingFeedback[]>(`/analytics/ratings?limit=${limit}`);
  },

  issues(): Promise<IssueDistribution[]> {
    return http.get<IssueDistribution[]>('/analytics/issues');
  },
};
