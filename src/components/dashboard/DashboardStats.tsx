import { StatsCard } from "@/components/dashboard/StatsCard";
import { TrendingUp, Users, FileText, Clock } from "lucide-react";

interface DashboardStatsProps {
  invoices: any[];
  companyName: string;
}

export function DashboardStats({ invoices, companyName }: DashboardStatsProps) {
  // Calculate stats
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const thisMonthInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate.getMonth() === thisMonth && invoiceDate.getFullYear() === thisYear;
  });

  const thisMonthRevenue = thisMonthInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total, 0);

  const pendingInvoices = invoices.filter(invoice => 
    invoice.status === 'sent' || invoice.status === 'overdue'
  );

  const pendingAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div className="text-center md:text-left">
        <h1 className="text-clamp-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-clamp-base text-muted-foreground mt-1">
          Willkommen zurück bei {companyName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Umsatz"
          value={`CHF ${thisMonthRevenue.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`}
          change={`${thisMonthInvoices.length} Rechnung${thisMonthInvoices.length !== 1 ? 'en' : ''}`}
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-success"
          href="/dashboard/reports"
        />
        <StatsCard
          title="Offene"
          value={`CHF ${pendingAmount.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`}
          change={`${pendingInvoices.length} Rechnung${pendingInvoices.length !== 1 ? 'en' : ''}`}
          changeType="neutral"
          icon={Clock}
          iconColor="text-warning"
          href="/dashboard/invoices"
        />
        <StatsCard
          title="Rechnungen"
          value={thisMonthInvoices.length.toString()}
          change="Rechnungen"
          changeType="neutral"
          icon={FileText}
          iconColor="text-primary"
          href="/dashboard/invoices"
        />
      </div>
    </div>
  );
}