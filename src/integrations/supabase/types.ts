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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          is_super_admin: boolean | null
          permissions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      annual_summary: {
        Row: {
          category: string
          created_at: string | null
          entry_count: number
          id: string
          total_amount: number
          updated_at: string | null
          vendor_id: string
          year: number
        }
        Insert: {
          category: string
          created_at?: string | null
          entry_count?: number
          id?: string
          total_amount?: number
          updated_at?: string | null
          vendor_id: string
          year: number
        }
        Update: {
          category?: string
          created_at?: string | null
          entry_count?: number
          id?: string
          total_amount?: number
          updated_at?: string | null
          vendor_id?: string
          year?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      business_expenses: {
        Row: {
          ai_confidence: number | null
          amount: number
          business_purpose: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          document_number: string | null
          due_date: string | null
          expense_date: string | null
          expense_type: string
          id: string
          image_url: string | null
          needs_review: boolean | null
          net_amount: number | null
          original_filename: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
          tax_category: string
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
          vendor_id: string
          vendor_name: string | null
        }
        Insert: {
          ai_confidence?: number | null
          amount: number
          business_purpose?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          document_number?: string | null
          due_date?: string | null
          expense_date?: string | null
          expense_type?: string
          id?: string
          image_url?: string | null
          needs_review?: boolean | null
          net_amount?: number | null
          original_filename?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          tax_category?: string
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
          vendor_id: string
          vendor_name?: string | null
        }
        Update: {
          ai_confidence?: number | null
          amount?: number
          business_purpose?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          document_number?: string | null
          due_date?: string | null
          expense_date?: string | null
          expense_type?: string
          id?: string
          image_url?: string | null
          needs_review?: boolean | null
          net_amount?: number | null
          original_filename?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          tax_category?: string
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
          vendor_id?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          bank_name: string | null
          created_at: string
          default_due_days: number | null
          default_tax_rate: number | null
          email: string | null
          email_body_template: string | null
          email_subject_template: string | null
          id: string
          invoice_number_format: string | null
          logo: string | null
          name: string | null
          phone: string | null
          qr_iban: string | null
          sender_email: string | null
          sender_name: string | null
          tax_number: string | null
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          address?: string | null
          bank_name?: string | null
          created_at?: string
          default_due_days?: number | null
          default_tax_rate?: number | null
          email?: string | null
          email_body_template?: string | null
          email_subject_template?: string | null
          id?: string
          invoice_number_format?: string | null
          logo?: string | null
          name?: string | null
          phone?: string | null
          qr_iban?: string | null
          sender_email?: string | null
          sender_name?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          address?: string | null
          bank_name?: string | null
          created_at?: string
          default_due_days?: number | null
          default_tax_rate?: number | null
          email?: string | null
          email_body_template?: string | null
          email_subject_template?: string | null
          id?: string
          invoice_number_format?: string | null
          logo?: string | null
          name?: string | null
          phone?: string | null
          qr_iban?: string | null
          sender_email?: string | null
          sender_name?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          contact_gender: string | null
          contact_person: string | null
          created_at: string
          created_by: string
          email: string
          id: string
          name: string
          phone: string | null
          tax_number: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          address?: string | null
          contact_gender?: string | null
          contact_person?: string | null
          created_at?: string
          created_by: string
          email: string
          id?: string
          name: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          address?: string | null
          contact_gender?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      daily_revenue: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          net_amount: number | null
          revenue_date: string
          source: string | null
          updated_at: string
          vat_amount: number | null
          vat_category: string | null
          vat_rate: number | null
          vendor_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          id?: string
          net_amount?: number | null
          revenue_date: string
          source?: string | null
          updated_at?: string
          vat_amount?: number | null
          vat_category?: string | null
          vat_rate?: number | null
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          net_amount?: number | null
          revenue_date?: string
          source?: string | null
          updated_at?: string
          vat_amount?: number | null
          vat_category?: string | null
          vat_rate?: number | null
          vendor_id?: string
        }
        Relationships: []
      }
      employee_expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          currency: string
          description: string | null
          employee_name: string
          expense_date: string
          expense_type: string
          id: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          employee_name: string
          expense_date: string
          expense_type?: string
          id?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          employee_name?: string
          expense_date?: string
          expense_type?: string
          id?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      hello_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      incoming_invoices: {
        Row: {
          ai_confidence: number | null
          amount: number
          category: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          image_url: string | null
          invoice_date: string | null
          invoice_number: string | null
          needs_review: boolean | null
          original_filename: string | null
          payment_date: string | null
          reminder_date: string | null
          reminder_sent: boolean | null
          status: string
          updated_at: string
          vendor_id: string
          vendor_name: string | null
        }
        Insert: {
          ai_confidence?: number | null
          amount: number
          category?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          needs_review?: boolean | null
          original_filename?: string | null
          payment_date?: string | null
          reminder_date?: string | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
          vendor_id: string
          vendor_name?: string | null
        }
        Update: {
          ai_confidence?: number | null
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          needs_review?: boolean | null
          original_filename?: string | null
          payment_date?: string | null
          reminder_date?: string | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
          vendor_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incoming_invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_by: string
          description: string
          id: string
          invoice_id: string
          line_total: number
          qty: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          created_by: string
          description: string
          id?: string
          invoice_id: string
          line_total: number
          qty: number
          tax_rate?: number
          unit_price: number
        }
        Update: {
          created_by?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          qty?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          created_by: string
          currency: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          due_date: string | null
          id: string
          invoice_no: string
          issue_date: string
          notes: string | null
          status: string
          subtotal: number
          tax_total: number
          total: number
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          due_date?: string | null
          id?: string
          invoice_no: string
          issue_date: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          due_date?: string | null
          id?: string
          invoice_no?: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          priority: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string | null
          vendor_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
          vendor_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      offer_items: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          line_total: number
          offer_id: string
          qty: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          line_total: number
          offer_id: string
          qty: number
          tax_rate?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          line_total?: number
          offer_id?: string
          qty?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          customer_id: string
          id: string
          issue_date: string
          notes: string | null
          offer_no: string
          status: string
          subtotal: number
          tax_total: number
          total: number
          updated_at: string
          valid_until: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          customer_id: string
          id?: string
          issue_date: string
          notes?: string | null
          offer_no: string
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          customer_id?: string
          id?: string
          issue_date?: string
          notes?: string | null
          offer_no?: string
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_employees: {
        Row: {
          created_at: string
          created_by: string
          department: string | null
          employee_number: string | null
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string
          position: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department?: string | null
          employee_number?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          position?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department?: string | null
          employee_number?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          position?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      payroll_processing_logs: {
        Row: {
          batch_id: string
          created_at: string
          created_by: string
          error_details: Json | null
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          processing_completed_at: string | null
          processing_started_at: string | null
          processing_status: string | null
          records_failed: number | null
          records_processed: number | null
          vendor_id: string
        }
        Insert: {
          batch_id?: string
          created_at?: string
          created_by: string
          error_details?: Json | null
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          records_failed?: number | null
          records_processed?: number | null
          vendor_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          created_by?: string
          error_details?: Json | null
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          records_failed?: number | null
          records_processed?: number | null
          vendor_id?: string
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          ahv_iv_eo_employee: number | null
          ahv_iv_eo_employer: number | null
          alv_employee: number | null
          alv_employer: number | null
          base_salary: number | null
          bonuses: number | null
          bu_insurance: number | null
          created_at: string
          created_by: string
          employee_id: string
          error_message: string | null
          fak_family_allowance: number | null
          file_url: string | null
          gross_salary: number | null
          health_insurance_employee: number | null
          id: string
          krankentaggeld: number | null
          nbu_insurance: number | null
          net_salary: number | null
          original_filename: string | null
          other_deductions: number | null
          other_employer_costs: number | null
          other_income: number | null
          overtime_pay: number | null
          payroll_month: number
          payroll_year: number
          pensionskasse_employee: number | null
          pensionskasse_employer: number | null
          processing_status: string | null
          thirteenth_salary: number | null
          total_company_cost: number | null
          total_deductions: number | null
          total_employer_costs: number | null
          updated_at: string
          vacation_pay: number | null
          vendor_id: string
        }
        Insert: {
          ahv_iv_eo_employee?: number | null
          ahv_iv_eo_employer?: number | null
          alv_employee?: number | null
          alv_employer?: number | null
          base_salary?: number | null
          bonuses?: number | null
          bu_insurance?: number | null
          created_at?: string
          created_by: string
          employee_id: string
          error_message?: string | null
          fak_family_allowance?: number | null
          file_url?: string | null
          gross_salary?: number | null
          health_insurance_employee?: number | null
          id?: string
          krankentaggeld?: number | null
          nbu_insurance?: number | null
          net_salary?: number | null
          original_filename?: string | null
          other_deductions?: number | null
          other_employer_costs?: number | null
          other_income?: number | null
          overtime_pay?: number | null
          payroll_month: number
          payroll_year: number
          pensionskasse_employee?: number | null
          pensionskasse_employer?: number | null
          processing_status?: string | null
          thirteenth_salary?: number | null
          total_company_cost?: number | null
          total_deductions?: number | null
          total_employer_costs?: number | null
          updated_at?: string
          vacation_pay?: number | null
          vendor_id: string
        }
        Update: {
          ahv_iv_eo_employee?: number | null
          ahv_iv_eo_employer?: number | null
          alv_employee?: number | null
          alv_employer?: number | null
          base_salary?: number | null
          bonuses?: number | null
          bu_insurance?: number | null
          created_at?: string
          created_by?: string
          employee_id?: string
          error_message?: string | null
          fak_family_allowance?: number | null
          file_url?: string | null
          gross_salary?: number | null
          health_insurance_employee?: number | null
          id?: string
          krankentaggeld?: number | null
          nbu_insurance?: number | null
          net_salary?: number | null
          original_filename?: string | null
          other_deductions?: number | null
          other_employer_costs?: number | null
          other_income?: number | null
          overtime_pay?: number | null
          payroll_month?: number
          payroll_year?: number
          pensionskasse_employee?: number | null
          pensionskasse_employer?: number | null
          processing_status?: string | null
          thirteenth_salary?: number | null
          total_company_cost?: number | null
          total_deductions?: number | null
          total_employer_costs?: number | null
          updated_at?: string
          vacation_pay?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_invoices_per_month: number | null
          max_users: number | null
          name: string
          price: number
          sort_order: number | null
          stripe_price_id: string | null
          trial_period_days: number | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_invoices_per_month?: number | null
          max_users?: number | null
          name: string
          price?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_invoices_per_month?: number | null
          max_users?: number | null
          name?: string
          price?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          currency: string | null
          expires_at: string
          features: Json | null
          id: string
          max_invoices_per_month: number | null
          max_users: number | null
          plan_type: string
          price: number
          starts_at: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at: string
          features?: Json | null
          id?: string
          max_invoices_per_month?: number | null
          max_users?: number | null
          plan_type: string
          price: number
          starts_at: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string
          features?: Json | null
          id?: string
          max_invoices_per_month?: number | null
          max_users?: number | null
          plan_type?: string
          price?: number
          starts_at?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_categories: {
        Row: {
          business_deductible: boolean | null
          description_de: string | null
          description_en: string | null
          id: string
          name_de: string
          name_en: string
          requires_business_purpose: boolean | null
          sort_order: number | null
          vat_deductible: boolean | null
        }
        Insert: {
          business_deductible?: boolean | null
          description_de?: string | null
          description_en?: string | null
          id: string
          name_de: string
          name_en: string
          requires_business_purpose?: boolean | null
          sort_order?: number | null
          vat_deductible?: boolean | null
        }
        Update: {
          business_deductible?: boolean | null
          description_de?: string | null
          description_en?: string | null
          id?: string
          name_de?: string
          name_en?: string
          requires_business_purpose?: boolean | null
          sort_order?: number | null
          vat_deductible?: boolean | null
        }
        Relationships: []
      }
      tax_report_view: {
        Row: {
          category_name: string | null
          created_at: string | null
          expense_count: number | null
          expense_types: string[] | null
          id: string
          tax_category: string
          tax_month: number
          tax_year: number
          total_amount: number | null
          total_net: number | null
          total_vat: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          category_name?: string | null
          created_at?: string | null
          expense_count?: number | null
          expense_types?: string[] | null
          id?: string
          tax_category: string
          tax_month: number
          tax_year: number
          total_amount?: number | null
          total_net?: number | null
          total_vat?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          category_name?: string | null
          created_at?: string | null
          expense_count?: number | null
          expense_types?: string[] | null
          id?: string
          tax_category?: string
          tax_month?: number
          tax_year?: number
          total_amount?: number | null
          total_net?: number | null
          total_vat?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          address: string | null
          approval_status: string | null
          approval_token: string | null
          approved_at: string | null
          approved_by: string | null
          company_name: string
          contact_email: string
          contact_person: string | null
          created_at: string | null
          domain: string | null
          id: string
          logo_url: string | null
          phone: string | null
          rejection_reason: string | null
          settings: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          approval_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_name: string
          contact_email: string
          contact_person?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          rejection_reason?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          approval_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string
          contact_email?: string
          contact_person?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          rejection_reason?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          approval_status: string | null
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          is_owner: boolean
          last_name: string | null
          role: string
          tenant_id: string | null
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          approval_status?: string | null
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_owner?: boolean
          last_name?: string | null
          role?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          approval_status?: string | null
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_owner?: boolean
          last_name?: string | null
          role?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_secrets: {
        Row: {
          created_at: string
          created_by: string
          encrypted_value: string
          id: string
          secret_type: string
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          encrypted_value: string
          id?: string
          secret_type: string
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          encrypted_value?: string
          id?: string
          secret_type?: string
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: Json | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          logo: string | null
          name: string
          phone: string | null
          slug: string
          tax_number: string | null
          tenant_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo?: string | null
          name: string
          phone?: string | null
          slug: string
          tax_number?: string | null
          tenant_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo?: string | null
          name?: string
          phone?: string | null
          slug?: string
          tax_number?: string | null
          tenant_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_tenant: {
        Args: {
          p_approval_token: string
          p_approved_by?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      create_invoice_from_webhook: {
        Args: {
          p_amount: number
          p_category?: string
          p_currency?: string
          p_description?: string
          p_due_date: string
          p_invoice_date: string
          p_invoice_number: string
          p_vendor_id: string
          p_vendor_name: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id?: string
          p_vendor_id: string
        }
        Returns: string
      }
      get_annual_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          entry_count: number
          total_amount: number
          vendor_id: string
          year: number
        }[]
      }
      get_tax_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          category_name: string
          expense_count: number
          expense_types: string[]
          tax_category: string
          tax_month: number
          tax_year: number
          total_amount: number
          total_net: number
          total_vat: number
          vendor_id: string
        }[]
      }
      get_tenant_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_tenants: number
          suspended_tenants: number
          total_revenue: number
          total_tenants: number
          trial_tenants: number
        }[]
      }
      get_user_vendor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_vendor_api_key: {
        Args: { secret_type_param: string; vendor_id_param: string }
        Returns: string
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_safe: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_vendor_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      refresh_financial_summaries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reject_tenant: {
        Args: {
          p_approval_token: string
          p_approved_by?: string
          p_rejection_reason?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      user_can_access_customer: {
        Args: { customer_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
