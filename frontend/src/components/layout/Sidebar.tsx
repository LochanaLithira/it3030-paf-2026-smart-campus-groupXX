import { Link, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Settings,
  ChevronRight,
  Building2,
  MapPin,
  Ticket,
  Wrench,
  CalendarDays,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { PERMISSIONS } from '@/lib/permissions';
import { BrandLogo } from '@/components/layout/BrandLogo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string | string[];  // string[] = any of these (OR logic)
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'User Management',
    href: '/users',
    icon: Users,
    permission: PERMISSIONS.USER_MANAGEMENT_PAGE,
  },
  {
    label: 'Role Management',
    href: '/roles',
    icon: ShieldCheck,
    permission: PERMISSIONS.ROLE_MANAGEMENT_PAGE,
  },
  {
    label: 'Locations',
    href: '/locations',
    icon: Building2,
    permission: PERMISSIONS.FACILITIES_MANAGEMENT_PAGE,
  },
  {
    label: 'Resources',
    href: '/resources',
    icon: MapPin,
    permission: PERMISSIONS.FACILITIES_MANAGEMENT_PAGE,
  },
  {
    label: 'My Bookings',
    href: '/bookings',
    icon: CalendarDays,
    permission: PERMISSIONS.BOOKINGS_MANAGEMENT_PAGE_USER,
  },
  {
    label: 'Booking Approvals',
    href: '/admin/bookings',
    icon: CalendarDays,
    permission: PERMISSIONS.BOOKINGS_MANAGEMENT_PAGE_ADMIN,
  },
  {
    label: 'Tickets',
    href: '/tickets',
    icon: Ticket,
    // Visible to any role with any ticket-view permission
    permission: PERMISSIONS.TICKETS_MANAGEMENT_PAGE_USER,
  },

  {
    label: 'Profile',
    href: '/profile',
    icon: Settings,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
];

export function Sidebar() {
  const { hasPermission, user } = useAuthStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    if (Array.isArray(item.permission)) {
      return item.permission.some((p) => hasPermission(p));
    }
    return hasPermission(item.permission);
  });

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border shrink-0">
        <BrandLogo size="sm" className="ring-1 ring-sidebar-primary/20" />
        <span className="font-bold text-sidebar-foreground text-lg">Smart Campus</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleItems.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{user.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {user.roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center rounded-full bg-sidebar-accent px-2 py-0.5 text-xs font-medium text-sidebar-accent-foreground"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}