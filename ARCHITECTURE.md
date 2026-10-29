# Arsitektur Sistem & Spesifikasi Teknis (ARCHITECTURE.md)
> **Aplikasi**: Kesflow (Couple Expense Tracker PWA)  
> **Framework**: Next.js 14+ (App Router, TypeScript)  
> **Backend BaaS**: Supabase (PostgreSQL, Auth, Realtime, Storage)

---

## 1. Pilihan Tech Stack & Rasionalisasi

| Komponen | Pilihan Teknologi | Alasan Pemilihan |
|---|---|---|
| **Framework Web** | Next.js 14+ (App Router) | Standar industri untuk React modern, performa tinggi, SSR/Edge capabilities, dan integrasi mudah dengan PWA. |
| **Bahasa Pemrograman** | TypeScript 5+ | *Type safety* penuh mencegah bug pada kalkulasi keuangan dan schema database. |
| **Styling & Icons** | Tailwind CSS + Lucide React | *Utility-first CSS*, responsif mobile-first, rendering ikon kencan yang bersih dan modern. |
| **PWA Engine** | Serwist / `@ducanh2912/next-pwa` | Menghasilkan Service Worker, manifest otomatis, dan kemampuan instalasi *standalone* di iOS & Android. |
| **Database & Realtime** | Supabase (PostgreSQL 15) | Database relasional tangguh, sinkronisasi *real-time* via WebSocket untuk kedua HP, dan *Row Level Security* (RLS). |
| **Autentikasi** | Supabase Auth | Mendukung Magic Link, Email/Password, dan session cookie management. |
| **Cloud Storage** | Supabase Storage | Bucket `receipts` untuk menyimpan foto struk belanja dengan proteksi RLS per pasangan. |
| **Hosting & CI/CD** | Vercel (Free Tier) | Deploy instan terintegrasi dengan GitHub, zero-config serverless Next.js, dan otomatis HTTPS. |

---

## 2. Diagram Aliran Data & Arsitektur Sistem

```mermaid
flowchart TD
    subgraph DeviceA [HP Pengguna A - iOS/Android PWA]
        ClientA[Next.js Client A]
        CacheA[Service Worker Cache]
    end

    subgraph DeviceB [HP Pasangan B - iOS/Android PWA]
        ClientB[Next.js Client B]
        CacheB[Service Worker Cache]
    end

    subgraph CloudVercel [Vercel Edge / Node Runtime]
        NextApp[Next.js Server Components & Middleware]
    end

    subgraph SupabasePlatform [Supabase Cloud BaaS]
        AuthEngine[Supabase Auth]
        Postgres[(PostgreSQL 15 DB)]
        RLSEngine[Row Level Security]
        RealtimeHub[Realtime WebSocket Engine]
        FileStorage[Storage Bucket: receipts]
    end

    ClientA -->|1. Akses Web PWA| NextApp
    ClientB -->|1. Akses Web PWA| NextApp
    
    ClientA -->|2. Query / Catat Transaksi| RLSEngine
    ClientB -->|2. Query / Catat Transaksi| RLSEngine
    RLSEngine --> Postgres

    ClientA -->|3. Upload Foto Struk| FileStorage
    ClientB -->|3. Upload Foto Struk| FileStorage

    Postgres -->|4. Trigger Perubahan Data| RealtimeHub
    RealtimeHub -.->|5. Push Update Instan (WSS)| ClientA
    RealtimeHub -.->|5. Push Update Instan (WSS)| ClientB
```

---

## 3. Struktur Direktori Proyek

