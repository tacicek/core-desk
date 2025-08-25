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
import { Loader2, Receipt, TrendingUp, PieChart, Calendar } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface GeneralExpense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  category: string;
  payment_method: string;
  status: string;
  created_at: string;
}

interface GeneralExpenseForm {
  title: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  category: string;
  payment_method: string;
}

export const GeneralExpenseManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState<GeneralExpense[]>([]);
  const [formData, setFormData] = useState<GeneralExpenseForm>({
    title: '',
    description: '',
    amount: 0,
    currency: 'CHF',
    expense_date: '',
    category: 'sonstiges',
    payment_method: 'bank_transfer'
  });
  const { toast } = useToast();
  const { vendor } = useVendor();

  // Load expenses from business_expenses table
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
        
        const formattedData = data?.map(expense => ({
          id: expense.id,
          title: expense.vendor_name || 'Allgemeine Ausgabe',
          description: expense.description || '',
          amount: expense.amount,
          currency: expense.currency,
          expense_date: expense.expense_date,
          category: expense.tax_category,
          payment_method: expense.payment_method || 'bank_transfer',
          status: expense.status,
          created_at: expense.created_at
        })) || [];
        
        setExpenses(formattedData);
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    };

    loadExpenses();
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('business_expenses')
        .insert({
          vendor_id: vendor.id,
          created_by: user.id,
          vendor_name: formData.title,
          description: formData.description,
          amount: formData.amount,
          currency: formData.currency,
          expense_date: formData.expense_date,
          tax_category: formData.category,
          payment_method: formData.payment_method,
          expense_type: 'other',
          status: 'paid',
          payment_date: formData.expense_date,
          needs_review: false,
          ai_confidence: 1.0,
          vat_rate: 0,
          vat_amount: 0
        });

      if (error) throw error;

      toast({
        title: "Ausgabe hinzugefügt",
        description: "Die allgemeine Ausgabe wurde erfolgreich hinzugefügt.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        amount: 0,
        currency: 'CHF',
        expense_date: '',
        category: 'sonstiges',
        payment_method: 'bank_transfer'
      });

      // Reload expenses
      const { data } = await supabase
        .from('business_expenses')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('expense_date', { ascending: false });
      
      if (data) {
        const formattedData = data.map(expense => ({
          id: expense.id,
          title: expense.vendor_name || 'Allgemeine Ausgabe',
          description: expense.description || '',
          amount: expense.amount,
          currency: expense.currency,
          expense_date: expense.expense_date,
          category: expense.tax_category,
          payment_method: expense.payment_method || 'bank_transfer',
          status: expense.status,
          created_at: expense.created_at
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

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'operating_expenses': 'Betriebsausgaben',
      'travel_expenses': 'Reisekosten',
      'office_supplies': 'Büromaterial',
      'marketing': 'Marketing',
      'equipment': 'Ausrüstung',
      'sonstiges': 'Sonstiges'
    };
    return categories[category] || category;
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
    const monthlyTotal = expenses
      .filter(exp => {
        const expDate = new Date(exp.expense_date);
        const now = new Date();
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return { totalAmount, monthlyTotal, categoryTotals };
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
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.monthlyTotal.toFixed(0)} CHF</p>
                <p className="text-sm text-muted-foreground">Diesen Monat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{Object.keys(stats.categoryTotals).length}</p>
                <p className="text-sm text-muted-foreground">Kategorien</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle>Neue Ausgabe</CardTitle>
            <CardDescription>
              Fügen Sie allgemeine Ausgaben hinzu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="z.B. Büromaterial, Tankkosten..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Betrag</Label>
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
                  <Label htmlFor="expense_date">Datum</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operating_expenses">Betriebsausgaben</SelectItem>
                    <SelectItem value="travel_expenses">Reisekosten</SelectItem>
                    <SelectItem value="office_supplies">Büromaterial</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="equipment">Ausrüstung</SelectItem>
                    <SelectItem value="sonstiges">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Zahlungsmethode</Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value) => setFormData({...formData, payment_method: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Banküberweisung</SelectItem>
                    <SelectItem value="credit_card">Kreditkarte</SelectItem>
                    <SelectItem value="cash">Bargeld</SelectItem>
                    <SelectItem value="debit_card">Debitkarte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Zusätzliche Details zur Ausgabe..."
                  rows={3}
                />
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
                      <TableHead>Titel</TableHead>
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
                        <TableCell className="font-medium">{expense.title}</TableCell>
                        <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {expense.amount.toFixed(2)} {expense.currency}
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