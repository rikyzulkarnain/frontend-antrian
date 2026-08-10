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

  /**
   * The most recently finished ticket, or null when nothing has been served
   * yet. Lets the Display TV show the previous number instead of an empty
   * board during quiet periods.
   */
  last(): Promise<QueueItem | null> {
    return http.get<QueueItem | null>('/queues/last');
  },

  get(id: string): Promise<QueueItem> {
    return http.get<QueueItem>(`/queues/${encodeURIComponent(id)}`);
  },

  create(serviceType: ServiceType): Promise<QueueItem> {
    return http.post<QueueItem>('/queues', { service_type: serviceType });
  },

  /** Submit the visitor's name + purpose to issue a ticket for the given service. */
  createGuest(input: {
    serviceType: ServiceType;
    token: string;
    name: string;
    purpose: string;
  }): Promise<QueueItem> {
    return http.post<QueueItem>('/queues/guest', {
      service_type: input.serviceType,
      token: input.token,
      name: input.name,
      purpose: input.purpose,
    });
  },

  /** Poll for the ticket assigned to an intake session token. Rejects with a 404 ApiError until the visitor submits the form. */
  getGuest(token: string): Promise<QueueItem> {
    return http.get<QueueItem>(`/queues/guest/${encodeURIComponent(token)}`);
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
