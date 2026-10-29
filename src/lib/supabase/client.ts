import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

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

  return createBrowserClient<Database>(
    url,
    key
  ) as unknown as SupabaseClient<Database>;
}
