export function normalizeReceipt(raw: unknown) {
  if (!raw || typeof raw !== 'object') throw new Error('Struk tidak terbaca.');
  const value = raw as Record<string, unknown>;
  if (!Array.isArray(value.items)) throw new Error('Rincian menu tidak valid.');
  const items = value.items.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Item struk tidak valid.');
    const row = item as Record<string, unknown>;
    if (typeof row.name !== 'string' || !row.name.trim() || typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price < 0) {
      throw new Error('Harga atau nama menu tidak valid.');
    }
    return { name: row.name.trim(), price: Math.round(row.price) };
  }).filter((item) => item.price > 0);
  if (typeof value.grandTotal !== 'number' || !Number.isFinite(value.grandTotal) || value.grandTotal <= 0 ||
      typeof value.extraFee !== 'number' || !Number.isFinite(value.extraFee)) throw new Error('Total struk tidak valid.');
  const extraFee = Math.round(value.extraFee);
  const grandTotal = Math.round(value.grandTotal);
  if (items.length && items.reduce((total, item) => total + item.price, 0) + extraFee !== grandTotal) {
    throw new Error('Rincian menu tidak cocok dengan total struk. Periksa dan isi secara manual.');
  }
  return {
    merchantName: typeof value.merchantName === 'string' ? value.merchantName : 'Struk Belanja',
    categoryName: typeof value.categoryName === 'string' ? value.categoryName : 'Makanan & Minuman',
    items, extraFee, grandTotal,
  };
}
