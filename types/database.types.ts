export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string | null;
          role: string | null;
          push_subscription_json: Json | null;
          push_quote_enabled: boolean | null;
          push_quote_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      daily_state: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          energy: number | null;
          focus: number | null;
          sensory_load: number | null;
          sleep_hours: number | null;
          social_load: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["daily_state"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_state"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          due_date: string | null;
          completed: boolean;
          completed_at: string | null;
          carry_over_count: number;
          energy_required: number | null;
          priority: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          completed?: boolean;
          carry_over_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      quotes: {
        Row: {
          id: number;
          author_name: string;
          era: string;
          topic: string | null;
          quote_text: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
    };
  };
}

export type User = Database["public"]["Tables"]["users"]["Row"];
export type DailyState = Database["public"]["Tables"]["daily_state"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
