import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

export function BrandLogo({ className, size = 'md' }: BrandLogoProps) {
  return (
    <img
      src="/smart-campus-logo.svg"
      alt="Smart Campus logo"
      className={cn(SIZE_CLASS[size], 'rounded-lg object-contain', className)}
      loading="eager"
      decoding="async"
    />
  );
}
