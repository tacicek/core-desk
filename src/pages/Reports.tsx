import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/contexts/VendorContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from "date-fns";

interface ReportsData {
  totalRevenue: number;
  paidInvoicesCount: number;
  averageInvoiceValue: number;
  monthlyData: Array<{ month: string; revenue: number; }>;
  topCustomers: Array<{ name: string; totalRevenue: number; invoiceCount: number; }>;
}

export default function Reports() {
  const { vendor } = useVendor();
  const [data, setData] = useState<ReportsData>({
    totalRevenue: 0,
    paidInvoicesCount: 0,
    averageInvoiceValue: 0,
    monthlyData: [],
    topCustomers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportsData = async () => {
      if (!vendor?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch paid invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('vendor_id', vendor.id)
          .eq('status', 'paid');

        if (invoicesError) {
          console.error('Error loading invoices:', invoicesError);
          return;
        }

        if (!invoices || invoices.length === 0) {
          setData({
            totalRevenue: 0,
            paidInvoicesCount: 0,
            averageInvoiceValue: 0,
            monthlyData: [],
            topCustomers: []
          });
          return;
        }

        // Calculate total revenue
        const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        const averageInvoiceValue = totalRevenue / invoices.length;

        // Group by customer
        const customerData = invoices.reduce((acc, invoice) => {
          const customerName = invoice.customer_name || 'Unbekannter Kunde';
          
          if (!acc[customerName]) {
            acc[customerName] = {
              name: customerName,
              totalRevenue: 0,
              invoiceCount: 0
            };
          }
          
          acc[customerName].totalRevenue += invoice.total || 0;
          acc[customerName].invoiceCount += 1;
          
          return acc;
        }, {} as Record<string, any>);

        // Get top 10 customers
        const topCustomers = Object.values(customerData)
          .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
          .slice(0, 10);

        // Group by month for chart
        const monthlyData = invoices.reduce((acc, invoice) => {
          const month = format(new Date(invoice.issue_date), 'yyyy-MM');
          
          if (!acc[month]) {
            acc[month] = { month, revenue: 0 };
          }
          
          acc[month].revenue += invoice.total || 0;
          
          return acc;
        }, {} as Record<string, any>);

        const monthlyChartData = Object.values(monthlyData)
          .sort((a: any, b: any) => a.month.localeCompare(b.month))
          .slice(-12); // Last 12 months

        setData({
          totalRevenue,
          paidInvoicesCount: invoices.length,
          averageInvoiceValue,
          monthlyData: monthlyChartData,
          topCustomers
        });

      } catch (error) {
        console.error('Error loading reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReportsData();
  }, [vendor?.id]);

  if (loading) {
    return (
      <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Berichte werden geladen...</h1>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="w-full max-w-full">
        <h1 className="text-2xl sm:text-3xl font-bold truncate">Berichte & Analysen</h1>
      </div>
      
      {/* Summary Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="w-full min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base truncate">Gesamtumsatz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold break-words">
              CHF {data.totalRevenue.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        
        <Card className="w-full min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base truncate">Bezahlte Rechnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold">{data.paidInvoicesCount}</p>
          </CardContent>
        </Card>
        
        <Card className="w-full min-w-0 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base truncate">Durchschnittlicher Rechnungswert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold break-words">
              CHF {data.averageInvoiceValue.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      {data.monthlyData.length > 0 && (
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg truncate">Monatliche Umsatzentwicklung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `CHF ${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`CHF ${value.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`, 'Umsatz']}
                    labelFormatter={(label) => `Monat: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Customers */}
      {data.topCustomers.length > 0 && (
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg truncate">Top Kunden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topCustomers.slice(0, 5).map((customer, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.invoiceCount} Rechnungen</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">CHF {customer.totalRevenue.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data Message */}
      {data.paidInvoicesCount === 0 && (
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg truncate">Keine Daten verfügbar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <p className="text-sm sm:text-base break-words">
                Es wurden noch keine bezahlten Rechnungen gefunden. Erstellen Sie Rechnungen und markieren Sie sie als bezahlt, um Berichte zu sehen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}