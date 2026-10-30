'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  onBack,
  title,
  description,
  children,
  className,
}: BottomSheetProps) {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDragOffsetY(0);
      setIsDragging(false);
      dragStartYRef.current = null;
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    dragStartYRef.current = touch.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const deltaY = touch.clientY - dragStartYRef.current;
    if (deltaY > 0) {
      setDragOffsetY(deltaY);
    } else {
      setDragOffsetY(0);
    }
  };

  const handleTouchEnd = () => {
    if (dragStartYRef.current === null) return;
    dragStartYRef.current = null;
    setIsDragging(false);
    if (dragOffsetY > 80) {
      setDragOffsetY(0);
      onClose();
    } else {
      setDragOffsetY(0);
    }
  };

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
          'fixed inset-0 bg-stone-950/50 backdrop-blur-[1px]',
          closing ? 'motion-safe:animate-fade-out' : 'motion-safe:animate-fade-in'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        style={
          dragOffsetY > 0
            ? {
                transform: `translateY(${dragOffsetY}px)`,
                transition: isDragging ? 'none' : 'transform 200ms ease-out',
              }
            : undefined
        }
        className={cn(
          'relative z-10 w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-2xl bg-warm-bg dark:bg-stone-900 border-t sm:border border-stone-200 dark:border-stone-800 p-5 pb-safe shadow-warm will-change-transform',
          closing
            ? 'motion-safe:animate-sheet-down sm:motion-safe:animate-modal-out'
            : 'motion-safe:animate-sheet-up sm:motion-safe:animate-modal-in',
          className
        )}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-stone-300 dark:bg-stone-700 sm:hidden" />
          <div className="flex items-start justify-between gap-2.5 border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
            <div className="flex items-start gap-2 min-w-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Kembali"
                  className="-ml-1 inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-200/70 dark:text-stone-200 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0">
                <h2
                  id="bottom-sheet-title"
                  className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate"
                >
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {isOpen ? children : cachedChildren}
      </div>
    </div>,
    document.body
  );
}
