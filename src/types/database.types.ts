export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SplitType = 'EQUAL_50_50' | 'FULL_TREAT' | 'FULL_OWE' | 'CUSTOM';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      spaces: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          invite_code: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      space_members: {
        Row: {
          id: string;
          space_id: string;
          user_id: string;
          nickname: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          user_id: string;
          nickname: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          user_id?: string;
          nickname?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          space_id: string | null;
          name: string;
          icon: string;
          color: string;
          is_preset: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id?: string | null;
          name: string;
          icon: string;
          color?: string;
          is_preset?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string | null;
          name?: string;
          icon?: string;
          color?: string;
          is_preset?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          space_id: string;
          title: string;
          start_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          title: string;
          start_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          title?: string;
          start_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          space_id: string;
          payer_id: string;
          event_id: string | null;
          category_id: string | null;
          title: string;
          amount: number;
          split_type: SplitType;
          user_a_share: number;
          user_b_share: number;
          receipt_url: string | null;
          notes: string | null;
          spent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          payer_id: string;
          event_id?: string | null;
          category_id?: string | null;
          title: string;
          amount: number;
          split_type: SplitType;
          user_a_share: number;
          user_b_share: number;
          receipt_url?: string | null;
          notes?: string | null;
          spent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          payer_id?: string;
          event_id?: string | null;
          category_id?: string | null;
          title?: string;
          amount?: number;
          split_type?: SplitType;
          user_a_share?: number;
          user_b_share?: number;
          receipt_url?: string | null;
          notes?: string | null;
          spent_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          space_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          notes: string | null;
          settled_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          notes?: string | null;
          settled_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          amount?: number;
          notes?: string | null;
          settled_at?: string;
        };
        Relationships: [];
      };
      quick_presets: {
        Row: {
          id: string;
          space_id: string;
          label: string;
          amount: number;
          category_name: string;
          icon_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          label: string;
          amount: number;
          category_name?: string;
          icon_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          label?: string;
          amount?: number;
          category_name?: string;
          icon_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_member_of_space: {
        Args: { _space_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
