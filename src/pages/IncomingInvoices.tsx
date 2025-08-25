import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { InvoiceScanner } from '@/components/invoice/InvoiceScanner';
import { BusinessExpenseManager } from '@/components/expense/BusinessExpenseManager';
import { DailyRevenueManager } from '@/components/revenue/DailyRevenueManager';
import { EmployeeExpenseManager } from '@/components/employee/EmployeeExpenseManager';
import { TaxReport } from '@/components/reports/TaxReport';
import { supabase } from '@/integrations/supabase/client';
import { useVendor } from '@/contexts/VendorContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Trash2
} from 'lucide-react';

interface IncomingInvoice {
  id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  status: string;
  ai_confidence: number;
  needs_review: boolean;
  created_at: string;
}

export default function IncomingInvoices() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<IncomingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');

  const loadInvoices = async () => {
    if (!vendor) return;

    try {
      const { data, error } = await supabase
        .from('incoming_invoices')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Rechnungen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [vendor]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
      case 'paid':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Bezahlt</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Überfällig</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Storniert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      utilities: '⚡',
      office: '🏢',
      travel: '✈️',
      food: '🍽️',
      transport: '🚗',
      healthcare: '🏥',
      insurance: '🛡️',
      rent: '🏠',
      other: '📄'
    };
    return icons[category] || '📄';
  };

  const markAsPaid = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('incoming_invoices')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Erfolgreich",
        description: "Rechnung als bezahlt markiert",
      });

      loadInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren der Rechnung",
        variant: "destructive",
      });
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('incoming_invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Erfolgreich",
        description: "Rechnung wurde gelöscht",
      });

      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen der Rechnung",
        variant: "destructive",
      });
    }
  };

  const calculateStats = () => {
    const pending = invoices.filter(inv => inv.status === 'pending');
    const overdue = invoices.filter(inv => inv.status === 'overdue');
    const totalPending = pending.reduce((sum, inv) => sum + inv.amount, 0);
    const totalOverdue = overdue.reduce((sum, inv) => sum + inv.amount, 0);

    return {
      pendingCount: pending.length,
      overdueCount: overdue.length,
      totalPending,
      totalOverdue
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-clamp-2xl font-bold">Finanzverwaltung</h1>
          <p className="text-clamp-base text-muted-foreground">
            Verwalten Sie alle Geschäftsfinanzen für die Steuererklärung
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-clamp-stat-value font-bold">{invoices.length}</p>
                <p className="text-clamp-stat-subtitle text-muted-foreground">Gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-clamp-stat-value font-bold">{stats.pendingCount}</p>
                <p className="text-clamp-stat-subtitle text-muted-foreground">Offen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-clamp-stat-value font-bold">{stats.overdueCount}</p>
                <p className="text-clamp-stat-subtitle text-muted-foreground">Überfällig</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-clamp-stat-value font-bold">
                  {stats.totalPending.toFixed(0)}
                </p>
                <p className="text-clamp-stat-subtitle text-muted-foreground">CHF offen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="w-full">
          <div className="space-y-4">
            {/* Finanzmanagement Gruppe */}
            <div>
              <h3 className="text-clamp-sm font-medium text-muted-foreground mb-3">Finanzmanagement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <TabsList className="w-full h-auto p-1 bg-muted/50">
                  <TabsTrigger value="expenses" className="w-full flex items-center gap-2 px-3 py-2 text-clamp-xs">
                    <Receipt className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="truncate">Ausgaben</span>
                  </TabsTrigger>
                </TabsList>
                <TabsList className="w-full h-auto p-1 bg-muted/50">
                  <TabsTrigger value="revenue" className="w-full flex items-center gap-2 px-3 py-2 text-clamp-xs">
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="truncate">Umsatz</span>
                  </TabsTrigger>
                </TabsList>
                <TabsList className="w-full h-auto p-1 bg-muted/50">
                  <TabsTrigger value="employees" className="w-full flex items-center gap-2 px-3 py-2 text-clamp-xs">
                    <Receipt className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="truncate">Personal</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Berichte Gruppe */}
            <div>
              <h3 className="text-clamp-sm font-medium text-muted-foreground mb-3">Berichte</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <TabsList className="w-full h-auto p-1 bg-muted/50">
                  <TabsTrigger value="report" className="w-full flex items-center gap-2 px-3 py-2 text-clamp-xs">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="truncate">Steuerbericht</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Werkzeuge Gruppe */}
            <div>
              <h3 className="text-clamp-sm font-medium text-muted-foreground mb-3">Werkzeuge</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <TabsList className="w-full h-auto p-1 bg-muted/50">
                  <TabsTrigger value="scan" className="w-full flex items-center gap-2 px-3 py-2 text-clamp-xs">
                    <Receipt className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="truncate">PDF Scannen</span>
                  </TabsTrigger>
                </TabsList>
                <TabsList className="w-full h-auto p-1 bg-muted/50">
                  <TabsTrigger value="list" className="w-full flex items-center gap-2 px-3 py-2 text-clamp-xs">
                    <Receipt className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="truncate">Rechnungsliste</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>
        </div>

        <TabsContent value="expenses" className="space-y-6">
          <BusinessExpenseManager />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <DailyRevenueManager />
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <EmployeeExpenseManager />
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <TaxReport />
        </TabsContent>

        <TabsContent value="scan" className="space-y-6">
          <InvoiceScanner />
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-clamp-lg">Rechnungsliste</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Noch keine Rechnungen vorhanden</p>
                  <p className="text-sm text-muted-foreground">
                    Verwenden Sie den Rechnungsscanner, um Ihre erste Rechnung hinzuzufügen
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Firma</TableHead>
                        <TableHead className="min-w-[100px]">Rechnung Nr.</TableHead>
                        <TableHead className="min-w-[100px]">Kategorie</TableHead>
                        <TableHead className="min-w-[120px]">Fälligkeitsdatum</TableHead>
                        <TableHead className="min-w-[100px]">Betrag</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="min-w-[120px]">
                            <div className="flex items-center gap-2">
                              {invoice.needs_review && (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                              <span className="font-medium">{invoice.vendor_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[100px]">{invoice.invoice_number}</TableCell>
                          <TableCell className="min-w-[100px]">
                            <div className="flex items-center gap-1">
                              <span>{getCategoryIcon(invoice.category)}</span>
                              <span className="capitalize">{invoice.category}</span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(invoice.due_date).toLocaleDateString('de-DE')}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold min-w-[100px]">
                            {invoice.amount.toFixed(2)} {invoice.currency}
                          </TableCell>
                          <TableCell className="min-w-[80px]">{getStatusBadge(invoice.status)}</TableCell>
                           <TableCell className="min-w-[120px]">
                             <div className="flex items-center gap-2">
                               {invoice.status === 'pending' && (
                                 <Button
                                   size="sm"
                                   onClick={() => markAsPaid(invoice.id)}
                                 >
                                   Bezahlt
                                 </Button>
                               )}
                               <Button
                                 size="sm"
                                 variant="destructive"
                                 onClick={() => deleteInvoice(invoice.id)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}