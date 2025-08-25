import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Package, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { productStorage } from "@/lib/storage-simple";
import { supabase } from "@/integrations/supabase/client";
import { simpleInvoiceStorage } from "@/lib/simple-invoice-storage";
import { invoiceNumberGenerator } from "@/lib/invoice-storage";
import { customerStorage } from "@/lib/customerStorage";
import { CustomerSelector } from "@/components/customer/CustomerSelector";
import { CustomerModal } from "@/components/customer/CustomerModal";
import { Invoice, InvoiceItem, Product, Customer } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";

interface NewInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export default function NewInvoice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<Date>();
  const [notes, setNotes] = useState<string>("");
  const [includeTax, setIncludeTax] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(8.1);
  const [items, setItems] = useState<NewInvoiceItem[]>([
    { id: '1', description: '', quantity: 1, price: 0 }
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data for new invoice...');
        
        // Load products
        const allProducts = await productStorage.getAll();
        setProducts(allProducts);
        
        // Load settings and get default tax rate from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('vendor_id')
            .eq('user_id', user.id)
            .single();

          if (profile?.vendor_id) {
            const { data: companySettings } = await supabase
              .from('company_settings')
              .select('*')
              .eq('vendor_id', profile.vendor_id)
              .single();

            if (companySettings) {
              setTaxRate(companySettings.default_tax_rate || 8.1);
              
              // Set due date from settings
              const dueDateCalc = new Date();
              dueDateCalc.setDate(dueDateCalc.getDate() + (companySettings.default_due_days || 30));
              setDueDate(dueDateCalc);
            }
          }
        }
        
        // Generate invoice number using Supabase
        const nextNumber = await invoiceNumberGenerator.getNext();
        setInvoiceNumber(nextNumber);
        
      } catch (error) {
        console.error('Error in loadData:', error);
      }
    };
    
    loadData();
  }, []);

  const addItem = () => {
    const newItem: NewInvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      price: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof NewInvoiceItem, value: string | number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addProductToInvoice = (product: Product) => {
    const newItem: NewInvoiceItem = {
      id: Date.now().toString(),
      description: product.name,
      quantity: 1,
      price: product.price
    };
    setItems([...items, newItem]);
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const calculateTax = (subtotal: number) => {
    return includeTax ? subtotal * (taxRate / 100) : 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + calculateTax(subtotal);
  };

  const handleSave = async () => {
    console.log('🚀 Starting handleSave...');
    console.log('📋 Selected customer:', selectedCustomer);
    console.log('📋 Items:', items);
    console.log('📋 Invoice number:', invoiceNumber);
    console.log('📋 Invoice date:', invoiceDate);
    console.log('📋 Due date:', dueDate);
    
    if (!selectedCustomer) {
      console.log('⚠️ No customer selected');
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Kunden aus.",
        variant: "destructive"
      });
      return;
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.price <= 0)) {
      console.log('⚠️ Invalid items found:', items.filter(item => !item.description || item.quantity <= 0 || item.price <= 0));
      toast({
        title: "Fehler", 
        description: "Bitte füllen Sie alle Positionen vollständig aus.",
        variant: "destructive"
      });
      return;
    }

    const subtotal = calculateSubtotal();
    const taxTotal = calculateTax(subtotal);
    const total = subtotal + taxTotal;

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

    // Convert items to invoice items
    const invoiceItems: InvoiceItem[] = items.map(item => ({
      id: generateId(),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.price,
      taxRate: includeTax ? taxRate : 0,
      total: item.quantity * item.price
    }));

    const invoice: Invoice = {
      id: generateId(),
      number: invoiceNumber,
      invoiceNumber: invoiceNumber,
      customerName: selectedCustomer.name,
      customerEmail: selectedCustomer.email,
      date: new Date(invoiceDate).toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : new Date().toISOString(),
      items: invoiceItems,
      subtotal,
      taxTotal,
      total,
      status: 'draft',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('📋 About to save invoice:', invoice);
    
    try {
      console.log('🚀 Using simple invoice storage');
      
      await simpleInvoiceStorage.add(invoice);
      
      console.log('✅ Invoice saved to Supabase successfully');
      
      toast({
        title: "Rechnung erstellt",
        description: "Die Rechnung wurde erfolgreich erstellt.",
      });
      console.log('🚀 Navigating to invoices...');
      navigate("/dashboard/invoices");
    } catch (error) {
      console.error('🔴 Invoice creation error details:', error);
      console.error('🔴 Error type:', typeof error);
      console.error('🔴 Error message:', error?.message);
      console.error('🔴 Error stack:', error?.stack);
      
      // More detailed error message for user
      let errorMessage = 'Unbekannter Fehler beim Erstellen der Rechnung.';
      if (error?.message) {
        if (error.message.includes('Authentication')) {
          errorMessage = 'Authentifizierungsfehler. Bitte melden Sie sich erneut an.';
        } else if (error.message.includes('vendor')) {
          errorMessage = 'Kein gültiges Unternehmen gefunden. Bitte prüfen Sie Ihre Einstellungen.';
        } else if (error.message.includes('invoice_no')) {
          errorMessage = 'Fehler bei der Rechnungsnummer. Bitte versuchen Sie es erneut.';
        } else {
          errorMessage = `Fehler: ${error.message}`;
        }
      }
      
      toast({
        title: "Fehler",
        description: errorMessage,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Zurück</span>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Neue Rechnung</h1>
          <p className="text-muted-foreground">Erstellen Sie eine neue Rechnung</p>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rechnungsdetails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label htmlFor="number">Rechnungsnummer</Label>
                <Input 
                  id="number" 
                  value={invoiceNumber}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                  Automatisch generiert
                </p>
              </div>
              <div>
                <Label htmlFor="date">Rechnungsdatum</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd.MM.yyyy") : "Datum auswählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
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
            <div>
              <Label htmlFor="notes">Notizen</Label>
              <Textarea 
                id="notes" 
                placeholder="Zusätzliche Informationen..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeTax"
                  checked={includeTax}
                  onCheckedChange={(checked) => setIncludeTax(checked === true)}
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
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Positionen</CardTitle>
            <div className="flex flex-col gap-3 mt-4">
              {products.length > 0 ? (
                <Select onValueChange={(productId) => {
                  const product = products.find(p => p.id === productId);
                  if (product) addProductToInvoice(product);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Produkt hinzufügen" />
                  </SelectTrigger>
                  <SelectContent className="w-full max-w-md">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id} className="py-4 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-start gap-4 w-full">
                          {/* Product Image - Left Side */}
                          <div className="flex-shrink-0">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Product Information - Right Side */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Product Name */}
                            <div className="font-semibold text-base text-gray-900 truncate">
                              {product.name}
                            </div>
                            
                            {/* Category Badge */}
                            {product.category && (
                              <div className="mb-2">
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                  {product.category}
                                </span>
                              </div>
                            )}
                            
                            {/* Description */}
                            {product.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                {product.description}
                              </p>
                            )}
                            
                            {/* Price and Tax Information */}
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-blue-600">
                                  CHF {product.price.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  MwSt: {product.taxRate}%
                                </span>
                              </div>
                              
                              {/* Active Status */}
                              <div>
                                {product.isActive !== false ? (
                                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                    Verfügbar
                                  </span>
                                ) : (
                                  <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                    Inaktiv
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="mb-2">Noch keine Produkte vorhanden</p>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/dashboard/products")}
                className="w-full sm:w-auto"
              >
                <Package className="h-4 w-4 mr-2" />
                Produkte verwalten
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2 items-end border p-3 rounded-lg md:border-0 md:p-0 md:rounded-none">
                <div className="md:col-span-6">
                  <Label htmlFor={`description-${index}`}>Beschreibung</Label>
                  <Input
                    id={`description-${index}`}
                    placeholder="Produktbeschreibung"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 md:contents">
                  <div className="md:col-span-2">
                    <Label htmlFor={`quantity-${index}`}>Menge</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor={`price-${index}`}>Preis (CHF)</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" onClick={addItem} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Position hinzufügen
            </Button>

            <div className="border-t pt-3 md:pt-4 space-y-2">
              <div className="flex justify-between text-sm md:text-base">
                <span>Zwischensumme:</span>
                <span>CHF {calculateSubtotal().toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
              </div>
              {includeTax && (
                <div className="flex justify-between text-sm md:text-base">
                  <span>MwSt. ({taxRate}%):</span>
                  <span>CHF {calculateTax(calculateSubtotal()).toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-base md:text-lg font-semibold border-t pt-2">
                <span>Gesamtbetrag:</span>
                <span>CHF {calculateTotal().toLocaleString('de-CH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <Button onClick={handleSave} className="flex-1 sm:flex-none">
          Rechnung speichern
        </Button>
        <Button variant="outline" onClick={() => navigate("/dashboard/invoices")} className="flex-1 sm:flex-none">
          Abbrechen
        </Button>
      </div>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleCustomerCreated}
        customer={null}
      />
    </div>
  );
}