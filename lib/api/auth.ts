import type { User } from '@/types/user';
import { http } from '../api';

export interface AuthSession {
  user: User;
  accessToken: string;
}

interface AuthResponseBody {
  user: User;
  access_token: string;
}

function toSession(body: AuthResponseBody): AuthSession {
  return { user: body.user, accessToken: body.access_token };
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthSession> {
    const body = await http.post<AuthResponseBody>('/auth/login', { email, password });
    return toSession(body);
  },

  async refresh(): Promise<AuthSession> {
    const body = await http.post<AuthResponseBody>('/auth/refresh');
    return toSession(body);
  },

  async logout(): Promise<void> {
    await http.post<{ ok: true }>('/auth/logout');
  },

  async me(): Promise<User> {
    return http.get<User>('/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await http.post<{ ok: true }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};
