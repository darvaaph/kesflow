import { NextResponse } from 'next/server';
import { requireSpaceMember, isAllowedPushEndpoint } from '@/lib/pushServer';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { spaceId, subscription, userAgent } = await request.json();
    if (typeof spaceId !== 'string' || typeof subscription?.endpoint !== 'string' ||
        !isAllowedPushEndpoint(subscription.endpoint) ||
        typeof subscription.keys?.p256dh !== 'string' || typeof subscription.keys?.auth !== 'string' ||
        !/^[A-Za-z0-9_-]{87,88}$/.test(subscription.keys.p256dh) ||
        !/^[A-Za-z0-9_-]{22,24}$/.test(subscription.keys.auth)) {
      return NextResponse.json({ error: 'Data langganan tidak valid.' }, { status: 400 });
    }
    const { supabase, user } = await requireSpaceMember(spaceId);
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server notifikasi belum dikonfigurasi.' }, { status: 503 });
    }
    const { error } = await supabase.from('push_subscriptions').upsert({
      space_id: spaceId, user_id: user.id, endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh, auth: subscription.keys.auth,
      user_agent: typeof userAgent === 'string' ? userAgent.slice(0, 500) : null,
    }, { onConflict: 'endpoint' });
    if (error) throw new Error('Gagal menyimpan langganan notifikasi.');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Request tidak valid.' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Silakan login.' }, { status: 401 });
  const endpoint = new URL(request.url).searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ subscribed: false });
  const { data, error } = await supabase.from('push_subscriptions').select('id')
    .eq('user_id', user.id).eq('endpoint', endpoint).maybeSingle();
  if (error) return NextResponse.json({ error: 'Gagal memeriksa langganan.' }, { status: 503 });
  return NextResponse.json({ subscribed: Boolean(data) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Silakan login.' }, { status: 401 });
    if (typeof endpoint !== 'string') return NextResponse.json({ error: 'Endpoint tidak valid.' }, { status: 400 });
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus langganan.' }, { status: 500 });
  }
}
