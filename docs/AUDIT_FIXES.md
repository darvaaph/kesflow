# Perbaikan audit 2 November 2026

## Penerapan

1. Backup database dan uji migration di lingkungan staging terlebih dahulu.
2. Database **yang sudah ada**: jalankan hanya `supabase/migrations/20261102_security_and_consistency.sql`. Jangan menjalankan ulang SQL bootstrap.
3. Database **baru**: gunakan `supabase_schema.sql`, yang dihasilkan dari seluruh migration melalui `npm run schema:build`.
4. Deploy aplikasi setelah migration berhasil. Versi aplikasi ini membutuhkan RPC baru; jangan deploy aplikasi sebelum database siap.
5. Isi `SUPABASE_SERVICE_ROLE_KEY` hanya pada environment server untuk pengiriman push. Jangan beri prefix `NEXT_PUBLIC`.
6. Buat pasangan VAPID key sendiri. Key contoh yang sebelumnya ada di repo harus dianggap tidak rahasia; ganti key yang pernah dipakai dari contoh dan daftar ulang langganan push di perangkat.

Migration tidak menghapus transaksi lama. Migration menolak keanggotaan ambigu (lebih dari dua anggota atau satu pengguna di beberapa ruang) agar data diperiksa terlebih dahulu. Jika beberapa event lama aktif, hanya yang paling baru tetap aktif.

Identitas A/B disimpan pada ruang, tetap terkait riwayat setelah anggota keluar. Anggota asli bisa bergabung kembali; pengganti tidak dapat mengambil alih identitas pasangan lama. Untuk pasangan baru, buat ruang baru. Perubahan ini mencegah utang lama dipindahkan ke orang lain.

Riwayat transaksi lama diimpor sebagai fakta pembayaran, dengan pencatat ditandai tidak diketahui. Detail perubahan sebelum migration tidak bisa direkonstruksi. Perubahan berikutnya mencatat pelaku, nilai sebelum/sesudah, dan ringkasan perubahan.

## Cakupan

- Akses ruang, profil, kategori, struk dan langganan push dibatasi di database.
- Create/join, pelunasan, reset dan aktivasi event memakai operasi database atomik. Penulisan transaksi mengambil kunci ruang yang sama dengan pelunasan.
- Snapshot data memakai satu query JSON aggregate sehingga saldo tidak terpotong batas baris API dan tidak mencampur snapshot dari beberapa query.
- Callback login memakai redirect HTTP dengan tujuan internal; service worker hanya menyimpan aset publik. Respons autentikasi, halaman pribadi, dan data keuangan tidak disimpan dalam Cache API. Cache lama dibuang ketika worker baru aktif.
- Refresh latar belakang mempertahankan halaman dan draft. Respons fetch yang sudah kedaluwarsa diabaikan.
- Diskon negatif dipertahankan, OCR memvalidasi total, dan formatter mempertahankan pecahan rupiah.
- Riwayat per transaksi diindeks sekali dan editor transaksi dibagi pakai dalam daftar.

## Verifikasi

`npm test` mencakup mesin saldo, diskon, format nominal, validasi OCR, middleware/callback, aturan cache, dan migration SQL pada PostgreSQL WASM (PGlite).

PGlite menguji policy dengan role `authenticated`, pemisahan tiga akun, payload pembagian tidak valid, stale settlement, retry settlement, pelestarian identitas, riwayat mutasi, snapshot lebih dari 1.000 transaksi, serta rollback reset. PGlite tidak menggantikan uji dua koneksi PostgreSQL bersamaan, Supabase Realtime, OAuth Google nyata, atau Web Push pada perangkat.

Commit, push, migration remote, serta perubahan environment deployment tidak dijalankan oleh agent.

## Dependency

Next.js diperbarui ke 15.5.28 dan React 19; akses cookies server sudah asynchronous. Vitest 5 memakai Node.js modern. PostCSS transitive milik Next dioverride dalam major 8 yang sama agar memakai versi yang sudah diperbaiki.

`npm audit --omit=dev` melaporkan nol kerentanan pada verifikasi lokal. Audit penuh masih melaporkan 18 moderate pada rantai alat lint (minimatch/ESLint). Tidak dipaksa memakai override major minimatch karena API-nya berbeda; saran otomatis npm bahkan menurunkan ESLint ke major lama. Temuan pengembangan ini perlu migrasi lint terpisah, bukan `npm audit fix --force`.

Refresh penghapusan memakai perubahan `spaces.revision` yang terikat RLS ruang. Ini menghindari ketergantungan pada filter `space_id` dalam payload DELETE. Verifikasi delivery Supabase Realtime tetap diperlukan pada staging.

## Hasil akhir lokal

- 63 test dalam 10 file: lulus.
- ESLint: lulus tanpa warning/error.
- Build produksi Next.js 15.5.28: lulus.
- `git diff --check`: lulus.
- `npm audit --omit=dev`: 0 kerentanan.
- Review independen keamanan dan kesesuaian audit dilakukan; temuan lanjutannya ditutup dengan regresi untuk pembulatan 0,29 dan invalidasi ruang pada penghapusan.

Belum dijalankan: migration pada Supabase pengguna, OAuth Google nyata, delivery realtime dua perangkat, push iOS/Android, serta uji konkurensi dua koneksi PostgreSQL terpisah.
