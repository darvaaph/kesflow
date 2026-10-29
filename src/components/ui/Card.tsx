import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({
  className,
  elevated = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-stone-200/90 bg-white p-4 dark:border-stone-800 dark:bg-stone-900',
        elevated && 'shadow-warm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
