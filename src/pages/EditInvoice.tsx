import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Plus, Trash2, Send } from 'lucide-react';
import { Invoice, InvoiceItem, Customer } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { customerStorage } from "@/lib/customerStorage";
import { simpleInvoiceStorage } from "@/lib/simple-invoice-storage";
import { invoiceStorage } from "@/lib/invoice-storage";
import { CustomerSelector } from "@/components/customer/CustomerSelector";
import { CustomerModal } from "@/components/customer/CustomerModal";
import { EmailService } from '@/lib/emailService';
import { InvoiceEmailModal } from '@/components/invoice/InvoiceEmailModal';

export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [date, setDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [includeTax, setIncludeTax] = useState<boolean>(true);
  const [taxRate, setTaxRate] = useState<number>(8.1);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      console.log('Loading invoice from Supabase, ID:', id);
      
      try {
        // Load invoice from Supabase
        const foundInvoice = await invoiceStorage.getById(id);
        
        if (!foundInvoice) {
          toast({
            title: "Fehler",
            description: "Rechnung nicht gefunden",
            variant: "destructive"
          });
          navigate('/dashboard/invoices');
          return;
        }

        console.log('Loaded invoice from Supabase:', foundInvoice);

        setInvoice(foundInvoice);
        setDate(format(new Date(foundInvoice.date), 'yyyy-MM-dd'));
        setDueDate(format(new Date(foundInvoice.dueDate), 'yyyy-MM-dd'));
        setNotes(foundInvoice.notes || '');
        setItems(foundInvoice.items);
        
        // Check if any items have tax (tax rate > 0)
        setIncludeTax(foundInvoice.items.some(item => item.taxRate > 0));
        // Use the tax rate from the first item that has tax, or default from settings
        const itemWithTax = foundInvoice.items.find(item => item.taxRate > 0);
        if (itemWithTax) {
          setTaxRate(itemWithTax.taxRate);
        }

        // Try to find the customer by name in the customers database
        try {
          const customers = await customerStorage.getAll();
          const matchingCustomer = customers.find(c => c.name === foundInvoice.customerName);
          if (matchingCustomer) {
            setSelectedCustomerId(matchingCustomer.id);
            setSelectedCustomer(matchingCustomer);
          }
        } catch (error) {
          console.error('Error loading customers for invoice:', error);
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
        toast({
          title: "Fehler",
          description: "Rechnung konnte nicht geladen werden",
          variant: "destructive"
        });
        navigate('/dashboard/invoices');
      }
    };
    
    loadData();
  }, [id, navigate, toast]);

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: includeTax ? taxRate : 0,
      total: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const item = updatedItems[index];
      const subtotal = item.quantity * item.unitPrice;
      // Only calculate tax if includeTax is true
      const tax = includeTax ? subtotal * (item.taxRate / 100) : 0;
      updatedItems[index].total = subtotal + tax;
    }
    
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0);
    const total = subtotal + taxTotal;
    
    return { subtotal, taxTotal, total };
  };

  const handleSave = async () => {
    if (!selectedCustomer || items.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Kunden aus und fügen Sie mindestens eine Position hinzu",
        variant: "destructive"
      });
      return;
    }

    const { subtotal, taxTotal, total } = calculateTotals();

    const updatedInvoice: Invoice = {
      ...invoice!,
      customerName: selectedCustomer.name,
      customerEmail: selectedCustomer.email,
      date: date,
      dueDate: dueDate,
      items,
      subtotal,
      taxTotal,
      total,
      notes,
      updatedAt: new Date().toISOString()
    };

    try {
      // Save to Supabase
      await invoiceStorage.update(invoice!.id, updatedInvoice);
      
      toast({
        title: "Erfolg",
        description: "Rechnung wurde aktualisiert"
      });
      navigate('/dashboard/invoices');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Fehler",
        description: "Rechnung konnte nicht aktualisiert werden",
        variant: "destructive"
      });
    }
  };

  const handleCustomerSelect = (customerId: string, customer: Customer | null) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomer(customer);
  };

  const handleCreateNewCustomer = () => {
    setIsCustomerModalOpen(true);
  };

  const handleCustomerCreated = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      const newCustomer = await customerStorage.add(customerData);
      setSelectedCustomerId(newCustomer.id);
      setSelectedCustomer(newCustomer);
      setIsCustomerModalOpen(false);
      toast({
        title: 'Erfolg',
        description: 'Kunde wurde erfolgreich erstellt und ausgewählt.',
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Fehler',
        description: 'Kunde konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenEmailModal = () => {
    if (!selectedCustomer?.email) {
      toast({
        title: 'Fehler',
        description: 'Kunde hat keine E-Mail-Adresse',
        variant: 'destructive',
      });
      return;
    }
    setEmailModalOpen(true);
  };

  const handleSendInvoiceEmail = async (emailData: { to: string; subject: string; message: string }) => {
    if (!invoice) return;

    try {
      toast({
        title: 'Info',
        description: 'E-Mail wird gesendet...',
      });
      
      // Send email with custom subject and message
      const emailSent = await EmailService.sendInvoiceEmail(invoice);
      
      if (emailSent) {
        await invoiceStorage.update(invoice.id, { status: 'sent' });
        toast({
          title: 'Erfolg',
          description: `Rechnung an ${emailData.to} gesendet`,
        });
        navigate('/dashboard/invoices'); // Navigate back to invoices list
      } else {
        toast({
          title: 'Fehler',
          description: 'E-Mail wurde nicht gesendet',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      console.error('Error sending invoice email:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Senden der E-Mail',
        variant: 'destructive',
      });
    }
  };

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Rechnung wird geladen...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subtotal, taxTotal, total } = calculateTotals();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Rechnungen
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Rechnung {invoice.number} bearbeiten</h1>
            <p className="text-muted-foreground">Bearbeiten Sie die Rechnungsdetails</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          {invoice && selectedCustomer?.email && (
            <Button 
              variant="outline"
              onClick={handleOpenEmailModal}
            >
              <Send className="h-4 w-4 mr-2" />
              E-Mail senden
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Form */}
      <Card>
        <CardHeader>
          <CardTitle>Rechnungsdetails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customer">Kunde *</Label>
              <CustomerSelector
                value={selectedCustomerId}
                onValueChange={handleCustomerSelect}
                onCreateNew={handleCreateNewCustomer}
                placeholder="Kunde auswählen..."
              />
              {selectedCustomer && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <div className="font-medium">{selectedCustomer.name}</div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Rechnungsdatum *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fälligkeitsdatum *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rechnungspositionen</h3>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Position hinzufügen
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                <div className="col-span-4">
                  <Label htmlFor={`description-${index}`}>Beschreibung</Label>
                  <Input
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Produktbeschreibung"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`quantity-${index}`}>Menge</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`unitPrice-${index}`}>Einzelpreis</Label>
                  <Input
                    id={`unitPrice-${index}`}
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`taxRate-${index}`}>MwSt. %</Label>
                  <Input
                    id={`taxRate-${index}`}
                    type="number"
                    value={item.taxRate}
                    onChange={(e) => updateItem(index, 'taxRate', Number(e.target.value))}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="col-span-1">
                  <Label>Gesamt</Label>
                  <p className="py-2 text-sm font-medium">
                    CHF {item.total.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-1 flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">Noch keine Positionen hinzugefügt</p>
                <Button onClick={addItem} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Erste Position hinzufügen
                </Button>
              </div>
            )}
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="flex justify-end">
              <div className="w-80 space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Zwischensumme:</span>
                  <span>CHF {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>MwSt.:</span>
                  <span>CHF {taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Gesamtbetrag:</span>
                  <span>CHF {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tax Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeTax"
                checked={includeTax}
                onCheckedChange={(checked) => {
                  const newIncludeTax = checked === true;
                  setIncludeTax(newIncludeTax);
                  // Update all items with new tax rate
                  const updatedItems = items.map(item => ({
                    ...item,
                    taxRate: newIncludeTax ? taxRate : 0
                  }));
                  setItems(updatedItems);
                }}
              />
              <Label htmlFor="includeTax">MwSt. hinzufügen</Label>
            </div>
            {includeTax && (
              <div>
                <Label htmlFor="taxRate">MwSt. Satz (%)</Label>
                <Input 
                  id="taxRate" 
                  type="number" 
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => {
                    const newTaxRate = parseFloat(e.target.value) || 0;
                    setTaxRate(newTaxRate);
                    // Update all items with new tax rate
                    const updatedItems = items.map(item => ({
                      ...item,
                      taxRate: newTaxRate
                    }));
                    setItems(updatedItems);
                  }}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Notizen zur Rechnung..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleCustomerCreated}
        customer={null}
      />

      <InvoiceEmailModal
        invoice={invoice}
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendInvoiceEmail}
      />
    </div>
  );
}