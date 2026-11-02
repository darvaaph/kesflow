import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), requireSpaceMember: vi.fn() }));
vi.mock('@/lib/pushServer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/pushServer')>();
  return { ...actual, requireSpaceMember: mocks.requireSpaceMember };
});
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn() }));
import { POST } from '../src/app/api/push/subscribe/route';
import { isAllowedPushEndpoint } from '../src/lib/pushServer';

describe('push trust boundaries', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.requireSpaceMember.mockResolvedValue({ user: { id: 'authenticated-user' }, supabase: { from: () => ({ upsert: mocks.upsert }) } });
  });
  const payload = {
    spaceId: 'room', userId: 'forged-user',
    subscription: { endpoint: 'https://fcm.googleapis.com/push/test', keys: { p256dh: 'A'.repeat(87), auth: 'A'.repeat(22) } },
  };
  it('stores the authenticated user rather than the supplied identity', async () => {
    vi.stubEnv('VAPID_PRIVATE_KEY', 'test');
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'test');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test');
    const response = await POST(new Request('https://kesflow.test/api/push/subscribe', { method: 'POST', body: JSON.stringify(payload) }));
    expect(response.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'authenticated-user' }), expect.anything());
  });
  it('does not claim success when server push is not configured', async () => {
    vi.stubEnv('VAPID_PRIVATE_KEY', '');
    const response = await POST(new Request('https://kesflow.test/api/push/subscribe', { method: 'POST', body: JSON.stringify(payload) }));
    expect(response.status).toBe(503);
  });
  it.each(['http://localhost/push', 'https://fcm.googleapis.com.evil.test/push', 'https://user@fcm.googleapis.com/push', 'https://127.0.0.1/push'])('rejects untrusted push destinations: %s', (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(false);
  });
});
