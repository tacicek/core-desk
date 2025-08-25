import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Users, DollarSign, Ticket, TrendingUp, Shield, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TenantStats } from '@/types/admin';
import TenantsOverviewTab from '@/components/admin/TenantsOverviewTab';
import RevenueBillingTab from '@/components/admin/RevenueBillingTab';
import AnalyticsReportsTab from '@/components/admin/AnalyticsReportsTab';
import SupportCenterTab from '@/components/admin/SupportCenterTab';
import SystemSettingsTab from '@/components/admin/SystemSettingsTab';
import PlatformManagementTab from '@/components/admin/PlatformManagementTab';

export default function AdminDashboard() {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tenants');
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_tenant_stats');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Fehler",
        description: "Statistiken konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navigationItems = [
    {
      id: 'tenants',
      label: 'Mandanten',
      icon: Building2,
      description: 'Verwalten Sie alle Mandanten'
    },
    {
      id: 'revenue',
      label: 'Umsatz & Billing',
      icon: DollarSign,
      description: 'Finanzielle Übersicht und Abrechnung'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      description: 'Berichte und Analysen'
    },
    {
      id: 'support',
      label: 'Support Center',
      icon: Ticket,
      description: 'Kundensupport und Tickets'
    }
  ];

  const systemItems = [
    {
      id: 'settings',
      label: 'System Einstellungen',
      icon: Settings,
      description: 'Allgemeine Systemkonfiguration'
    },
    {
      id: 'platform',
      label: 'Plattform Verwaltung',
      icon: Shield,
      description: 'Erweiterte Plattform-Einstellungen'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900/50 to-purple-900/50">
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Willkommen im Admin Dashboard
          </h1>
          <p className="text-purple-200">
            Verwalten Sie Ihr gesamtes System von einer zentralen Stelle aus
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-200">Gesamt Mandanten</CardTitle>
              <Building2 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.total_tenants || 0}</div>
              <p className="text-xs text-purple-300">
                +12% seit letztem Monat
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-200">Aktive Abonnements</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.active_tenants || 0}</div>
              <p className="text-xs text-purple-300">
                {stats?.trial_tenants || 0} Trial-Versionen
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-200">Monatlicher Umsatz</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats?.total_revenue || 0)}
              </div>
              <p className="text-xs text-purple-300">
                +8.1% Wachstum
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-200">Support Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">23</div>
              <p className="text-xs text-purple-300">
                5 kritisch
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "outline"}
                  onClick={() => setActiveTab(item.id)}
                  className={
                    activeTab === item.id
                      ? "bg-purple-600 hover:bg-purple-700 border-purple-500 text-white"
                      : "bg-slate-800/50 border-purple-500/30 text-purple-200 hover:bg-purple-500/20 hover:text-white"
                  }
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="text-xs text-purple-300 font-medium mb-2 w-full">SYSTEM</div>
            {systemItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "outline"}
                  onClick={() => setActiveTab(item.id)}
                  className={
                    activeTab === item.id
                      ? "bg-purple-600 hover:bg-purple-700 border-purple-500 text-white"
                      : "bg-slate-800/50 border-purple-500/30 text-purple-200 hover:bg-purple-500/20 hover:text-white"
                  }
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="space-y-6">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-purple-500/20 p-6">
            {activeTab === 'tenants' && <TenantsOverviewTab onStatsChange={loadStats} />}
            {activeTab === 'revenue' && <RevenueBillingTab />}
            {activeTab === 'analytics' && <AnalyticsReportsTab />}
            {activeTab === 'support' && <SupportCenterTab />}
            {activeTab === 'settings' && <SystemSettingsTab />}
            {activeTab === 'platform' && <PlatformManagementTab />}
          </div>
        </div>
      </div>
    </div>
  );
}