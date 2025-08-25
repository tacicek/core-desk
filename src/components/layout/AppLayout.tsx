import { ReactNode, useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Search, Bell, LogOut, Menu, User, Settings, CreditCard, HelpCircle, ChevronDown, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/contexts/VendorContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import NotificationCenter from '@/components/ui/notification-center';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { vendor, userProfile, isOwner } = useVendor();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [overdueCount, setOverdueCount] = useState(0);
  
  // Check if we're on a sub-page (not dashboard root)
  const isSubPage = location.pathname !== '/dashboard' && location.pathname !== '/dashboard/';

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Benutzer';
  };

  const checkOverdueInvoices = async () => {
    if (!vendor?.id) return;
    
    try {
      console.log('Checking overdue invoices from Supabase...');
      
      // Load invoices from Supabase
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('status', 'sent');

      if (error) {
        console.error('Error loading invoices for overdue check:', error);
        return;
      }

      const now = new Date();
      const overdue = invoices?.filter(invoice => {
        const dueDate = new Date(invoice.due_date);
        return dueDate < now;
      }) || [];
      
      setOverdueCount(overdue.length);
    } catch (error) {
      console.error('Error checking overdue invoices:', error);
    }
  };

  useEffect(() => {
    if (vendor?.id) {
      checkOverdueInvoices();
    }
    
    // Listen for dashboard refresh events to update notification count
    const handleRefresh = () => {
      if (vendor?.id) {
        checkOverdueInvoices();
      }
    };
    
    window.addEventListener('refreshDashboard', handleRefresh);
    
    // Check every 5 minutes for overdue invoices
    const interval = setInterval(() => {
      if (vendor?.id) {
        checkOverdueInvoices();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('refreshDashboard', handleRefresh);
      clearInterval(interval);
    };
  }, [vendor?.id]);

  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return names.length > 1 
        ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
        : names[0].charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full max-w-full overflow-hidden bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-14 md:h-16 border-b bg-card px-3 md:px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              {/* Mobile Home Button - Only show on sub-pages */}
              {isMobile && isSubPage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => navigate('/dashboard')}
                  title="Dashboard"
                >
                  <Home className="h-4 w-4" />
                </Button>
              )}
              
              <SidebarTrigger className="flex-shrink-0" />
              <LanguageSwitcher />
              
              {/* Vendor Info */}
              {vendor && (
                <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-primary/10 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-foreground">{vendor.name}</div>
                  </div>
                </div>
              )}
              
              {/* Search - Hidden on mobile to save space */}
              <div className="relative max-w-md hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechnung, Kunde suchen..."
                  className="pl-10 w-48 xl:w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
              {/* Notification Center */}
              <div className="hidden lg:flex">
                <NotificationCenter />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 md:gap-2 h-auto p-1 md:p-2 hover:bg-accent">
                    <Avatar className="h-7 w-7 md:h-8 md:w-8">
                      <AvatarImage src={userProfile?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    {/* User info - Hidden on small screens */}
                    <div className="hidden md:flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium text-foreground truncate max-w-32 lg:max-w-40">
                        {getUserDisplayName()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground truncate max-w-32 lg:max-w-40">
                          {user?.email}
                        </span>
                        {/* Owner badge */}
                        {isOwner && (
                          <Badge variant="secondary" className="text-xs py-0 px-1 flex-shrink-0">
                            Owner
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-md z-50">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{getUserDisplayName()}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                      {/* Vendor info */}
                      {vendor && (
                        <span className="text-xs text-primary font-medium">{vendor.name}</span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                    <User className="mr-2 h-4 w-4" />
                    {t('Profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('Settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/company-info')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Vendor Einstellungen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Owner management */}
                  {isOwner && (
                    <DropdownMenuItem onClick={() => navigate('/vendor-management')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Vendor Verwaltung
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/contact')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Hilfe & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('actions.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 md:p-6 overflow-auto min-w-0 max-w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}