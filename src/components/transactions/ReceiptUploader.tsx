'use client';

import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export interface ReceiptUploaderProps {
  receiptUrl: string | null;
  onChange: (url: string | null) => void;
  spaceId: string;
  compact?: boolean;
}

/**
 * Kompresi gambar di browser menggunakan HTML5 Canvas sebelum diunggah
 */
async function compressImageFile(
  file: File
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 960;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses gambar struk.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengompresi foto struk.'));
              return;
            }
            resolve({ blob, dataUrl });
          },
          'image/jpeg',
          0.72
        );
      };
      img.onerror = () => reject(new Error('Format gambar tidak didukung.'));
      img.src = String(event.target?.result || '');
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadAndCompressReceipt(
  file: File,
  spaceId: string
): Promise<{ storedUrl: string; dataUrl: string }> {
  const { blob, dataUrl } = await compressImageFile(file);

  if (!isSupabaseConfigured()) {
    return { storedUrl: dataUrl, dataUrl };
  }

  const supabase = createClient();
  const filePath = `${spaceId}/${Date.now()}-receipt.jpg`;
  const { error } = await supabase.storage
    .from('receipts')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    return { storedUrl: dataUrl, dataUrl };
  }

  const { data: signedData } = await supabase.storage
    .from('receipts')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365);

  return {
    storedUrl: signedData?.signedUrl || dataUrl,
    dataUrl,
  };
}

export function ReceiptUploader({
  receiptUrl,
  onChange,
  spaceId,
  compact = false,
}: ReceiptUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const { storedUrl } = await uploadAndCompressReceipt(file, spaceId);
      onChange(storedUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Gagal mengunggah foto struk.'
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  if (compact) {
    return (
      <div className="relative shrink-0">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleFileChange}
          className="sr-only"
          id="receipt-file-input-compact"
        />

        {receiptUrl ? (
          <div className="relative h-[44px] w-[44px] overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptUrl}
              alt="Foto struk"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute inset-0 flex items-center justify-center bg-black/55 text-white transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              title="Hapus foto struk"
              aria-label="Hapus foto struk"
            >
              <Trash2 className="h-4 w-4 text-red-300" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-stone-600 transition-colors hover:border-orange-500 hover:bg-orange-50/50 hover:text-orange-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-orange-400 dark:hover:text-orange-400"
            title="Ambil atau unggah foto struk"
            aria-label="Ambil atau unggah foto struk"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-600 dark:text-orange-400" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
        )}

        {uploadError && (
          <p
            role="alert"
            className="absolute left-0 top-full mt-1 whitespace-nowrap text-[11px] font-medium text-red-600 dark:text-red-400"
          >
            {uploadError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        Foto Struk / Bukti Bayar (Opsional)
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
        id="receipt-file-input"
      />

      {receiptUrl ? (
        <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-2.5 dark:border-stone-800 dark:bg-stone-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={receiptUrl}
            alt="Pratinjau foto struk belanja"
            className="max-h-44 w-full rounded-lg object-contain"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => onChange(null)}
          >
            <Trash2 className="h-4 w-4 text-red-700 dark:text-red-400" />
            <span>Hapus Foto Struk</span>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          fullWidth
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4 text-orange-700 dark:text-orange-400" />
          <span>
            {isUploading
              ? 'Mengompresi & Mengunggah Struk...'
              : 'Ambil / Pilih Foto Struk'}
          </span>
        </Button>
      )}

      {uploadError && (
        <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
          {uploadError}
        </p>
      )}
    </div>
  );
}
