import type { User, UserRole } from '@/types/user';
import { http } from '../api';

export interface UserInput {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  is_active?: boolean;
}

export const userApi = {
  list(): Promise<User[]> {
    return http.get<User[]>('/users');
  },

  get(id: string): Promise<User> {
    return http.get<User>(`/users/${encodeURIComponent(id)}`);
  },

  create(input: UserInput): Promise<User> {
    return http.post<User>('/users', input);
  },

  update(id: string, input: Partial<UserInput>): Promise<User> {
    return http.patch<User>(`/users/${encodeURIComponent(id)}`, input);
  },

  remove(id: string): Promise<{ ok: true }> {
    return http.delete<{ ok: true }>(`/users/${encodeURIComponent(id)}`);
  },
};
