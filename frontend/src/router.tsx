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
import { LocationManagementPage } from '@/pages/LocationManagementPage';
import { ResourceManagementPage } from '@/pages/ResourceManagementPage';
import { TicketListPage } from '@/pages/TicketListPage';

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
    if (!hasPermission(PERMISSIONS.MANAGE_USERS)) {
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
    if (!hasPermission(PERMISSIONS.MANAGE_ROLES)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const profileRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/profile',
  component: ProfilePage,
});

const locationsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/locations',
  component: LocationManagementPage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    if (!hasPermission(PERMISSIONS.VIEW_RESOURCES)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const resourcesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/resources',
  component: ResourceManagementPage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    if (!hasPermission(PERMISSIONS.VIEW_RESOURCES)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const ticketsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/tickets',
  component: TicketListPage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    // Allow access if user has any ticket-related permission
    if (
      !hasPermission(PERMISSIONS.VIEW_OWN_TICKETS) &&
      !hasPermission(PERMISSIONS.VIEW_ALL_TICKETS) &&
      !hasPermission(PERMISSIONS.VIEW_ASSIGNED_TICKETS)
    ) {
      throw redirect({ to: '/dashboard' });
    }
  },
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
    locationsRoute,
    resourcesRoute,
    ticketsRoute,
    profileRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
