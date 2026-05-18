import type { IssueCategory, QueueItem, ServiceType } from '@/types/queue';
import { http } from '../api';

export interface RatingPayload {
  rating: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  comment?: string;
  respondent_name?: string;
  respondent_phone?: string;
  issue_category?: IssueCategory;
}

export const queueApi = {
  list(params?: { status?: QueueItem['status']; serviceType?: ServiceType }): Promise<QueueItem[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.serviceType) qs.set('service_type', params.serviceType);
    const q = qs.toString();
    return http.get<QueueItem[]>(`/queues${q ? `?${q}` : ''}`);
  },

  current(): Promise<QueueItem[]> {
    return http.get<QueueItem[]>('/queues?active=true');
  },

  get(id: string): Promise<QueueItem> {
    return http.get<QueueItem>(`/queues/${encodeURIComponent(id)}`);
  },

  create(serviceType: ServiceType): Promise<QueueItem> {
    return http.post<QueueItem>('/queues', { service_type: serviceType });
  },

  call(input: { counter_id: number; service_type?: ServiceType }): Promise<QueueItem> {
    return http.post<QueueItem>('/queues/call', input);
  },

  recall(id: string): Promise<QueueItem> {
    return http.post<QueueItem>(`/queues/${encodeURIComponent(id)}/recall`);
  },

  complete(id: string): Promise<QueueItem> {
    return http.post<QueueItem>(`/queues/${encodeURIComponent(id)}/complete`);
  },

  skip(id: string): Promise<QueueItem> {
    return http.post<QueueItem>(`/queues/${encodeURIComponent(id)}/skip`);
  },

  rate(id: string, payload: RatingPayload): Promise<QueueItem> {
    return http.post<QueueItem>(`/queues/${encodeURIComponent(id)}/rating`, payload);
  },
};
