import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format angka ke format standar Rupiah Indonesia: "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  const absVal = Math.abs(Math.round(amount));
  const formatted = rupiahFormatter.format(absVal);
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format angka ribuan tanpa prefix "Rp " untuk input field: "25.000"
 */
export function formatNumberInput(value: number | string): string {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return rupiahFormatter.format(Number(digits));
}

/**
 * Parse string berformat titik ribuan menjadi number murni
 */
export function parseNumberInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

/**
 * Format tanggal ramah dalam Bahasa Indonesia
 */
export function formatRelativeDate(isoDate: string): string {
  try {
    const date = parseISO(isoDate);
    if (isToday(date)) {
      return `Hari ini, ${format(date, 'HH:mm', { locale: localeId })}`;
    }
    if (isYesterday(date)) {
      return `Kemarin, ${format(date, 'HH:mm', { locale: localeId })}`;
    }
    return format(date, 'd MMM yyyy, HH:mm', { locale: localeId });
  } catch {
    return isoDate;
  }
}

export function formatShortDate(isoDate: string): string {
  try {
    const date = parseISO(isoDate);
    return format(date, 'd MMM yyyy', { locale: localeId });
  } catch {
    return isoDate;
  }
}
