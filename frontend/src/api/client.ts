// ================================================================
//  Smart Campus — API Client
//  ky instance with JWT auth interceptor + automatic token refresh
// ================================================================

import ky, { type KyInstance, type Options } from 'ky';

const API_BASE = '/api/v1';

// ── Token storage helpers ────────────────────────────────────────

const TOKEN_KEY = 'sc_access_token';
const REFRESH_KEY = 'sc_refresh_token';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  setAccess: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ── Refresh logic (singleton promise to prevent parallel refreshes) ──

let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error('No refresh token available');

  const res = await ky.post(`${API_BASE}/auth/refresh`, {
    json: { refreshToken },
  });

  const data = await res.json<{ accessToken: string; refreshToken: string }>();
  tokenStorage.setAccess(data.accessToken);
  tokenStorage.setRefresh(data.refreshToken);
  return data.accessToken;
}

async function refreshToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── ky instance ──────────────────────────────────────────────────

export const apiClient: KyInstance = ky.create({
  prefixUrl: API_BASE,
  timeout: 30_000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = tokenStorage.getAccess();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401) return response;

        // Skip refresh on auth endpoints themselves
        if (request.url.includes('/auth/')) return response;

        try {
          const newToken = await refreshToken();
          request.headers.set('Authorization', `Bearer ${newToken}`);
          return ky(request);
        } catch {
          // Refresh failed — redirect to login
          tokenStorage.clear();
          window.location.href = '/login';
          return response;
        }
      },
    ],
  },
});

// ── Typed helpers ────────────────────────────────────────────────

export async function apiGet<T>(path: string, opts?: Options): Promise<T> {
  return apiClient.get(path, opts).json<T>();
}

export async function apiPost<T>(path: string, body?: unknown, opts?: Options): Promise<T> {
  return apiClient.post(path, { json: body, ...opts }).json<T>();
}

export async function apiPut<T>(path: string, body?: unknown, opts?: Options): Promise<T> {
  return apiClient.put(path, { json: body, ...opts }).json<T>();
}

export async function apiPatch<T>(path: string, body?: unknown, opts?: Options): Promise<T> {
  return apiClient.patch(path, { json: body, ...opts }).json<T>();
}

export async function apiDelete(path: string, opts?: Options): Promise<void> {
  await apiClient.delete(path, opts);
}
