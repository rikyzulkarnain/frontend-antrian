import type { Counter } from '../constants';
import { http } from '../api';

export interface CounterInput {
  name: string;
  service: Counter['service'];
  active: boolean;
  // Assigned operator's user id (UUID), or null to unassign. The backend keys
  // counter ownership on this, not the display name.
  staff_id?: string | null;
}

export const counterApi = {
  list(): Promise<Counter[]> {
    return http.get<Counter[]>('/counters');
  },

  get(id: number): Promise<Counter> {
    return http.get<Counter>(`/counters/${id}`);
  },

  create(input: CounterInput): Promise<Counter> {
    return http.post<Counter>('/counters', input);
  },

  update(id: number, input: Partial<CounterInput>): Promise<Counter> {
    return http.patch<Counter>(`/counters/${id}`, input);
  },

  remove(id: number): Promise<{ ok: true }> {
    return http.delete<{ ok: true }>(`/counters/${id}`);
  },
};
