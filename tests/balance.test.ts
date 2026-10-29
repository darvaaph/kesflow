import { describe, it, expect } from 'vitest';
import { calculateRunningBalance, computeTransactionShares } from '../src/lib/balance';

describe('Balance Engine Verification', () => {
  const userA = 'user-a-uuid';
  const userB = 'user-b-uuid';

  it('harus menghitung split 50:50 dengan benar', () => {
    const transactions = [
      {
        payer_id: userA,
        amount: 2000,
        split_type: 'EQUAL_50_50' as const,
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
        split_type: 'FULL_TREAT' as const,
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

  it('harus menghitung mode FULL_OWE (Ditalangi Penuh) dengan benar', () => {
    const transactions = [
      {
        payer_id: userA,
        amount: 60000,
        split_type: 'FULL_OWE' as const,
        user_a_share: 0,
        user_b_share: 60000,
      },
    ];
    const res = calculateRunningBalance(userA, userB, transactions, []);
    expect(res.netBalanceForA).toBe(60000);
    expect(res.totalDateExpense).toBe(60000);
  });

  it('harus menghitung mode CUSTOM dengan benar', () => {
    const shares = computeTransactionShares(100000, 'CUSTOM', userB, userA, 40000, 60000);
    const transactions = [
      {
        payer_id: userB,
        amount: 100000,
        split_type: 'CUSTOM' as const,
        user_a_share: shares.user_a_share,
        user_b_share: shares.user_b_share,
      },
    ];
    const res = calculateRunningBalance(userA, userB, transactions, []);
    expect(res.netBalanceForA).toBe(-40000);
    expect(res.totalDateExpense).toBe(100000);
  });

  it('harus kembali menjadi 0 setelah dilakukan Settle Up penuh', () => {
    const transactions = [
      {
        payer_id: userA,
        amount: 100000,
        split_type: 'EQUAL_50_50' as const,
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

  it('harus menghitung Pelunasan Sebagian (Partial Settle Up) dengan presisi', () => {
    const transactions = [
      {
        payer_id: userA,
        amount: 100000,
        split_type: 'EQUAL_50_50' as const,
        user_a_share: 50000,
        user_b_share: 50000,
      },
    ];
    // User B berhutang Rp 50.000 ke User A, lalu mencicil Rp 30.000 dulu
    const partialSettlements = [
      {
        from_user_id: userB,
        to_user_id: userA,
        amount: 30000,
      },
    ];
    const afterPartial = calculateRunningBalance(
      userA,
      userB,
      transactions,
      partialSettlements
    );
    expect(afterPartial.netBalanceForA).toBe(20000);

    // Kemudian User B melunasi sisa Rp 20.000
    const afterSecondPay = calculateRunningBalance(userA, userB, transactions, [
      ...partialSettlements,
      {
        from_user_id: userB,
        to_user_id: userA,
        amount: 20000,
      },
    ]);
    expect(afterSecondPay.netBalanceForA).toBe(0);
  });

  it('harus menghitung ulang porsi saat transaksi diedit (pembayar atau mode bagi berubah)', () => {
    // Awalnya dibayar User A Rp 80.000 (50:50) -> +40.000 untuk A
    const initialShares = computeTransactionShares(
      80000,
      'EQUAL_50_50',
      userA,
      userA
    );
    expect(initialShares).toEqual({ user_a_share: 40000, user_b_share: 40000 });

    // Diedit menjadi dibayar User B Rp 80.000 dengan mode FULL_OWE (B menalangi A penuh) -> -80.000 untuk A
    const updatedShares = computeTransactionShares(
      80000,
      'FULL_OWE',
      userB,
      userA
    );
    expect(updatedShares).toEqual({ user_a_share: 80000, user_b_share: 0 });

    const res = calculateRunningBalance(
      userA,
      userB,
      [
        {
          payer_id: userB,
          amount: 80000,
          split_type: 'FULL_OWE',
          user_a_share: updatedShares.user_a_share,
          user_b_share: updatedShares.user_b_share,
        },
      ],
      []
    );
    expect(res.netBalanceForA).toBe(-80000);
  });

  it('harus sesuai dengan simulasi numerik 5 langkah di SPLIT_BILL_LOGIC.md', () => {
    const transactions = [
      // #1 Parkir Motor Rp 2.000 (User A, 50:50) -> +1.000
      {
        payer_id: userA,
        amount: 2000,
        split_type: 'EQUAL_50_50' as const,
        user_a_share: 1000,
        user_b_share: 1000,
      },
      // #2 Tiket Bioskop XXI Rp 100.000 (User B, 50:50) -> -49.000
      {
        payer_id: userB,
        amount: 100000,
        split_type: 'EQUAL_50_50' as const,
        user_a_share: 50000,
        user_b_share: 50000,
      },
      // #3 Makan Malam Resto Rp 150.000 (User A, FULL_TREAT) -> tetap -49.000
      {
        payer_id: userA,
        amount: 150000,
        split_type: 'FULL_TREAT' as const,
        user_a_share: 150000,
        user_b_share: 0,
      },
      // #4 Beli Titipan Lipstik B Rp 60.000 (User A, FULL_OWE) -> +11.000
      {
        payer_id: userA,
        amount: 60000,
        split_type: 'FULL_OWE' as const,
        user_a_share: 0,
        user_b_share: 60000,
      },
    ];

    const beforeSettle = calculateRunningBalance(userA, userB, transactions, []);
    expect(beforeSettle.netBalanceForA).toBe(11000);
    expect(beforeSettle.totalDateExpense).toBe(312000);
    expect(beforeSettle.totalPaidByA).toBe(212000);
    expect(beforeSettle.totalPaidByB).toBe(100000);

    // #5 Pelunasan Rp 11.000 dari User B ke User A -> Rp 0
    const afterSettle = calculateRunningBalance(userA, userB, transactions, [
      {
        from_user_id: userB,
        to_user_id: userA,
        amount: 11000,
      },
    ]);
    expect(afterSettle.netBalanceForA).toBe(0);
  });
});
