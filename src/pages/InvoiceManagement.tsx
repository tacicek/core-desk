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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useVendor } from '@/contexts/VendorContext';
import { useToast } from '@/hooks/use-toast';
import { InvoiceUploadArea } from '@/components/invoice/InvoiceUploadArea';
import { InvoiceStatsCards } from '@/components/invoice/InvoiceStatsCards';
import { InvoiceFilters } from '@/components/invoice/InvoiceFilters';
import { InvoiceGrid } from '@/components/invoice/InvoiceGrid';
import { InvoiceDetailView } from '@/components/invoice/InvoiceDetailView';
import { AdvancedInvoiceTable } from '@/components/invoice/AdvancedInvoiceTable';
import { N8nWebhookIntegration } from '@/components/invoice/N8nWebhookIntegration';
import { BusinessExpenseManager } from '@/components/expense/BusinessExpenseManager';
import { 
  Upload,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Search,
  Eye
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
  image_url: string;
  original_filename: string;
  created_at: string;
}

interface FilterState {
  status: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  searchTerm: string;
}

export default function InvoiceManagement() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<IncomingInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<IncomingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<IncomingInvoice | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    searchTerm: ''
  });

  const loadInvoices = async () => {
    if (!vendor) {
      // Set sample data when no vendor is available for demo purposes
      setInvoices([{
        id: '1',
        vendor_name: 'Büro Express AG',
        invoice_number: 'RE-2024-0249',
        invoice_date: '2024-09-23',
        due_date: '2024-10-23',
        amount: 194.40,
        currency: 'CHF',
        description: 'Büromaterial und Druckerpapier für Büroausstattung',
        category: 'Büromaterial',
        status: 'paid',
        ai_confidence: 0.95,
        needs_review: false,
        image_url: '',
        original_filename: 'rechnung_249.pdf',
        created_at: '2024-09-23T16:18:00Z'
      }]);
      setLoading(false);
      return;
    }

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

  const handleInvoiceUpload = async (file: File) => {
    if (!vendor) return;

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vendor_id', vendor.id);

      // Call the scan-invoice edge function
      const { data, error } = await supabase.functions.invoke('scan-invoice', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Rechnung wurde hochgeladen und wird analysiert",
      });

      // Reload invoices to show the new one
      loadInvoices();

    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hochladen der Rechnung",
        variant: "destructive",
      });
    }
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
        title: "Erfolg",
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
        title: "Erfolg",
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

  const applyFilters = () => {
    let filtered = [...invoices];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.invoice_date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.invoice_date) <= new Date(filters.dateTo)
      );
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(invoice => invoice.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(invoice => invoice.amount <= parseFloat(filters.maxAmount));
    }

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.vendor_name?.toLowerCase().includes(searchLower) ||
        invoice.invoice_number?.toLowerCase().includes(searchLower) ||
        invoice.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleViewDetails = (invoice: IncomingInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailDialog(true);
  };

  useEffect(() => {
    loadInvoices();
  }, [vendor]);

  useEffect(() => {
    applyFilters();
  }, [invoices, filters]);

  const calculateStats = () => {
    const total = filteredInvoices.length;
    const pending = filteredInvoices.filter(inv => inv.status === 'pending').length;
    const overdue = filteredInvoices.filter(inv => {
      const today = new Date();
      const dueDate = new Date(inv.due_date);
      return inv.status === 'pending' && dueDate < today;
    }).length;
    const totalAmount = filteredInvoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return { total, pending, overdue, totalAmount };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rechnungsverwaltung</h1>
            <p className="text-muted-foreground">
              Rechnungen hochladen, mit KI analysieren, verwalten und Geschäftsausgaben erfassen
            </p>
          </div>
        </div>

        {/* Business Expenses Section */}
        <Card>
          <CardHeader>
            <CardTitle>Geschäftsausgaben</CardTitle>
          </CardHeader>
          <CardContent>
            <BusinessExpenseManager />
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <InvoiceStatsCards 
          total={stats.total}
          pending={stats.pending}
          overdue={stats.overdue}
          totalAmount={stats.totalAmount}
        />

        {/* N8n Integration */}
        <N8nWebhookIntegration />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </CardContent>
        </Card>

        {/* Invoice Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Rechnungen ({filteredInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceGrid
              invoices={filteredInvoices}
              onViewDetails={handleViewDetails}
              onMarkAsPaid={markAsPaid}
              onDelete={deleteInvoice}
            />
          </CardContent>
        </Card>

        {/* Advanced Table for Accountants */}
        <AdvancedInvoiceTable 
          invoices={invoices}
          onInvoicesChange={loadInvoices}
        />

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Rechnungsdetails
              </DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <InvoiceDetailView 
                invoice={selectedInvoice}
                onMarkAsPaid={markAsPaid}
                onClose={() => setShowDetailDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}