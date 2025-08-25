import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { Invoice } from "@/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { generateInvoicePDF } from "@/lib/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

interface RecentInvoicesProps {
  invoices: Invoice[];
}

const statusLabels = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  paid: 'Bezahlt',
  overdue: 'Überfällig'
};

const statusColors = {
  draft: 'bg-warning text-warning-foreground',
  sent: 'bg-primary text-primary-foreground',
  paid: 'bg-success text-success-foreground',
  overdue: 'bg-destructive text-destructive-foreground'
};

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const recentInvoices = invoices.slice(0, 5);

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/dashboard/invoices/${invoiceId}`);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      await generateInvoicePDF(invoice);
      toast({
        title: "PDF erstellt",
        description: `Rechnung ${invoice.invoiceNumber} wurde heruntergeladen.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Fehler",
        description: "Beim Erstellen der PDF ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Letzte Rechnungen</CardTitle>
      </CardHeader>
      <CardContent>
        {recentInvoices.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-muted-foreground">
            <p>Noch keine Rechnungen vorhanden</p>
            <Button className="mt-4" size="sm">
              Erste Rechnung erstellen
            </Button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm md:text-base truncate">{invoice.invoiceNumber}</span>
                    <Badge className={statusColors[invoice.status]}>
                      {statusLabels[invoice.status]}
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {invoice.customerName || 'Kunde nicht gefunden'} • {format(new Date(invoice.date), 'dd MMMM yyyy', { locale: de })}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <span className="font-semibold text-sm md:text-base">CHF {invoice.total.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewInvoice(invoice.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleDownloadInvoice(invoice)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}