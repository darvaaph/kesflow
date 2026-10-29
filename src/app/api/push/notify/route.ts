import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const FALLBACK_PUBLIC_VAPID =
  'BJlHq_dp6__mAMAAa1MKDsQG937EdtJDXktBlYTCUgV-bfydS2OMl2ZYFiAqkpcIqrSJQeITxkiMT_LJzWYX1wM';
const FALLBACK_PRIVATE_VAPID =
  '5BCSaQPgRVzAW_juJmmqzXfCBNgt4ra_LdxQ1BFqYAc';

interface NotifyRequestBody {
  spaceId: string;
  actorId: string;
  title: string;
  body: string;
  url?: string;
  includeSelf?: boolean;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as NotifyRequestBody;
    const { spaceId, actorId, title, body, url = '/', includeSelf = false } = payload;

    if (!spaceId || !title || !body) {
      return NextResponse.json(
        { error: 'Parameter notifikasi tidak lengkap.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      return NextResponse.json({ ok: true, sent: 0, mode: 'mock' });
    }

    const publicKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_PUBLIC_VAPID;
    const privateKey =
      process.env.VAPID_PRIVATE_KEY || FALLBACK_PRIVATE_VAPID;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@kesflow.app';

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const supabase = createServerSupabaseClient();
    let query = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('space_id', spaceId);

    if (!includeSelf && actorId) {
      query = query.neq('user_id', actorId);
    }

    const { data: subs, error } = await query;
    if (error || !subs || subs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const notificationJson = JSON.stringify({ title, body, url });
    let sentCount = 0;

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationJson
          );
          sentCount += 1;
        } catch (pushErr) {
          const statusCode = (pushErr as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      })
    );

    return NextResponse.json({ ok: true, sent: sentCount });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Gagal mengirim push notification.',
      },
      { status: 500 }
    );
  }
}
