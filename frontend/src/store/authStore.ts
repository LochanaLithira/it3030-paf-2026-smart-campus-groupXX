// ================================================================
//  Smart Campus — Auth Store (Zustand v5)
//  Persists user session in localStorage
// ================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserResponse } from '@/types/api';
import { tokenStorage } from '@/api/client';
import { authApi } from '@/api/auth';
import type { Permission } from '@/lib/permissions';

type UserLike = UserResponse & { active?: boolean };

function normalizeUser(user: UserLike): UserResponse {
  return {
    ...user,
    // Backend/legacy payloads may send "active" instead of "isActive".
    isActive:
      typeof user.isActive === 'boolean'
        ? user.isActive
        : typeof user.active === 'boolean'
          ? user.active
          : true,
  };
}

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: UserResponse) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission | string) => boolean;
  hasAnyPermission: (permissions: (Permission | string)[]) => boolean;
  hasAllPermissions: (permissions: (Permission | string)[]) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user: UserResponse) => {
        set({ user: normalizeUser(user), isAuthenticated: true });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Even if API call fails, clear local state
          tokenStorage.clear();
        } finally {
          set({ user: null, isAuthenticated: false });
          tokenStorage.clear();
        }
      },

      hasPermission: (permission: Permission | string) => {
        const { user } = get();
        if (!user) return false;
        return user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions: (Permission | string)[]) => {
        const { user } = get();
        if (!user) return false;
        return permissions.some((p) => user.permissions.includes(p));
      },

      hasAllPermissions: (permissions: (Permission | string)[]) => {
        const { user } = get();
        if (!user) return false;
        return permissions.every((p) => user.permissions.includes(p));
      },

      hasRole: (role: string) => {
        const { user } = get();
        if (!user) return false;
        return user.roles.includes(role);
      },

      isAdmin: () => {
        const { user } = get();
        if (!user) return false;
        return user.roles.includes('ADMIN');
      },
    }),
    {
      name: 'smartcampus-auth-v2',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        const state = persistedState as { user?: UserLike | null; isAuthenticated?: boolean } | undefined;

        return {
          ...state,
          user: state?.user ? normalizeUser(state.user) : null,
          isAuthenticated: Boolean(state?.isAuthenticated && state?.user),
        };
      },
      merge: (persistedState: unknown, currentState) => {
        const state = persistedState as { user?: UserLike | null; isAuthenticated?: boolean } | undefined;

        return {
          ...currentState,
          ...state,
          user: state?.user ? normalizeUser(state.user) : null,
          isAuthenticated: Boolean(state?.isAuthenticated && state?.user),
        };
      },
      // Only persist user, not loading state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);