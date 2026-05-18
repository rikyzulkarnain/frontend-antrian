const STORAGE_KEY = 'sa.access_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(STORAGE_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.sessionStorage.setItem(STORAGE_KEY, token);
  else window.sessionStorage.removeItem(STORAGE_KEY);
}
