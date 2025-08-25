export interface Tenant {
  id: string;
  company_name: string;
  contact_email: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  domain?: string;
  logo_url?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_type: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled' | 'past_due';
  billing_cycle: 'monthly' | 'yearly';
  price: number;
  currency: string;
  starts_at: string;
  expires_at: string;
  max_users: number;
  max_invoices_per_month: number;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  is_super_admin: boolean;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  tenant_id?: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface AuditLog {
  id: string;
  admin_user_id?: string;
  tenant_id?: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface TenantStats {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  suspended_tenants: number;
  total_revenue: number;
}

export interface TenantWithSubscription extends Tenant {
  subscription?: Subscription;
  last_login?: string;
  user_count?: number;
}

export interface RevenueSummary {
  monthly_revenue: number;
  yearly_revenue: number;
  growth_rate: number;
  churn_rate: number;
}

export interface PlanConfig {
  name: string;
  price: number;
  currency: string;
  features: string[];
  max_users: number;
  max_invoices_per_month: number;
  billing_cycles: ('monthly' | 'yearly')[];
}