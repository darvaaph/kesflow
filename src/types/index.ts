import { Database, SplitType } from './database.types';

export type { SplitType };

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Space = Database['public']['Tables']['spaces']['Row'];
export type SpaceMember = Database['public']['Tables']['space_members']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type DateEvent = Database['public']['Tables']['events']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Settlement = Database['public']['Tables']['settlements']['Row'];

export type ActivityLogType =
  | 'TX_CREATED'
  | 'TX_UPDATED'
  | 'TX_DELETED'
  | 'SETTLEMENT_ADDED';

export interface ActivityLogItem {
  id: string;
  space_id: string;
  actor_id: string;
  actor_name: string;
  action_type: ActivityLogType;
  target_id: string;
  title: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface BalanceCalculationTransaction {
  payer_id: string;
  amount: number;
  split_type: SplitType;
  user_a_share: number;
  user_b_share: number;
}

export interface BalanceCalculationSettlement {
  from_user_id: string;
  to_user_id: string;
  amount: number;
}

export interface RunningBalanceResult {
  /**
   * Net balance from perspective of User A:
   * > 0 means User B owes User A
   * < 0 means User A owes User B
   * = 0 means settled (Rp 0)
   */
  netBalanceForA: number;
  totalDateExpense: number;
  totalPaidByA: number;
  totalPaidByB: number;
}

export interface QuickPresetItem {
  id: string;
  space_id?: string;
  label: string;
  amount: number;
  categoryName: string;
  iconName: string;
}

export interface QuickPresetInput {
  label: string;
  amount: number;
  categoryName: string;
  iconName: string;
}

export interface NewTransactionInput {
  title: string;
  amount: number;
  category_id: string;
  payer_id: string;
  split_type: SplitType;
  user_a_share?: number;
  user_b_share?: number;
  event_id?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  spent_at?: string;
}
