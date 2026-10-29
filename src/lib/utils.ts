import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generateInviteCode(): string {
  const prefixes = ['KISS', 'LOVE', 'DATE', 'HUGS', 'DUET', 'PAIR'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const digits = Math.floor(10 + Math.random() * 90).toString();
  return `${prefix}${digits}`;
}
