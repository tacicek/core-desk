import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useVendor } from '@/contexts/VendorContext';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  Calendar,
  BarChart3
} from 'lucide-react';

interface AnnualData {
  year: number;
  category: string;
  total_amount: number;
  entry_count: number;
}

export function AnnualSummaryReport() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const [data, setData] = useState<AnnualData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const loadAnnualData = async () => {
    if (!vendor) return;

    try {
      const year = parseInt(selectedYear);
      
      // Load daily revenue
      const { data: dailyRevenueData, error: dailyError } = await supabase
        .from('daily_revenue')
        .select('amount, currency')
        .eq('vendor_id', vendor.id)
        .gte('revenue_date', `${year}-01-01`)
        .lte('revenue_date', `${year}-12-31`);

      if (dailyError) throw dailyError;

      // Load paid invoices
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('total, tax_total, currency, status')
        .eq('vendor_id', vendor.id)
        .gte('issue_date', `${year}-01-01`)
        .lte('issue_date', `${year}-12-31`)
        .in('status', ['sent', 'paid']);

      if (invoiceError) throw invoiceError;

      // Load business expenses
      const { data: businessExpenseData, error: businessError } = await supabase
        .from('business_expenses')
        .select('amount, net_amount, vat_amount, tax_category')
        .eq('vendor_id', vendor.id)
        .gte('expense_date', `${year}-01-01`)
        .lte('expense_date', `${year}-12-31`);

      if (businessError) throw businessError;

      // Load employee expenses
      const { data: employeeExpenseData, error: employeeError } = await supabase
        .from('employee_expenses')
        .select('amount, currency')
        .eq('vendor_id', vendor.id)
        .gte('expense_date', `${year}-01-01`)
        .lte('expense_date', `${year}-12-31`);

      if (employeeError) throw employeeError;

      // Load incoming invoices
      const { data: incomingInvoiceData, error: incomingError } = await supabase
        .from('incoming_invoices')
        .select('amount, currency')
        .eq('vendor_id', vendor.id)
        .gte('invoice_date', `${year}-01-01`)
        .lte('invoice_date', `${year}-12-31`);

      if (incomingError) throw incomingError;

      // Calculate totals
      const dailyRevenueTotal = dailyRevenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const invoiceRevenueTotal = invoiceData?.filter(inv => inv.status === 'paid').reduce((sum, item) => sum + (item.total || 0), 0) || 0;
      const businessExpenseTotal = businessExpenseData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const employeeExpenseTotal = employeeExpenseData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const incomingInvoiceTotal = incomingInvoiceData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      // Create annual data structure
      const calculatedData: AnnualData[] = [
        {
          year,
          category: 'revenue',
          total_amount: dailyRevenueTotal + invoiceRevenueTotal,
          entry_count: (dailyRevenueData?.length || 0) + (invoiceData?.filter(inv => inv.status === 'paid').length || 0)
        },
        {
          year,
          category: 'business_expenses',
          total_amount: businessExpenseTotal,
          entry_count: businessExpenseData?.length || 0
        },
        {
          year,
          category: 'employee_expenses',
          total_amount: employeeExpenseTotal,
          entry_count: employeeExpenseData?.length || 0
        },
        {
          year,
          category: 'incoming_invoices',
          total_amount: incomingInvoiceTotal,
          entry_count: incomingInvoiceData?.length || 0
        }
      ];

      setData(calculatedData);
    } catch (error) {
      console.error('Error loading annual data:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Jahresbericht",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnualData();
  }, [vendor, selectedYear]);

  const getCategoryData = (category: string) => {
    const categoryData = data.find(d => d.category === category);
    return {
      amount: categoryData?.total_amount || 0,
      count: categoryData?.entry_count || 0
    };
  };

  const revenue = getCategoryData('revenue');
  const businessExpenses = getCategoryData('business_expenses');
  const incomingInvoices = getCategoryData('incoming_invoices');
  const employeeExpenses = getCategoryData('employee_expenses');

  const totalExpenses = businessExpenses.amount + incomingInvoices.amount + employeeExpenses.amount;
  const netProfit = revenue.amount - totalExpenses;
  const profitMargin = revenue.amount > 0 ? (netProfit / revenue.amount) * 100 : 0;

  const availableYears = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'business_expenses':
        return <Receipt className="h-5 w-5 text-orange-600" />;
      case 'incoming_invoices':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'employee_expenses':
        return <Users className="h-5 w-5 text-blue-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'revenue':
        return 'Umsatz';
      case 'business_expenses':
        return 'Geschäftsausgaben';
      case 'incoming_invoices':
        return 'Eingangsrechnungen';
      case 'employee_expenses':
        return 'Mitarbeiter-Ausgaben';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jahresbericht
            </CardTitle>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {revenue.amount.toFixed(0)} CHF
                </p>
                <p className="text-sm text-muted-foreground">Umsatz ({revenue.count} Einträge)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  -{totalExpenses.toFixed(0)} CHF
                </p>
                <p className="text-sm text-muted-foreground">Gesamt Ausgaben</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className={`h-5 w-5 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(0)} CHF
                </p>
                <p className="text-sm text-muted-foreground">Netto Gewinn/Verlust</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Gewinnmarge</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Einnahmen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getCategoryIcon('revenue')}
                  <span className="font-medium">{getCategoryLabel('revenue')}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{revenue.amount.toFixed(2)} CHF</p>
                  <p className="text-sm text-muted-foreground">{revenue.count} Einträge</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Ausgaben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'business_expenses', data: businessExpenses },
                { category: 'incoming_invoices', data: incomingInvoices },
                { category: 'employee_expenses', data: employeeExpenses }
              ].map(({ category, data }) => (
                <div key={category} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="font-medium">{getCategoryLabel(category)}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">-{data.amount.toFixed(2)} CHF</p>
                    <p className="text-sm text-muted-foreground">{data.count} Einträge</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Jahresübersicht {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Gesamt Einnahmen</p>
                <p className="text-2xl font-bold text-green-600">{revenue.amount.toFixed(2)} CHF</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Gesamt Ausgaben</p>
                <p className="text-2xl font-bold text-red-600">{totalExpenses.toFixed(2)} CHF</p>
              </div>
              <div className={`p-4 rounded-lg ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-muted-foreground">Netto Ergebnis</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)} CHF
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}