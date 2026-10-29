import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kesflow - Couple Expense Tracker',
    short_name: 'Kesflow',
    description:
      'Catat pengeluaran date berdua dan pantau saldo pasangan.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#faf9f6',
    theme_color: '#c2410c',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
