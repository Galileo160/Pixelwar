export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; coins: number; diamonds: number; created_at: string; updated_at: string };
        Insert: { id: string; username: string; coins?: number; diamonds?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      pixels: {
        Row: { x: number; y: number; color: string; owner_id: string | null; locked: boolean; updated_at: string };
        Insert: { x: number; y: number; color?: string; owner_id?: string | null; locked?: boolean; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["pixels"]["Insert"]>;
        Relationships: [];
      };

      pixel_history: {
        Row: { id: number; x: number; y: number; old_color: string; new_color: string; user_id: string | null; created_at: string };
        Insert: { id?: number; x: number; y: number; old_color: string; new_color: string; user_id?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["pixel_history"]["Insert"]>;
        Relationships: [];
      };
      wallet_transactions: {
        Row: { id: number; user_id: string; currency: "coins" | "diamonds"; amount: number; reason: string; metadata: Json; created_at: string };
        Insert: { id?: number; user_id: string; currency: "coins" | "diamonds"; amount: number; reason: string; metadata?: Json; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["wallet_transactions"]["Insert"]>;
        Relationships: [];
      };
      asset_price_history: {
        Row: { id: number; asset_id: string; price: number; recorded_at: string };
        Insert: { id?: number; asset_id: string; price: number; recorded_at?: string };
        Update: Partial<Database["public"]["Tables"]["asset_price_history"]["Insert"]>;
        Relationships: [];
      };
      virtual_assets: {
        Row: { id: string; symbol: string; name: string; description: string; current_price: number; created_at: string };
        Insert: { id?: string; symbol: string; name: string; description: string; current_price?: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["virtual_assets"]["Insert"]>;
        Relationships: [];
      };
      user_asset_holdings: {
        Row: { user_id: string; asset_id: string; quantity: number; avg_buy_price: number; updated_at: string };
        Insert: { user_id: string; asset_id: string; quantity?: number; avg_buy_price?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_asset_holdings"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: { id: string; title: string; description: string; starts_at: string; ends_at: string; active: boolean; created_at: string };
        Insert: { id?: string; title: string; description: string; starts_at: string; ends_at: string; active?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: { id: string; x: number; y: number; reason: string; reporter_id: string | null; status: string; created_at: string };
        Insert: { id?: string; x: number; y: number; reason: string; reporter_id?: string | null; status?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      paint_pixel: { Args: { p_x: number; p_y: number; p_color: string; p_lock: boolean }; Returns: Json };
      grant_test_currency: { Args: { p_coins: number; p_diamonds: number }; Returns: Json };
      claim_rewarded_ad_demo: { Args: Record<string, never>; Returns: Json };
      trade_virtual_asset: { Args: { p_asset_id: string; p_side: "buy" | "sell"; p_quantity: number }; Returns: Json };
    };
    Enums: {};
    CompositeTypes: {};
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Pixel = Database["public"]["Tables"]["pixels"]["Row"];
export type VirtualAsset = Database["public"]["Tables"]["virtual_assets"]["Row"];
export type Holding = Database["public"]["Tables"]["user_asset_holdings"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
