import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { useAuthStore } from '@/store/authStore';
import { LoginPage } from '@/pages/LoginPage';
import { OAuthCallback } from '@/pages/OAuthCallback';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { RoleManagementPage } from '@/pages/RoleManagementPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { PERMISSIONS } from '@/lib/permissions';

// ── Root Route ───────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});

// ── Auth Routes (public) ─────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const oauthCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/oauth/callback',
  component: OAuthCallback,
});

// ── Protected Layout Route ───────────────────────────────────────

const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: AppLayout,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

// ── App Routes ───────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const usersRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/users',
  component: UserManagementPage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    if (!hasPermission(PERMISSIONS.USERS_READ)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const rolesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/roles',
  component: RoleManagementPage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    if (!hasPermission(PERMISSIONS.ROLES_READ)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const profileRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/profile',
  component: ProfilePage,
});

// ── Router ───────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  loginRoute,
  oauthCallbackRoute,
  protectedLayoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    usersRoute,
    rolesRoute,
    profileRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
