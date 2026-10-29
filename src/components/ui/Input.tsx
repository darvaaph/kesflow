'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
  helperText?: string;
  prefixText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, labelClassName, error, helperText, prefixText, id, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            title={typeof label === 'string' ? label : undefined}
            className={cn(
              'block text-sm font-medium text-stone-800 dark:text-stone-200 truncate',
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixText && (
            <span className="pointer-events-none absolute left-3.5 text-sm font-semibold text-stone-600 dark:text-stone-400">
              {prefixText}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base text-stone-900 placeholder:text-stone-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:border-orange-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-400',
              prefixText && 'pl-11',
              error && 'border-red-600 focus-visible:ring-red-600',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
