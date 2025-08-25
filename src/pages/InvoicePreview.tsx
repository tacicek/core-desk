import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Send, Edit, CheckCircle } from 'lucide-react';
import { Invoice } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { SwissQRBill } from '@/components/invoice/SwissQRBill';
import { generateInvoicePDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { EmailService } from '@/lib/emailService';
import { formatCurrency } from '@/lib/formatters';

const statusLabels = {
  draft: 'Entwurf',
  sent: 'Offen',
  paid: 'Bezahlt',
  overdue: 'Überfällig'
};

const statusColors = {
  draft: 'secondary',
  sent: 'default',
  paid: 'default',
  overdue: 'destructive'
} as const;

export default function InvoicePreview() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const loadInvoice = async () => {
      try {
        console.log('Loading invoice from Supabase, ID:', id);
        
        // First, fetch the invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (invoiceError) {
          console.error('Error loading invoice:', invoiceError);
          toast.error('Fehler beim Laden der Rechnung');
          return;
        }
        
        if (!invoiceData) {
          console.log('Invoice not found in Supabase');
          return;
        }
        
        // Then, fetch the invoice items
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', id);
        
        if (itemsError) {
          console.error('Error loading invoice items:', itemsError);
          toast.error('Fehler beim Laden der Rechnungspositionen');
          return;
        }
        
        // Transform the data to match Frontend Invoice interface
        const transformedInvoice: Invoice = {
          id: invoiceData.id,
          number: invoiceData.invoice_no,
          invoiceNumber: invoiceData.invoice_no,
          customerName: invoiceData.customer_name || '',
          customerEmail: invoiceData.customer_email || '',
          date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
          dueDate: invoiceData.due_date || new Date().toISOString().split('T')[0],
          items: (itemsData || []).map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.qty,
            unitPrice: item.unit_price,
            taxRate: item.tax_rate,
            total: item.line_total
          })),
          subtotal: invoiceData.subtotal,
          taxTotal: invoiceData.tax_total,
          total: invoiceData.total,
          status: invoiceData.status as 'draft' | 'sent' | 'paid' | 'overdue',
          notes: invoiceData.notes || '',
          createdAt: invoiceData.created_at || new Date().toISOString(),
          updatedAt: invoiceData.updated_at || new Date().toISOString()
        };
        
        console.log('Transformed invoice:', transformedInvoice);
        setInvoice(transformedInvoice);
      } catch (error) {
        console.error('Error in loadInvoice:', error);
        toast.error('Fehler beim Laden der Rechnung');
      }
    };
    
    loadInvoice();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      console.log('Starting PDF generation for invoice:', invoice.number);
      console.log('Invoice data passed to PDF generator:', JSON.stringify(invoice, null, 2));
      console.log('Customer data in invoice:', invoice.customerName);
      console.log('Due date calculation:', {
        invoiceDate: invoice.date,
        dueDate: invoice.dueDate,
        diffDays: Math.ceil(Math.abs(new Date(invoice.dueDate).getTime() - new Date(invoice.date).getTime()) / (1000 * 60 * 60 * 24))
      });
      toast.loading('PDF wird erstellt...', { id: 'pdf-generation' });
      await generateInvoicePDF(invoice);
      console.log('PDF generation completed successfully');
      toast.success('PDF erfolgreich heruntergeladen', { id: 'pdf-generation' });
    } catch (error) {
      console.error('PDF generation error:', error);
      console.error('Error details:', error);
      toast.error('Fehler beim Erstellen der PDF', { id: 'pdf-generation' });
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;
    
    try {
      // Send email first
      const emailSent = await EmailService.sendInvoiceEmail(invoice);
      
      if (emailSent) {
        // Update invoice status to sent in Supabase
        const { error } = await supabase
          .from('invoices')
          .update({ status: 'sent' })
          .eq('id', invoice.id);
        
        if (error) {
          console.error('Error updating invoice status:', error);
          toast.error('Fehler beim Aktualisieren des Status');
          return;
        }
        
        setInvoice({ ...invoice, status: 'sent' });
        toast.success('Rechnung wurde versendet');
        window.dispatchEvent(new CustomEvent('refreshDashboard'));
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(`Fehler beim Senden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    
    try {
      // Update invoice status to paid in Supabase
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoice.id);
      
      if (error) {
        console.error('Error updating invoice status:', error);
        toast.error('Fehler beim Aktualisieren des Status');
        return;
      }
      
      setInvoice({ ...invoice, status: 'paid' });
      toast.success('Rechnung als bezahlt markiert');
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Fehler beim Aktualisieren des Rechnungsstatus');
    }
  };

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Rechnung nicht gefunden</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/dashboard/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Zurück zu Rechnungen</span>
              <span className="sm:hidden">Zurück</span>
            </Button>
          </Link>
          <div>
            <h1 className="font-bold" style={{ fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)' }}>Rechnung {invoice.number}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Erstellt am {invoice.date ? format(new Date(invoice.date), 'dd. MMMM yyyy', { locale: de }) : 'Datum nicht verfügbar'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusColors[invoice.status]}>
            {statusLabels[invoice.status]}
          </Badge>
          <Link to={`/dashboard/invoices/${invoice.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Bearbeiten</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </Link>
          {invoice.status === 'draft' && (
            <Button onClick={handleSendInvoice} size="sm">
              <Send className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Senden</span>
              <span className="sm:hidden">Send</span>
            </Button>
          )}
          {invoice.status === 'sent' && (
            <Button onClick={handleMarkAsPaid} size="sm" variant="outline" className="text-green-600 hover:text-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Als bezahlt markieren</span>
              <span className="sm:hidden">Bezahlt</span>
            </Button>
          )}
          <Button onClick={handleDownloadPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">PDF herunterladen</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Rechnungsdetails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* Customer and Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div>
              <h3 className="font-semibold mb-2">Kunde</h3>
              <div className="space-y-1 text-xs md:text-sm">
                <p className="font-medium">{invoice.customerName}</p>
                <p>{invoice.customerEmail}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Rechnungsinformationen</h3>
              <div className="space-y-1 text-xs md:text-sm">
                <p><span className="font-medium">Rechnungsnummer:</span> {invoice.number}</p>
                <p><span className="font-medium">Rechnungsdatum:</span> {invoice.date ? format(new Date(invoice.date), 'dd.MM.yyyy', { locale: de }) : 'Nicht verfügbar'}</p>
                <p><span className="font-medium">Fälligkeitsdatum:</span> {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: de }) : 'Nicht verfügbar'}</p>
                <p><span className="font-medium">Status:</span> {statusLabels[invoice.status]}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <h3 className="font-semibold mb-4">Rechnungspositionen</h3>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full border-collapse min-w-[600px] md:min-w-0">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 md:py-3 px-2 text-xs md:text-sm font-medium text-muted-foreground">Beschreibung</th>
                    <th className="text-right py-2 md:py-3 px-2 text-xs md:text-sm font-medium text-muted-foreground">Menge</th>
                    <th className="text-right py-2 md:py-3 px-2 text-xs md:text-sm font-medium text-muted-foreground">Einzelpreis</th>
                    <th className="text-right py-2 md:py-3 px-2 text-xs md:text-sm font-medium text-muted-foreground">MwSt.</th>
                    <th className="text-right py-2 md:py-3 px-2 text-xs md:text-sm font-medium text-muted-foreground">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 md:py-3 px-2 text-xs md:text-sm">{item.description}</td>
                      <td className="py-2 md:py-3 px-2 text-xs md:text-sm text-right">{item.quantity}</td>
                      <td className="py-2 md:py-3 px-2 text-xs md:text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 md:py-3 px-2 text-xs md:text-sm text-right">{item.taxRate}%</td>
                      <td className="py-2 md:py-3 px-2 text-xs md:text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-2">
              <div className="flex justify-between text-sm md:text-base">
                <span>Zwischensumme:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm md:text-base">
                <span>MwSt.:</span>
                <span>{formatCurrency(invoice.taxTotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base md:text-lg font-bold">
                <span>Gesamtbetrag:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notizen</h3>
                <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Swiss QR Bill */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4">Schweizer QR-Rechnung</h2>
        <SwissQRBill invoice={invoice} />
      </div>
    </div>
  );
}