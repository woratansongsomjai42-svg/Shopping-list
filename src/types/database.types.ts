// Hand-written to match supabase/migrations/0001_init.sql.
// Once the project is linked, regenerate with:
//   npx supabase gen types typescript --linked > src/types/database.types.ts

export type MemberRole = "owner" | "member";

export type ShoppingCategory =
  | "fresh_food"
  | "kitchen_supplies"
  | "cleaning_supplies"
  | "personal_care"
  | "household_goods"
  | "other";

export type UrgencyLevel = "urgent" | "normal" | "backup";

export type ExpenseCategory =
  | "electricity"
  | "water"
  | "internet"
  | "groceries"
  | "household_goods"
  | "rent"
  | "other";

export type PersonalTransactionType = "income" | "expense";

export type PersonalAssetType =
  | "savings"
  | "stock"
  | "mutual_fund"
  | "crypto"
  | "real_estate"
  | "gold"
  | "other";

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["households"]["Insert"]>;
        Relationships: [];
      };
      household_members: {
        Row: {
          household_id: string;
          user_id: string;
          role: MemberRole;
          display_name: string | null;
          joined_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: MemberRole;
          display_name?: string | null;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["household_members"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
      shopping_items: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          quantity: number;
          unit: string;
          category: ShoppingCategory;
          urgency: UrgencyLevel;
          note: string | null;
          is_purchased: boolean;
          purchased_by: string | null;
          purchased_at: string | null;
          converted_expense_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          quantity?: number;
          unit?: string;
          category?: ShoppingCategory;
          urgency?: UrgencyLevel;
          note?: string | null;
          is_purchased?: boolean;
          purchased_by?: string | null;
          purchased_at?: string | null;
          converted_expense_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shopping_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "shopping_items_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shopping_items_converted_expense_id_fkey";
            columns: ["converted_expense_id"];
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          description: string;
          amount: number;
          currency: string;
          category: ExpenseCategory;
          expense_date: string;
          paid_by: string;
          source_item_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          description: string;
          amount: number;
          currency?: string;
          category?: ExpenseCategory;
          expense_date?: string;
          paid_by: string;
          source_item_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "expenses_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_source_item_id_fkey";
            columns: ["source_item_id"];
            referencedRelation: "shopping_items";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          share_amount: number;
          is_settled: boolean;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          share_amount: number;
          is_settled?: boolean;
          settled_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["expense_splits"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey";
            columns: ["expense_id"];
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      personal_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: PersonalTransactionType;
          category: string;
          description: string;
          amount: number;
          transaction_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: PersonalTransactionType;
          category?: string;
          description: string;
          amount: number;
          transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["personal_transactions"]["Insert"]>;
        Relationships: [];
      };
      personal_assets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: PersonalAssetType;
          invested_amount: number;
          current_value: number;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type?: PersonalAssetType;
          invested_amount?: number;
          current_value?: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["personal_assets"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_household_by_invite_code: {
        Args: { p_invite_code: string };
        Returns: string;
      };
    };
    Enums: {
      member_role: MemberRole;
      shopping_category: ShoppingCategory;
      urgency_level: UrgencyLevel;
      expense_category: ExpenseCategory;
      personal_transaction_type: PersonalTransactionType;
      personal_asset_type: PersonalAssetType;
    };
    CompositeTypes: Record<string, never>;
  };
}
