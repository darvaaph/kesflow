import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Cek apakah user sudah punya Space
        const { data: memberRows } = await supabase
          .from('space_members')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        const target =
          memberRows && memberRows.length > 0 ? next : '/onboarding';
        return NextResponse.redirect(`${origin}${target}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect ke halaman login dengan query error jika autentikasi gagal
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}

