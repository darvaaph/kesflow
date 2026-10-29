import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export interface ScannedReceiptResult {
  merchantName: string;
  categoryName?: string;
  items: {
    name: string;
    price: number;
    qty?: number;
  }[];
  extraFee: number;
  grandTotal: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!body.imageBase64) {
      return NextResponse.json(
        { error: 'Gambar struk tidak ditemukan.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY belum diatur di environment (.env.local / Vercel). Silakan isi rincian menu secara manual di bawah.',
          missingKey: true,
        },
        { status: 400 }
      );
    }

    // Bersihkan prefix data URL jika ada (misal "data:image/jpeg;base64,...")
    const base64Clean = body.imageBase64.includes(',')
      ? body.imageBase64.split(',')[1] || body.imageBase64
      : body.imageBase64;

    const mimeType = (body.mimeType || 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp';

    const client = new GoogleGenAI({ apiKey });

    const prompt = `Kamu adalah asisten pembaca struk kasir Indonesia untuk aplikasi keuangan pasangan Kesflow.
Baca gambar struk ini dengan teliti dan ekstrak:
1. merchantName: Nama toko/restoran/kafe/tempat belanja (contoh: "Mie Gacoan", "Kopi Kenangan", "Solaria", "Indomaret").
2. categoryName: Pilih SATU kategori yang paling cocok dari daftar berikut: "Makanan & Minuman", "Camilan & Jajan", "Nonton & Bioskop", "Transport & Parkir", "Belanja Bareng", "Staycation & Liburan", "Hadiah & Kejutan", "Lain-lain".
3. items: Daftar setiap menu/barang yang dibeli. Untuk setiap baris item, isi:
   - name: Nama menu/barang (sertakan jumlah jika > 1, contoh "2x Es Teh Manis").
   - price: Harga total baris item tersebut dalam angka Rupiah penuh (contoh: jika tertulis 28.000 atau 28,000 maka tulis 28000). Jangan masukkan baris subtotal, pajak, atau kembalian ke dalam items.
   - qty: Jumlah unit item tersebut (default 1).
4. extraFee: Total biaya tambahan di luar harga menu (jumlahkan Pajak PB1/PPN, Service Charge, Biaya Layanan, Ongkir, Pembulatan, dikurangi diskon jika ada) dalam angka Rupiah penuh. Jika tidak ada pajak/biaya tambahan, isi 0.
5. grandTotal: Total pembayaran akhir di struk dalam angka Rupiah penuh.`;

    const interaction = await client.interactions.create({
      model: 'gemini-3.8-flash',
      store: false,
      input: [
        { type: 'text', text: prompt },
        {
          type: 'image',
          data: base64Clean,
          mime_type: mimeType,
        },
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: {
            merchantName: { type: 'string' },
            categoryName: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  qty: { type: 'number' },
                },
                required: ['name', 'price'],
              },
            },
            extraFee: { type: 'number' },
            grandTotal: { type: 'number' },
          },
          required: ['merchantName', 'items', 'extraFee', 'grandTotal'],
        },
      },
    });

    const rawText = interaction.output_text;
    if (!rawText) {
      return NextResponse.json(
        { error: 'AI tidak dapat membaca teks dari gambar struk ini.' },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(rawText) as ScannedReceiptResult;
    return NextResponse.json({
      merchantName: parsed.merchantName || 'Struk Belanja',
      categoryName: parsed.categoryName || 'Makanan & Minuman',
      items: Array.isArray(parsed.items) ? parsed.items : [],
      extraFee: Math.max(0, Math.round(Number(parsed.extraFee) || 0)),
      grandTotal: Math.max(0, Math.round(Number(parsed.grandTotal) || 0)),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Gagal memindai struk: ${err.message}`
            : 'Gagal memindai struk dengan AI.',
      },
      { status: 500 }
    );
  }
}
