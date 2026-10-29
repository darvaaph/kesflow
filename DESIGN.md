# DESIGN.md - Kesflow Visual Direction & Decision Log

## Identity & Mood
- **Product**: Kesflow (Kencan Expense Flow), aplikasi web progresif (PWA) pencatat pengeluaran kencan berdua untuk pasangan.
- **Visual Language**: Modern Clean & Warm (hangat, bersahabat, transparan, dan tidak kaku seperti aplikasi akuntansi).
- **Dials**: `Dial: ENERGY 2 / RHYTHM 2 / MOTION 2`

## Color Palette (Max 3 Core + 1 Accent)
1. **Warm Alabaster (`#faf9f6`)**: Latar utama yang hangat di mata dibanding putih klinis murni.
2. **Stone Ink (`#1c1917` & `#57534e`)**: Teks utama dan sekunder dengan rasio kontras di atas 7:1 (lulus WCAG AAA).
3. **Warm Sand Border (`#e7e5e4`)**: Pembatas permukaan kartu yang lembut tanpa bayangan berlebihan.
4. **Terracotta Coral (`#ea580c` / `#f97316`)**: Satu warna aksen utama untuk aksi kencan primer (tombol tambah transaksi, indikator aktif, dan fokus).

## One-Line Decision Reasons (R-31)
- **Mengapa palet Warm Alabaster & Terracotta Coral?** Menciptakan suasana hangat dan romantis untuk pasangan tanpa kesan intimidatif seperti penagihan hutang bank.
- **Mengapa Plus Jakarta Sans?** Huruf humanis geometris dengan keterbacaan angka nominal Rupiah (`tabular-nums`) yang sangat jelas di layar mobile berukuran kecil.
- **Mengapa layout satu kolom berpusat (`max-w-md`) dengan Bottom Navigation?** Mengoptimalkan jangkauan satu jempol (*thumb zone*) saat pengguna sedang berjalan atau membayar parkir di tempat kencan.
- **Mengapa variasi radius (`rounded-2xl` untuk kartu utama, `rounded-xl` untuk tombol/input, `rounded-md` untuk tag status)?** Membedakan hierarki antara kontainer informasi, elemen interaktif, dan penanda status.
- **Mengapa ikon kontekstual pada kategori dan preset?** Mempercepat pemindaian visual (< 1 detik) saat memilih preset parkir motor, parkir mobil, kopi, atau makan malam.
