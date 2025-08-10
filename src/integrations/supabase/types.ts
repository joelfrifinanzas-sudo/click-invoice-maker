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
      app_invites: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          status?: string
        }
        Relationships: []
      }
      app_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          limit_invoices_per_month: number | null
          limit_users: number | null
          name: string
          storage_limit_mb: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          limit_invoices_per_month?: number | null
          limit_users?: number | null
          name: string
          storage_limit_mb?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          limit_invoices_per_month?: number | null
          limit_users?: number | null
          name?: string
          storage_limit_mb?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      app_roots: {
        Row: {
          created_at: string
          email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          company_id: string | null
          created_at: string
          details: Json | null
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          message: string | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          details?: Json | null
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          message?: string | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          details?: Json | null
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          message?: string | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      auth_login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip: string | null
          ok: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          ok?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          ok?: boolean
        }
        Relationships: []
      }
      clients: {
        Row: {
          activo: boolean
          apellido: string | null
          created_at: string
          documento: string | null
          email: string | null
          es_contribuyente: boolean
          id: string
          nombre_empresa: string | null
          nombre_pila: string | null
          nombre_visualizacion: string
          notas: string | null
          pais_tel: string
          saludo: string | null
          telefono_laboral: string | null
          telefono_movil: string | null
          tenant_id: string
          tipo_cliente: Database["public"]["Enums"]["client_type"]
        }
        Insert: {
          activo?: boolean
          apellido?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          es_contribuyente?: boolean
          id?: string
          nombre_empresa?: string | null
          nombre_pila?: string | null
          nombre_visualizacion: string
          notas?: string | null
          pais_tel?: string
          saludo?: string | null
          telefono_laboral?: string | null
          telefono_movil?: string | null
          tenant_id: string
          tipo_cliente: Database["public"]["Enums"]["client_type"]
        }
        Update: {
          activo?: boolean
          apellido?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          es_contribuyente?: boolean
          id?: string
          nombre_empresa?: string | null
          nombre_pila?: string | null
          nombre_visualizacion?: string
          notas?: string | null
          pais_tel?: string
          saludo?: string | null
          telefono_laboral?: string | null
          telefono_movil?: string | null
          tenant_id?: string
          tipo_cliente?: Database["public"]["Enums"]["client_type"]
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          currency: string
          id: string
          itbis_rate: number
          limit_invoices_per_month: number | null
          limit_users: number | null
          name: string
          owner_user_id: string
          phone: string | null
          plan: string
          rnc: string | null
          storage_limit_mb: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          currency?: string
          id?: string
          itbis_rate?: number
          limit_invoices_per_month?: number | null
          limit_users?: number | null
          name: string
          owner_user_id: string
          phone?: string | null
          plan?: string
          rnc?: string | null
          storage_limit_mb?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          currency?: string
          id?: string
          itbis_rate?: number
          limit_invoices_per_month?: number | null
          limit_users?: number | null
          name?: string
          owner_user_id?: string
          phone?: string | null
          plan?: string
          rnc?: string | null
          storage_limit_mb?: number | null
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
          es_usuario: boolean
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
          es_usuario?: boolean
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
          es_usuario?: boolean
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
          global_role: Database["public"]["Enums"]["global_role"] | null
          id: string
          last_login: string | null
          phone: string | null
          status: Database["public"]["Enums"]["account_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          global_role?: Database["public"]["Enums"]["global_role"] | null
          id: string
          last_login?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          global_role?: Database["public"]["Enums"]["global_role"] | null
          id?: string
          last_login?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          tenant_id?: string | null
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
      audit_log: {
        Args: {
          _event_type: Database["public"]["Enums"]["audit_event_type"]
          _company_id?: string
          _subject_id?: string
          _message?: string
          _details?: Json
        }
        Returns: undefined
      }
      auth_log_attempt: {
        Args: { _email: string; _ip: string; _ok: boolean }
        Returns: undefined
      }
      auth_rate_limit_check: {
        Args: {
          _email: string
          _ip: string
          _window_mins?: number
          _max_attempts?: number
        }
        Returns: {
          blocked: boolean
          failures: number
          retry_after_seconds: number
        }[]
      }
      compute_global_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["global_role"]
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
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      jwt_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      jwt_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      mark_customers_as_users: {
        Args: { _company_id: string }
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
      resolve_tenant_id: {
        Args: { _user_id: string }
        Returns: string
      }
      su_add_user_to_company: {
        Args: {
          _user_id: string
          _company_id: string
          _role: Database["public"]["Enums"]["company_role"]
        }
        Returns: undefined
      }
      su_assign_cashier_by_domain: {
        Args: { _company_id: string; _domain: string }
        Returns: number
      }
      su_assign_members: {
        Args: {
          _company_id: string
          _user_ids: string[]
          _role: Database["public"]["Enums"]["company_role"]
        }
        Returns: number
      }
      su_audit_list: {
        Args: {
          _company_id?: string
          _user_id?: string
          _event_type?: Database["public"]["Enums"]["audit_event_type"]
          _from?: string
          _to?: string
        }
        Returns: {
          id: string
          created_at: string
          user_id: string
          user_email: string
          user_name: string
          company_id: string
          company_name: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          subject_id: string
          message: string
        }[]
      }
      su_companies_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          address: string | null
          created_at: string
          currency: string
          id: string
          itbis_rate: number
          limit_invoices_per_month: number | null
          limit_users: number | null
          name: string
          owner_user_id: string
          phone: string | null
          plan: string
          rnc: string | null
          storage_limit_mb: number | null
          updated_at: string
        }[]
      }
      su_company_members: {
        Args: { _company_id: string }
        Returns: {
          user_id: string
          email: string
          display_name: string
          role: Database["public"]["Enums"]["company_role"]
        }[]
      }
      su_company_remove_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: undefined
      }
      su_company_set_active: {
        Args: { _company_id: string; _active: boolean }
        Returns: undefined
      }
      su_company_set_member_role: {
        Args: {
          _company_id: string
          _user_id: string
          _role: Database["public"]["Enums"]["company_role"]
        }
        Returns: undefined
      }
      su_company_upsert: {
        Args:
          | {
              _id: string
              _name: string
              _rnc: string
              _phone: string
              _address: string
              _currency: string
              _itbis_rate: number
              _active: boolean
              _plan: string
              _limit_invoices_per_month: number
              _limit_users: number
              _owner_user_id?: string
            }
          | {
              _id: string
              _name: string
              _rnc: string
              _phone: string
              _address: string
              _currency: string
              _itbis_rate: number
              _active: boolean
              _plan: string
              _limit_invoices_per_month: number
              _limit_users: number
              _owner_user_id?: string
              _storage_limit_mb?: number
            }
        Returns: {
          active: boolean
          address: string | null
          created_at: string
          currency: string
          id: string
          itbis_rate: number
          limit_invoices_per_month: number | null
          limit_users: number | null
          name: string
          owner_user_id: string
          phone: string | null
          plan: string
          rnc: string | null
          storage_limit_mb: number | null
          updated_at: string
        }
      }
      su_invite_or_assign_owner: {
        Args: { _company_id: string; _owner_email: string }
        Returns: undefined
      }
      su_list_ncf_sequences: {
        Args: { _company_id: string }
        Returns: {
          ncf_type: string
          next_seq: number
          company_id: string
        }[]
      }
      su_plan_upsert: {
        Args: {
          _name: string
          _description: string
          _limit_invoices_per_month: number
          _limit_users: number
          _storage_limit_mb: number
          _features?: Json
        }
        Returns: {
          created_at: string
          description: string | null
          features: Json
          limit_invoices_per_month: number | null
          limit_users: number | null
          name: string
          storage_limit_mb: number | null
          updated_at: string
        }
      }
      su_plans_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          description: string | null
          features: Json
          limit_invoices_per_month: number | null
          limit_users: number | null
          name: string
          storage_limit_mb: number | null
          updated_at: string
        }[]
      }
      su_set_root_email: {
        Args: { _email: string }
        Returns: undefined
      }
      su_upsert_ncf_sequence: {
        Args: { _company_id: string; _ncf_type: string; _next_seq: number }
        Returns: undefined
      }
      su_user_memberships: {
        Args: { _user_id: string }
        Returns: {
          company_id: string
          company_name: string
          role: Database["public"]["Enums"]["company_role"]
        }[]
      }
      su_users_list: {
        Args: { _name?: string; _email?: string }
        Returns: {
          id: string
          email: string
          display_name: string
          phone: string
          companies_count: number
          last_sign_in_at: string
        }[]
      }
      su_users_without_membership: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          display_name: string
          last_sign_in_at: string
        }[]
      }
      sync_my_claims: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      sync_user_claims: {
        Args: { _user_id: string }
        Returns: undefined
      }
      touch_login: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      upsert_client: {
        Args: { payload: Json }
        Returns: {
          activo: boolean
          apellido: string | null
          created_at: string
          documento: string | null
          email: string | null
          es_contribuyente: boolean
          id: string
          nombre_empresa: string | null
          nombre_pila: string | null
          nombre_visualizacion: string
          notas: string | null
          pais_tel: string
          saludo: string | null
          telefono_laboral: string | null
          telefono_movil: string | null
          tenant_id: string
          tipo_cliente: Database["public"]["Enums"]["client_type"]
        }
      }
    }
    Enums: {
      account_status: "active" | "suspended"
      app_role: "superadmin"
      audit_event_type:
        | "auth_login"
        | "invoice_created"
        | "invoice_updated"
        | "invoice_canceled"
        | "role_changed"
        | "company_activated"
        | "company_deactivated"
      client_type: "Empresarial" | "Individuo"
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
      global_role: "super_admin" | "admin" | "cajera" | "cliente"
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
      account_status: ["active", "suspended"],
      app_role: ["superadmin"],
      audit_event_type: [
        "auth_login",
        "invoice_created",
        "invoice_updated",
        "invoice_canceled",
        "role_changed",
        "company_activated",
        "company_deactivated",
      ],
      client_type: ["Empresarial", "Individuo"],
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
      global_role: ["super_admin", "admin", "cajera", "cliente"],
    },
  },
} as const
