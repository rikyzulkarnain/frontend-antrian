import { http } from '../api';
import type { Service, ServiceCreate, ServicePatch } from '@/types/service';

export const serviceApi = {
  list(opts?: { activeOnly?: boolean }): Promise<Service[]> {
    const qs = opts?.activeOnly ? '?active=true' : '';
    return http.get<Service[]>(`/services${qs}`);
  },
  get(key: string): Promise<Service> {
    return http.get<Service>(`/services/${encodeURIComponent(key)}`);
  },
  create(input: ServiceCreate): Promise<Service> {
    return http.post<Service>('/services', input);
  },
  update(key: string, patch: ServicePatch): Promise<Service> {
    return http.patch<Service>(`/services/${encodeURIComponent(key)}`, patch);
  },
  delete(key: string): Promise<{ ok: true }> {
    return http.delete<{ ok: true }>(`/services/${encodeURIComponent(key)}`);
  },
};
