import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Durasi persistensi sesi di HP / browser: 30 hari dalam detik
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const mockFlag = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE;

  if (mockFlag === 'true') return false;
  if (!url || !key) return false;
  if (
    url.includes('your-project.supabase.co') ||
    key.includes('your-anon-key-here')
  ) {
    return false;
  }
  return true;
}

export function createClient(): SupabaseClient<Database> {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createBrowserClient<Database>(url, key, {
    cookieOptions: {
      maxAge: SESSION_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    },
  }) as unknown as SupabaseClient<Database>;
}
