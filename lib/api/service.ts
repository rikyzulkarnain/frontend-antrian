import { http } from '../api';
import type { Service, ServicePatch } from '@/types/service';

export const serviceApi = {
  list(opts?: { activeOnly?: boolean }): Promise<Service[]> {
    const qs = opts?.activeOnly ? '?active=true' : '';
    return http.get<Service[]>(`/services${qs}`);
  },
  get(key: string): Promise<Service> {
    return http.get<Service>(`/services/${encodeURIComponent(key)}`);
  },
  update(key: string, patch: ServicePatch): Promise<Service> {
    return http.patch<Service>(`/services/${encodeURIComponent(key)}`, patch);
  },
};
