import { create } from 'zustand';
import type { User } from '@/types/user';
import { authApi } from '@/lib/api/auth';
import { setAccessToken } from '@/lib/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean;

  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,

  setAuth: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, accessToken });
  },

  clearAuth: () => {
    setAccessToken(null);
    set({ user: null, accessToken: null });
  },

  hydrate: async () => {
    try {
      const { user, accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      set({ user, accessToken, isHydrated: true });
    } catch {
      setAccessToken(null);
      set({ user: null, accessToken: null, isHydrated: true });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort — clear local state even if server call fails.
    }
    setAccessToken(null);
    set({ user: null, accessToken: null });
  },
}));
