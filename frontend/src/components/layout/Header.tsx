import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useAuthStore } from '@/store/authStore';

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const requestLogout = () => {
    setConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      setConfirmOpen(false);
      navigate({ to: '/login' });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background shrink-0">
      {/* Page title area — can be augmented with breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Smart Campus Resource Management</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* Sign out intentionally stays as the right-most action */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={requestLogout}
            className="text-muted-foreground hover:text-destructive gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirm sign out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of Smart Campus?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isSigningOut} />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmLogout} disabled={isSigningOut}>
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}