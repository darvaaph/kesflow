'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Keep mounted until the exit animation (180ms) finishes.
  const [mounted, setMounted] = useState(isOpen);
  const [cachedChildren, setCachedChildren] = useState(children);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setCachedChildren(children);
      return;
    }
    const t = setTimeout(() => setMounted(false), 180);
    return () => clearTimeout(t);
  }, [isOpen, children]);

  if ((!isOpen && !mounted) || typeof document === 'undefined') return null;
  const closing = !isOpen;

  // Portal: an ancestor with transform would otherwise become the containing block of `fixed`.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
    >
      <div
        className={cn(
          'fixed inset-0 bg-stone-950/50',
          closing ? 'motion-safe:animate-fade-out' : 'motion-safe:animate-fade-in'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-warm-bg dark:bg-stone-900 border-t sm:border border-stone-200 dark:border-stone-800 p-5 pb-safe shadow-warm will-change-transform',
          closing
            ? 'motion-safe:animate-sheet-down sm:motion-safe:animate-modal-out'
            : 'motion-safe:animate-sheet-up sm:motion-safe:animate-modal-in',
          className
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-stone-300 dark:bg-stone-700 sm:hidden" />
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
          <div>
            <h2
              id="bottom-sheet-title"
              className="text-lg font-bold text-stone-900 dark:text-stone-100"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-stone-600 hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {isOpen ? children : cachedChildren}
      </div>
    </div>,
    document.body
  );
}
