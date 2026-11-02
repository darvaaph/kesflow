import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format angka ke format standar Rupiah Indonesia: "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  const absVal = Math.abs(amount);
  const formatted = rupiahFormatter.format(absVal);
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format angka ribuan tanpa prefix "Rp " untuk input field: "25.000"
 */
export function formatNumberInput(value: number | string): string {
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value)
      : '';
  }
  const clean = value.replace(/[^\d,-]/g, '');
  const [whole, fraction] = clean.replace(/-/g, '').split(',');
  if (!whole && fraction === undefined) return clean.startsWith('-') ? '-' : '';
  return `${clean.startsWith('-') ? '-' : ''}${rupiahFormatter.format(Number(whole || 0))}${fraction !== undefined ? `,${fraction.slice(0, 2)}` : ''}`;
}

/**
 * Parse string berformat titik ribuan menjadi number murni
 */
export function parseNumberInput(formatted: string): number {
  const normalized = formatted.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
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

/**
 * Memendekkan nama agar pas di elemen UI sempit (misal kolom porsi custom split, badge, tombol)
 * Jika nama terdiri dari beberapa kata, utamakan nama depan. Jika tetap panjang, potong dengan elipsis.
 */
export function formatShortName(name: string | null | undefined, maxLength = 12): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  const words = trimmed.split(/\s+/);
  // Jika nama lebih dari 1 kata, ambil kata pertama jika kata pertama sudah proporsional (>= 2 dan <= maxLength)
  if (words.length > 1 && words[0].length >= 2 && words[0].length <= maxLength) {
    return words[0];
  }

  // Jika 1 kata tapi melebihi batas maksimal, potong dengan elipsis
  if (trimmed.length > maxLength) {
    return `${trimmed.slice(0, maxLength - 1)}…`;
  }

  return trimmed;
}
