'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-orange-700 text-white hover:bg-orange-800 active:bg-orange-900 dark:bg-orange-600 dark:hover:bg-orange-500',
      secondary:
        'bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200',
      outline:
        'border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800',
      ghost:
        'bg-transparent text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800',
      danger:
        'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'min-h-[44px] px-3.5 py-2 text-sm font-medium rounded-xl',
      md: 'min-h-[44px] px-4 py-2.5 text-sm font-semibold rounded-xl',
      lg: 'min-h-[48px] px-5 py-3 text-base font-semibold rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
