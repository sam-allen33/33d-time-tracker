// Minimal generated types placeholder
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; role: 'admin' | 'employee'; is_temp: boolean; expires_at: string | null; created_at: string | null };
        Insert: { id: string; display_name?: string | null; role?: 'admin' | 'employee'; is_temp?: boolean; expires_at?: string | null; created_at?: string | null };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      customers: {
        Row: { id: string; name: string; active: boolean };
        Insert: { id?: string; name: string; active?: boolean };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      functions: {
        Row: { id: string; name: string; active: boolean };
        Insert: { id?: string; name: string; active?: boolean };
        Update: Partial<Database['public']['Tables']['functions']['Insert']>;
      };
      time_entries: {
        Row: { id: string; user_id: string; customer_id: string; function_id: string; start_ts: string; end_ts: string | null; source: string | null; device_id: string | null; notes: string | null; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; user_id: string; customer_id: string; function_id: string; start_ts?: string; end_ts?: string | null; source?: string | null; device_id?: string | null; notes?: string | null };
        Update: Partial<Database['public']['Tables']['time_entries']['Insert']>;
      };
    };
    Views: {
      v_entries_detailed: {
        Row: { id: string; user_id: string; employee: string | null; customer: string; function: string; start_ts: string; end_ts: string | null; duration_seconds: number; rounded_minutes: number; source: string | null; device_id: string | null; notes: string | null; created_at: string | null };
      };
      v_hours_by_customer: {
        Row: { customer: string; hours: number; entries: number; distinct_employees: number };
      };
      v_hours_by_customer_function: {
        Row: { customer: string; function: string; hours: number; entries: number };
      };
    };
  };
}
