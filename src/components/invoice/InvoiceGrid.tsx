import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Eye, 
  CheckCircle, 
  Trash2, 
  MoreVertical, 
  Calendar,
  Euro,
  Building,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

interface InvoiceGridProps {
  invoices: IncomingInvoice[];
  onViewDetails: (invoice: IncomingInvoice) => void;
  onMarkAsPaid: (invoiceId: string) => void;
  onDelete: (invoiceId: string) => void;
}

export function InvoiceGrid({ invoices, onViewDetails, onMarkAsPaid, onDelete }: InvoiceGridProps) {
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

  const isOverdue = (invoice: IncomingInvoice) => {
    if (invoice.status !== 'pending') return false;
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    return dueDate < today;
  };

  const getCardClassName = (invoice: IncomingInvoice) => {
    let baseClass = "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]";
    
    if (isOverdue(invoice)) {
      baseClass += " border-red-200 bg-red-50/50";
    } else if (invoice.needs_review) {
      baseClass += " border-yellow-200 bg-yellow-50/50";
    }
    
    return baseClass;
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Keine Rechnungen gefunden</h3>
        <p className="text-muted-foreground">
          Verwenden Sie den Upload-Bereich oben, um neue Rechnungen hochzuladen.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {invoices.map((invoice) => (
        <Card 
          key={invoice.id} 
          className={getCardClassName(invoice)}
          onClick={() => onViewDetails(invoice)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm truncate">
                    {invoice.vendor_name || 'Unbekanntes Unternehmen'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">
                    {invoice.invoice_number || 'Rechnungsnr.: -'}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(invoice);
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Details anzeigen
                  </DropdownMenuItem>
                  {invoice.status === 'pending' && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsPaid(invoice.id);
                    }}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Als bezahlt markieren
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(invoice.id);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Amount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold">
                  {invoice.amount.toFixed(2)} {invoice.currency}
                </span>
              </div>
              {getStatusBadge(invoice.status)}
            </div>

            {/* Dates */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Rechnung: {format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale: de })}</span>
              </div>
              {invoice.due_date && (
                <div className={`flex items-center gap-2 ${isOverdue(invoice) ? 'text-red-600' : 'text-muted-foreground'}`}>
                  <Calendar className="h-3 w-3" />
                  <span>Fällig: {format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: de })}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {invoice.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {invoice.description}
              </p>
            )}

            {/* AI Confidence & Review Status */}
            <div className="flex items-center justify-between text-xs">
              {invoice.ai_confidence && (
                <span className="text-muted-foreground">
                  KI-Vertrauen: {(invoice.ai_confidence * 100).toFixed(0)}%
                </span>
              )}
              {invoice.needs_review && (
                <Badge variant="outline" className="text-xs">
                  Überprüfung erforderlich
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}