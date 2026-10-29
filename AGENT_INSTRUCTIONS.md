# Instruksi Kerja & Batasan AI Agent (AGENT_INSTRUCTIONS.md)
> **Target Audience**: AI Coding Agent & Software Engineers  
> **Aplikasi**: Kesflow (Couple Expense Tracker PWA)  
> **Status**: Dokumen Aturan Wajib (Mandatory Guardrails)

Dokumen ini adalah **kontrak kerja utama** bagi AI Agent saat membangun aplikasi Kesflow. Agent **WAJIB** membaca dan mematuhi seluruh batasan, aturan arsitektur, dan alur eksekusi yang tertulis di sini.

---

## 1. Misi Utama (Core Mission)

Membangun aplikasi **PWA (Progressive Web App)** mobile-first bernama **Kesflow** menggunakan **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Supabase**. Aplikasi ini berfungsi untuk mencatat, membagi, dan memantau pengeluaran kencan antara **2 orang (pasangan)** dengan pengalaman pengguna yang sangat cepat, minim gesekan (*zero-friction*), dan estetik.

---

## 2. Batasan Keras & Hal yang DILARANG (Strict Guardrails)

Berikut adalah daftar batasan mutlak yang tidak boleh dilanggar oleh Agent:

### ❌ 1. JANGAN Buat Fitur Multi-User Lebih Dari 2 Orang
- Kesflow adalah aplikasi **spesifik pasangan (couple-only)**.
- Setiap *Space* maksimal hanya dapat menampung **2 anggota** (Pengguna & Pasangannya).
- Jangan membuat sistem grup rombongan, trip teman kantor, atau *split bill* multi-orang seperti Splitwise.

### ❌ 2. JANGAN Catat Pengeluaran Pribadi
- Lingkup aplikasi **HANYA** pengeluaran saat berdua (kencan, makan bareng, liburan bareng, bensin/parkir kencan).
- Jangan membuat modul *budgeting* pribadi, catatan rekening pribadi, atau pencatatan gaji/pemasukan bulanan pribadi.

### ❌ 3. JANGAN Memerlukan Mac / Xcode / Native Build
- Pengguna mengembangkan proyek dari OS **Windows** dan menggunakan perangkat gabungan (iOS + Android).
- Aplikasi harus 100% berbasis **PWA Web Standar** yang dapat diinstal langsung via browser (Safari di iPhone & Chrome di Android).
- Jangan membuat dependensi yang memerlukan kompilasi native iOS (Xcode/CocoaPods) atau Android Studio.

### ❌ 4. JANGAN Menulis Rumus Perhitungan Sendiri
- Selalu gunakan rumus saldo berjalan (*running balance*) dan skenario pembagian yang sudah ditentukan di [`SPLIT_BILL_LOGIC.md`](./SPLIT_BILL_LOGIC.md).
- Jangan mengubah definisi pembagian 50:50, 100% Ditraktir, atau Ditalangi Penuh tanpa mengikuti spesifikasi.

### ❌ 5. Sediakan Mock / Demo Mode Otomatis
- Jika variabel lingkungan Supabase (`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`) belum diisi atau bernilai placeholder, aplikasi **TIDAK BOLEH CRASH**.
- Agent wajib menyediakan mekanisme *fallback state* (Mock Data / LocalStorage Demo Mode) sehingga aplikasi bisa langsung di-preview dan diuji interaksinya secara lokal sebelum koneksi Supabase dipasang.

---

## 3. Standar Koding & Kualitas (Coding Standards)

1. **TypeScript Strict Mode**: Tidak boleh menggunakan tipe data `any`. Semua tipe data transaksi, space, profil, dan kategori harus didefinisikan secara eksplisit di `src/types/`.
2. **Mobile First UI**: Selalu desain untuk layar smartphone (375px - 430px) terlebih dahulu. Komponen harus memiliki target sentuh minimal **44x44 piksel** agar nyaman ditekan dengan jempol.
3. **Penanganan Safe Area iOS**: Selalu sertakan padding aman untuk notch / home indicator iPhone:
   `padding-bottom: env(safe-area-inset-bottom);`
4. **Format Mata Uang Rupiah**: Semua nominal harus diformat dalam standar Indonesia: `Rp 25.000` (menggunakan `Intl.NumberFormat('id-ID')`), tidak boleh `IDR 25000` atau `$25`.
5. **Realtime Pub/Sub**: Manfaatkan Supabase Realtime channel pada tabel transaksi dan saldo sehingga perubahan di HP A langsung ter-update di layar HP B tanpa reload.

---

## 4. Rencana Kerja Bertahap (Step-by-Step Task Checklist)

Agent harus menyelesaikan pembuatan aplikasi mengikuti tahapan berikut secara berurutan:

### Phase 1: Inisialisasi Proyek & Struktur Dasar
- [x] Inisialisasi proyek Next.js 14 dengan TypeScript, Tailwind CSS, App Router, dan ESLint.
- [x] Install dependensi esensial: `lucide-react`, `@supabase/supabase-js`, `@supabase/ssr`, `clsx`, `tailwind-merge`, `date-fns`, `canvas-confetti`.
- [x] Siapkan file konfigurasi lingkungan `.env.example` dan `.env.local`.
- [x] Siapkan struktur folder sesuai [`ARCHITECTURE.md`](./ARCHITECTURE.md).

### Phase 2: Database Schema & Supabase Client
- [x] Buat file `supabase_schema.sql` di root proyek berisi DDL lengkap, trigger otomatis, RLS policies, dan publikasi realtime sesuai [`DATABASE.md`](./DATABASE.md).
- [x] Implementasikan Supabase browser client (`src/lib/supabase/client.ts`), server client (`src/lib/supabase/server.ts`), dan route guard middleware (`src/middleware.ts`).
- [x] Implementasikan mode *Mock Provider / Local Fallback* jika Supabase belum terkonfigurasi.

