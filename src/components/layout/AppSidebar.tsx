import { useState, useEffect } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  BarChart3,
  Settings,
  Plus,
  Receipt,
  Calculator,
  Building2,
  ClipboardList,
  CreditCard,
  LogOut,
  Webhook,
  ChevronDown,
  TrendingUp,
  Shield,
  X
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CompanySettings } from "@/types";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from "@/hooks/use-mobile";

const mainItems = [
  { title: "navigation.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "navigation.invoices", url: "/dashboard/invoices", icon: FileText },
  { title: "navigation.offers", url: "/dashboard/offers", icon: ClipboardList },
  { title: "navigation.customers", url: "/dashboard/customers", icon: Users },
  { title: "navigation.products", url: "/dashboard/products", icon: Package },
  { title: "navigation.reports", url: "/dashboard/reports", icon: BarChart3 },
];

const financialItems = [
  { title: "navigation.invoiceManagement", url: "/dashboard/invoice-management", icon: FileText },
  { title: "navigation.payrollManagement", url: "/dashboard/payroll-management", icon: Users },
  { title: "navigation.expenses", url: "/dashboard/expenses", icon: Receipt },
  { title: "navigation.revenue", url: "/dashboard/revenue", icon: TrendingUp },
  { title: "navigation.tax", url: "/dashboard/tax", icon: Calculator },
];

const quickActions = [
  { title: "actions.newInvoice", url: "/dashboard/invoices/new", icon: Plus },
  { title: "actions.newOffer", url: "/dashboard/offers/new", icon: ClipboardList },
  { title: "actions.newCustomer", url: "/dashboard/customers/new", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('vendor_id')
          .eq('user_id', user.id)
          .single();

        if (profile?.vendor_id) {
          const { data: companySettings } = await supabase
            .from('company_settings')
            .select('*')
            .eq('vendor_id', profile.vendor_id)
            .single();

          if (companySettings) {
            setSettings({
              name: companySettings.name || 'GeschäftsCockpit',
              logo: companySettings.logo,
              address: companySettings.address,
              phone: companySettings.phone,
              email: companySettings.email,
              taxNumber: companySettings.tax_number,
              qrIban: companySettings.qr_iban,
              bankName: companySettings.bank_name,
              defaultTaxRate: companySettings.default_tax_rate || 8.1,
              defaultDueDays: companySettings.default_due_days || 30,
              invoiceNumberFormat: companySettings.invoice_number_format || 'F-{YYYY}-{MM}-{###}',
              senderName: companySettings.sender_name,
              senderEmail: companySettings.sender_email,
              emailSubjectTemplate: companySettings.email_subject_template,
              emailBodyTemplate: companySettings.email_body_template,
            });
          }
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isFinancialSectionActive = () => {
    return financialItems.some(item => isActive(item.url));
  };

  const getNavClassName = (path: string) => {
    return isActive(path)
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "hover:bg-accent";
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">{/* Removed custom width handling */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 hover:bg-sidebar-accent/10 transition-colors rounded-md p-1 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
              {settings?.logo ? (
                <img 
                  src={settings.logo} 
                  alt="Firmenlogo" 
                  className="h-full w-full object-contain"
                />
              ) : (
                <Receipt className="h-5 w-5" />
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{settings?.name || "GeschäftsCockpit"}</span>
                <span className="text-xs text-muted-foreground">Business Management</span>
              </div>
            )}
          </Link>
          {isMobile && (
            <SidebarTrigger className="h-8 w-8 p-0 hover:bg-sidebar-accent transition-colors">
              <X className="h-4 w-4" />
            </SidebarTrigger>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('Main Menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{t(item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Financial Management Dropdown */}
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className={isFinancialSectionActive() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"}>
                      <CreditCard className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span>{t('Financial Management')}</span>
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side={collapsed ? "right" : "bottom"} align="start" className="w-64 bg-background border shadow-lg z-50">
                    {financialItems.map((item) => (
                      <DropdownMenuItem key={item.title} asChild>
                        <NavLink 
                          to={item.url} 
                          className="flex items-center gap-3 w-full cursor-pointer px-3 py-2 text-sm hover:bg-accent rounded-sm"
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{t(item.title)}</span>
                        </NavLink>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('Quick Actions')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{t(item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/dashboard/api-management" className={getNavClassName("/dashboard/api-management")}>
                <Webhook className="h-4 w-4" />
                {!collapsed && <span>API Management</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/dashboard/company-info" className={getNavClassName("/dashboard/company-info")}>
                <Building2 className="h-4 w-4" />
                {!collapsed && <span>Meine Firma</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/dashboard/settings" className={getNavClassName("/dashboard/settings")}>
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Einstellungen</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Admin Panel Link - Only for Super Admins */}
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/admin" className={getNavClassName("/admin")}>
                  <Shield className="h-4 w-4" />
                  {!collapsed && <span>{t('navigation.adminPanel')}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>{t('actions.signOut')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && user?.email && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
            {user.email}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}