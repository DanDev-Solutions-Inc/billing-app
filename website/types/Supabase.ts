// Supabase schema types.
// Shape matches `supabase gen types typescript` output so it can be regenerated
// as a drop-in replacement once the project is linked:
//   npm run supabase:generate
// Do not edit by hand beyond keeping it in sync with supabase/schema.sql.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          business_name: string | null;
          inbound_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name?: string | null;
          inbound_token?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          wave_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          wave_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string | null;
          invoice_number: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          issue_date: string;
          due_date: string | null;
          notes: string | null;
          subtotal: number;
          tax: number;
          total: number;
          wave_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id?: string | null;
          invoice_number?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          issue_date?: string;
          due_date?: string | null;
          notes?: string | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          wave_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      estimates: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string | null;
          estimate_number: string | null;
          status: Database["public"]["Enums"]["estimate_status"];
          issue_date: string;
          expiry_date: string | null;
          notes: string | null;
          subtotal: number;
          tax: number;
          total: number;
          converted_invoice_id: string | null;
          wave_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id?: string | null;
          estimate_number?: string | null;
          status?: Database["public"]["Enums"]["estimate_status"];
          issue_date?: string;
          expiry_date?: string | null;
          notes?: string | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          converted_invoice_id?: string | null;
          wave_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["estimates"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "estimates_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      line_items: {
        Row: {
          id: string;
          user_id: string;
          parent_type: "invoice" | "estimate";
          parent_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          parent_type: "invoice" | "estimate";
          parent_id: string;
          description: string;
          quantity?: number;
          unit_price?: number;
          position?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["line_items"]["Insert"]>;
        Relationships: [];
      };
      receipts: {
        Row: {
          id: string;
          user_id: string;
          vendor: string | null;
          amount: number;
          receipt_date: string;
          category: string | null;
          notes: string | null;
          image_url: string | null;
          image_pathname: string | null;
          source: Database["public"]["Enums"]["receipt_source"];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vendor?: string | null;
          amount?: number;
          receipt_date?: string;
          category?: string | null;
          notes?: string | null;
          image_url?: string | null;
          image_pathname?: string | null;
          source?: Database["public"]["Enums"]["receipt_source"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["receipts"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          txn_date: string;
          description: string | null;
          amount: number;
          direction: Database["public"]["Enums"]["txn_direction"];
          category: string | null;
          receipt_id: string | null;
          invoice_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          txn_date?: string;
          description?: string | null;
          amount: number;
          direction: Database["public"]["Enums"]["txn_direction"];
          category?: string | null;
          receipt_id?: string | null;
          invoice_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "transactions_receipt_id_fkey";
            columns: ["receipt_id"];
            referencedRelation: "receipts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey";
            columns: ["invoice_id"];
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_invoices: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string | null;
          title: string | null;
          line_items: Json;
          tax_rate: number;
          notes: string | null;
          frequency: Database["public"]["Enums"]["recurring_frequency"];
          interval: number;
          next_run: string;
          last_run: string | null;
          end_date: string | null;
          net_days: number;
          auto_send: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id?: string | null;
          title?: string | null;
          line_items?: Json;
          tax_rate?: number;
          notes?: string | null;
          frequency: Database["public"]["Enums"]["recurring_frequency"];
          interval?: number;
          next_run: string;
          last_run?: string | null;
          end_date?: string | null;
          net_days?: number;
          auto_send?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["recurring_invoices"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      invoice_status: "draft" | "sent" | "paid";
      estimate_status: "draft" | "sent" | "accepted" | "declined";
      txn_direction: "income" | "expense";
      receipt_source: "upload" | "email";
      recurring_frequency: "daily" | "weekly" | "monthly" | "yearly";
    };
    CompositeTypes: Record<string, never>;
  };
}
