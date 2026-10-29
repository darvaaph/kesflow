import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'coral' | 'emerald' | 'amber' | 'violet';
}

export function Badge({
  className,
  variant = 'neutral',
  children,
  ...props
}: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps['variant']>, string> = {
    neutral:
      'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700',
    coral:
      'bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800',
    emerald:
      'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
    amber:
      'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
    violet:
      'bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
