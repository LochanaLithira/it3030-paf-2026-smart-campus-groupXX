import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PERMISSIONS } from '@/lib/permissions';
import { Users, Shield, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const { user, hasPermission, isAdmin } = useAuthStore();
  const hasNoRoles = !user?.roles || user.roles.length === 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          {isAdmin()
            ? 'You have full administrative access to the platform.'
            : hasNoRoles
            ? 'Your account has been created.'
            : 'Here is an overview of your account.'}
        </p>
      </div>

      {/* No-role banner */}
      {hasNoRoles && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-400">No role assigned</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-500">
            Your account does not have a role yet. Please contact an administrator to have a role
            assigned before you can access platform features.
          </AlertDescription>
        </Alert>
      )}

      {/* Role badges */}
      {!hasNoRoles && (
        <div className="flex flex-wrap gap-2">
          {user?.roles.map((role) => (
            <Badge key={role} variant={role === 'ADMIN' ? 'default' : 'secondary'}>
              {role}
            </Badge>
          ))}
        </div>
      )}

      {/* Stat cards — shown based on permissions */}
      {!hasNoRoles && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {hasPermission(PERMISSIONS.USERS_READ) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Management</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Manage platform users and their profiles</p>
              </CardContent>
            </Card>
          )}

          {hasPermission(PERMISSIONS.ROLES_READ) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Role Management</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Configure roles and their permissions</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Permissions summary */}
      {!hasNoRoles && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user?.permissions.slice(0, 20).map((perm) => (
                <Badge key={perm} variant="outline" className="text-xs font-mono">
                  {perm}
                </Badge>
              ))}
              {(user?.permissions.length ?? 0) > 20 && (
                <Badge variant="outline" className="text-xs">
                  +{(user?.permissions.length ?? 0) - 20} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
