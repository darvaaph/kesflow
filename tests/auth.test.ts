import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const auth = vi.hoisted(() => ({
  getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
  exchangeCodeForSession: vi.fn(async () => ({ error: null })),
}));
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth }) }));
vi.mock('@/lib/supabase/client', () => ({ isSupabaseConfigured: () => true, SESSION_COOKIE_MAX_AGE: 2592000 }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({ auth }) }));
import { updateSession } from '../src/lib/supabase/middleware';
import { GET } from '../src/app/auth/callback/route';

describe('authentication boundaries', () => {
  beforeEach(() => vi.clearAllMocks());
  it.each(['/auth/callback?code=test', '/sw.js'])('allows public authentication resources: %s', async (path) => {
    const response = await updateSession(new NextRequest(`https://kesflow.test${path}`));
    expect(response.headers.get('location')).toBeNull();
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it('returns JSON 401 for an unauthenticated API request', async () => {
    const response = await updateSession(new NextRequest('https://kesflow.test/api/push/notify'));
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
  });
  it.each(['//evil.test', '/\t/evil.test', '/\\evil.test', '/</script><script>alert(1)</script>'])('rejects unsafe callback target: %s', async (next) => {
    const response = await GET(new Request(`https://kesflow.test/auth/callback?code=test&next=${encodeURIComponent(next)}`));
    expect(response.headers.get('location')).toBe('https://kesflow.test/');
    expect(await response.text()).not.toContain('<script>');
  });
  it('preserves a legitimate internal callback path and exchanges the code', async () => {
    const response = await GET(new Request('https://kesflow.test/auth/callback?code=test&next=/settings'));
    expect(response.headers.get('location')).toBe('https://kesflow.test/settings');
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('test');
  });
});
