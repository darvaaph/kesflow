# Kesflow — Couple Expense Tracker PWA
> **Master Documentation & AI Agent Instruction Hub**  
> *Aplikasi Web Progresif (PWA) Pengelola Pengeluaran Kencan & Keuangan Bersama Pasangan*

Selamat datang di repositori dokumentasi **Kesflow**. Direktori ini berisi seluruh spesifikasi teknis, dokumen kebutuhan produk (PRD), skema database, panduan desain antarmuka, serta batasan instruksi kerja (**Agent Guardrails**) yang dirancang agar AI Agent atau pengembang dapat mengeksekusi pembuatan aplikasi ini secara terarah, presisi, dan mandiri tanpa multitafsir.

---

## 🗺️ Peta Dokumen & Urutan Pembacaan Agent

Jika Anda adalah **AI Agent** yang ditugaskan untuk membangun aplikasi ini, baca dokumen-dokumen berikut sesuai urutan prioritas:

| No | Dokumen | Deskripsi & Tujuan |
|---|---|---|
| 1 | [**AGENT_INSTRUCTIONS.md**](./AGENT_INSTRUCTIONS.md) | **WAJIB DIBACA PERTAMA.** Batasan (*guardrails*), hal yang dilarang, alur kerja bertahap, dan kriteria penerimaan (*acceptance criteria*). |
| 2 | [**PRD.md**](./PRD.md) | Product Requirements Document: Masalah, persona, fitur utama, dan use-case kencan. |
| 3 | [**ARCHITECTURE.md**](./ARCHITECTURE.md) | Tech stack (Next.js 14 App Router, Supabase, Tailwind, PWA), struktur folder, dan routing. |
| 4 | [**DATABASE.md**](./DATABASE.md) | Skema PostgreSQL, Row Level Security (RLS), trigger otomatis, dan skrip `supabase_schema.sql`. |
| 5 | [**SPLIT_BILL_LOGIC.md**](./SPLIT_BILL_LOGIC.md) | Rumus matematika saldo berjalan (*running balance*), 4 mode pembagian, dan kasus uji unit test. |
| 6 | [**UI_UX_SPEC.md**](./UI_UX_SPEC.md) | Desain visual (*Modern Clean & Warm*), token warna, komponen mobile-first, dan standar iOS/Android PWA. |

---

## ⚡ Ringkasan Cepat Proyek (Executive Summary)

- **Nama Aplikasi**: Kesflow (Kencan Expense Flow)
- **Platform**: Progressive Web App (PWA) — *Mobile First* untuk iOS (Safari Add to Home Screen) dan Android (Chrome Install App) tanpa memerlukan Mac / Apple Developer Account.
- **Tech Stack Utama**:
  - **Frontend**: Next.js 14+ (App Router, TypeScript)
  - **Styling**: Tailwind CSS + Lucide React + Shadcn-style primitives
  - **Backend & Database**: Supabase (PostgreSQL 15, Auth, Realtime DB, Storage Struk)
  - **PWA Tooling**: Web App Manifest + Serwist / `@ducanh2912/next-pwa`
  - **Hosting**: Vercel (Free Tier)
- **Fokus Utama**:
  1. **Strictly Couple Only**: Maksimal 2 orang per ruang (*Couple Space*). Tidak ada fitur grup rombongan besar.
  2. **Hanya Pengeluaran Kencan/Bersama**: Pengeluaran pribadi masing-masing tidak dicatat.
  3. **Zero-Friction Micro-Expense**: Tombol 1-klik untuk parkir (Rp 2k / 5k), kopi, snack.
  4. **Smart Running Balance**: Otomatis melacak siapa yang menalangi siapa secara transparan dengan tombol pelunasan (*Settle Up*).

---

## 🚀 Panduan Eksekusi untuk Agent

1. Jangan menambahkan fitur di luar lingkup yang didefinisikan dalam `PRD.md`.
2. Selalu ikuti aturan arsitektur di `ARCHITECTURE.md` dan skema database di `DATABASE.md`.
3. Gunakan logika perhitungan yang telah dibakukan di `SPLIT_BILL_LOGIC.md`.
4. Pastikan UI mengikuti standar estetika dan *safe-area* iOS di `UI_UX_SPEC.md`.

---

## 💻 Cara Menjalankan Proyek Secara Lokal

1. **Instalasi Dependensi**:
   ```bash
   npm install
   ```
2. **Konfigurasi Lingkungan**:
   - Salin `.env.example` ke `.env.local`.
   - Secara bawaan, `NEXT_PUBLIC_ENABLE_MOCK_MODE=true` akan mengaktifkan **Mode Demo Lokal** (tanpa perlu koneksi Supabase) sehingga seluruh fitur (1-Tap Quick Presets, Split Bill 4 mode, Settle Up + Confetti, Sinkronisasi antar-tab, dan Pergantian Sudut Pandang Pasangan) langsung dapat diuji.
   - Jika ingin menghubungkan ke **Supabase Cloud**, jalankan skrip [`supabase_schema.sql`](./supabase_schema.sql) di SQL Editor Supabase, lalu isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan ubah `NEXT_PUBLIC_ENABLE_MOCK_MODE=false`.
3. **Menjalankan Server Pengembangan**:
   ```bash
   npm run dev
   ```
4. **Menjalankan Unit Test & Build Produksi**:
   ```bash
   npm test
   npm run build
   ```

---

## 📱 Cara Instalasi PWA di iPhone (iOS Safari) & Android (Chrome)

Aplikasi **Kesflow** dirancang sebagai **Standalone Progressive Web App (PWA)** sehingga dapat dipasang di layar utama ponsel tanpa melalui App Store atau Google Play Store:

### 🍎 Instalasi di iPhone (iOS Safari)
1. Buka URL aplikasi Kesflow menggunakan browser **Safari** di iPhone.
2. Ketuk tombol **Bagikan (Share)** (ikon kotak dengan panah ke atas di bilah bawah Safari).
3. Gulir ke bawah dan pilih **Tambah ke Layar Utama (*Add to Home Screen*)**.
4. Ketuk **Tambah (*Add*)** di pojok kanan atas.
5. Buka ikon **Kesflow** dari layar utama iPhone Anda; aplikasi akan berjalan layar penuh (*standalone*) tanpa bilah alamat browser dan mendukung *iOS Safe Area*.

### 🤖 Instalasi di Android (Google Chrome)
1. Buka URL aplikasi Kesflow menggunakan browser **Google Chrome** di Android.
2. Ketuk banner **Instal Kesflow** yang muncul di bagian bawah layar, atau ketuk ikon **Menu (⋮)** di pojok kanan atas Chrome.
3. Pilih **Instal aplikasi (*Install app*)** atau **Tambahkan ke layar utama**.
4. Konfirmasi dengan mengetuk **Instal**. Aplikasi Kesflow siap diakses langsung dari laci aplikasi Android Anda.
