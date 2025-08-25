import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Receipt, Upload, TrendingUp } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TaxCategory {
  id: string;
  name_de: string;
  name_en: string;
  description_de: string;
  requires_business_purpose: boolean;
}

interface BusinessExpense {
  id: string;
  expense_type: string;
  vendor_name: string;
  document_number: string;
  expense_date: string;
  amount: number;
  currency: string;
  vat_amount: number;
  tax_category: string;
  business_purpose: string;
  description: string;
  status: string;
  category_name: string;
}

interface BusinessExpenseForm {
  expense_type: string;
  vendor_name: string;
  document_number: string;
  expense_date: string;
  amount: number;
  currency: string;
  vat_amount: number;
  vat_rate: number;
  tax_category: string;
  business_purpose: string;
  description: string;
  payment_method: string;
}

export const BusinessExpenseManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [taxCategories, setTaxCategories] = useState<TaxCategory[]>([]);
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [formData, setFormData] = useState<BusinessExpenseForm>({
    expense_type: 'purchase',
    vendor_name: '',
    document_number: '',
    expense_date: '',
    amount: 0,
    currency: 'CHF',
    vat_amount: 0,
    vat_rate: 8.1,
    tax_category: 'operating_expenses',
    business_purpose: '',
    description: '',
    payment_method: 'bank_transfer'
  });
  const { toast } = useToast();
  const { vendor } = useVendor();

  // Load tax categories
  useEffect(() => {
    const loadTaxCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('tax_categories')
          .select('*')
          .order('sort_order');

        if (error) throw error;
        setTaxCategories(data || []);
      } catch (error) {
        console.error('Error loading tax categories:', error);
      }
    };

    loadTaxCategories();
  }, []);

  // Load expenses
  useEffect(() => {
    const loadExpenses = async () => {
      if (!vendor) return;

      try {
        const { data, error } = await supabase
          .from('business_expenses')
          .select('*')
          .eq('vendor_id', vendor.id)
          .order('expense_date', { ascending: false });

        if (error) throw error;

        // Get category names separately
        const categoryIds = [...new Set(data?.map(exp => exp.tax_category) || [])];
        const { data: categories } = await supabase
          .from('tax_categories')
          .select('id, name_de')
          .in('id', categoryIds);

        const categoryMap = categories?.reduce((acc, cat) => {
          acc[cat.id] = cat.name_de;
          return acc;
        }, {} as Record<string, string>) || {};
        
        const formattedData = data?.map(expense => ({
          ...expense,
          category_name: categoryMap[expense.tax_category] || expense.tax_category
        })) || [];
        
        setExpenses(formattedData);
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    };

    loadExpenses();
  }, [vendor]);

  // Calculate VAT amount when amount or rate changes
  useEffect(() => {
    const vatAmount = (formData.amount * formData.vat_rate) / (100 + formData.vat_rate);
    setFormData(prev => ({ ...prev, vat_amount: parseFloat(vatAmount.toFixed(2)) }));
  }, [formData.amount, formData.vat_rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const selectedCategory = taxCategories.find(cat => cat.id === formData.tax_category);
      
      // Validate business purpose if required
      if (selectedCategory?.requires_business_purpose && !formData.business_purpose.trim()) {
        toast({
          title: "Geschäftszweck erforderlich",
          description: `Für die Kategorie "${selectedCategory.name_de}" ist ein Geschäftszweck erforderlich.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('business_expenses')
        .insert({
          vendor_id: vendor.id,
          created_by: user.id,
          ...formData,
          status: 'paid',
          payment_date: formData.expense_date,
          needs_review: false,
          ai_confidence: 1.0
        });

      if (error) throw error;

      toast({
        title: "Ausgabe hinzugefügt",
        description: "Die Geschäftsausgabe wurde erfolgreich hinzugefügt.",
      });

      // Reset form
      setFormData({
        expense_type: 'purchase',
        vendor_name: '',
        document_number: '',
        expense_date: '',
        amount: 0,
        currency: 'CHF',
        vat_amount: 0,
        vat_rate: 8.1,
        tax_category: 'operating_expenses',
        business_purpose: '',
        description: '',
        payment_method: 'bank_transfer'
      });

      // Reload expenses
      const { data } = await supabase
        .from('business_expenses')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('expense_date', { ascending: false });
      
      if (data) {
        // Get category names separately
        const categoryIds = [...new Set(data.map(exp => exp.tax_category))];
        const { data: categories } = await supabase
          .from('tax_categories')
          .select('id, name_de')
          .in('id', categoryIds);

        const categoryMap = categories?.reduce((acc, cat) => {
          acc[cat.id] = cat.name_de;
          return acc;
        }, {} as Record<string, string>) || {};

        const formattedData = data.map(expense => ({
          ...expense,
          category_name: categoryMap[expense.tax_category] || expense.tax_category
        }));
        setExpenses(formattedData);
      }

    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hinzufügen der Ausgabe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = taxCategories.find(cat => cat.id === formData.tax_category);

  const getExpenseTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'incoming_invoice': 'Eingangsrechnung',
      'purchase': 'Einkauf',
      'receipt': 'Quittung',
      'other': 'Sonstiges'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Bezahlt</Badge>;
      case 'pending':
        return <Badge variant="secondary">Ausstehend</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateStats = () => {
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalVat = expenses.reduce((sum, exp) => sum + exp.vat_amount, 0);
    const monthlyTotal = expenses
      .filter(exp => {
        const expDate = new Date(exp.expense_date);
        const now = new Date();
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    return { totalAmount, totalVat, monthlyTotal };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAmount.toFixed(0)} CHF</p>
                <p className="text-sm text-muted-foreground">Gesamtausgaben</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalVat.toFixed(0)} CHF</p>
                <p className="text-sm text-muted-foreground">MwSt. Vorsteuer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.monthlyTotal.toFixed(0)} CHF</p>
                <p className="text-sm text-muted-foreground">Diesen Monat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle>Neue Geschäftsausgabe</CardTitle>
            <CardDescription>
              Fügen Sie Belege, Quittungen und Rechnungen für die Steuer hinzu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense_type">Ausgaben-Art</Label>
                  <Select 
                    value={formData.expense_type} 
                    onValueChange={(value) => setFormData({...formData, expense_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incoming_invoice">Eingangsrechnung</SelectItem>
                      <SelectItem value="purchase">Einkauf</SelectItem>
                      <SelectItem value="receipt">Quittung</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor_name">Firma/Anbieter</Label>
                  <Input
                    id="vendor_name"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_number">Beleg-Nr.</Label>
                  <Input
                    id="document_number"
                    value={formData.document_number}
                    onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense_date">Datum</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Bruttobetrag</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vat_rate">MwSt.-Satz (%)</Label>
                  <Select 
                    value={formData.vat_rate.toString()} 
                    onValueChange={(value) => setFormData({...formData, vat_rate: parseFloat(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (MwSt.-frei)</SelectItem>
                      <SelectItem value="2.5">2.5% (reduziert)</SelectItem>
                      <SelectItem value="3.7">3.7% (Beherbergung)</SelectItem>
                      <SelectItem value="8.1">8.1% (normal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_category">Steuerkategorie</Label>
                <Select 
                  value={formData.tax_category} 
                  onValueChange={(value) => setFormData({...formData, tax_category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taxCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name_de}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategory?.description_de && (
                  <p className="text-xs text-muted-foreground">{selectedCategory.description_de}</p>
                )}
              </div>

              {selectedCategory?.requires_business_purpose && (
                <div className="space-y-2">
                  <Label htmlFor="business_purpose">Geschäftszweck *</Label>
                  <Textarea
                    id="business_purpose"
                    value={formData.business_purpose}
                    onChange={(e) => setFormData({...formData, business_purpose: e.target.value})}
                    placeholder="Beschreiben Sie den geschäftlichen Zweck dieser Ausgabe..."
                    rows={2}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Für diese Kategorie ist eine Begründung des Geschäftszwecks erforderlich.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">MwSt.-Betrag:</span>
                <span className="font-semibold">{formData.vat_amount.toFixed(2)} CHF</span>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Ausgabe hinzufügen
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Ausgaben</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Noch keine Ausgaben erfasst</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Anbieter</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Betrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.slice(0, 10).map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-sm">
                          {new Date(expense.expense_date).toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{expense.vendor_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getExpenseTypeLabel(expense.expense_type)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{expense.category_name}</TableCell>
                        <TableCell>
                          <div className="text-right">
                            <p className="font-semibold">{expense.amount.toFixed(2)} {expense.currency}</p>
                            <p className="text-xs text-muted-foreground">
                              MwSt: {expense.vat_amount.toFixed(2)}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};