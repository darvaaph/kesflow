import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createPushAdminClient, isAllowedPushEndpoint, requireSpaceMember } from '@/lib/pushServer';

export async function POST(request: Request) {
  try {
    const { spaceId, title, body, includeSelf = false } = await request.json();
    if (typeof spaceId !== 'string' || typeof title !== 'string' || typeof body !== 'string' ||
        !title.trim() || !body.trim() || title.length > 200 || body.length > 1000) {
      return NextResponse.json({ error: 'Parameter notifikasi tidak valid.' }, { status: 400 });
    }
    const { user } = await requireSpaceMember(spaceId);
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return NextResponse.json({ error: 'Notifikasi belum dikonfigurasi.' }, { status: 503 });
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@kesflow.app', publicKey, privateKey);
    // Service access is restricted to a room whose membership was verified above.
    const admin = createPushAdminClient();
    let query = admin.from('push_subscriptions').select('*').eq('space_id', spaceId);
    query = includeSelf === true ? query.eq('user_id', user.id) : query.neq('user_id', user.id);
    const { data: subs, error } = await query;
    if (error) throw new Error('Gagal membaca langganan.');
    let sent = 0;
    await Promise.all((subs ?? []).map(async (sub) => {
      if (!isAllowedPushEndpoint(sub.endpoint)) return;
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url: '/' }), { timeout: 10000 });
        sent++;
      } catch (error) {
        if ([404, 410].includes((error as { statusCode?: number }).statusCode ?? 0)) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }));
    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal mengirim notifikasi.' }, { status: 400 });
  }
}
