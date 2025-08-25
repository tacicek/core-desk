import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Customer } from "@/types";
import { Offer, OfferItem } from "@/types/offer";
import { settingsStorage } from "@/lib/storage-simple";
import { offerStorage, offerItemStorage, generateId } from "@/lib/offerStorage";
import { useToast } from "@/hooks/use-toast";
import { useVendor } from "@/contexts/VendorContext";

export default function EditOffer() {
  const { id } = useParams<{ id: string }>();
  const { vendor, userProfile } = useVendor();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [items, setItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id || !vendor) {
      navigate("/dashboard/offers");
      return;
    }

    try {
      const [offerData, offerItems] = await Promise.all([
        offerStorage.getById(id, vendor.id),
        offerItemStorage.getByOfferId(id)
      ]);

      if (offerData) {
        setOffer(offerData);
        setItems(offerItems);
      } else {
        toast({
          title: "Angebot nicht gefunden",
          description: "Das angeforderte Angebot konnte nicht gefunden werden.",
          variant: "destructive",
        });
        navigate("/dashboard/offers");
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Laden des Angebots ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
      navigate("/dashboard/offers");
    } finally {
      setLoading(false);
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
    if (!offer) return;
    
    setItems([...items, {
      id: generateId(),
      offer_id: offer.id,
      description: "",
      qty: 1,
      unit_price: 0,
      tax_rate: 8.1,
      line_total: 0,
      created_by: offer.created_by
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
    
    if (!offer || !vendor || !userProfile) return;

    setSaving(true);
    
    try {
      const { subtotal, taxTotal, total } = calculateTotals();
      
      const updatedOffer: Partial<Offer> = {
        customer_id: offer.customer_id,
        issue_date: offer.issue_date,
        valid_until: offer.valid_until,
        notes: offer.notes,
        subtotal,
        tax_total: taxTotal,
        total,
        updated_at: new Date().toISOString()
      };

      await offerStorage.update(offer.id, updatedOffer, vendor.id);
      await offerItemStorage.updateByOfferId(offer.id, items, vendor.id, userProfile.id);

      toast({
        title: "Angebot aktualisiert",
        description: `Angebot ${offer.offer_no} wurde erfolgreich aktualisiert.`,
      });

      navigate("/dashboard/offers");
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Speichern des Angebots ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOfferChange = (field: keyof Offer, value: string) => {
    if (!offer) return;
    
    setOffer({
      ...offer,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/offers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Angebot bearbeiten</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>Laden...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  const { subtotal, taxTotal, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/offers")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Angebot bearbeiten</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Angebotsinformationen - #{offer.offer_no}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer">Kunde *</Label>
                <Select 
                  value={offer.customer_id} 
                  onValueChange={(value) => handleOfferChange('customer_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kunde auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDate">Ausstellungsdatum *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={offer.issue_date}
                  onChange={(e) => handleOfferChange('issue_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Gültig bis</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={offer.valid_until || ''}
                  onChange={(e) => handleOfferChange('valid_until', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={offer.notes || ''}
                onChange={(e) => handleOfferChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Positionen
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Position hinzufügen
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid gap-4 p-4 border rounded-lg">
                  <div className="grid gap-4 md:grid-cols-12">
                    <div className="md:col-span-5">
                      <Label htmlFor={`description-${index}`}>Beschreibung *</Label>
                      <Input
                        id={`description-${index}`}
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`qty-${index}`}>Menge *</Label>
                      <Input
                        id={`qty-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`unitPrice-${index}`}>Einzelpreis *</Label>
                      <Input
                        id={`unitPrice-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`taxRate-${index}`}>MwSt. %</Label>
                      <Input
                        id={`taxRate-${index}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.tax_rate}
                        onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="h-10 w-10 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">
                      Zeilensumme: CHF {item.line_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
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
            {saving ? 'Speichern...' : 'Änderungen speichern'}
          </Button>
        </div>
      </form>
    </div>
  );
}