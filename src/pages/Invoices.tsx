import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Download, Edit, CheckCircle, Settings, Mail, Trash2, Send, Copy } from "lucide-react";
import { Invoice } from "@/types";
import { invoiceStorage, invoiceNumberGenerator } from "@/lib/invoice-storage";
import { generateInvoicePDF } from "@/lib/pdfGenerator";
import { EmailService } from "@/lib/emailService";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { InvoiceEmailModal } from "@/components/invoice/InvoiceEmailModal";

const statusLabels = {
  draft: 'Entwurf',
  sent: 'Offen', 
  paid: 'Bezahlt',
  overdue: 'Überfällig'
};

const statusColors = {
  draft: 'secondary',
  sent: 'default',
  paid: 'success',
  overdue: 'destructive'
} as const;

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const loadInvoices = async () => {
    try {
      console.log('Loading invoices from Supabase...');
      setLoading(true);
      
      const allInvoices = await invoiceStorage.getAll();
      console.log('Loaded invoices from Supabase:', allInvoices);
      
      // Sort by date (newest first)
      const sortedInvoices = allInvoices.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setInvoices(sortedInvoices);
      
      // Apply status filter from URL
      const statusFilter = searchParams.get('status');
      let filtered = sortedInvoices;
      
      if (statusFilter) {
        if (statusFilter === 'overdue') {
          filtered = sortedInvoices.filter(inv => isOverdue(inv));
        } else {
          filtered = sortedInvoices.filter(inv => inv.status === statusFilter);
        }
      }
      
      setFilteredInvoices(filtered);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Fehler beim Laden der Rechnungen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [searchParams]);

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'paid') return false;
    if (invoice.status === 'draft') return false;
    if (invoice.status !== 'sent') return false;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      toast.loading('PDF wird erstellt...', { id: `pdf-${invoice.id}` });
      await generateInvoicePDF(invoice);
      
      // If invoice is draft, change status to sent when downloading
      if (invoice.status === 'draft') {
        await invoiceStorage.update(invoice.id, { status: 'sent' });
        await loadInvoices(); // Reload to get updated data
      }
      
      toast.success('PDF erfolgreich heruntergeladen', { id: `pdf-${invoice.id}` });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Fehler beim Erstellen der PDF', { id: `pdf-${invoice.id}` });
    }
  };

  const handleEdit = (invoice: Invoice) => {
    navigate(`/dashboard/invoices/${invoice.id}/edit`);
  };

  const handleSendReminderEmail = async (invoice: Invoice) => {
    try {
      toast.loading('E-Mail wird gesendet...', { id: `email-${invoice.id}` });
      
      // Call the Supabase edge function to send reminder email
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          type: 'reminder',
          itemId: invoice.id,
          to: invoice.customerEmail || 'customer@example.com' // Fallback if no email
        }
      });

      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
      
      toast.success('Zahlungserinnerung gesendet', { id: `email-${invoice.id}` });
      
    } catch (error) {
      console.error('Error sending reminder email:', error);
      toast.error('Fehler beim Senden der E-Mail', { id: `email-${invoice.id}` });
    }
  };

  const handleOpenEmailModal = (invoice: Invoice) => {
    if (!invoice.customerEmail) {
      toast.error('Kunde hat keine E-Mail-Adresse');
      return;
    }
    setSelectedInvoiceForEmail(invoice);
    setEmailModalOpen(true);
  };

  const handleSendInvoiceEmail = async (emailData: { to: string; subject: string; message: string }) => {
    if (!selectedInvoiceForEmail) return;

    try {
      toast.loading('E-Mail wird gesendet...', { id: `email-${selectedInvoiceForEmail.id}` });
      
      // Send email with custom subject and message
      const emailSent = await EmailService.sendInvoiceEmail(selectedInvoiceForEmail);
      
      if (emailSent) {
        await invoiceStorage.update(selectedInvoiceForEmail.id, { status: 'sent' });
        await loadInvoices(); // Reload to get updated data
        toast.success(`Rechnung an ${emailData.to} gesendet`, { id: `email-${selectedInvoiceForEmail.id}` });
      } else {
        toast.error('E-Mail wurde nicht gesendet', { id: `email-${selectedInvoiceForEmail.id}` });
      }
      
    } catch (error) {
      console.error('Error sending invoice email:', error);
      toast.error('Fehler beim Senden der E-Mail', { id: `email-${selectedInvoiceForEmail.id}` });
    }
  };

  const handleChangeStatus = async (invoice: Invoice, newStatus: 'draft' | 'sent' | 'paid' | 'overdue') => {
    try {
      await invoiceStorage.update(invoice.id, { status: newStatus });
      await loadInvoices(); // Reload to get updated data
      toast.success(`Status zu "${statusLabels[newStatus]}" geändert`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await invoiceStorage.update(invoice.id, { status: 'paid' });
      await loadInvoices(); // Reload to get updated data
      toast.success('Rechnung als bezahlt markiert');
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      await invoiceStorage.delete(invoice.id);
      await loadInvoices(); // Reload to get updated data
      toast.success('Rechnung erfolgreich gelöscht');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Fehler beim Löschen der Rechnung');
    }
  };

  const handleDuplicateInvoice = async (invoice: Invoice) => {
    try {
      toast.loading('Rechnung wird dupliziert...', { id: `duplicate-${invoice.id}` });
      
      // Generate new invoice number
      const newInvoiceNumber = await invoiceNumberGenerator.getNext();
      
      // Create new invoice with today's date and new due date (30 days from today)
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 30);
      
      // Generate unique IDs with fallback for older browsers
      const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        } else {
          // Fallback: Generate UUID v4 format for older browsers
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
      };
      
      // Create duplicate invoice with new ID and invoice number
      const duplicatedInvoice: Invoice = {
        ...invoice,
        id: generateId(),
        number: newInvoiceNumber,
        invoiceNumber: newInvoiceNumber,
        date: today.toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'draft', // Always start as draft
        notes: `Dupliziert von Rechnung ${invoice.number} am ${today.toLocaleDateString('de-DE')}${invoice.notes ? '\n\n' + invoice.notes : ''}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: invoice.items.map(item => ({
          ...item,
          id: generateId() // Generate new IDs for items too
        }))
      };
      
      console.log('Duplicating invoice:', {
        original: invoice.number,
        new: newInvoiceNumber,
        items: duplicatedInvoice.items.length
      });
      
      // Add the duplicated invoice
      await invoiceStorage.add(duplicatedInvoice);
      await loadInvoices(); // Reload to get updated data
      
      toast.success(`Duplikat erstellt: ${invoice.number} → ${newInvoiceNumber} (als Entwurf)`, { id: `duplicate-${invoice.id}` });
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Duplizieren der Rechnung: ${errorMessage}`, { id: `duplicate-${invoice.id}` });
    }
  };

  // Get current filter status for display
  const currentFilter = searchParams.get('status');
  const getFilterTitle = () => {
    if (currentFilter === 'overdue') return 'Überfällige Rechnungen';
    if (currentFilter === 'draft') return 'Entwurf Rechnungen';
    if (currentFilter === 'sent') return 'Offene Rechnungen';
    if (currentFilter === 'paid') return 'Bezahlte Rechnungen';
    return 'Alle Rechnungen';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Rechnungen werden geladen...</h1>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Laden...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{getFilterTitle()}</h1>
          <p className="text-muted-foreground">
            {currentFilter === 'overdue' 
              ? 'Rechnungen, die überfällig sind und Aufmerksamkeit benötigen'
              : 'Verwalten Sie Ihre Rechnungen'
            }
          </p>
        </div>
        <Link to="/dashboard/invoices/new">
          <Button size="sm" className="md:size-default">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Neue Rechnung</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        </Link>
      </div>

      {currentFilter && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/invoices')}>
            Alle Rechnungen anzeigen
          </Button>
          {currentFilter === 'overdue' && filteredInvoices.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {filteredInvoices.length} überfällig
            </Badge>
          )}
        </div>
      )}

      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6 md:py-8">
            <p className="text-muted-foreground mb-4">Noch keine Rechnungen vorhanden</p>
            <Link to="/dashboard/invoices/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Rechnung erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => {
            const overdueStatus = isOverdue(invoice);
            const isDuplicate = invoice.notes?.includes('Dupliziert von Rechnung') && invoice.status === 'draft';
            return (
            <Card 
              key={invoice.id} 
              className={`hover:shadow-md transition-shadow ${
                overdueStatus 
                  ? 'bg-destructive/10 border-destructive/20 hover:bg-destructive/15' 
                  : ''
              }`}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{invoice.customerName || 'Unbekannter Kunde'}</h3>
                        <Badge variant={statusColors[invoice.status]} className="flex-shrink-0">
                          {statusLabels[invoice.status]}
                        </Badge>
                        {isDuplicate && (
                          <Badge variant="outline" className="flex-shrink-0 text-blue-600 border-blue-300 bg-blue-50">
                            <Copy className="w-3 h-3 mr-1" />
                            Duplikat
                          </Badge>
                        )}
                        {overdueStatus && (
                          <Badge variant="destructive" className="flex-shrink-0 animate-pulse">
                            ÜBERFÄLLIG
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">#{invoice.number}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{format(new Date(invoice.date), 'dd. MMMM yyyy', { locale: de })}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className={overdueStatus ? 'text-destructive font-medium' : ''}>
                        Fällig: {format(new Date(invoice.dueDate), 'dd. MMM yyyy', { locale: de })}
                        {overdueStatus && ' (ÜBERFÄLLIG)'}
                      </span>
                      {isDuplicate && invoice.status === 'draft' && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-blue-600 font-medium">
                            {invoice.notes?.match(/Dupliziert von Rechnung ([^\s]+)/)?.[1] && 
                              `Original: ${invoice.notes.match(/Dupliziert von Rechnung ([^\s]+)/)?.[1]}`
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="text-left lg:text-right">
                      <div className="text-xl font-bold flex items-baseline gap-1">
                        <span className="text-sm text-muted-foreground">CHF</span>
                        <span>{invoice.total.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.items.length} Position{invoice.items.length !== 1 ? 'en' : ''}
                      </div>
                    </div>
                  
                    <div className="flex gap-1 flex-wrap justify-start lg:justify-end lg:flex-shrink-0 mt-2 lg:mt-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-8 w-8 p-0 ${invoice.customerEmail ? 'text-green-600' : 'text-orange-600'}`}
                        title={invoice.customerEmail ? 'E-Mail senden' : 'Keine E-Mail verfügbar'}
                        onClick={() => invoice.customerEmail && handleOpenEmailModal(invoice)}
                        disabled={!invoice.customerEmail}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 w-8 p-0" 
                         onClick={() => navigate(`/dashboard/invoices/${invoice.id}`)}
                         title="Fatura görüntüle"
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleDownloadPDF(invoice)}
                        title="PDF herunterladen"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {invoice.customerEmail && invoice.status === 'draft' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                          onClick={() => handleOpenEmailModal(invoice)}
                          title="Rechnung per E-Mail senden"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleEdit(invoice)}
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                        onClick={() => handleDuplicateInvoice(invoice)}
                        title="Rechnung duplizieren"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      {overdueStatus && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                          onClick={() => handleSendReminderEmail(invoice)}
                          title="Zahlungserinnerung senden"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {invoice.status === 'sent' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-success hover:text-success" 
                          onClick={() => handleMarkAsPaid(invoice)}
                          title="Als bezahlt markieren"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive" 
                            title="Rechnung löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Rechnung löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sind Sie sicher, dass Sie die Rechnung #{invoice.number} löschen möchten? 
                              Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteInvoice(invoice)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Status ändern"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleChangeStatus(invoice, 'draft')}>
                            Status: Entwurf
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeStatus(invoice, 'sent')}>
                            Status: Offen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeStatus(invoice, 'paid')}>
                            Status: Bezahlt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeStatus(invoice, 'overdue')}>
                            Status: Überfällig
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <InvoiceEmailModal
        invoice={selectedInvoiceForEmail}
        isOpen={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false);
          setSelectedInvoiceForEmail(null);
        }}
        onSend={handleSendInvoiceEmail}
      />
    </div>
  );
}