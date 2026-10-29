# Logika Matematika & Aturan Bisnis Split Bill (SPLIT_BILL_LOGIC.md)
> **Aplikasi**: Kesflow (Couple Expense Tracker PWA)  
> **Prinsip**: Presisi 100% tanpa selisih (*Zero Discrepancy*), transparan, dan ramah pasangan.

Dokumen ini mendefinisikan seluruh rumus matematika, logika pembebanan, status saldo berjalan (*running balance*), dan skenario uji unit test yang wajib diikuti oleh sistem.

---

## 1. Definisi Entitas & Konsep Dasar

Dalam satu *Couple Space*, hanya terdapat 2 orang anggota:
- **User A** (misal: Kamu)
- **User B** (misal: Pasanganmu)

### Saldo Berjalan (Net Running Balance)
Saldo berjalan dihitung dari sudut pandang **User A**:
$$\text{NetBalance}_A = \sum (\text{Hak Piutang A}) - \sum (\text{Kewajiban Hutang A})$$

- Jika $\text{NetBalance}_A > 0$: **User B berhutang kepada User A** sebesar $\text{NetBalance}_A$.
- Jika $\text{NetBalance}_A < 0$: **User A berhutang kepada User B** sebesar $|\text{NetBalance}_A|$.
- Jika $\text{NetBalance}_A = 0$: **Kondisi Seimbang / Lunas Sempurna**.

---

## 2. Empat Mode Pembagian Pengeluaran (Split Modes)

Setiap transaksi belanja memiliki total nominal $T$ ($T > 0$).

### 1. Mode `EQUAL_50_50` (Bagi Rata 50:50)
Pengeluaran dinikmati berdua secara setara (contoh: tiket bioskop, makan bersama, bayar parkir).
- Porsi Beban:
  $$\text{user\_a\_share} = \frac{T}{2}, \quad \text{user\_b\_share} = \frac{T}{2}$$
- Pengaruh terhadap Saldo:
  - Jika **User A yang membayar**: User A berhak menerima piutang dari B sebesar $+\frac{T}{2}$.
  - Jika **User B yang membayar**: User A berhutang kepada B sebesar $-\frac{T}{2}$.

### 2. Mode `FULL_TREAT` (100% Ditraktir Penuh)
Salah satu pasangan mentraktir pasangannya sebagai hadiah atau bentuk kasih sayang. 
> [!IMPORTANT]
> Traktir **TIDAK** menimbulkan hutang/piutang sama sekali, namun tetap dihitung ke dalam **Total Pengeluaran Kencan** dan **Total Kontribusi Nyata**.
- Jika **User A mentraktir User B**:
  - $\text{user\_a\_share} = T$, $\text{user\_b\_share} = 0$.
  - Pengaruh ke Saldo Berjalan: **$0$ (Tidak ada hutang)**.
  - Kontribusi Bayar User A bertambah $+T$.
- Jika **User B mentraktir User A**:
  - $\text{user\_a\_share} = 0$, $\text{user\_b\_share} = T$.
  - Pengaruh ke Saldo Berjalan: **$0$ (Tidak ada hutang)**.
  - Kontribusi Bayar User B bertambah $+T$.

### 3. Mode `FULL_OWE` (Ditalangi Penuh 100%)
Salah satu pasangan membelikan barang kebutuhan pribadi pasangannya saat sedang bersama (contoh: User A membayari skincare titipan User B di mall).
- Jika **User A menalangi untuk User B**:
  - $\text{user\_a\_share} = 0$, $\text{user\_b\_share} = T$.
  - Pengaruh ke Saldo Berjalan: $+T$ (User B berhutang penuh $T$ ke User A).
- Jika **User B menalangi untuk User A**:
  - $\text{user\_a\_share} = T$, $\text{user\_b\_share} = 0$.
  - Pengaruh ke Saldo Berjalan: $-T$ (User A berhutang penuh $T$ ke User B).

### 4. Mode `CUSTOM` (Nominal Kustom)
Pengguna menentukan sendiri nominal porsi masing-masing:
$$\text{user\_a\_share} + \text{user\_b\_share} = T$$
- Jika **User A yang membayar**: Saldo A bertambah $+\text{user\_b\_share}$.
- Jika **User B yang membayar**: Saldo A berkurang $-\text{user\_a\_share}$.

---

## 3. Logika Pelunasan (Settle Up Reconciliation)

