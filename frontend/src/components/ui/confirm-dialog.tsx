import { type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog heading */
  title: string;
  /** Body text / description */
  description: ReactNode;
  /** Label on the confirm button. Defaults to "Delete" */
  confirmLabel?: string;
  /** Label on the cancel button. Defaults to "Cancel" */
  cancelLabel?: string;
  /** Visual style of the confirm action. Defaults to "danger" */
  variant?: ConfirmVariant;
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Shows a spinner on the confirm button while pending */
  isPending?: boolean;
}

const variantConfig: Record<
  ConfirmVariant,
  { icon: React.ElementType; iconBg: string; iconColor: string; btnClass: string }
> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100 dark:bg-red-950',
    iconColor: 'text-red-600 dark:text-red-400',
    btnClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: ShieldAlert,
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  isPending = false,
}: ConfirmDialogProps) {
  const { icon: Icon, iconBg, iconColor, btnClass } = variantConfig[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md gap-0 p-0 overflow-hidden"
      >
        {/* Top accent bar */}
        <div
          className={cn(
            'h-1 w-full',
            variant === 'danger' && 'bg-red-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'info' && 'bg-blue-500',
          )}
        />

        <div className="p-6">
          <DialogHeader className="flex-row items-start gap-4 space-y-0">
            {/* Icon bubble */}
            <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconBg)}>
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>

            <div className="space-y-1.5">
              <DialogTitle className="text-base font-semibold leading-snug">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <DialogFooter className="rounded-b-xl border-t bg-muted/40 px-6 py-4 sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="min-w-[90px]"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
            }}
            disabled={isPending}
            className={cn('min-w-[90px]', btnClass)}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                  />
                </svg>
                Processing…
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
