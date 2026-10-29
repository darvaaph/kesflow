export type ItemAssignee = 'A' | 'B' | 'BOTH';

export interface BillLineItem {
  id: string;
  name: string;
  price: number;
  qty?: number;
  assignedTo: ItemAssignee;
}

export interface ItemizedBillData {
  items: BillLineItem[];
  extraFee: number;
}

export interface ItemizedSplitCalculation {
  subtotalA: number;
  subtotalB: number;
  itemsSubtotal: number;
  extraA: number;
  extraB: number;
  extraFee: number;
  shareA: number;
  shareB: number;
  grandTotal: number;
}

const ITEMIZED_MARKER_START = '<!--KESFLOW_ITEMS:';
const ITEMIZED_MARKER_END = '-->';

/**
 * Menghitung pembagian porsi User A dan User B berdasarkan daftar menu dan pajak/biaya tambahan.
 * Pajak/biaya tambahan dibagi secara proporsional sesuai subtotal makanan masing-masing.
 */
export function calculateItemizedSplit(
  data: ItemizedBillData
): ItemizedSplitCalculation {
  let subtotalA = 0;
  let subtotalB = 0;

  for (const item of data.items) {
    const price = Math.max(0, Math.round(Number(item.price) || 0));
    if (price <= 0) continue;

    if (item.assignedTo === 'A') {
      subtotalA += price;
    } else if (item.assignedTo === 'B') {
      subtotalB += price;
    } else {
      const half = Math.round(price / 2);
      subtotalA += half;
      subtotalB += price - half;
    }
  }

  const itemsSubtotal = subtotalA + subtotalB;
  const extraFee = Math.max(0, Math.round(Number(data.extraFee) || 0));

  let extraA = 0;
  let extraB = 0;

  if (extraFee > 0) {
    if (itemsSubtotal > 0) {
      extraA = Math.round((extraFee * subtotalA) / itemsSubtotal);
      extraB = extraFee - extraA;
    } else {
      extraA = Math.round(extraFee / 2);
      extraB = extraFee - extraA;
    }
  }

  const shareA = subtotalA + extraA;
  const shareB = subtotalB + extraB;
  const grandTotal = shareA + shareB;

  return {
    subtotalA,
    subtotalB,
    itemsSubtotal,
    extraA,
    extraB,
    extraFee,
    shareA,
    shareB,
    grandTotal,
  };
}

/**
 * Menyimpan catatan biasa + rincian menu ke dalam satu string `notes`
 * sehingga kompatibel penuh dengan tabel `transactions` Supabase tanpa perlu migrasi skema.
 */
export function encodeTransactionNotes(
  plainNotes: string,
  itemized: ItemizedBillData | null
): string | null {
  const cleanNotes = plainNotes.trim();
  const validItems =
    itemized?.items.filter(
      (it) => it.name.trim().length > 0 && Number(it.price) > 0
    ) ?? [];

  if (validItems.length === 0) {
    return cleanNotes || null;
  }

  const payload: ItemizedBillData = {
    items: validItems.map((it) => ({
      id: it.id,
      name: it.name.trim(),
      price: Math.round(Number(it.price) || 0),
      ...(it.qty && it.qty > 1 ? { qty: it.qty } : {}),
      assignedTo: it.assignedTo,
    })),
    extraFee: Math.max(0, Math.round(Number(itemized?.extraFee) || 0)),
  };

  const marker = `${ITEMIZED_MARKER_START}${JSON.stringify(payload)}${ITEMIZED_MARKER_END}`;
  return cleanNotes ? `${cleanNotes}\n${marker}` : marker;
}

/**
 * Memisahkan catatan teks biasa dan data rincian menu dari string `notes` transaksi.
 */
export function parseTransactionNotes(rawNotes: string | null | undefined): {
  plainNotes: string;
  itemized: ItemizedBillData | null;
} {
  if (!rawNotes) {
    return { plainNotes: '', itemized: null };
  }

  const startIdx = rawNotes.indexOf(ITEMIZED_MARKER_START);
  if (startIdx === -1) {
    return { plainNotes: rawNotes.trim(), itemized: null };
  }

  const endIdx = rawNotes.indexOf(ITEMIZED_MARKER_END, startIdx);
  if (endIdx === -1) {
    return { plainNotes: rawNotes.trim(), itemized: null };
  }

  const plainPart = (
    rawNotes.slice(0, startIdx) +
    rawNotes.slice(endIdx + ITEMIZED_MARKER_END.length)
  ).trim();

  const jsonStr = rawNotes.slice(
    startIdx + ITEMIZED_MARKER_START.length,
    endIdx
  );

  try {
    const parsed = JSON.parse(jsonStr) as Partial<ItemizedBillData>;
    if (!parsed || !Array.isArray(parsed.items)) {
      return { plainNotes: plainPart, itemized: null };
    }
    const validItems: BillLineItem[] = parsed.items
      .filter(
        (it): it is BillLineItem =>
          Boolean(it) &&
          typeof it.name === 'string' &&
          typeof it.price === 'number'
      )
      .map((it, idx) => ({
        id: it.id || `item-${idx}`,
        name: it.name,
        price: it.price,
        qty: it.qty,
        assignedTo:
          it.assignedTo === 'A' ||
          it.assignedTo === 'B' ||
          it.assignedTo === 'BOTH'
            ? it.assignedTo
            : 'BOTH',
      }));

    if (validItems.length === 0) {
      return { plainNotes: plainPart, itemized: null };
    }

    return {
      plainNotes: plainPart,
      itemized: {
        items: validItems,
        extraFee: Math.max(0, Math.round(Number(parsed.extraFee) || 0)),
      },
    };
  } catch {
    return { plainNotes: plainPart, itemized: null };
  }
}