```text
kencan-kita/
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png              // Icon PWA Android & Splash
│   │   ├── icon-512x512.png              // Icon resolusi tinggi
│   │   └── apple-touch-icon.png          // Icon Home Screen iOS
│   ├── favicon.ico
│   └── manifest.json                     // Web App Manifest
├── src/
│   ├── app/
│   │   ├── (auth)/                       // Route Group: Halaman Otentikasi
│   │   │   ├── login/
│   │   │   │   └── page.tsx              // Login Magic Link / PIN
│   │   │   └── onboarding/
│   │   │       └── page.tsx              // Buat Space atau Join dengan Kode 6 Huruf
│   │   ├── (dashboard)/                  // Route Group: Layar Utama Aplikasi
│   │   │   ├── layout.tsx                // Layout dengan Header & BottomNav
│   │   │   ├── page.tsx                  // Dashboard (Saldo, Presets, List Transaksi)
│   │   │   ├── events/
│   │   │   │   └── page.tsx              // Filter Transaksi per Kencan Khusus
│   │   │   ├── stats/
│   │   │   │   └── page.tsx              // Grafik & Laporan Bulanan
│   │   │   └── settings/
│   │   │       └── page.tsx              // Info Akun, Kode Space, Keluar
│   │   ├── layout.tsx                    // Root Layout (Font, Meta tags iOS PWA)
│   │   ├── globals.css                   // Tailwind directives & CSS Variables
│   │   └── manifest.ts                   // Next.js dynamic manifest helper
│   ├── components/
│   │   ├── ui/                           // Komponen Primitif
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── BottomSheet.tsx           // Mobile Drawer modal
│   │   │   └── Avatar.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx                // Header atas: Nama Pasangan & Realtime Ping
│   │   │   └── BottomNav.tsx             // Navigasi bawah ala aplikasi native
│   │   ├── dashboard/
│   │   │   ├── BalanceCard.tsx           // Kartu Saldo Berjalan & Tombol Settle Up
│   │   │   ├── QuickPresets.tsx          // Tombol Cepat: Parkir 2k/5k, Kopi, Snack
│   │   │   ├── TransactionList.tsx       // Daftar transaksi belanja kencan
│   │   │   └── TransactionItem.tsx       // Baris rincian transaksi & status bagi
│   │   ├── transactions/
│   │   │   ├── AddTransactionDrawer.tsx  // Bottom sheet input transaksi lengkap
│   │   │   ├── SplitModeSelector.tsx     // Pilihan 50:50, Traktir, Talangi, Kustom
│   │   │   ├── ReceiptUploader.tsx       // Kompresi & upload foto struk
│   │   │   └── SettleUpModal.tsx         // Modal konfirmasi pelunasan
│   │   └── stats/
│   │       ├── CategoryPieChart.tsx      // Visualisasi kategori terboros
│   │       └── ContributionRatio.tsx     // Bar perbandingan siapa bayar berapa
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 // Browser Supabase client (Client Components)
│   │   │   ├── server.ts                 // Server Supabase client (Server Components)
│   │   │   └── middleware.ts             // Session refresher & route protector
│   │   ├── balance.ts                    // Logika matematika saldo berjalan
│   │   ├── format.ts                     // Format Rupiah (Rp) & Tanggal ID
│   │   ├── mockData.ts                   // Data fallback lokal jika Supabase offline
│   │   └── utils.ts                      // cn (clsx + tailwind-merge)
│   ├── types/
│   │   ├── database.types.ts             // Tipe TypeScript hasil generate Supabase
│   │   └── index.ts                      // Tipe transaksi, space, member, balance
│   └── middleware.ts                     // Next.js middleware (Auth protection)
├── tests/
│   └── balance.test.ts                   // Unit test mesin saldo berjalan
├── supabase/
│   └── migrations/
│       └── 20261029_init.sql             // File migrasi SQL Supabase
├── .env.example
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Pola Routing & Proteksi Autentikasi

Aplikasi menggunakan pola proteksi route via `src/middleware.ts`:

1. **Pengguna Belum Login**:
   - Jika mengakses `/`, `/events`, `/stats`, `/settings` -> Otomatis diarahkan ke `/login`.
2. **Pengguna Sudah Login tapi Belum Masuk Space**:
   - Jika user belum memiliki `space_id` di tabel `space_members` -> Diarahkan ke `/onboarding`.
3. **Pengguna Sudah Aktif dalam Space**:
   - Akses `/login` atau `/onboarding` -> Otomatis diarahkan ke dashboard `/`.

---

## 5. Pola Sinkronisasi Realtime (Supabase Realtime)

Untuk memastikan kedua HP selalu sinkron seketika saat salah satu mencatat belanja:

```typescript
// Contoh implementasi di Client Component Dashboard
useEffect(() => {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`space-${spaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'transactions',
        filter: `space_id=eq.${spaceId}`
      },
      (payload) => {
        // Otomatis refresh daftar transaksi dan kalkulasi saldo
        fetchLatestData();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'settlements',
        filter: `space_id=eq.${spaceId}`
      },
      () => {
        // Otomatis update status pelunasan
        fetchLatestData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [spaceId]);
```

---

## 6. Spesifikasi Variabel Lingkungan (`.env.example`)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Mode Mock / Demo Lokal (Aktifkan jika belum memiliki Supabase)
NEXT_PUBLIC_ENABLE_MOCK_MODE=false
```
