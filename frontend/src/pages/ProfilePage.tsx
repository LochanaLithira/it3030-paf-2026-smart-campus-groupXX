import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profilePictureUrl ?? undefined} alt={user.fullName} />
              <AvatarFallback className="text-lg">{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.fullName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="flex gap-1 mt-2">
                {user.roles.map((role) => (
                  <Badge key={role} variant={role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Account Status</p>
              <Badge variant={user.active ? 'default' : 'destructive'}>
                {user.active ? 'Active' : 'Deactivated'}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Member Since</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-2">Permissions ({user.permissions.length})</p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {user.permissions.map((perm) => (
                <Badge key={perm} variant="outline" className="text-xs font-mono">
                  {perm}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
