export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string | null
          province: string | null
          secondary_emails: string[]
          user_id: string
          wave_id: string | null
        }
        Insert: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          secondary_emails?: string[]
          user_id: string
          wave_id?: string | null
        }
        Update: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          secondary_emails?: string[]
          user_id?: string
          wave_id?: string | null
        }
        Relationships: []
      }
      document_emails: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          delivered_at: string | null
          id: string
          opened_at: string | null
          parent_id: string
          parent_type: string
          recipient: string
          resend_email_id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          parent_id: string
          parent_type: string
          recipient: string
          resend_email_id: string
          sent_at?: string
          user_id: string
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          parent_id?: string
          parent_type?: string
          recipient?: string
          resend_email_id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          blob_pathname: string
          blob_url: string
          content_type: string | null
          created_at: string
          folder_id: string | null
          id: string
          name: string
          size: number
          user_id: string
        }
        Insert: {
          blob_pathname: string
          blob_url: string
          content_type?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          name: string
          size?: number
          user_id: string
        }
        Update: {
          blob_pathname?: string
          blob_url?: string
          content_type?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          name?: string
          size?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          converted_invoice_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          customer_id: string | null
          estimate_number: string | null
          exchange_rate: number
          expiry_date: string | null
          id: string
          issue_date: string
          notes: string | null
          status: Database["public"]["Enums"]["estimate_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string
          wave_id: string | null
        }
        Insert: {
          converted_invoice_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          customer_id?: string | null
          estimate_number?: string | null
          exchange_rate?: number
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id: string
          wave_id?: string | null
        }
        Update: {
          converted_invoice_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          customer_id?: string | null
          estimate_number?: string | null
          exchange_rate?: number
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string
          wave_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_converted_invoice_id_fkey"
            columns: ["converted_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_billing_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          customer_id: string | null
          due_date: string | null
          exchange_rate: number
          id: string
          invoice_number: string | null
          issue_date: string
          notes: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string
          wave_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          customer_id?: string | null
          due_date?: string | null
          exchange_rate?: number
          id?: string
          invoice_number?: string | null
          issue_date?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id: string
          wave_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          customer_id?: string | null
          due_date?: string | null
          exchange_rate?: number
          id?: string
          invoice_number?: string | null
          issue_date?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string
          wave_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_billing_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          id: string
          parent_id: string
          parent_type: string
          position: number
          quantity: number
          unit_price: number
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description: string
          id?: string
          parent_id: string
          parent_type: string
          position?: number
          quantity?: number
          unit_price?: number
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          id?: string
          parent_id?: string
          parent_type?: string
          position?: number
          quantity?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: []
      }
      profile_access: {
        Row: {
          created_at: string
          id: string
          member_email: string
          owner_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_email: string
          owner_id: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_email?: string
          owner_id?: string
          role?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          id: string
          inbound_token: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          inbound_token?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          inbound_token?: string
          user_id?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          image_pathname: string | null
          image_url: string | null
          notes: string | null
          receipt_date: string
          source: string
          source_message_id: string | null
          tax_included: boolean
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          image_pathname?: string | null
          image_url?: string | null
          notes?: string | null
          receipt_date?: string
          source?: string
          source_message_id?: string | null
          tax_included?: boolean
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          image_pathname?: string | null
          image_url?: string | null
          notes?: string | null
          receipt_date?: string
          source?: string
          source_message_id?: string | null
          tax_included?: boolean
          user_id?: string
          vendor?: string | null
        }
        Relationships: []
      }
      recurring_invoices: {
        Row: {
          active: boolean
          auto_send: boolean
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          customer_id: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id: string
          interval: number
          last_run: string | null
          line_items: Json
          net_days: number
          next_run: string
          notes: string | null
          send_to: string | null
          tax_rate: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          auto_send?: boolean
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          customer_id?: string | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          interval?: number
          last_run?: string | null
          line_items?: Json
          net_days?: number
          next_run: string
          notes?: string | null
          send_to?: string | null
          tax_rate?: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          auto_send?: boolean
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          customer_id?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          interval?: number
          last_run?: string | null
          line_items?: Json
          net_days?: number
          next_run?: string
          notes?: string | null
          send_to?: string | null
          tax_rate?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_billing_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "recurring_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          direction: Database["public"]["Enums"]["txn_direction"]
          id: string
          invoice_id: string | null
          receipt_id: string | null
          status: Database["public"]["Enums"]["txn_status"]
          tax_included: boolean
          txn_date: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          direction: Database["public"]["Enums"]["txn_direction"]
          id?: string
          invoice_id?: string | null
          receipt_id?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          tax_included?: boolean
          txn_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["txn_direction"]
          id?: string
          invoice_id?: string | null
          receipt_id?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          tax_included?: boolean
          txn_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_billing_summary: {
        Row: {
          customer_id: string | null
          invoice_count: number | null
          last_invoiced: string | null
          total_billed: number | null
          total_billed_foreign: number | null
          total_paid: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_folder_cascade: {
        Args: { folder: string }
        Returns: {
          blob_pathname: string
        }[]
      }
      delete_transaction_cascade: { Args: { txn_id: string }; Returns: string }
      fiscal_year_summary: {
        Args: {
          corp_tax_rate?: number
          tax_rate?: number
          year_end_month?: number
        }
        Returns: {
          corporate_tax: number
          expenses: number
          fy_end: string
          fy_start: string
          hst_collected: number
          hst_paid: number
          hst_payable: number
          income: number
          net_income: number
        }[]
      }
      folder_documents: {
        Args: { root: string }
        Returns: {
          blob_pathname: string
          blob_url: string
          content_type: string
          id: string
          name: string
          rel_path: string
          size: number
        }[]
      }
      has_access: { Args: { target_owner: string }; Returns: boolean }
      monthly_cash_flow: {
        Args: { months?: number }
        Returns: {
          expense: number
          income: number
          month: string
        }[]
      }
      next_invoice_number: { Args: { uid: string }; Returns: string }
      receipt_categories: {
        Args: never
        Returns: {
          category: string
          count: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      currency_code: "CAD" | "USD"
      estimate_status: "draft" | "sent" | "accepted" | "declined"
      invoice_status: "draft" | "sent" | "paid"
      recurring_frequency: "daily" | "weekly" | "monthly" | "yearly"
      txn_direction: "income" | "expense"
      txn_status: "pending" | "approved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      currency_code: ["CAD", "USD"],
      estimate_status: ["draft", "sent", "accepted", "declined"],
      invoice_status: ["draft", "sent", "paid"],
      recurring_frequency: ["daily", "weekly", "monthly", "yearly"],
      txn_direction: ["income", "expense"],
      txn_status: ["pending", "approved"],
    },
  },
} as const
