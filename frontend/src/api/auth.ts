import { apiClient, tokenStorage } from './client';
import type { AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest } from '@/types/api';

interface CredentialsLoginRequest {
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Exchange Google OAuth2 authorization code for JWT tokens.
   * Called by OAuthCallback after Google redirects back.
   */
  loginWithGoogle: async (request: LoginRequest): Promise<AuthResponse> => {
    const data = await apiClient.post('auth/google', { json: request }).json<AuthResponse>();
    tokenStorage.setAccess(data.accessToken);
    tokenStorage.setRefresh(data.refreshToken);
    return data;
  },

  /**
   * Self-registration — the new account has NO role until admin assigns one.
   */
  register: async (request: RegisterRequest): Promise<AuthResponse> => {
    const data = await apiClient.post('auth/register', { json: request }).json<AuthResponse>();
    tokenStorage.setAccess(data.accessToken);
    tokenStorage.setRefresh(data.refreshToken);
    return data;
  },

  /**
   * Sign in with email and password (local / seeded accounts).
   */
  loginWithCredentials: async (request: CredentialsLoginRequest): Promise<AuthResponse> => {
    const data = await apiClient.post('auth/login', { json: request }).json<AuthResponse>();
    tokenStorage.setAccess(data.accessToken);
    tokenStorage.setRefresh(data.refreshToken);
    return data;
  },

  refresh: async (request: RefreshTokenRequest): Promise<AuthResponse> => {
    return apiClient.post('auth/refresh', { json: request }).json<AuthResponse>();
  },

  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefresh();
    try {
      await apiClient.post('auth/logout', { json: { refreshToken } });
    } finally {
      tokenStorage.clear();
    }
  },
};
