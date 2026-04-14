import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { useAuthStore } from '@/store/authStore';
import { tokenStorage } from '@/api/client';
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
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { TicketCreatePage } from '@/pages/TicketCreatePage';
import TechDashboardPage from '@/pages/TechDashboardPage';
import { BookingListPage } from '@/pages/BookingListPage';
import { BookingDetailPage } from '@/pages/BookingDetailPage';
import { BookingCreatePage } from '@/pages/BookingCreatePage';
import { AdminBookingQueuePage } from '@/pages/AdminBookingQueuePage';

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
    const hasToken = Boolean(tokenStorage.getAccess());
    if (isAuthenticated && hasToken) {
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
    const hasToken = Boolean(tokenStorage.getAccess());

    if (!isAuthenticated || !hasToken) {
      // Keep store consistent when persisted auth state exists but JWTs are missing.
      useAuthStore.setState({ user: null, isAuthenticated: false });
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
    if (!hasPermission(PERMISSIONS.USER_MANAGEMENT_PAGE)) {
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
    if (!hasPermission(PERMISSIONS.ROLE_MANAGEMENT_PAGE)) {
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
    if (!hasPermission(PERMISSIONS.FACILITIES_MANAGEMENT_PAGE)) {
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
    if (!hasPermission(PERMISSIONS.FACILITIES_MANAGEMENT_PAGE)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const bookingsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/bookings',
  component: BookingListPage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    if (!hasPermission(PERMISSIONS.BOOKINGS_MANAGEMENT_PAGE_USER)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const bookingCreateRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/bookings/new',
  component: BookingCreatePage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    if (!hasPermission(PERMISSIONS.BOOKINGS_CREATE)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const bookingDetailRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/bookings/$bookingId',
  component: BookingDetailPage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    if (!hasPermission(PERMISSIONS.BOOKINGS_VIEW_OWN) && !hasPermission(PERMISSIONS.BOOKINGS_VIEW_ALL)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const adminBookingsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/admin/bookings',
  component: AdminBookingQueuePage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    if (!hasPermission(PERMISSIONS.BOOKINGS_MANAGEMENT_PAGE_ADMIN)) {
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
    if (!hasPermission(PERMISSIONS.TICKETS_MANAGEMENT_PAGE_USER)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const ticketDetailRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/tickets/$ticketId',
  component: TicketDetailPage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    // Allow access if user has any ticket-related permission
    if (
      !hasPermission(PERMISSIONS.TICKETS_VIEW_OWN) &&
      !hasPermission(PERMISSIONS.TICKETS_VIEW_ALL) &&
      !hasPermission(PERMISSIONS.TICKETS_VIEW_ASSIGNED)
    ) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const ticketCreateRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/tickets/new',
  component: TicketCreatePage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    if (!hasPermission(PERMISSIONS.TICKETS_CREATE)) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const techDashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/tech-dashboard',
  component: TechDashboardPage,
  beforeLoad: () => {
    const { hasPermission } = useAuthStore.getState();
    // Only technicians with assigned ticket permissions
    if (!hasPermission(PERMISSIONS.TICKETS_MANAGEMENT_PAGE_TECHNICIAN)) {
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
    bookingsRoute,
    bookingCreateRoute,
    bookingDetailRoute,
    adminBookingsRoute,
    ticketsRoute,
    ticketCreateRoute,
    ticketDetailRoute,
    techDashboardRoute,
    profileRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
