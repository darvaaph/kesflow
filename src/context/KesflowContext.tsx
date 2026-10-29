'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityLogItem,
  Category,
  DateEvent,
  NewTransactionInput,
  Profile,
  QuickPresetInput,
  QuickPresetItem,
  RunningBalanceResult,
  Settlement,
  Space,
  SpaceMember,
  SplitType,
  Transaction,
} from '@/types';
import {
  DEFAULT_CATEGORIES,
  DEMO_SPACE_ID,
  DEMO_USER_A_ID,
  DEMO_USER_B_ID,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_DEMO_EVENTS,
  INITIAL_DEMO_MEMBERS,
  INITIAL_DEMO_PROFILES,
  INITIAL_DEMO_SETTLEMENTS,
  INITIAL_DEMO_SPACE,
  INITIAL_DEMO_TRANSACTIONS,
  QUICK_PRESETS,
} from '@/lib/mockData';
import {
  BalanceBreakdown,
  calculateBalanceBreakdown,
  calculateRunningBalance,
  computeTransactionShares,
} from '@/lib/balance';
import { formatRupiah } from '@/lib/format';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { generateInviteCode } from '@/lib/utils';

const SPLIT_LABELS: Record<SplitType, string> = {
  EQUAL_50_50: 'Split 50:50',
  FULL_TREAT: 'Treat 100%',
  FULL_OWE: 'Talangin Semua',
  CUSTOM: 'Custom',
};

interface KesflowStateStorage {
  space: Space | null;
  members: SpaceMember[];
  profiles: Profile[];
  categories: Category[];
  events: DateEvent[];
  transactions: Transaction[];
  settlements: Settlement[];
  activityLogs: ActivityLogItem[];
  quickPresets?: QuickPresetItem[];
}

interface KesflowContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isMockMode: boolean;
  isRealtimeConnected: boolean;
  currentUser: Profile | null;
  partnerUser: Profile | null;
  userAId: string;
  userBId: string;
  space: Space | null;
  members: SpaceMember[];
  profiles: Profile[];
  categories: Category[];
  events: DateEvent[];
  transactions: Transaction[];
  settlements: Settlement[];
  activityLogs: ActivityLogItem[];
  quickPresets: QuickPresetItem[];
  balance: RunningBalanceResult;
  netBalanceForCurrentUser: number;
  balanceBreakdownForA: BalanceBreakdown;
  // Actions
  loginWithEmailOrPin: (
    email: string,
    displayName?: string,
    pin?: string
  ) => Promise<{ isInstantLogin: boolean }>;
  loginWithGoogle: () => Promise<void>;
  loginAsAccount: (userId: string) => void;
  logout: () => Promise<void>;
  switchDemoActiveUser: (userId: string) => void;
  createCoupleSpace: (
    spaceName: string,
    nickname: string
  ) => Promise<{ inviteCode: string }>;
  joinCoupleSpace: (inviteCode: string, nickname: string) => Promise<void>;
  updateNickname: (newNickname: string) => Promise<void>;
  addTransaction: (input: NewTransactionInput) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    input: NewTransactionInput
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  settleUpBalance: (
    notes?: string,
    customAmount?: number
  ) => Promise<Settlement | null>;
  addDateEvent: (title: string, startDate: string) => Promise<DateEvent>;
  toggleEventActive: (eventId: string) => Promise<void>;
  deleteDateEvent: (eventId: string) => Promise<void>;
  addQuickPreset: (input: QuickPresetInput) => Promise<QuickPresetItem>;
  updateQuickPreset: (
    id: string,
    input: QuickPresetInput
  ) => Promise<QuickPresetItem>;
  deleteQuickPreset: (id: string) => Promise<void>;
  resetQuickPresets: () => Promise<void>;
  clearSpaceTransactions: () => Promise<void>;
  leaveCoupleSpace: () => Promise<void>;
  resetDemoData: () => void;
  clearError: () => void;
}

const STORAGE_KEY = 'kesflow_app_state_v3';
const ACTIVE_USER_KEY = 'kesflow_active_user_id_v2';
const AUTH_SESSION_KEY = 'kesflow_logged_in_v2';
const CHANNEL_NAME = 'kesflow_realtime_channel_v2';

const KesflowContext = createContext<KesflowContextValue | undefined>(undefined);

function getInitialStorage(isMock: boolean = true): KesflowStateStorage {
  if (!isMock) {
    return {
      space: null,
      members: [],
      profiles: [],
      categories: DEFAULT_CATEGORIES,
      events: [],
      transactions: [],
      settlements: [],
      activityLogs: [],
      quickPresets: QUICK_PRESETS,
    };
  }
  return {
    space: INITIAL_DEMO_SPACE,
    members: INITIAL_DEMO_MEMBERS,
    profiles: INITIAL_DEMO_PROFILES,
    categories: DEFAULT_CATEGORIES,
    events: INITIAL_DEMO_EVENTS,
    transactions: INITIAL_DEMO_TRANSACTIONS,
    settlements: INITIAL_DEMO_SETTLEMENTS,
    activityLogs: INITIAL_ACTIVITY_LOGS,
    quickPresets: QUICK_PRESETS,
  };
}

