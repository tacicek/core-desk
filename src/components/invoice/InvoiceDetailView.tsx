import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Edit3, 
  Save, 
  X, 
  Calendar,
  Euro,
  Building,
  FileText,
  Tag,
  Brain,
  Image as ImageIcon
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

interface InvoiceDetailViewProps {
  invoice: IncomingInvoice;
  onMarkAsPaid: (invoiceId: string) => void;
  onClose: () => void;
}

export function InvoiceDetailView({ invoice, onMarkAsPaid, onClose }: InvoiceDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState(invoice);

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInvoice(invoice);
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ausstehend</Badge>;
      case 'paid':
        return <Badge variant="default">Bezahlt</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Überfällig</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const categories = [
    { value: 'operating_expenses', label: 'Betriebsausgaben' },
    { value: 'office_supplies', label: 'Büromaterial' },
    { value: 'rent', label: 'Miete' },
    { value: 'utilities', label: 'Nebenkosten' },
    { value: 'travel', label: 'Reisekosten' },
    { value: 'meals', label: 'Bewirtung' },
    { value: 'vehicle', label: 'Fahrzeugkosten' },
    { value: 'insurance', label: 'Versicherungen' },
    { value: 'professional_services', label: 'Beratung' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'equipment', label: 'Ausrüstung' },
    { value: 'software', label: 'Software' },
    { value: 'training', label: 'Weiterbildung' },
    { value: 'telecommunications', label: 'Telekommunikation' },
    { value: 'maintenance', label: 'Wartung' },
    { value: 'other', label: 'Sonstiges' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Invoice Image */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Original-Rechnung
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.image_url ? (
              <div className="space-y-2">
                <img 
                  src={invoice.image_url} 
                  alt="Fatura"
                  className="w-full h-auto rounded-lg border"
                />
                <p className="text-xs text-muted-foreground">
                  Datei: {invoice.original_filename}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Bild nicht verfügbar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Details */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rechnungsinformationen
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(invoice.status)}
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Abbrechen
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vendor_name">Firmenname</Label>
                {isEditing ? (
                  <Input
                    id="vendor_name"
                    value={editedInvoice.vendor_name}
                    onChange={(e) => setEditedInvoice({...editedInvoice, vendor_name: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium">{invoice.vendor_name || '-'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_number">Rechnungsnummer</Label>
                {isEditing ? (
                  <Input
                    id="invoice_number"
                    value={editedInvoice.invoice_number}
                    onChange={(e) => setEditedInvoice({...editedInvoice, invoice_number: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium">{invoice.invoice_number || '-'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Betrag</Label>
                {isEditing ? (
                  <Input
                    id="amount"
                    type="number"
                    value={editedInvoice.amount}
                    onChange={(e) => setEditedInvoice({...editedInvoice, amount: parseFloat(e.target.value)})}
                  />
                ) : (
                  <p className="text-sm font-medium">
                    {invoice.amount.toFixed(2)} {invoice.currency}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                {isEditing ? (
                  <Select 
                    value={editedInvoice.category} 
                    onValueChange={(value) => setEditedInvoice({...editedInvoice, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">
                    {categories.find(cat => cat.value === invoice.category)?.label || invoice.category}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_date">Rechnungsdatum</Label>
                {isEditing ? (
                  <Input
                    id="invoice_date"
                    type="date"
                    value={editedInvoice.invoice_date}
                    onChange={(e) => setEditedInvoice({...editedInvoice, invoice_date: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium">
                    {format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Fälligkeitsdatum</Label>
                {isEditing ? (
                  <Input
                    id="due_date"
                    type="date"
                    value={editedInvoice.due_date}
                    onChange={(e) => setEditedInvoice({...editedInvoice, due_date: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium">
                    {invoice.due_date ? format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: de }) : '-'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={editedInvoice.description}
                  onChange={(e) => setEditedInvoice({...editedInvoice, description: e.target.value})}
                  rows={3}
                />
              ) : (
                <p className="text-sm">{invoice.description || '-'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              KI-Analyseergebnisse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vertrauenswert:</span>
              <Badge variant={invoice.ai_confidence > 0.8 ? 'default' : 'secondary'}>
                {(invoice.ai_confidence * 100).toFixed(0)}%
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Überprüfungsstatus:</span>
              <Badge variant={invoice.needs_review ? 'destructive' : 'default'}>
                {invoice.needs_review ? 'Überprüfung erforderlich' : 'Genehmigt'}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              Erstellt: {format(new Date(invoice.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {invoice.status === 'pending' && (
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={() => onMarkAsPaid(invoice.id)}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Als bezahlt markieren
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}