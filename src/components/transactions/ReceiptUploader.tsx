'use client';

import React, { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export interface ReceiptUploaderProps {
  receiptUrl: string | null;
  onChange: (url: string | null) => void;
  spaceId: string;
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

export function ReceiptUploader({
  receiptUrl,
  onChange,
  spaceId,
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
      const { blob, dataUrl } = await compressImageFile(file);

      if (!isSupabaseConfigured()) {
        onChange(dataUrl);
        return;
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
        // Fallback ke pratinjau lokal terkompresi jika bucket belum siap
        onChange(dataUrl);
        return;
      }

      const { data: signedData } = await supabase.storage
        .from('receipts')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      onChange(signedData?.signedUrl || dataUrl);
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