export function KesflowProvider({ children }: { children: React.ReactNode }) {
  const isMockMode = !isSupabaseConfigured();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  const [activeUserId, setActiveUserId] = useState<string>(DEMO_USER_A_ID);
  const [state, setState] = useState<KesflowStateStorage>(() =>
    getInitialStorage(isMockMode)
  );

  const broadcastLocalState = useCallback((nextState: KesflowStateStorage) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        bc.postMessage({ type: 'STATE_UPDATED', payload: nextState });
        bc.close();
      }
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const fetchSupabaseData = useCallback(async () => {
    if (isMockMode) return;
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setState({
          space: null,
          members: [],
          profiles: [],
          categories: DEFAULT_CATEGORIES,
          events: [],
          transactions: [],
          settlements: [],
          activityLogs: [],
        });
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setActiveUserId(user.id);

      const { data: myMemberRows } = await supabase
        .from('space_members')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      const myMember = myMemberRows?.[0];
      if (!myMember) {
        const { data: ownProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setState({
          space: null,
          members: [],
          profiles: ownProfile ? [ownProfile] : [],
          categories: DEFAULT_CATEGORIES,
          events: [],
          transactions: [],
          settlements: [],
          activityLogs: [],
        });
        setIsLoading(false);
        return;
      }

      const spaceId = myMember.space_id;
      const [
        spaceRes,
        membersRes,
        categoriesRes,
        eventsRes,
        txRes,
        settlementsRes,
        presetsRes,
      ] = await Promise.all([
        supabase.from('spaces').select('*').eq('id', spaceId).single(),
        supabase
          .from('space_members')
          .select('*')
          .eq('space_id', spaceId)
          .order('joined_at', { ascending: true }),
        supabase.from('categories').select('*'),
        supabase
          .from('events')
          .select('*')
          .eq('space_id', spaceId)
          .order('start_date', { ascending: false }),
        supabase
          .from('transactions')
          .select('*')
          .eq('space_id', spaceId)
          .order('spent_at', { ascending: false }),
        supabase
          .from('settlements')
          .select('*')
          .eq('space_id', spaceId)
          .order('settled_at', { ascending: false }),
        supabase
          .from('quick_presets')
          .select('*')
          .eq('space_id', spaceId)
          .order('created_at', { ascending: true }),
      ]);

      const memberUserIds = (membersRes.data ?? []).map((m) => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberUserIds.length > 0 ? memberUserIds : [user.id]);

      setState((prev) => ({
        space: spaceRes.data ?? null,
        members: membersRes.data ?? [],
        profiles: profilesData ?? [],
        categories:
          categoriesRes.data && categoriesRes.data.length > 0
            ? categoriesRes.data
            : DEFAULT_CATEGORIES,
        events: eventsRes.data ?? [],
        transactions: txRes.data ?? [],
        settlements: settlementsRes.data ?? [],
        activityLogs: (prev.activityLogs ?? []).filter(
          (l) => l.space_id === spaceId
        ),
        quickPresets:
          presetsRes.data && presetsRes.data.length > 0
            ? presetsRes.data.map(
                (r: {
                  id: string;
                  space_id?: string;
                  label: string;
                  amount: number | string;
                  category_name?: string;
                  icon_name?: string;
                }) => ({
                  id: r.id,
                  space_id: r.space_id,
                  label: r.label,
                  amount: Number(r.amount),
                  categoryName: r.category_name || 'Transport & Parkir',
                  iconName: r.icon_name || 'Zap',
                })
              )
            : prev.quickPresets ?? QUICK_PRESETS,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat data dari server Supabase.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [isMockMode]);

  useEffect(() => {
    if (isMockMode) {
      try {
        const savedUser = localStorage.getItem(ACTIVE_USER_KEY);
        const savedAuth = localStorage.getItem(AUTH_SESSION_KEY);
        if (savedUser) {
          setActiveUserId(savedUser);
        }
        if (savedAuth === 'false') {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as KesflowStateStorage;
          setState({
            ...parsed,
            activityLogs: parsed.activityLogs ?? INITIAL_ACTIVITY_LOGS,
          });
        } else {
          const initial = getInitialStorage();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
          setState(initial);
        }
      } catch {
        setState(getInitialStorage());
      }
      setIsRealtimeConnected(true);
      setIsLoading(false);

      const handleStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            setState(JSON.parse(e.newValue) as KesflowStateStorage);
          } catch {
            // Ignore malformed JSON
          }
        }
      };

      window.addEventListener('storage', handleStorage);
      let bc: BroadcastChannel | null = null;
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'STATE_UPDATED' && ev.data.payload) {
            setState(ev.data.payload as KesflowStateStorage);
          }
        };
      }

      return () => {
        window.removeEventListener('storage', handleStorage);
        if (bc) bc.close();
      };
    } else {
      fetchSupabaseData();

      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED'
        ) {
          fetchSupabaseData();
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setActiveUserId('');
          setState({
            space: null,
            members: [],
            profiles: [],
            categories: DEFAULT_CATEGORIES,
            events: [],
            transactions: [],
            settlements: [],
            activityLogs: [],
            quickPresets: QUICK_PRESETS,
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isMockMode, fetchSupabaseData]);

  useEffect(() => {
    if (isMockMode || !state.space?.id) return;

    const supabase = createClient();
    const spaceId = state.space.id;

    const channel = supabase
      .channel(`space-${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `space_id=eq.${spaceId}`,
        },
        () => {
          fetchSupabaseData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'settlements',
          filter: `space_id=eq.${spaceId}`,
        },
        () => {
          fetchSupabaseData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quick_presets',
          filter: `space_id=eq.${spaceId}`,
        },
        () => {
          fetchSupabaseData();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMockMode, state.space?.id, fetchSupabaseData]);

  const { userAId, userBId } = useMemo(() => {
    const firstMember = state.members[0]?.user_id || DEMO_USER_A_ID;
    const secondMember = state.members[1]?.user_id || DEMO_USER_B_ID;
    return {
      userAId: firstMember,
      userBId: secondMember,
    };
  }, [state.members]);

  const currentUser = useMemo<Profile | null>(() => {
    const found = state.profiles.find((p) => p.id === activeUserId);
    if (found) return found;
    return state.profiles[0] ?? null;
  }, [state.profiles, activeUserId]);

  const partnerUser = useMemo<Profile | null>(() => {
    if (!state.space || state.members.length < 2) return null;
    const found = state.profiles.find(
      (p) => p.id !== (currentUser?.id ?? activeUserId)
    );
    return found ?? null;
  }, [state.space, state.members.length, state.profiles, currentUser, activeUserId]);

  const balance = useMemo<RunningBalanceResult>(() => {
    return calculateRunningBalance(
      userAId,
      userBId,
      state.transactions,
      state.settlements
    );
  }, [userAId, userBId, state.transactions, state.settlements]);

  const balanceBreakdownForA = useMemo<BalanceBreakdown>(() => {
    return calculateBalanceBreakdown(
      userAId,
      userBId,
      state.transactions,
      state.settlements
    );
  }, [userAId, userBId, state.transactions, state.settlements]);

  const netBalanceForCurrentUser = useMemo<number>(() => {
    const activeId = currentUser?.id ?? activeUserId;
    if (activeId === userAId) {
      return balance.netBalanceForA;
    }
    return -balance.netBalanceForA;
  }, [balance.netBalanceForA, currentUser, activeUserId, userAId]);

  const switchDemoActiveUser = useCallback((userId: string) => {
    setActiveUserId(userId);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_USER_KEY, userId);
      localStorage.setItem(AUTH_SESSION_KEY, 'true');
    }
  }, []);

  const loginAsAccount = useCallback(
    (userId: string) => {
      switchDemoActiveUser(userId);
    },
    [switchDemoActiveUser]
  );

  const loginWithEmailOrPin = useCallback(
    async (
      email: string,
      displayName?: string,
      pin?: string
    ): Promise<{ isInstantLogin: boolean }> => {
      setError(null);
      if (isMockMode) {
        const cleanEmail = email.trim().toLowerCase();
        // Cek apakah email cocok dengan Nadin atau Raka
        const existingProfile = state.profiles.find(
          (p) =>
            p.email.toLowerCase() === cleanEmail ||
            p.display_name.toLowerCase() === displayName?.trim().toLowerCase()
        );

        if (existingProfile) {
          switchDemoActiveUser(existingProfile.id);
          return { isInstantLogin: true };
        }

        const name =
          displayName?.trim() ||
          cleanEmail.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, ' ') ||
          'Raka';
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

        const updatedProfiles = state.profiles.map((p, idx) =>
          idx === 0
            ? { ...p, email: cleanEmail, display_name: formattedName }
            : p
        );
        const updatedMembers = state.members.map((m, idx) =>
          idx === 0 ? { ...m, nickname: formattedName } : m
        );
        const nextState: KesflowStateStorage = {
          ...state,
          profiles:
            updatedProfiles.length > 0
              ? updatedProfiles
              : INITIAL_DEMO_PROFILES,
          members:
            updatedMembers.length > 0 ? updatedMembers : INITIAL_DEMO_MEMBERS,
        };
        setState(nextState);
        broadcastLocalState(nextState);
        switchDemoActiveUser(DEMO_USER_A_ID);
        return { isInstantLogin: true };
      }

      const supabase = createClient();
      const cleanEmail = email.trim();

      // Jika menggunakan PIN / Password (minimal 4 karakter)
      if (pin && pin.trim().length >= 4) {
        const cleanPin = pin.trim();
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPin,
        });

        if (signInErr) {
          // Jika belum terdaftar, otomatis buatkan akun baru
          const { data: signUpData, error: signUpErr } =
            await supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPin,
              options: {
                data: {
                  full_name: displayName || cleanEmail.split('@')[0],
                },
              },
            });

          if (signUpErr) {
            throw new Error(signUpErr.message);
          }

          if (signUpData.session) {
            await fetchSupabaseData();
            return { isInstantLogin: true };
          }
        } else {
          await fetchSupabaseData();
          return { isInstantLogin: true };
        }
      }

      // Opsi OTP / Magic Link jika tanpa PIN
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          data: {
            full_name: displayName || cleanEmail.split('@')[0],
          },
        },
      });
      if (otpError) {
        throw new Error(otpError.message);
      }
      return { isInstantLogin: false };
    },
    [
      isMockMode,
      state,
      broadcastLocalState,
      switchDemoActiveUser,
      fetchSupabaseData,
    ]
  );

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    if (isMockMode) {
      switchDemoActiveUser(DEMO_USER_A_ID);
      return;
    }

    const supabase = createClient();
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback';

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (oauthError) {
      throw new Error(oauthError.message);
    }
  }, [isMockMode, switchDemoActiveUser]);

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_SESSION_KEY, 'false');
    }
    if (!isMockMode) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
  }, [isMockMode]);

  const createCoupleSpace = useCallback(
    async (
      spaceName: string,
      nickname: string
    ): Promise<{ inviteCode: string }> => {
      setError(null);
      const inviteCode = generateInviteCode();
      const cleanSpaceName = spaceName.trim() || 'Date Kita';
      const cleanNickname =
        nickname.trim() || currentUser?.display_name || 'Raka';

      if (isMockMode) {
        const newSpace: Space = {
          id: `space-${Date.now()}`,
          name: cleanSpaceName,
          invite_code: inviteCode,
          created_by: currentUser?.id ?? DEMO_USER_A_ID,
          created_at: new Date().toISOString(),
        };
        const memberA: SpaceMember = {
          id: `mem-a-${Date.now()}`,
          space_id: newSpace.id,
          user_id: DEMO_USER_A_ID,
          nickname: cleanNickname,
          role: 'owner',
          joined_at: new Date().toISOString(),
        };
        const memberB: SpaceMember = {
          id: `mem-b-${Date.now()}`,
          space_id: newSpace.id,
          user_id: DEMO_USER_B_ID,
          nickname: partnerUser?.display_name || 'Nadin',
          role: 'member',
          joined_at: new Date(Date.now() + 1000).toISOString(),
        };
        const updatedProfiles = state.profiles.map((p) =>
          p.id === DEMO_USER_A_ID ? { ...p, display_name: cleanNickname } : p
        );
        const nextState: KesflowStateStorage = {
          ...state,
          space: newSpace,
          members: [memberA, memberB],
          profiles: updatedProfiles,
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return { inviteCode };
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Silakan masuk terlebih dahulu.');

      const { data: spaceData, error: spaceErr } = await supabase
        .from('spaces')
        .insert({
          name: cleanSpaceName,
          invite_code: inviteCode,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (spaceErr || !spaceData) {
        throw new Error(spaceErr?.message || 'Gagal bikin Space.');
      }

      const { error: memberErr } = await supabase.from('space_members').insert({
        space_id: spaceData.id,
        user_id: user.id,
        nickname: cleanNickname,
        role: 'owner',
      });

      if (memberErr) {
        throw new Error(memberErr.message);
      }

      // Sinkronkan juga ke profiles.display_name agar seragam di seluruh app
      await supabase
        .from('profiles')
        .update({ display_name: cleanNickname, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      await fetchSupabaseData();
      return { inviteCode };
    },
    [
      isMockMode,
      currentUser,
      partnerUser,
      state,
      broadcastLocalState,
      fetchSupabaseData,
    ]
  );

  const joinCoupleSpace = useCallback(
    async (inviteCode: string, nickname: string): Promise<void> => {
      setError(null);
      const normalizedCode = inviteCode.trim().toUpperCase();
      if (normalizedCode.length !== 6) {
        throw new Error('Kode undangan harus terdiri dari 6 karakter.');
      }

      const cleanNickname =
        nickname.trim() || partnerUser?.display_name || 'Nadin';

      if (isMockMode) {
        if (
          state.space &&
          state.space.invite_code.toUpperCase() !== normalizedCode
        ) {
          if (normalizedCode !== 'LOVE24' && normalizedCode !== 'KISS69') {
            throw new Error(
              `Kode "${normalizedCode}" tidak ditemukan. Gunakan kode Space pasanganmu (${state.space.invite_code}).`
            );
          }
        }
        if (state.members.length >= 2) {
          const isAlreadyMember = state.members.some(
            (m) => m.user_id === activeUserId
          );
          if (!isAlreadyMember) {
            throw new Error(
              'Space ini sudah penuh (maksimal 2 anggota untuk pasangan).'
            );
          }
        }

        const updatedMembers = state.members.map((m) =>
          m.user_id === activeUserId ? { ...m, nickname: cleanNickname } : m
        );
        const updatedProfiles = state.profiles.map((p) =>
          p.id === activeUserId ? { ...p, display_name: cleanNickname } : p
        );
        const nextState: KesflowStateStorage = {
          ...state,
          members: updatedMembers,
          profiles: updatedProfiles,
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Silakan masuk terlebih dahulu.');

      const { data: targetSpace, error: findErr } = await supabase
        .from('spaces')
        .select('*')
        .eq('invite_code', normalizedCode)
        .single();

      if (findErr || !targetSpace) {
        throw new Error('Kode undangan tidak ditemukan.');
      }

      const { count } = await supabase
        .from('space_members')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', targetSpace.id);

      if ((count ?? 0) >= 2) {
        throw new Error(
          'Space ini sudah penuh (maksimal 2 orang per Space).'
        );
      }

      const { error: joinErr } = await supabase.from('space_members').insert({
        space_id: targetSpace.id,
        user_id: user.id,
        nickname: cleanNickname,
        role: 'member',
      });

      if (joinErr) {
        throw new Error(joinErr.message);
      }

      // Sinkronkan juga ke profiles.display_name agar seragam di seluruh app
      await supabase
        .from('profiles')
        .update({ display_name: cleanNickname, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      await fetchSupabaseData();
    },
    [
      isMockMode,
      partnerUser,
      state,
      activeUserId,
      broadcastLocalState,
      fetchSupabaseData,
    ]
  );

  const getProfileName = useCallback(
    (userId: string) =>
      state.profiles.find((p) => p.id === userId)?.display_name || 'Pasangan',
    [state.profiles]
  );

  const addTransaction = useCallback(
    async (input: NewTransactionInput): Promise<Transaction> => {
      setError(null);
      if (input.amount <= 0) {
        throw new Error('Nominal pengeluaran harus lebih besar dari Rp 0.');
      }

      const shares = computeTransactionShares(
        input.amount,
        input.split_type,
        input.payer_id,
        userAId,
        input.user_a_share,
        input.user_b_share
      );

      if (
        input.split_type === 'CUSTOM' &&
        Math.round(shares.user_a_share + shares.user_b_share) !==
          Math.round(input.amount)
      ) {
        throw new Error(
          'Total pembagian kustom harus sama persis dengan nominal pengeluaran.'
        );
      }

      const spaceId = state.space?.id ?? DEMO_SPACE_ID;
      const nowIso = new Date().toISOString();
      const actorId = currentUser?.id ?? userAId;
      const actorName = currentUser?.display_name || 'Raka';
      const payerName = getProfileName(input.payer_id);

      if (isMockMode) {
        const newTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          space_id: spaceId,
          payer_id: input.payer_id,
          event_id: input.event_id ?? null,
          category_id: input.category_id,
          title: input.title.trim(),
          amount: Number(input.amount),
          split_type: input.split_type,
          user_a_share: shares.user_a_share,
          user_b_share: shares.user_b_share,
          receipt_url: input.receipt_url ?? null,
          notes: input.notes?.trim() || null,
          spent_at: input.spent_at || nowIso,
          created_at: nowIso,
        };

        const logItem: ActivityLogItem = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          space_id: spaceId,
          actor_id: actorId,
          actor_name: actorName,
          action_type: 'TX_CREATED',
          target_id: newTx.id,
          title: newTx.title,
          description: `Dicatat sebesar ${formatRupiah(newTx.amount)}, dibayar oleh ${payerName} (${SPLIT_LABELS[newTx.split_type]})`,
          amount: newTx.amount,
          created_at: nowIso,
        };

        const nextState: KesflowStateStorage = {
          ...state,
          transactions: [newTx, ...state.transactions],
          activityLogs: [logItem, ...(state.activityLogs ?? [])],
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return newTx;
      }

      const supabase = createClient();
      const { data, error: insertErr } = await supabase
        .from('transactions')
        .insert({
          space_id: spaceId,
          payer_id: input.payer_id,
          event_id: input.event_id ?? null,
          category_id: input.category_id,
          title: input.title.trim(),
          amount: Number(input.amount),
          split_type: input.split_type,
          user_a_share: shares.user_a_share,
          user_b_share: shares.user_b_share,
          receipt_url: input.receipt_url ?? null,
          notes: input.notes?.trim() || null,
          spent_at: input.spent_at || nowIso,
        })
        .select('*')
        .single();

      if (insertErr || !data) {
        throw new Error(insertErr?.message || 'Gagal menyimpan transaksi.');
      }

      await fetchSupabaseData();
      return data;
    },
    [
      userAId,
      state,
      currentUser,
      getProfileName,
      isMockMode,
      broadcastLocalState,
      fetchSupabaseData,
    ]
  );

  const updateTransaction = useCallback(
    async (id: string, input: NewTransactionInput): Promise<Transaction> => {
      setError(null);
      if (input.amount <= 0) {
        throw new Error('Nominal pengeluaran harus lebih besar dari Rp 0.');
      }

      const shares = computeTransactionShares(
        input.amount,
        input.split_type,
        input.payer_id,
        userAId,
        input.user_a_share,
        input.user_b_share
      );

      if (
        input.split_type === 'CUSTOM' &&
        Math.round(shares.user_a_share + shares.user_b_share) !==
          Math.round(input.amount)
      ) {
        throw new Error(
          'Total pembagian kustom harus sama persis dengan nominal pengeluaran.'
        );
      }

      const actorId = currentUser?.id ?? userAId;
      const actorName = currentUser?.display_name || 'Raka';
      const spaceId = state.space?.id ?? DEMO_SPACE_ID;
      const nowIso = new Date().toISOString();

      if (isMockMode) {
        const existing = state.transactions.find((t) => t.id === id);
        if (!existing) {
          throw new Error('Transaksi tidak ditemukan.');
        }

        const changes: string[] = [];
        const cleanTitle = input.title.trim();
        if (existing.title !== cleanTitle) {
          changes.push(`Judul: "${existing.title}" -> "${cleanTitle}"`);
        }
        if (Number(existing.amount) !== Number(input.amount)) {
          changes.push(
            `Nominal: ${formatRupiah(Number(existing.amount))} -> ${formatRupiah(Number(input.amount))}`
          );
        }
        if (existing.payer_id !== input.payer_id) {
          changes.push(
            `Pembayar: ${getProfileName(existing.payer_id)} -> ${getProfileName(input.payer_id)}`
          );
        }
        if (existing.split_type !== input.split_type) {
          changes.push(
            `Mode: ${SPLIT_LABELS[existing.split_type]} -> ${SPLIT_LABELS[input.split_type]}`
          );
        } else if (
          existing.split_type === 'CUSTOM' &&
          (Number(existing.user_a_share) !== shares.user_a_share ||
            Number(existing.user_b_share) !== shares.user_b_share)
        ) {
          changes.push(
            `Porsi: ${formatRupiah(shares.user_a_share)} / ${formatRupiah(shares.user_b_share)}`
          );
        }
        if ((existing.event_id ?? null) !== (input.event_id ?? null)) {
          const oldEvt =
            state.events.find((e) => e.id === existing.event_id)?.title ||
            'Tanpa Momen';
          const newEvt =
            state.events.find((e) => e.id === input.event_id)?.title ||
            'Tanpa Momen';
          changes.push(`Momen: ${oldEvt} -> ${newEvt}`);
        }
        if (existing.category_id !== input.category_id) {
          const oldCat =
            state.categories.find((c) => c.id === existing.category_id)?.name ||
            'Lainnya';
          const newCat =
            state.categories.find((c) => c.id === input.category_id)?.name ||
            'Lainnya';
          changes.push(`Kategori: ${oldCat} -> ${newCat}`);
        }

        const diffText =
          changes.length > 0
            ? `Diubah oleh ${actorName}: ${changes.join(' · ')}`
            : `Diperbarui oleh ${actorName} (${formatRupiah(Number(input.amount))})`;

        const updatedTx: Transaction = {
          ...existing,
          payer_id: input.payer_id,
          event_id: input.event_id ?? null,
          category_id: input.category_id,
          title: cleanTitle,
          amount: Number(input.amount),
          split_type: input.split_type,
          user_a_share: shares.user_a_share,
          user_b_share: shares.user_b_share,
          receipt_url:
            input.receipt_url !== undefined
              ? input.receipt_url
              : existing.receipt_url,
          notes: input.notes?.trim() || null,
          spent_at: input.spent_at || existing.spent_at,
        };

        const logItem: ActivityLogItem = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          space_id: spaceId,
          actor_id: actorId,
          actor_name: actorName,
          action_type: 'TX_UPDATED',
          target_id: updatedTx.id,
          title: updatedTx.title,
          description: diffText,
          amount: updatedTx.amount,
          created_at: nowIso,
        };

        const nextState: KesflowStateStorage = {
          ...state,
          transactions: state.transactions.map((t) =>
            t.id === id ? updatedTx : t
          ),
          activityLogs: [logItem, ...(state.activityLogs ?? [])],
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return updatedTx;
      }

      const supabase = createClient();
      const { data, error: updateErr } = await supabase
        .from('transactions')
        .update({
          payer_id: input.payer_id,
          event_id: input.event_id ?? null,
          category_id: input.category_id,
          title: input.title.trim(),
          amount: Number(input.amount),
          split_type: input.split_type,
          user_a_share: shares.user_a_share,
          user_b_share: shares.user_b_share,
          receipt_url: input.receipt_url ?? null,
          notes: input.notes?.trim() || null,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateErr || !data) {
        throw new Error(updateErr?.message || 'Gagal memperbarui transaksi.');
      }

      await fetchSupabaseData();
      return data;
    },
    [
      userAId,
      state,
      currentUser,
      getProfileName,
      isMockMode,
      broadcastLocalState,
      fetchSupabaseData,
    ]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      const actorId = currentUser?.id ?? userAId;
      const actorName = currentUser?.display_name || 'Raka';
      const spaceId = state.space?.id ?? DEMO_SPACE_ID;
      const nowIso = new Date().toISOString();

      if (isMockMode) {
        const targetTx = state.transactions.find((t) => t.id === id);
        const logItem: ActivityLogItem | null = targetTx
          ? {
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              space_id: spaceId,
              actor_id: actorId,
              actor_name: actorName,
              action_type: 'TX_DELETED',
              target_id: targetTx.id,
              title: targetTx.title,
              description: `Dihapus oleh ${actorName} (Nominal semula ${formatRupiah(Number(targetTx.amount))}, dibayar ${getProfileName(targetTx.payer_id)})`,
              amount: Number(targetTx.amount),
              created_at: nowIso,
            }
          : null;

        const nextState: KesflowStateStorage = {
          ...state,
          transactions: state.transactions.filter((t) => t.id !== id),
          activityLogs: logItem
            ? [logItem, ...(state.activityLogs ?? [])]
            : state.activityLogs ?? [],
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return;
      }

      const supabase = createClient();
      const { error: delErr } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (delErr) {
        throw new Error(delErr.message);
      }
      await fetchSupabaseData();
    },
    [
      isMockMode,
      state,
      currentUser,
      userAId,
      getProfileName,
      broadcastLocalState,
      fetchSupabaseData,
    ]
  );

  const settleUpBalance = useCallback(
    async (
      notes?: string,
      customAmount?: number
    ): Promise<Settlement | null> => {
      setError(null);
      const netA = balance.netBalanceForA;
      if (netA === 0) return null;

      const maxAmount = Math.abs(netA);
      const amount =
        customAmount !== undefined && customAmount > 0
          ? Math.min(Number(customAmount), maxAmount)
          : maxAmount;

      if (amount <= 0) {
        throw new Error('Nominal settle up harus lebih besar dari Rp 0.');
      }

      const fromUserId = netA > 0 ? userBId : userAId;
      const toUserId = netA > 0 ? userAId : userBId;
      const spaceId = state.space?.id ?? DEMO_SPACE_ID;
      const nowIso = new Date().toISOString();
      const isPartial = amount < maxAmount;
      const remaining = Math.max(0, maxAmount - amount);
      const defaultNote = isPartial
        ? 'Cicilan settle up saldo date'
        : 'Settle up penuh saldo date';
      const actorId = currentUser?.id ?? userAId;
      const actorName = currentUser?.display_name || 'Raka';
      const fromName = getProfileName(fromUserId);
      const toName = getProfileName(toUserId);

      if (isMockMode) {
        const newSettlement: Settlement = {
          id: `st-${Date.now()}`,
          space_id: spaceId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount,
          notes: notes?.trim() || defaultNote,
          settled_at: nowIso,
        };

        const logItem: ActivityLogItem = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          space_id: spaceId,
          actor_id: actorId,
          actor_name: actorName,
          action_type: 'SETTLEMENT_ADDED',
          target_id: newSettlement.id,
          title: isPartial
            ? `Cicilan Settle Up (${fromName} -> ${toName})`
            : `Settle Up Penuh (${fromName} -> ${toName})`,
          description: isPartial
            ? `${fromName} membayar cicilan ${formatRupiah(amount)} ke ${toName}. Sisa saldo: ${formatRupiah(remaining)}`
            : `${fromName} bayar penuh ${formatRupiah(amount)} ke ${toName}. Saldo kembali Rp 0`,
          amount,
          created_at: nowIso,
        };

        const nextState: KesflowStateStorage = {
          ...state,
          settlements: [newSettlement, ...state.settlements],
          activityLogs: [logItem, ...(state.activityLogs ?? [])],
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return newSettlement;
      }

      const supabase = createClient();
      const { data, error: stErr } = await supabase
        .from('settlements')
        .insert({
          space_id: spaceId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount,
          notes: notes?.trim() || defaultNote,
          settled_at: nowIso,
        })
        .select('*')
        .single();

      if (stErr || !data) {
        throw new Error(stErr?.message || 'Gagal mencatat settle up.');
      }

      await fetchSupabaseData();
      return data;
    },
    [
      balance.netBalanceForA,
      userAId,
      userBId,
      state,
      currentUser,
      getProfileName,
      isMockMode,
      broadcastLocalState,
      fetchSupabaseData,
    ]
  );

  const addDateEvent = useCallback(
    async (title: string, startDate: string): Promise<DateEvent> => {
      setError(null);
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        throw new Error('Nama momen wajib diisi.');
      }
      const spaceId = state.space?.id ?? DEMO_SPACE_ID;
      const nowIso = new Date().toISOString();

      if (isMockMode) {
        const newEvent: DateEvent = {
          id: `evt-${Date.now()}`,
          space_id: spaceId,
          title: cleanTitle,
          start_date: startDate || nowIso.slice(0, 10),
          is_active: false,
          created_at: nowIso,
        };
        const nextState: KesflowStateStorage = {
          ...state,
          events: [newEvent, ...state.events],
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return newEvent;
      }

      const supabase = createClient();
      const { data, error: evErr } = await supabase
        .from('events')
        .insert({
          space_id: spaceId,
          title: cleanTitle,
          start_date: startDate || nowIso.slice(0, 10),
          is_active: false,
        })
        .select('*')
        .single();

      if (evErr || !data) {
        throw new Error(evErr?.message || 'Gagal bikin momen.');
      }

      await fetchSupabaseData();
      return data;
    },
    [state, isMockMode, broadcastLocalState, fetchSupabaseData]
  );

  const toggleEventActive = useCallback(
    async (eventId: string): Promise<void> => {
      setError(null);
      if (isMockMode) {
        const target = state.events.find((e) => e.id === eventId);
        const nextActive = !target?.is_active;
        // Hanya 1 acara yang bisa "Sedang Berlangsung" pada satu waktu agar tidak membingungkan
        const nextState: KesflowStateStorage = {
          ...state,
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, is_active: nextActive }
              : { ...e, is_active: false }
          ),
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return;
      }

      const target = state.events.find((e) => e.id === eventId);
      if (!target) return;
      const supabase = createClient();
      await supabase
        .from('events')
        .update({ is_active: !target.is_active })
        .eq('id', eventId);
      await fetchSupabaseData();
    },
    [isMockMode, state, broadcastLocalState, fetchSupabaseData]
  );

  const deleteDateEvent = useCallback(
    async (eventId: string): Promise<void> => {
      setError(null);
      if (isMockMode) {
        const nextState: KesflowStateStorage = {
          ...state,
          events: state.events.filter((e) => e.id !== eventId),
          transactions: state.transactions.map((t) =>
            t.event_id === eventId ? { ...t, event_id: null } : t
          ),
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return;
      }

      const supabase = createClient();
      await supabase.from('events').delete().eq('id', eventId);
      await fetchSupabaseData();
    },
    [isMockMode, state, broadcastLocalState, fetchSupabaseData]
  );

  const addQuickPreset = useCallback(
    async (input: QuickPresetInput): Promise<QuickPresetItem> => {
      setError(null);
      const cleanLabel = input.label.trim();
      if (!cleanLabel) {
        throw new Error('Nama pintasan wajib diisi.');
      }
      if (input.amount <= 0) {
        throw new Error('Nominal pintasan harus lebih besar dari Rp 0.');
      }
      const spaceId = state.space?.id ?? DEMO_SPACE_ID;

      if (isMockMode) {
        const newPreset: QuickPresetItem = {
          id: `preset-${Date.now()}`,
          space_id: spaceId,
          label: cleanLabel,
          amount: Math.round(input.amount),
          categoryName: input.categoryName || 'Transport & Parkir',
          iconName: input.iconName || 'Zap',
        };
        const currentList = state.quickPresets ?? QUICK_PRESETS;
        const nextState: KesflowStateStorage = {
          ...state,
          quickPresets: [...currentList, newPreset],
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return newPreset;
      }

      const supabase = createClient();
      const { data, error: insertErr } = await supabase
        .from('quick_presets')
        .insert({
          space_id: spaceId,
          label: cleanLabel,
          amount: Math.round(input.amount),
          category_name: input.categoryName || 'Transport & Parkir',
          icon_name: input.iconName || 'Zap',
        })
        .select('*')
        .single();

      if (insertErr || !data) {
        throw new Error(insertErr?.message || 'Gagal menambahkan pintasan.');
      }

      const item: QuickPresetItem = {
        id: data.id,
        space_id: data.space_id,
        label: data.label,
        amount: Number(data.amount),
        categoryName: data.category_name || 'Transport & Parkir',
        iconName: data.icon_name || 'Zap',
      };
      await fetchSupabaseData();
      return item;
    },
    [isMockMode, state, broadcastLocalState, fetchSupabaseData]
  );

  const updateQuickPreset = useCallback(
    async (id: string, input: QuickPresetInput): Promise<QuickPresetItem> => {
      setError(null);
      const cleanLabel = input.label.trim();
      if (!cleanLabel) {
        throw new Error('Nama pintasan wajib diisi.');
      }
      if (input.amount <= 0) {
        throw new Error('Nominal pintasan harus lebih besar dari Rp 0.');
      }

      if (isMockMode) {
        const currentList = state.quickPresets ?? QUICK_PRESETS;
        const updatedList = currentList.map((p) =>
          p.id === id
            ? {
                ...p,
                label: cleanLabel,
                amount: Math.round(input.amount),
                categoryName: input.categoryName || p.categoryName,
                iconName: input.iconName || p.iconName,
              }
            : p
        );
        const nextState: KesflowStateStorage = {
          ...state,
          quickPresets: updatedList,
        };
        setState(nextState);
        broadcastLocalState(nextState);
        const item = updatedList.find((p) => p.id === id)!;
        return item;
      }

      const supabase = createClient();
      const { data, error: updateErr } = await supabase
        .from('quick_presets')
        .update({
          label: cleanLabel,
          amount: Math.round(input.amount),
          category_name: input.categoryName,
          icon_name: input.iconName,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateErr || !data) {
        throw new Error(updateErr?.message || 'Gagal mengubah pintasan.');
      }

      const item: QuickPresetItem = {
        id: data.id,
        space_id: data.space_id,
        label: data.label,
        amount: Number(data.amount),
        categoryName: data.category_name,
        iconName: data.icon_name,
      };
      await fetchSupabaseData();
      return item;
    },
    [isMockMode, state, broadcastLocalState, fetchSupabaseData]
  );

  const deleteQuickPreset = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      if (isMockMode) {
        const currentList = state.quickPresets ?? QUICK_PRESETS;
        const updatedList = currentList.filter((p) => p.id !== id);
        const nextState: KesflowStateStorage = {
          ...state,
          quickPresets: updatedList,
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return;
      }

      const supabase = createClient();
      const { error: delErr } = await supabase
        .from('quick_presets')
        .delete()
        .eq('id', id);

      if (delErr) {
        throw new Error(delErr.message || 'Gagal menghapus pintasan.');
      }
      await fetchSupabaseData();
    },
    [isMockMode, state, broadcastLocalState, fetchSupabaseData]
  );

  const updateNickname = useCallback(
    async (newNickname: string): Promise<void> => {
      setError(null);
      const cleanName = newNickname.trim();
      if (!cleanName) {
        throw new Error('Nickname tidak boleh kosong.');
      }

      const activeId = currentUser?.id ?? activeUserId;

      if (isMockMode) {
        const updatedProfiles = state.profiles.map((p) =>
          p.id === activeId ? { ...p, display_name: cleanName } : p
        );
        const updatedMembers = state.members.map((m) =>
          m.user_id === activeId ? { ...m, nickname: cleanName } : m
        );
        const nextState: KesflowStateStorage = {
          ...state,
          profiles: updatedProfiles,
          members: updatedMembers,
        };
        setState(nextState);
        broadcastLocalState(nextState);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Silakan login terlebih dahulu.');

      // Update profil di table profiles
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          display_name: cleanName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profErr) {
        throw new Error(profErr.message);
      }

      // Update juga di space_members jika sudah bergabung ke space
      if (state.space?.id) {
        await supabase
          .from('space_members')
          .update({ nickname: cleanName })
          .eq('space_id', state.space.id)
          .eq('user_id', user.id);
      }

      await fetchSupabaseData();
    },
    [isMockMode, currentUser, activeUserId, state, broadcastLocalState, fetchSupabaseData]
  );

  const resetQuickPresets = useCallback(async (): Promise<void> => {
    setError(null);
    if (isMockMode) {
      const nextState: KesflowStateStorage = {
        ...state,
        quickPresets: QUICK_PRESETS,
      };
      setState(nextState);
      broadcastLocalState(nextState);
      return;
    }

    const spaceId = state.space?.id ?? DEMO_SPACE_ID;
    const supabase = createClient();
    await supabase.from('quick_presets').delete().eq('space_id', spaceId);
    await supabase.from('quick_presets').insert(
      QUICK_PRESETS.map((p) => ({
        space_id: spaceId,
        label: p.label,
        amount: p.amount,
        category_name: p.categoryName,
        icon_name: p.iconName,
      }))
    );
    await fetchSupabaseData();
  }, [isMockMode, state, broadcastLocalState, fetchSupabaseData]);

  const clearSpaceTransactions = useCallback(async (): Promise<void> => {
    setError(null);
    if (!state.space) return;

    if (isMockMode) {
      const nextState: KesflowStateStorage = {
        ...state,
        transactions: [],
        settlements: [],
        activityLogs: [
          {
            id: `log-${Date.now()}`,
            space_id: state.space.id,
            actor_id: currentUser?.id ?? DEMO_USER_A_ID,
            actor_name: currentUser?.display_name || 'Kamu',
            action_type: 'TX_DELETED',
            target_id: state.space.id,
            title: 'Reset Transaksi Ruang',
            description: `${currentUser?.display_name || 'Kamu'} mengosongkan seluruh riwayat transaksi date (saldo kembali Rp 0).`,
            amount: 0,
            created_at: new Date().toISOString(),
          },
          ...(state.activityLogs ?? []),
        ],
      };
      setState(nextState);
      broadcastLocalState(nextState);
      return;
    }

    const spaceId = state.space.id;
    const supabase = createClient();

    const [txDel, stDel] = await Promise.all([
      supabase.from('transactions').delete().eq('space_id', spaceId),
      supabase.from('settlements').delete().eq('space_id', spaceId),
    ]);

    if (txDel.error) throw new Error(txDel.error.message);
    if (stDel.error) throw new Error(stDel.error.message);

    await fetchSupabaseData();
  }, [isMockMode, state, currentUser, broadcastLocalState, fetchSupabaseData]);

  const leaveCoupleSpace = useCallback(async (): Promise<void> => {
    setError(null);
    if (!state.space) return;

    if (isMockMode) {
      const nextState: KesflowStateStorage = {
        ...state,
        space: null,
        members: [],
        transactions: [],
        settlements: [],
        events: [],
      };
      setState(nextState);
      broadcastLocalState(nextState);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && state.space) {
      const { error: leaveErr } = await supabase
        .from('space_members')
        .delete()
        .eq('space_id', state.space.id)
        .eq('user_id', user.id);

      if (leaveErr) throw new Error(leaveErr.message);
    }

    await fetchSupabaseData();
  }, [isMockMode, state, broadcastLocalState, fetchSupabaseData]);

  const resetDemoData = useCallback(() => {
    const initial = getInitialStorage();
    setState(initial);
    broadcastLocalState(initial);
  }, [broadcastLocalState]);

  const clearError = useCallback(() => setError(null), []);

  const computedActivityLogs = useMemo<ActivityLogItem[]>(() => {
    if (!state.space) return [];
    const currentSpaceId = state.space.id;

    // 1. Log otomatis dari transaksi nyata di space ini
    const txLogs: ActivityLogItem[] = state.transactions.map((tx) => {
      const payer = state.profiles.find((p) => p.id === tx.payer_id);
      const payerName = payer?.display_name || 'Pasangan';
      return {
        id: `tx-log-${tx.id}`,
        space_id: tx.space_id,
        actor_id: tx.payer_id,
        actor_name: payerName,
        action_type: 'TX_CREATED',
        target_id: tx.id,
        title: tx.title,
        description: `Mencatat pengeluaran baru ${formatRupiah(Number(tx.amount))} (Dibayar ${payerName} · ${SPLIT_LABELS[tx.split_type] || 'Split'})`,
        amount: Number(tx.amount),
        created_at: tx.spent_at || tx.created_at,
      };
    });

    // 2. Log otomatis dari settlement pelunasan hutang di space ini
    const stLogs: ActivityLogItem[] = state.settlements.map((st) => {
      const fromUser = state.profiles.find((p) => p.id === st.from_user_id);
      const toUser = state.profiles.find((p) => p.id === st.to_user_id);
      const fromName = fromUser?.display_name || 'Pasangan';
      const toName = toUser?.display_name || 'Pasangan';
      return {
        id: `st-log-${st.id}`,
        space_id: st.space_id,
        actor_id: st.from_user_id,
        actor_name: fromName,
        action_type: 'SETTLEMENT_ADDED',
        target_id: st.id,
        title: 'Settle Up Saldo',
        description: `${fromName} melunasi saldo hutang ${formatRupiah(Number(st.amount))} ke ${toName}${st.notes ? ` · ${st.notes}` : ''}`,
        amount: Number(st.amount),
        created_at: st.settled_at,
      };
    });

    // 3. Log manual/kustom khusus space ini (seperti log reset transaksi)
    const customLogs = (state.activityLogs || []).filter(
      (l) =>
        l.space_id === currentSpaceId &&
        !l.id.startsWith('tx-log-') &&
        !l.id.startsWith('st-log-')
    );

    const allLogs = [...customLogs, ...txLogs, ...stLogs];
    return allLogs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [
    state.space,
    state.transactions,
    state.settlements,
    state.activityLogs,
    state.profiles,
  ]);

  const value: KesflowContextValue = {
    isLoading,
    isAuthenticated,
    error,
    isMockMode,
    isRealtimeConnected,
    currentUser,
    partnerUser,
    userAId,
    userBId,
    space: state.space,
    members: state.members,
    profiles: state.profiles,
    categories: state.categories,
    events: state.events,
    transactions: state.transactions,
    settlements: state.settlements,
    activityLogs: computedActivityLogs,
    quickPresets: state.quickPresets ?? QUICK_PRESETS,
    balance,
    netBalanceForCurrentUser,
    balanceBreakdownForA,
    loginWithEmailOrPin,
    loginWithGoogle,
    loginAsAccount,
    logout,
    switchDemoActiveUser,
    createCoupleSpace,
    joinCoupleSpace,
    updateNickname,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    settleUpBalance,
    addDateEvent,
    toggleEventActive,
    deleteDateEvent,
    addQuickPreset,
    updateQuickPreset,
    deleteQuickPreset,
    resetQuickPresets,
    clearSpaceTransactions,
    leaveCoupleSpace,
    resetDemoData,
    clearError,
  };

  return (
    <KesflowContext.Provider value={value}>{children}</KesflowContext.Provider>
  );
}

export function useKesflow(): KesflowContextValue {
  const ctx = useContext(KesflowContext);
  if (!ctx) {
    throw new Error('useKesflow harus digunakan di dalam KesflowProvider');
  }
  return ctx;
}