### Phase 3: Mesin Saldo Berjalan (Balance Engine) & Unit Tests
- [x] Buat modul `src/lib/balance.ts` yang mengimplementasikan rumus matematika dari [`SPLIT_BILL_LOGIC.md`](./SPLIT_BILL_LOGIC.md).
- [x] Buat modul pemformatan mata uang dan tanggal di `src/lib/format.ts`.
- [x] Tulis unit test di `tests/balance.test.ts` untuk menguji:
  - Pembagian 50:50.
  - Skenario 100% Ditraktir (saldo tidak berubah).
  - Skenario Ditalangi Penuh (100% menjadi piutang).
  - Pembayaran pelunasan (*Settle Up*).

### Phase 4: UI Design System & Layout Mobile
- [x] Konfigurasi Tailwind dengan palet "Modern Clean & Warm" (Warm slate `#faf9f6`, aksen coral `#f97316` / peach lembut).
- [x] Buat komponen atom: `Button`, `Input`, `Card`, `Badge`, `Drawer / BottomSheet`.
- [x] Buat komponen layout: `Header.tsx` (menampilkan nama pasangan & indikator koneksi) dan `BottomNav.tsx` (Dashboard, Events, Stats, Settings).

### Phase 5: Autentikasi & Alur Onboarding Couple Space
- [x] Halaman `/login`: Login via Email / Magic Link atau PIN sederhana.
- [x] Halaman `/onboarding`: 
  - Opsi A: "Buat Ruang Kencan Baru" -> Menghasilkan 6-karakter kode unik (contoh: `KISS69`, `LOVE24`).
  - Opsi B: "Gabung ke Ruang Pasangan" -> Input 6-karakter kode undangan.
- [x] Verifikasi bahwa maksimal hanya 2 orang yang dapat berada dalam satu ruang.

### Phase 6: Dashboard & Quick-Tap Presets
- [x] Komponen `BalanceCard.tsx`: Menampilkan status saldo berjalan dalam bahasa ramah dan santai (contoh: *"Kamu ditalangi pacar Rp 45.000"*).
- [x] Komponen `QuickPresets.tsx`: Tombol 1-klik untuk pengeluaran mikro:
  - Parkir Motor (Rp 2.000)
  - Parkir Mobil (Rp 5.000)
  - Parkir Mall (Rp 10.000)
  - Kopi / Minum (Rp 25.000)
  - Camilan / Jajan (Rp 20.000)
- [x] Menekan tombol preset langsung mencatat transaksi secara instan dengan dialog konfirmasi 1 detik.

### Phase 7: Form Transaksi Lengkap & Foto Struk
- [x] Komponen `AddTransactionDrawer.tsx` (Bottom Sheet meluncur dari bawah):
  - Judul pengeluaran
  - Nominal dengan auto-formatting Rupiah
  - Kategori dengan icon visual
  - Pembayar (Kamu / Pasangan)
  - Mode Pembagian (50:50, Ditraktir, Ditalangi, Kustom)
  - Tag Kencan / Event khusus (opsional)
- [x] Komponen `ReceiptUploader.tsx`: Kompresi foto struk sebelum diunggah ke Supabase Storage bucket `receipts`.

### Phase 8: Pelunasan Saldo (Settle Up Flow)
- [x] Modal `SettleUpModal.tsx`:
  - Menampilkan nominal yang harus dibayar untuk membuat saldo seimbang (Rp 0).
  - Tombol "Tandai Lunas".
  - Efek perayaan (*confetti celebration*) saat hutang lunas.

### Phase 9: Fitur Tag Kencan & Statistik Bulanan
- [x] Halaman `/events`: Membuat dan memfilter pengeluaran per momen kencan (*e.g.* "Liburan Bandung", "Nonton Bioskop Weekend").
- [x] Halaman `/stats`:
  - Total pengeluaran kencan bulan ini.
  - Diagram lingkaran (*Pie Chart*) kategori pengeluaran terboros.
  - Bar perbandingan kontribusi pengeluaran nyata antara kedua pasangan.

### Phase 10: Optimasi PWA Standalone & Build Verification
- [x] Konfigurasi `manifest.json`, icon 192x192, 512x512, dan apple-touch-icon.
- [x] Tambahkan meta tags PWA iOS di `src/app/layout.tsx`.
- [x] Uji build produksi: Jalankan `npm run build` dan pastikan **zero TypeScript error**.
- [x] Dokumentasikan cara instalasi di iPhone (Safari) dan Android (Chrome) pada file `README.md`.

---

## 5. Kriteria Penerimaan (Acceptance Criteria)

Aplikasi dinyatakan selesai dan berhasil jika memenuhi syarat berikut:
1. **Lolos Build**: Perintah `npm run build` berjalan sukses tanpa error maupun peringatan tipe TypeScript.
2. **Presisi Matematika**: Semua skenario pada unit test `tests/balance.test.ts` berstatus **PASS** (100% akurat tanpa selisih).
3. **PWA Standalone**: Saat dibuka di iPhone Safari (Add to Home Screen) atau Android Chrome (Install App), aplikasi berjalan dalam mode *standalone* tanpa address bar browser.
4. **Kecepatan Input**: Pengguna dapat mencatat bayar parkir Rp 2.000 dalam waktu kurang dari 3 detik via Quick-Tap Preset.
5. **Realtime Sync**: Transaksi yang dicatat di satu sesi langsung muncul di sesi lainnya tanpa memuat ulang halaman.
