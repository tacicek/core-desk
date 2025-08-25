import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Customer } from "@/types";
import { Offer, OfferItem } from "@/types/offer";
import { offerStorage, offerItemStorage, offerNumberGenerator, generateId } from "@/lib/offerStorage";
import { customerStorage } from "@/lib/customerStorage";
import { CustomerSelector } from "@/components/customer/CustomerSelector";
import { CustomerModal } from "@/components/customer/CustomerModal";
import { useToast } from "@/hooks/use-toast";
import { useVendor } from "@/contexts/VendorContext";

export default function NewOfferSimple() {
  const { vendor, userProfile } = useVendor();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<OfferItem[]>([
    {
      id: generateId(),
      offer_id: "",
      description: "",
      qty: 1,
      unit_price: 0,
      tax_rate: 8.1,
      line_total: 0,
      created_by: ""
    }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const customerList = await customerStorage.getAll();
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const calculateLineTotal = (qty: number, unitPrice: number, taxRate: number) => {
    const subtotal = qty * unitPrice;
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
  };

  const updateItem = (index: number, field: keyof OfferItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'qty' || field === 'unit_price' || field === 'tax_rate') {
      const item = updatedItems[index];
      item.line_total = calculateLineTotal(
        Number(item.qty), 
        Number(item.unit_price), 
        Number(item.tax_rate)
      );
    }
    
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, {
      id: generateId(),
      offer_id: "",
      description: "",
      qty: 1,
      unit_price: 0,
      tax_rate: 8.1,
      line_total: 0,
      created_by: ""
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = Number(item.qty) * Number(item.unit_price);
      return sum + itemSubtotal;
    }, 0);
    
    const taxTotal = items.reduce((sum, item) => {
      const itemSubtotal = Number(item.qty) * Number(item.unit_price);
      const itemTax = itemSubtotal * (Number(item.tax_rate) / 100);
      return sum + itemTax;
    }, 0);
    
    return {
      subtotal,
      taxTotal,
      total: subtotal + taxTotal
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Kunden aus.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      const offerNumber = await offerNumberGenerator.getNext();
      const offerId = generateId();
      const { subtotal, taxTotal, total } = calculateTotals();
      
      const offer: Offer = {
        id: offerId,
        offer_no: offerNumber,
        customer_id: selectedCustomer.id,
        issue_date: issueDate,
        valid_until: validUntil || undefined,
        status: 'draft',
        subtotal,
        tax_total: taxTotal,
        total,
        currency: 'CHF',
        notes: notes || undefined,
        created_by: "temp-user-id",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!vendor || !userProfile) return;
      
      await offerStorage.add(offer, vendor.id, userProfile.id);

      // Save items
      const offerItems = items.map(item => ({
        ...item,
        offer_id: offerId,
        created_by: "temp-user-id"
      }));

      for (const item of offerItems) {
        await offerItemStorage.add(offerId, item, vendor.id, userProfile.id);
      }

      toast({
        title: "Angebot erstellt",
        description: `Angebot ${offerNumber} wurde erfolgreich erstellt.`,
      });

      navigate("/dashboard/offers");
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Erstellen des Angebots ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      await loadCustomers();
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

  const { subtotal, taxTotal, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/offers")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Neues Angebot</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Angebotsinformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="issueDate">Ausstellungsdatum *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Gültig bis</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Zusätzliche Notizen zum Angebot..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Positionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border p-3 rounded">
                <div className="md:col-span-5">
                  <Label>Beschreibung *</Label>
                  <Input
                    placeholder="Produktbeschreibung"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Menge *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Preis (CHF) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>MwSt. (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.tax_rate}
                    onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="md:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="h-9 w-9 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Position hinzufügen
            </Button>
            
            <div className="border-t pt-4 mt-6">
              <div className="space-y-2 text-right">
                <div className="flex justify-between">
                  <span>Zwischensumme:</span>
                  <span>CHF {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>MwSt.:</span>
                  <span>CHF {taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Gesamtsumme:</span>
                  <span>CHF {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/dashboard/offers")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Speichern...' : 'Angebot erstellen'}
          </Button>
        </div>
      </form>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleCustomerCreated}
        customer={null}
      />
    </div>
  );
}