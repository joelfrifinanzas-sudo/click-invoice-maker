export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null
          created_at: string
          currency: string
          id: string
          itbis_rate: number
          name: string
          owner_user_id: string
          phone: string | null
          rnc: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string
          id?: string
          itbis_rate?: number
          name: string
          owner_user_id: string
          phone?: string | null
          rnc?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string
          id?: string
          itbis_rate?: number
          name?: string
          owner_user_id?: string
          phone?: string | null
          rnc?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cotizacion_items: {
        Row: {
          cotizacion_id: string
          created_at: string
          id: string
          itbis_rate: number
          nombre: string
          precio_unitario: number
          product_id: string | null
          qty: number
          subtotal: number
          updated_at: string
        }
        Insert: {
          cotizacion_id: string
          created_at?: string
          id?: string
          itbis_rate?: number
          nombre: string
          precio_unitario?: number
          product_id?: string | null
          qty?: number
          subtotal?: number
          updated_at?: string
        }
        Update: {
          cotizacion_id?: string
          created_at?: string
          id?: string
          itbis_rate?: number
          nombre?: string
          precio_unitario?: number
          product_id?: string | null
          qty?: number
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "v_cotizacion_totales"
            referencedColumns: ["cotizacion_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string | null
          estado: Database["public"]["Enums"]["cotizacion_status"]
          fecha: string
          id: string
          itbis_rate: number
          moneda: string
          notas: string | null
          number: string | null
          public_id: string | null
          terminos: string | null
          tipo_descuento: Database["public"]["Enums"]["cotizacion_discount_type"]
          total: number
          total_itbis: number
          total_neto: number
          updated_at: string
          valor_descuento: number
          vence_el: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id?: string | null
          estado?: Database["public"]["Enums"]["cotizacion_status"]
          fecha?: string
          id?: string
          itbis_rate?: number
          moneda?: string
          notas?: string | null
          number?: string | null
          public_id?: string | null
          terminos?: string | null
          tipo_descuento?: Database["public"]["Enums"]["cotizacion_discount_type"]
          total?: number
          total_itbis?: number
          total_neto?: number
          updated_at?: string
          valor_descuento?: number
          vence_el?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string | null
          estado?: Database["public"]["Enums"]["cotizacion_status"]
          fecha?: string
          id?: string
          itbis_rate?: number
          moneda?: string
          notas?: string | null
          number?: string | null
          public_id?: string | null
          terminos?: string | null
          tipo_descuento?: Database["public"]["Enums"]["cotizacion_discount_type"]
          total?: number
          total_itbis?: number
          total_neto?: number
          updated_at?: string
          valor_descuento?: number
          vence_el?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cotizaciones_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cotizaciones_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          itbis_rate: number
          name: string
          owner_user_id: string
          phone: string | null
          rnc: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          itbis_rate?: number
          name: string
          owner_user_id: string
          phone?: string | null
          rnc?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          itbis_rate?: number
          name?: string
          owner_user_id?: string
          phone?: string | null
          rnc?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_cotizacion_config: {
        Row: {
          company_id: string
          created_at: string
          next_seq: number
          prefix: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          next_seq?: number
          prefix?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          next_seq?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      empresa_facturacion_config: {
        Row: {
          company_id: string
          created_at: string
          ncf_prefix: string
          next_invoice_seq: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          ncf_prefix?: string
          next_invoice_seq?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          ncf_prefix?: string
          next_invoice_seq?: number
          updated_at?: string
        }
        Relationships: []
      }
      empresa_ncf_sequences: {
        Row: {
          company_id: string
          created_at: string
          ncf_type: string
          next_seq: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          ncf_type: string
          next_seq?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          ncf_type?: string
          next_seq?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          invoice_id: string
          itbis_rate: number
          owner_user_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_id: string
          itbis_rate?: number
          owner_user_id: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_id?: string
          itbis_rate?: number
          owner_user_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoice_items_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoice_items_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_totals"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "fk_invoice_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_totals"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          canceled_at: string | null
          canceled_by: string | null
          company_id: string
          created_at: string
          currency: string
          customer_id: string | null
          due_date: string | null
          id: string
          issue_date: string
          itbis_rate: number
          ncf: string | null
          ncf_sequence: number | null
          notes: string | null
          number: string | null
          owner_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          canceled_by?: string | null
          company_id: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          itbis_rate?: number
          ncf?: string | null
          ncf_sequence?: number | null
          notes?: string | null
          number?: string | null
          owner_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          canceled_by?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          itbis_rate?: number
          ncf?: string | null
          ncf_sequence?: number | null
          notes?: string | null
          number?: string | null
          owner_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_id: string
          method: string | null
          notes: string | null
          owner_user_id: string
          paid_at: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id: string
          method?: string | null
          notes?: string | null
          owner_user_id: string
          paid_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string
          method?: string | null
          notes?: string | null
          owner_user_id?: string
          paid_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payments_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_totals"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_totals"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          currency: string
          id: string
          itbis_rate: number
          name: string
          owner_user_id: string
          sku: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          itbis_rate?: number
          name: string
          owner_user_id: string
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          itbis_rate?: number
          name?: string
          owner_user_id?: string
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_company: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profiles: {
        Row: {
          company_id: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_cotizacion_totales: {
        Row: {
          cotizacion_id: string | null
          itbis: number | null
          moneda: string | null
          neto: number | null
          total: number | null
        }
        Relationships: []
      }
      v_invoice_totals: {
        Row: {
          currency: string | null
          invoice_id: string | null
          itbis: number | null
          net: number | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_owner_membership: {
        Args: { _company_id: string; _user_id: string }
        Returns: undefined
      }
      assign_invoice_ncf: {
        Args: { _invoice_id: string; _ncf_type: string }
        Returns: string
      }
      cotizacion_mark_viewed: {
        Args: { _public_id: string }
        Returns: undefined
      }
      cotizacion_send: {
        Args: { _id: string }
        Returns: undefined
      }
      cotizaciones_recalc_totals: {
        Args: { _cotizacion_id: string }
        Returns: undefined
      }
      fn_calc_itbis: {
        Args: { net: number; rate?: number }
        Returns: number
      }
      next_cotizacion_number: {
        Args: { _company_id: string }
        Returns: string
      }
      next_ncf: {
        Args: { _company_id: string; _ncf_type: string }
        Returns: string
      }
    }
    Enums: {
      company_role: "owner" | "member"
      cotizacion_discount_type: "none" | "percent" | "amount"
      cotizacion_status:
        | "borrador"
        | "enviada"
        | "vista"
        | "aceptada"
        | "rechazada"
        | "vencida"
        | "facturada"
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
      company_role: ["owner", "member"],
      cotizacion_discount_type: ["none", "percent", "amount"],
      cotizacion_status: [
        "borrador",
        "enviada",
        "vista",
        "aceptada",
        "rechazada",
        "vencida",
        "facturada",
      ],
    },
  },
} as const
