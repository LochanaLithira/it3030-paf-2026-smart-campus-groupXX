import { useAuthStore } from '@/store/authStore';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { TechnicianDashboard } from '@/components/dashboard/TechnicianDashboard';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  const hasNoRoles = !user?.roles || user.roles.length === 0;

  if (hasNoRoles) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">Your account has been created.</p>
        </div>
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-400">No role assigned</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-500">
            Your account does not have a role yet. Please contact an administrator to have a role
            assigned before you can access platform features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Priority Role Routing (Highest to lowest logic)
  if (hasRole('ADMIN')) return <AdminDashboard />;
  if (hasRole('MANAGER')) return <ManagerDashboard />;
  if (hasRole('TECHNICIAN')) return <TechnicianDashboard />;
  if (hasRole('USER')) return <UserDashboard />;

  return null;
}