Pelunasan adalah pencatatan transfer atau pembayaran uang tunai untuk mereset saldo kembali seimbang:
- Jika saat ini $\text{NetBalance}_A > 0$ (User B hutang ke A sebesar $X$):
  - User B melakukan pelunasan ke User A sebesar $X$.
  - Sistem mencatat settlement: `from: User B`, `to: User A`, `amount: X`.
  - Saldo baru: $X - X = 0$.
- Jika saat ini $\text{NetBalance}_A < 0$ (User A hutang ke B sebesar $Y$):
  - User A melakukan pelunasan ke User B sebesar $Y$.
  - Sistem mencatat settlement: `from: User A`, `to: User B`, `amount: Y`.
  - Saldo baru: $-Y + Y = 0$.

---

## 4. Simulasi Numerik Kencan Riil (Langkah demi Langkah)

Mari simulasikan 1 malam kencan antara **User A (Cowok)** dan **User B (Cewek)**:

| Step | Aktivitas | Total ($T$) | Pembayar | Mode | Beban A | Beban B | Net Saldo A | Keterangan Status |
|---|---|---|---|---|---|---|---|---|
| **#1** | Parkir Motor | Rp 2.000 | User A | 50:50 | Rp 1.000 | Rp 1.000 | **+Rp 1.000** | Cewek berhutang Rp 1.000 ke Cowok |
| **#2** | Tiket Bioskop XXI | Rp 100.000 | User B | 50:50 | Rp 50.000 | Rp 50.000 | **-Rp 49.000** | Cowok berhutang Rp 49.000 ke Cewek |
| **#3** | Makan Malam Resto | Rp 150.000 | User A | Traktir Penuh | Rp 150.000 | Rp 0 | **-Rp 49.000** | Saldo tetap! (Hanya nambah total kencan) |
| **#4** | Beli Titipan Lipstik B | Rp 60.000 | User A | Talangi Penuh | Rp 0 | Rp 60.000 | **+Rp 11.000** | Cewek berhutang Rp 11.000 ke Cowok |
| **#5** | Pelunasan (Settle Up) | Rp 11.000 | User B (Transfer) | Settlement | - | - | **Rp 0** | **Saldo Lunas Sempurna (Rp 0)** |

**Statistik Akhir Kencan**:
- Total Pengeluaran Kencan Bersama: $\text{Rp 2.000} + \text{Rp 100.000} + \text{Rp 150.000} + \text{Rp 60.000} = \text{Rp 312.000}$.
- Total Uang Fisik Dikeluarkan Cowok (User A): $\text{Rp 2.000} + \text{Rp 150.000} + \text{Rp 60.000} = \text{Rp 212.000}$.
- Total Uang Fisik Dikeluarkan Cewek (User B): $\text{Rp 100.000}$.

---

## 5. Spesifikasi Unit Test TypeScript (`tests/balance.test.ts`)

Agent **WAJIB** membuat dan menjalankan unit test berikut untuk memverifikasi logika:

```typescript
import { describe, it, expect } from 'vitest'; // atau jest
import { calculateRunningBalance } from '../src/lib/balance';

describe('Balance Engine Verification', () => {
  const userA = 'user-a-uuid';
  const userB = 'user-b-uuid';

  it('harus menghitung split 50:50 dengan benar', () => {
    const transactions = [
      {
        payer_id: userA,
        amount: 2000,
        split_type: 'EQUAL_50_50',
        user_a_share: 1000,
        user_b_share: 1000,
      },
    ];
    const res = calculateRunningBalance(userA, userB, transactions, []);
    expect(res.netBalanceForA).toBe(1000);
    expect(res.totalDateExpense).toBe(2000);
  });

  it('tidak boleh mengubah saldo saat mode FULL_TREAT', () => {
    const transactions = [
      {
        payer_id: userA,
        amount: 150000,
        split_type: 'FULL_TREAT',
        user_a_share: 150000,
        user_b_share: 0,
      },
    ];
    const res = calculateRunningBalance(userA, userB, transactions, []);
    expect(res.netBalanceForA).toBe(0);
    expect(res.totalDateExpense).toBe(150000);
    expect(res.totalPaidByA).toBe(150000);
    expect(res.totalPaidByB).toBe(0);
  });

  it('harus kembali menjadi 0 setelah dilakukan Settle Up penuh', () => {
    const transactions = [
      {
        payer_id: userA,
        amount: 100000,
        split_type: 'EQUAL_50_50',
        user_a_share: 50000,
        user_b_share: 50000,
      },
    ];
    const settlements = [
      {
        from_user_id: userB,
        to_user_id: userA,
        amount: 50000,
      },
    ];
    const res = calculateRunningBalance(userA, userB, transactions, settlements);
    expect(res.netBalanceForA).toBe(0);
  });
});
```
