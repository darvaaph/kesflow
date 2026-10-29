import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function createTransitionHtml(targetUrl: string, title = 'Menyiapkan Ruang Kencan...', subtitle = 'Menghubungkan akun Google kamu ✨') {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta http-equiv="refresh" content="2;url=${targetUrl}">
  <style>
    :root {
      --bg: #faf9f6;
      --card: #ffffff;
      --text: #1c1917;
      --muted: #78716c;
      --border: #e7e5e4;
      --coral: #f97316;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #141210;
        --card: #1c1917;
        --text: #f5f5f4;
        --muted: #a8a29e;
        --border: #292524;
        --coral: #fb923c;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      text-align: center;
      user-select: none;
      -webkit-font-smoothing: antialiased;
    }
    .heart-box {
      width: 72px;
      height: 72px;
      border-radius: 24px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
      box-shadow: 0 12px 28px -4px rgba(234, 88, 12, 0.45);
      animation: heartbeat 1.3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    .heart-svg {
      width: 36px;
      height: 36px;
      fill: #ffffff;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.35rem;
    }
    p {
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 1.5rem;
    }
    .progress-bar {
      width: 140px;
      height: 4px;
      border-radius: 99px;
      background: var(--border);
      overflow: hidden;
      position: relative;
    }
    .progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 50%;
      background: linear-gradient(90deg, #f97316, #fb923c);
      border-radius: 99px;
      animation: shimmer 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(250%); }
    }
  </style>
</head>
<body>
  <div class="heart-box">
    <svg class="heart-svg" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  </div>
  <h1>${title}</h1>
  <p>${subtitle}</p>
  <div class="progress-bar"></div>
  <script>
    setTimeout(function() {
      window.location.replace("${targetUrl}");
    }, 450);
  </script>
</body>
</html>`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Pastikan origin menggunakan domain asli di Vercel/reverse proxy
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const baseOrigin = isLocalEnv
    ? origin
    : forwardedHost
    ? `https://${forwardedHost}`
    : origin;

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let target = next;
      if (user) {
        // Cek apakah user sudah punya Space
        const { data: memberRows } = await supabase
          .from('space_members')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        target = memberRows && memberRows.length > 0 ? next : '/onboarding';
      }

      const fullTarget = `${baseOrigin}${target}`;
      return new NextResponse(createTransitionHtml(fullTarget), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
  }

  // Redirect ke halaman login dengan query error jika autentikasi gagal
  const failTarget = `${baseOrigin}/login?error=auth-failed`;
  return new NextResponse(
    createTransitionHtml(
      failTarget,
      'Gagal Menghubungkan',
      'Mengalihkan kembali ke halaman login...'
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  );
}
