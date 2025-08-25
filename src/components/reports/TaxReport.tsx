
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useVendor } from '@/contexts/VendorContext';
import { useToast } from '@/hooks/use-toast';
// Customer functionality removed
import { 
  FileText, 
  Printer, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  Users,
  Calendar,
  Calculator
} from 'lucide-react';

interface TaxReportData {
  // Revenue data
  totalRevenue: number;
  revenueCount: number;
  
  // Business expenses
  totalBusinessExpenses: number;
  businessExpensesCount: number;
  businessExpensesByCategory: Array<{
    tax_category: string;
    category_name: string;
    total_net: number;
    total_vat: number;
    total_amount: number;
    expense_count: number;
  }>;
  
  // Incoming invoices (business costs)
  totalIncomingInvoices: number;
  incomingInvoicesCount: number;
  
  // Employee expenses
  totalEmployeeExpenses: number;
  employeeExpensesCount: number;
  
  // Outgoing invoices (our sales)
  totalOutgoingInvoices: number;
  outgoingInvoicesCount: number;
  totalVATCollected: number;
  
  // Net calculations
  netProfit: number;
  totalVATPaid: number;
  vatBalance: number;
}

export function TaxReport() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const [data, setData] = useState<TaxReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const loadTaxData = async () => {
    if (!vendor) return;

    try {
      setLoading(true);
      console.log('Loading tax data from Supabase...');

      // Load invoices from Supabase
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('vendor_id', vendor.id);

      if (error) {
        console.error('Error loading invoices:', error);
        return;
      }

      console.log('Loaded invoices from Supabase:', invoiceData);
      
      // Filter invoices for the selected year and ONLY paid status
      const yearInvoices = invoiceData.filter((invoice: any) => {
        const invoiceDate = new Date(invoice.date);
        const invoiceYear = invoiceDate.getFullYear().toString();
        // Only include PAID invoices, exclude draft and sent
        return invoiceYear === selectedYear && invoice.status === 'paid';
      });

      // Calculate invoice totals
      const totalOutgoingInvoices = yearInvoices.reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0);
      const totalVATCollected = yearInvoices.reduce((sum: number, invoice: any) => sum + (invoice.taxTotal || 0), 0);
      const outgoingInvoicesCount = yearInvoices.length;

      // Load incoming invoices from Supabase (from invoice management system)
      const startOfYear = `${selectedYear}-01-01`;
      const endOfYear = `${selectedYear}-12-31`;

      const { data: incomingInvoices, error: incomingError } = await supabase
        .from('incoming_invoices')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('invoice_date', startOfYear)
        .lte('invoice_date', endOfYear);

      if (incomingError) {
        console.error('Error loading incoming invoices:', incomingError);
        throw incomingError;
      }

      const totalIncomingInvoices = incomingInvoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const incomingInvoicesCount = incomingInvoices?.length || 0;

      // Load business expenses from Supabase
      const { data: businessExpenses, error: businessError } = await supabase
        .from('business_expenses')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('expense_date', startOfYear)
        .lte('expense_date', endOfYear);

      if (businessError) {
        console.error('Error loading business expenses:', businessError);
        throw businessError;
      }

      const totalBusinessExpenses = businessExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const businessExpensesCount = businessExpenses?.length || 0;
      const totalVATPaid = businessExpenses?.reduce((sum, exp) => sum + (exp.vat_amount || 0), 0) || 0;

      // Group business expenses by category
      const businessExpensesByCategory = businessExpenses?.reduce((acc: any[], exp) => {
        const existingCategory = acc.find(cat => cat.tax_category === exp.tax_category);
        if (existingCategory) {
          existingCategory.total_amount += exp.amount;
          existingCategory.total_net += exp.net_amount || 0;
          existingCategory.total_vat += exp.vat_amount || 0;
          existingCategory.expense_count += 1;
        } else {
          acc.push({
            tax_category: exp.tax_category,
            category_name: exp.tax_category,
            total_amount: exp.amount,
            total_net: exp.net_amount || 0,
            total_vat: exp.vat_amount || 0,
            expense_count: 1
          });
        }
        return acc;
      }, []) || [];

      // Load daily revenue from Supabase
      const { data: dailyRevenue, error: revenueError } = await supabase
        .from('daily_revenue')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('revenue_date', startOfYear)
        .lte('revenue_date', endOfYear);

      if (revenueError) {
        console.error('Error loading daily revenue:', revenueError);
        throw revenueError;
      }

      const totalRevenue = dailyRevenue?.reduce((sum, rev) => sum + rev.amount, 0) || 0;
      const revenueCount = dailyRevenue?.length || 0;

      // Load employee expenses from Supabase
      const { data: employeeExpenses, error: employeeError } = await supabase
        .from('employee_expenses')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('expense_date', startOfYear)
        .lte('expense_date', endOfYear);

      if (employeeError) {
        console.error('Error loading employee expenses:', employeeError);
        throw employeeError;
      }

      const totalEmployeeExpenses = employeeExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const employeeExpensesCount = employeeExpenses?.length || 0;

      const totalExpenses = totalBusinessExpenses + totalIncomingInvoices + totalEmployeeExpenses;
      const netProfit = totalRevenue + totalOutgoingInvoices - totalExpenses;
      const vatBalance = totalVATCollected - totalVATPaid;

      console.log(`Tax data for ${selectedYear}:`, {
        totalRevenue,
        totalOutgoingInvoices,
        totalIncomingInvoices,
        totalBusinessExpenses,
        totalEmployeeExpenses,
        netProfit
      });

      setData({
        totalRevenue,
        revenueCount,
        totalBusinessExpenses,
        businessExpensesCount,
        businessExpensesByCategory,
        totalIncomingInvoices,
        incomingInvoicesCount,
        totalEmployeeExpenses,
        employeeExpensesCount,
        totalOutgoingInvoices,
        outgoingInvoicesCount,
        totalVATCollected,
        netProfit,
        totalVATPaid,
        vatBalance
      });

    } catch (error) {
      console.error('Error loading tax data:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Steuerdaten",
        variant: "destructive",
      });
      setData({
        totalRevenue: 0,
        revenueCount: 0,
        totalBusinessExpenses: 0,
        businessExpensesCount: 0,
        businessExpensesByCategory: [],
        totalIncomingInvoices: 0,
        incomingInvoicesCount: 0,
        totalEmployeeExpenses: 0,
        employeeExpensesCount: 0,
        totalOutgoingInvoices: 0,
        outgoingInvoicesCount: 0,
        totalVATCollected: 0,
        netProfit: 0,
        totalVATPaid: 0,
        vatBalance: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxData();
  }, [selectedYear, vendor]);

  // Listen for invoice changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage changed, reloading tax data...');
      loadTaxData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('refreshDashboard', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('refreshDashboard', handleStorageChange);
    };
  }, [selectedYear]);

  const availableYears = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  const formatCurrency = (amount: number) => {
    return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Keine Steuerdaten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Steuerbericht {selectedYear}</h2>
            <p className="text-muted-foreground">Vollständige Steuerübersicht für die Steuererklärung</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </Button>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Steuerbericht {selectedYear}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Erstellt am: {new Date().toLocaleDateString('de-CH')}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="print:hidden">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Einnahmen
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Ausgaben
          </TabsTrigger>
          <TabsTrigger value="vat" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Mehrwertsteuer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(data.totalRevenue + data.totalOutgoingInvoices)}
                    </p>
                    <p className="text-sm text-muted-foreground">Gesamt Einnahmen</p>
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
                      {formatCurrency(data.totalBusinessExpenses + data.totalIncomingInvoices + data.totalEmployeeExpenses)}
                    </p>
                    <p className="text-sm text-muted-foreground">Gesamt Ausgaben</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calculator className={`h-5 w-5 ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.netProfit)}
                    </p>
                    <p className="text-sm text-muted-foreground">Netto Gewinn/Verlust</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className={`h-5 w-5 ${data.vatBalance >= 0 ? 'text-red-600' : 'text-green-600'}`} />
                  <div>
                    <p className={`text-2xl font-bold ${data.vatBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(data.vatBalance))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.vatBalance >= 0 ? 'MwSt. zu zahlen' : 'MwSt. Guthaben'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overview Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Steuerübersicht {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-base font-semibold text-green-600">Einnahmen</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Umsatz (Tagesgeschäft)</span>
                      <span className="font-medium">{formatCurrency(data.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rechnungen (Verkäufe)</span>
                      <span className="font-medium">{formatCurrency(data.totalOutgoingInvoices)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Gesamt Einnahmen</span>
                      <span className="font-semibold">{formatCurrency(data.totalRevenue + data.totalOutgoingInvoices)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-semibold text-red-600">Ausgaben</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Geschäftsausgaben</span>
                      <span className="font-medium">{formatCurrency(data.totalBusinessExpenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eingangsrechnungen</span>
                      <span className="font-medium">{formatCurrency(data.totalIncomingInvoices)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mitarbeiterausgaben</span>
                      <span className="font-medium">{formatCurrency(data.totalEmployeeExpenses)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Gesamt Ausgaben</span>
                      <span className="font-semibold">{formatCurrency(data.totalBusinessExpenses + data.totalIncomingInvoices + data.totalEmployeeExpenses)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-green-600">Tagesgeschäft (Umsatz)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground">{data.revenueCount} Einträge</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-green-600">Rechnungen (Verkäufe)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(data.totalOutgoingInvoices)}</p>
                  <p className="text-sm text-muted-foreground">{data.outgoingInvoicesCount} Rechnungen</p>
                  <p className="text-xs text-muted-foreground">MwSt. gesammelt: {formatCurrency(data.totalVATCollected)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {/* Business Expenses by Category */}
          {data.businessExpensesByCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Geschäftsausgaben nach Kategorie</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">Anzahl</TableHead>
                      <TableHead className="text-right">Netto</TableHead>
                      <TableHead className="text-right">MwSt.</TableHead>
                      <TableHead className="text-right">Brutto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.businessExpensesByCategory.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{category.category_name || category.tax_category}</TableCell>
                        <TableCell className="text-right">{category.expense_count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.total_net)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.total_vat)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(category.total_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Other Expenses */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-red-600">Eingangsrechnungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalIncomingInvoices)}</p>
                  <p className="text-sm text-muted-foreground">{data.incomingInvoicesCount} Rechnungen</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-red-600">Mitarbeiterausgaben</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalEmployeeExpenses)}</p>
                  <p className="text-sm text-muted-foreground">{data.employeeExpensesCount} Einträge</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-red-600">Gesamt Ausgaben</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(data.totalBusinessExpenses + data.totalIncomingInvoices + data.totalEmployeeExpenses)}
                  </p>
                  <p className="text-sm text-muted-foreground">Alle Kategorien</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vat" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-blue-600">MwSt. Berechnung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>MwSt. eingenommen (Verkäufe)</span>
                    <span className="font-medium text-red-600">+{formatCurrency(data.totalVATCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MwSt. bezahlt (Einkäufe)</span>
                    <span className="font-medium text-green-600">-{formatCurrency(data.totalVATPaid)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-semibold">MwSt. Saldo</span>
                    <span className={`font-semibold ${data.vatBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {data.vatBalance >= 0 ? '+' : ''}{formatCurrency(data.vatBalance)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {data.vatBalance >= 0 
                      ? 'Positiver Saldo = MwSt. an Steuerverwaltung zu zahlen'
                      : 'Negativer Saldo = MwSt. Guthaben von Steuerverwaltung'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-blue-600">MwSt. Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">
                      {data.vatBalance >= 0 ? 'Zu zahlen' : 'Guthaben'}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(Math.abs(data.vatBalance))}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Basis: Standard MwSt.-Satz von 8.1%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
