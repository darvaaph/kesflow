import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function worker() {
  type Event = { request: { method: string; url: string }; respondWith: (promise: unknown) => void };
  const listeners: Record<string, (event: Event) => void> = {};
  const fetch = vi.fn(async () => ({ ok: true, redirected: false, clone: () => ({}) }));
  const cache = { match: vi.fn(async () => undefined), put: vi.fn(async () => undefined) };
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kesflow.test' }, addEventListener: (name: string, handler: (event: Event) => void) => { listeners[name] = handler; } },
    URL, fetch, caches: { open: async () => cache },
  });
  return { listeners, fetch, cache };
}
describe('public-only service worker cache', () => {
  it.each(['/auth/callback?code=secret', '/api/push/subscribe', '/', 'https://project.supabase.co/rest/v1/transactions'])('does not intercept private GET %s', (path) => {
    const { listeners, cache } = worker();
    const respondWith = vi.fn();
    listeners.fetch({ request: { method: 'GET', url: new URL(path, 'https://kesflow.test').href }, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
  });
  it('still caches public static assets', async () => {
    const { listeners, cache } = worker();
    let pending: unknown;
    listeners.fetch({ request: { method: 'GET', url: 'https://kesflow.test/_next/static/chunk.js' }, respondWith: (promise) => { pending = promise; } });
    await pending;
    expect(cache.put).toHaveBeenCalledOnce();
  });
});
