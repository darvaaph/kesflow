import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { KesflowProvider } from '@/context/KesflowContext';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kesflow | Catatan Pengeluaran Kencan Pasangan',
  description:
    'Aplikasi Web Progresif (PWA) pengelola pengeluaran kencan dan saldo berjalan khusus pasangan berdua.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kesflow',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f6' },
    { media: '(prefers-color-scheme: dark)', color: '#141210' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="font-sans antialiased selection:bg-orange-200 selection:text-stone-900">
        <KesflowProvider>
          <ServiceWorkerRegister />
          {children}
        </KesflowProvider>
      </body>
    </html>
  );
}
