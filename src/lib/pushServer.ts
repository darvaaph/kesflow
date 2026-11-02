import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from './supabase/server';
import type { Database } from '@/types/database.types';

export async function requireSpaceMember(spaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Silakan login terlebih dahulu.');
  const { data, error: memberError } = await supabase.from('space_members')
    .select('id').eq('space_id', spaceId).eq('user_id', user.id).single();
  if (memberError || !data) throw new Error('Kamu bukan anggota ruang ini.');
  return { supabase, user };
}

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      (url.hostname === 'fcm.googleapis.com' || url.hostname === 'updates.push.services.mozilla.com' ||
       url.hostname.endsWith('.push.services.mozilla.com') || url.hostname === 'web.push.apple.com' ||
       url.hostname.endsWith('.notify.windows.com'));
  } catch { return false; }
}

export function createPushAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server notifikasi belum dikonfigurasi.');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
