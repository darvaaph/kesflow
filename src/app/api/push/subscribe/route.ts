import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface SubscribeRequestBody {
  spaceId: string;
  userId: string;
  subscription: {
    endpoint: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
  userAgent?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscribeRequestBody;
    const { spaceId, userId, subscription, userAgent } = body;

    if (
      !spaceId ||
      !userId ||
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return NextResponse.json(
        { error: 'Data langganan notifikasi tidak lengkap.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      return NextResponse.json({ ok: true, mode: 'mock' });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        space_id: spaceId,
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent ?? null,
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Gagal menyimpan langganan notifikasi.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = (await request.json()) as { endpoint?: string };
    if (!endpoint) {
      return NextResponse.json({ ok: true });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      return NextResponse.json({ ok: true, mode: 'mock' });
    }

    const supabase = createServerSupabaseClient();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
