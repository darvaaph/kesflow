import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'coral' | 'stone';
  className?: string;
}

export function Avatar({
  name,
  size = 'md',
  tone = 'coral',
  className,
}: AvatarProps) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'K';

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const tones = {
    coral:
      'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800',
    stone:
      'bg-stone-200 text-stone-900 border-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700',
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl border font-bold select-none',
        sizes[size],
        tones[tone],
        className
      )}
    >
      {initials}
    </div>
  );
}
