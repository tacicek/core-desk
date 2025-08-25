import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/contexts/VendorContext";
import { TrendingUp, FileText, DollarSign, Clock } from "lucide-react";

interface VendorStatsData {
  totalInvoices: number;
  totalRevenue: number;
  overdueInvoices: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
}

export function VendorStats() {
  const [stats, setStats] = useState<VendorStatsData>({
    totalInvoices: 0,
    totalRevenue: 0,
    overdueInvoices: 0,
    monthlyRevenue: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const { vendor } = useVendor();

  useEffect(() => {
    if (vendor?.id) {
      fetchStats();
    }
  }, [vendor?.id]);

  const fetchStats = async () => {
    if (!vendor?.id) return;

    try {
      setLoading(true);
      console.log('Loading stats from Supabase for vendor:', vendor.id);

      // Get invoices data from Supabase
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('total, status, issue_date, due_date')
        .eq('vendor_id', vendor.id);

      if (invoicesError) {
        console.error('Error loading invoices for stats:', invoicesError);
        return;
      }

      console.log('Loaded invoices for stats from Supabase:', invoices);

      if (invoices) {
        const totalRevenue = invoices
          .filter((inv: any) => inv.status === 'paid')
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyRevenue = invoices
          .filter((inv: any) => {
            const invoiceDate = new Date(inv.issue_date);
            return inv.status === 'paid' && 
                   invoiceDate.getMonth() === currentMonth &&
                   invoiceDate.getFullYear() === currentYear;
          })
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        const lastMonthRevenue = invoices
          .filter((inv: any) => {
            const invoiceDate = new Date(inv.issue_date);
            return inv.status === 'paid' && 
                   invoiceDate.getMonth() === lastMonth &&
                   invoiceDate.getFullYear() === lastMonthYear;
          })
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

        const monthlyGrowth = lastMonthRevenue > 0 
          ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0;

        const overdueInvoices = invoices
          .filter((inv: any) => {
            if (inv.status !== 'sent') return false;
            const dueDate = new Date(inv.due_date);
            return dueDate < new Date();
          }).length;

        setStats({
          totalInvoices: invoices.length,
          totalRevenue,
          overdueInvoices,
          monthlyRevenue,
          monthlyGrowth
        });
      } else {
        setStats({
          totalInvoices: 0,
          totalRevenue: 0,
          overdueInvoices: 0,
          monthlyRevenue: 0,
          monthlyGrowth: 0
        });
      }
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Rechnungen",
      value: stats.totalInvoices,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Gesamtumsatz",
      value: `CHF ${stats.totalRevenue.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      title: "Überfällig",
      value: stats.overdueInvoices,
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      title: "Monatsumsatz",
      value: `CHF ${stats.monthlyRevenue.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      subtitle: `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth.toFixed(1)}% vs. Vormonat`
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className={`${card.borderColor} border-2 hover:shadow-lg transition-all duration-200`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-clamp-stat-title font-medium text-muted-foreground mb-1">{card.title}</p>
                  <p className="text-clamp-stat-value font-bold text-foreground break-words">{card.value}</p>
                  {card.subtitle && (
                    <p className={`text-clamp-stat-subtitle mt-1 ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}