// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_DEMO_SPACE, INITIAL_DEMO_MEMBERS, INITIAL_DEMO_PROFILES, DEFAULT_CATEGORIES, INITIAL_DEMO_TRANSACTIONS, DEMO_USER_A_ID } from '../src/lib/mockData';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => true,
  createClient: () => {
    const channel = { on: () => channel, subscribe: () => channel };
    return {
      rpc: mocks.rpc,
      auth: { getUser: mocks.getUser, onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
      channel: () => channel, removeChannel() {},
    };
  },
}));
import { KesflowProvider, useKesflow } from '../src/context/KesflowContext';
import { AddTransactionDrawer } from '../src/components/transactions/AddTransactionDrawer';

function snapshot() {
  return structuredClone({ space: INITIAL_DEMO_SPACE, members: INITIAL_DEMO_MEMBERS, profiles: INITIAL_DEMO_PROFILES,
    categories: DEFAULT_CATEGORIES, transactions: INITIAL_DEMO_TRANSACTIONS, events: [], settlements: [], activityLogs: [], quickPresets: [] });
}
let current: ReturnType<typeof useKesflow>;
const loadingHistory: boolean[] = [];
function Consumer() {
  current = useKesflow();
  loadingHistory.push(current.isLoading);
  return createElement(AddTransactionDrawer, { isOpen: !current.isLoading, onClose: () => {} });
}
let root: Root;
describe('background refresh', () => {
  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    mocks.getUser.mockResolvedValue({ data: { user: { id: DEMO_USER_A_ID } }, error: null });
    mocks.rpc.mockResolvedValue({ data: snapshot(), error: null });
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => { root.render(createElement(KesflowProvider, null, createElement(Consumer))); });
    loadingHistory.length = 0;
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });
  it('preserves the typed draft when category/event objects are refreshed', async () => {
    const input = document.querySelector<HTMLInputElement>('input[placeholder="Contoh: Makan Malam Ramen / Bioskop"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Draft dinner');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    mocks.rpc.mockResolvedValue({ data: snapshot(), error: null });
    await act(async () => { await current.refreshData(); });
    expect(input.value).toBe('Draft dinner');
    expect(loadingHistory).not.toContain(true);
  });
  it('retains the last valid financial snapshot on a failed query', async () => {
    const before = current.balance.netBalanceForA;
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'Network unavailable' } });
    await act(async () => { await current.refreshData(); });
    expect(current.balance.netBalanceForA).toBe(before);
    expect(current.transactions.length).toBe(INITIAL_DEMO_TRANSACTIONS.length);
    expect(current.error).toContain('Network');
  });
  it('ignores an older request that completes after a newer snapshot', async () => {
    let resolveOld!: (value: unknown) => void;
    mocks.rpc.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    let oldRequest!: Promise<void>;
    await act(async () => { oldRequest = current.refreshData(); await Promise.resolve(); });
    const newer = snapshot();
    newer.transactions = [];
    mocks.rpc.mockResolvedValueOnce({ data: newer, error: null });
    await act(async () => { await current.refreshData(); });
    await act(async () => { resolveOld({ data: snapshot(), error: null }); await oldRequest; });
    expect(current.transactions).toEqual([]);
  });
});
