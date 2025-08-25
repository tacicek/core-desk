import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Building2, 
  Calendar, 
  CreditCard, 
  Receipt,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
}

interface InvoiceDetail {
  id: string;
  vendor_name: string;
  vendor_address?: string;
  vendor_tax_number?: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  payment_date?: string;
  currency: string;
  description: string;
  category: string;
  status: string;
  ai_confidence: number;
  needs_review: boolean;
  
  // Line items from AI extraction
  line_items: InvoiceLineItem[];
  
  // Totals
  subtotal: number;
  total_vat: number;
  total_amount: number;
  
  // Metadata
  original_filename?: string;
  image_url?: string;
  created_at: string;
}

interface InvoiceDetailModalProps {
  invoice: InvoiceDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, isOpen, onClose }: InvoiceDetailModalProps) {
  if (!invoice) return null;

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
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge variant="default" className="bg-green-600">Hoch ({(confidence * 100).toFixed(0)}%)</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge variant="secondary">Mittel ({(confidence * 100).toFixed(0)}%)</Badge>;
    } else {
      return <Badge variant="destructive">Niedrig ({(confidence * 100).toFixed(0)}%)</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Rechnungsdetails - {invoice.invoice_number}
          </DialogTitle>
          <DialogDescription>
            Detaillierte Ansicht der Rechnung mit allen erkannten Informationen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-4 w-4" />
                  Lieferant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium">{invoice.vendor_name}</p>
                  {invoice.vendor_address && (
                    <p className="text-sm text-muted-foreground">{invoice.vendor_address}</p>
                  )}
                  {invoice.vendor_tax_number && (
                    <p className="text-sm text-muted-foreground">
                      Steuernr.: {invoice.vendor_tax_number}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  Rechnungsinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rechnungsnummer:</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rechnungsdatum:</span>
                  <span>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale: de })}</span>
                </div>
                {invoice.due_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fälligkeitsdatum:</span>
                    <span>{format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: de })}</span>
                  </div>
                )}
                {invoice.payment_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Zahlungsdatum:</span>
                    <span>{format(new Date(invoice.payment_date), 'dd.MM.yyyy', { locale: de })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(invoice.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Kategorie:</span>
                  <span>{invoice.category}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-4 w-4" />
                KI-Analyse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vertrauen:</span>
                  {getConfidenceBadge(invoice.ai_confidence)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Überprüfung erforderlich:</span>
                  <Badge variant={invoice.needs_review ? "destructive" : "default"}>
                    {invoice.needs_review ? "Ja" : "Nein"}
                  </Badge>
                </div>
                {invoice.original_filename && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dateiname:</span>
                    <span className="text-sm">{invoice.original_filename}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-4 w-4" />
                  Rechnungspositionen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead className="text-right">Menge</TableHead>
                        <TableHead className="text-right">Einzelpreis</TableHead>
                        <TableHead className="text-right">MwSt.%</TableHead>
                        <TableHead className="text-right">MwSt. Betrag</TableHead>
                        <TableHead className="text-right">Gesamt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.line_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right">{item.vat_rate}%</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.vat_amount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Totals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-4 w-4" />
                Rechnungssumme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Zwischensumme:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>MwSt. gesamt:</span>
                  <span>{formatCurrency(invoice.total_vat)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Gesamtbetrag:</span>
                  <span>{formatCurrency(invoice.total_amount)} {invoice.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {invoice.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Beschreibung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{invoice.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-4 w-4" />
                Verarbeitungsinformationen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Erstellt am:</span>
                  <span>{format(new Date(invoice.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-xs">{invoice.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}