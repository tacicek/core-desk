import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Trash2, 
  Download, 
  Mail, 
  FileSpreadsheet,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceDetailModal } from './InvoiceDetailModal';

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

interface AdvancedInvoiceTableProps {
  invoices: IncomingInvoice[];
  onInvoicesChange: () => void;
}

type FilterPeriod = 'all' | 'current-year' | 'last-year' | 'q1' | 'q2' | 'q3' | 'q4' | 'h1' | 'h2' | 'custom';

export function AdvancedInvoiceTable({ invoices, onInvoicesChange }: AdvancedInvoiceTableProps) {
  const { toast } = useToast();
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Get available years from invoices
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    invoices.forEach(invoice => {
      const year = new Date(invoice.invoice_date).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort().reverse();
  }, [invoices]);

  // Filter invoices based on selected period
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];
    const currentYear = parseInt(filterYear);

    switch (filterPeriod) {
      case 'current-year':
        filtered = filtered.filter(invoice => 
          new Date(invoice.invoice_date).getFullYear() === new Date().getFullYear()
        );
        break;
      case 'last-year':
        filtered = filtered.filter(invoice => 
          new Date(invoice.invoice_date).getFullYear() === new Date().getFullYear() - 1
        );
        break;
      case 'q1':
        filtered = filtered.filter(invoice => {
          const date = new Date(invoice.invoice_date);
          return date.getFullYear() === currentYear && date.getMonth() >= 0 && date.getMonth() <= 2;
        });
        break;
      case 'q2':
        filtered = filtered.filter(invoice => {
          const date = new Date(invoice.invoice_date);
          return date.getFullYear() === currentYear && date.getMonth() >= 3 && date.getMonth() <= 5;
        });
        break;
      case 'q3':
        filtered = filtered.filter(invoice => {
          const date = new Date(invoice.invoice_date);
          return date.getFullYear() === currentYear && date.getMonth() >= 6 && date.getMonth() <= 8;
        });
        break;
      case 'q4':
        filtered = filtered.filter(invoice => {
          const date = new Date(invoice.invoice_date);
          return date.getFullYear() === currentYear && date.getMonth() >= 9 && date.getMonth() <= 11;
        });
        break;
      case 'h1':
        filtered = filtered.filter(invoice => {
          const date = new Date(invoice.invoice_date);
          return date.getFullYear() === currentYear && date.getMonth() >= 0 && date.getMonth() <= 5;
        });
        break;
      case 'h2':
        filtered = filtered.filter(invoice => {
          const date = new Date(invoice.invoice_date);
          return date.getFullYear() === currentYear && date.getMonth() >= 6 && date.getMonth() <= 11;
        });
        break;
      case 'custom':
        if (customDateFrom && customDateTo) {
          filtered = filtered.filter(invoice => {
            const invoiceDate = new Date(invoice.invoice_date);
            return invoiceDate >= new Date(customDateFrom) && invoiceDate <= new Date(customDateTo);
          });
        }
        break;
    }

    return filtered.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
  }, [invoices, filterPeriod, filterYear, customDateFrom, customDateTo]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invoiceId]);
    } else {
      setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedInvoices.length === 0) return;

    try {
      const { error } = await supabase
        .from('incoming_invoices')
        .delete()
        .in('id', selectedInvoices);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: `${selectedInvoices.length} Rechnungen wurden gelöscht`,
      });

      setSelectedInvoices([]);
      onInvoicesChange();
    } catch (error) {
      console.error('Error deleting invoices:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen der Rechnungen",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSingle = async (invoiceId: string) => {
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

      onInvoicesChange();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen der Rechnung",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      const exportData = filteredInvoices.map(invoice => ({
        'Firmenname': invoice.vendor_name,
        'Rechnungsnummer': invoice.invoice_number,
        'Rechnungsdatum': format(new Date(invoice.invoice_date), 'dd.MM.yyyy'),
        'Betrag': invoice.amount,
        'Währung': invoice.currency,
        'Status': getStatusText(invoice.status),
        'Kategorie': invoice.category,
        'Beschreibung': invoice.description,
        'KI-Vertrauen': `${(invoice.ai_confidence * 100).toFixed(0)}%`,
        'Überprüfung erforderlich': invoice.needs_review ? 'Ja' : 'Nein',
        'Erstellt': format(new Date(invoice.created_at), 'dd.MM.yyyy HH:mm')
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rechnungen');

      // Add some styling
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ c: C, r: R });
          if (!worksheet[cell_address]) continue;
          
          if (R === 0) {
            // Header row styling
            worksheet[cell_address].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: "CCCCCC" } }
            };
          }
        }
      }

      const fileName = `Rechnungen_${getPeriodText()}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export erfolgreich",
        description: `Excel-Datei wurde heruntergeladen: ${fileName}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export-Fehler",
        description: "Fehler beim Erstellen der Excel-Datei",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const sendEmail = async () => {
    if (!emailAddress) {
      toast({
        title: "E-Mail-Adresse erforderlich",
        description: "Bitte geben Sie eine E-Mail-Adresse ein",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      // Create Excel file as blob
      const exportData = filteredInvoices.map(invoice => ({
        'Firmenname': invoice.vendor_name,
        'Rechnungsnummer': invoice.invoice_number,
        'Rechnungsdatum': format(new Date(invoice.invoice_date), 'dd.MM.yyyy'),
        'Betrag': invoice.amount,
        'Währung': invoice.currency,
        'Status': getStatusText(invoice.status),
        'Kategorie': invoice.category,
        'Beschreibung': invoice.description,
        'KI-Vertrauen': `${(invoice.ai_confidence * 100).toFixed(0)}%`,
        'Überprüfung erforderlich': invoice.needs_review ? 'Ja' : 'Nein',
        'Erstellt': format(new Date(invoice.created_at), 'dd.MM.yyyy HH:mm')
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rechnungen');

      // Convert to base64 for email attachment
      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const excelBase64 = btoa(String.fromCharCode(...new Uint8Array(excelBuffer)));

      const { data, error } = await supabase.functions.invoke('send-invoice-report', {
        body: {
          to: emailAddress,
          period: getPeriodText(),
          invoicesCount: filteredInvoices.length,
          totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0),
          attachment: {
            filename: `Rechnungen_${getPeriodText()}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`,
            content: excelBase64
          }
        }
      });

      if (error) throw error;

      toast({
        title: "E-Mail gesendet",
        description: `Rechnungsübersicht wurde an ${emailAddress} gesendet`,
      });

      setEmailAddress('');
    } catch (error) {
      console.error('Email error:', error);
      toast({
        title: "E-Mail-Fehler",
        description: "Fehler beim Senden der E-Mail",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Ausstehend
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Bezahlt
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Überfällig
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'paid': return 'Bezahlt';
      case 'overdue': return 'Überfällig';
      default: return status;
    }
  };

  const getPeriodText = () => {
    switch (filterPeriod) {
      case 'current-year': return `Jahr_${new Date().getFullYear()}`;
      case 'last-year': return `Jahr_${new Date().getFullYear() - 1}`;
      case 'q1': return `Q1_${filterYear}`;
      case 'q2': return `Q2_${filterYear}`;
      case 'q3': return `Q3_${filterYear}`;
      case 'q4': return `Q4_${filterYear}`;
      case 'h1': return `H1_${filterYear}`;
      case 'h2': return `H2_${filterYear}`;
      case 'custom': return 'Benutzerdefiniert';
      default: return 'Alle';
    }
  };

  // Sample invoice detail data for demonstration
  const createSampleInvoiceDetail = (invoice: IncomingInvoice) => ({
    ...invoice,
    vendor_address: "Muster Straße 123\n8001 Zürich\nSchweiz",
    vendor_tax_number: "CHE-123.456.789",
    payment_date: invoice.status === 'paid' ? invoice.due_date : undefined,
    line_items: [
      {
        id: '1',
        description: 'Büromaterial Paket Standard',
        quantity: 2,
        unit_price: 45.50,
        vat_rate: 7.7,
        vat_amount: 7.00,
        total_amount: 98.00
      },
      {
        id: '2',
        description: 'Druckerpapier A4, 500 Blatt',
        quantity: 5,
        unit_price: 12.90,
        vat_rate: 7.7,
        vat_amount: 4.97,
        total_amount: 69.47
      },
      {
        id: '3',
        description: 'Kugelschreiber Set (10 Stück)',
        quantity: 1,
        unit_price: 25.00,
        vat_rate: 7.7,
        vat_amount: 1.93,
        total_amount: 26.93
      }
    ],
    subtotal: invoice.amount * 0.928,
    total_vat: invoice.amount * 0.072,
    total_amount: invoice.amount
  });

  const handleViewDetails = (invoice: IncomingInvoice) => {
    const detailData = createSampleInvoiceDetail(invoice);
    setSelectedInvoiceForDetail(detailData);
    setIsDetailModalOpen(true);
  };

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Rechnungstabelle für Steuerberater ({filteredInvoices.length} Rechnungen)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Zeitraum</Label>
            <Select value={filterPeriod} onValueChange={(value: FilterPeriod) => setFilterPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="current-year">Aktuelles Jahr</SelectItem>
                <SelectItem value="last-year">Letztes Jahr</SelectItem>
                <SelectItem value="q1">Q1 - Erstes Quartal</SelectItem>
                <SelectItem value="q2">Q2 - Zweites Quartal</SelectItem>
                <SelectItem value="q3">Q3 - Drittes Quartal</SelectItem>
                <SelectItem value="q4">Q4 - Viertes Quartal</SelectItem>
                <SelectItem value="h1">H1 - Erste Jahreshälfte</SelectItem>
                <SelectItem value="h2">H2 - Zweite Jahreshälfte</SelectItem>
                <SelectItem value="custom">Benutzerdefiniert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(filterPeriod.startsWith('q') || filterPeriod.startsWith('h')) && (
            <div className="space-y-2">
              <Label>Jahr</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterPeriod === 'custom' && (
            <>
              <div className="space-y-2">
                <Label>Von</Label>
                <Input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bis</Label>
                <Input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Anzahl Rechnungen</p>
            <p className="text-2xl font-bold">{filteredInvoices.length}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Gesamtbetrag</p>
            <p className="text-2xl font-bold">{totalAmount.toFixed(2)} CHF</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Zeitraum</p>
            <p className="text-2xl font-bold">{getPeriodText()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            {selectedInvoices.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {selectedInvoices.length} Löschen
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToExcel}
              disabled={isExporting || filteredInvoices.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportiere...' : 'Excel Export'}
            </Button>
            
            <div className="flex gap-2 items-center">
              <Input
                placeholder="E-Mail-Adresse für Steuerberater"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-64"
                type="email"
              />
              <Button 
                size="sm" 
                onClick={sendEmail}
                disabled={isSendingEmail || filteredInvoices.length === 0 || !emailAddress}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSendingEmail ? 'Sende...' : 'Per E-Mail senden'}
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Firmenname</TableHead>
                <TableHead>Rechnungsnr.</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Zahlungsdatum</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>KI-Vertrauen</TableHead>
                <TableHead className="w-12">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Keine Rechnungen für den ausgewählten Zeitraum gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.id)}
                        onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.vendor_name || 'Unbekannt'}
                    </TableCell>
                    <TableCell>{invoice.invoice_number || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell>
                      {invoice.status === 'paid' && invoice.due_date 
                        ? format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: de })
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.amount.toFixed(2)} {invoice.currency}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>{invoice.category}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.ai_confidence > 0.8 ? 'default' : 'secondary'}>
                        {(invoice.ai_confidence * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                          <DropdownMenuItem 
                            onClick={() => handleViewDetails(invoice)}
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Details anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSingle(invoice.id)}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <InvoiceDetailModal 
          invoice={selectedInvoiceForDetail}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInvoiceForDetail(null);
          }}
        />
      </CardContent>
    </Card>
  );
}