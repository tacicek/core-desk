import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useVendor } from '@/contexts/VendorContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Users,
  Calendar,
  Trash2,
  TrendingDown
} from 'lucide-react';

interface EmployeeExpense {
  id: string;
  employee_name: string;
  expense_date: string;
  amount: number;
  currency: string;
  expense_type: string;
  description: string;
  created_at: string;
}

const expenseTypes = [
  { value: 'salary', label: 'Gehalt' },
  { value: 'benefits', label: 'Zusatzleistungen' },
  { value: 'training', label: 'Schulungen' },
  { value: 'travel', label: 'Reisekosten' },
  { value: 'other', label: 'Sonstiges' }
];

export function EmployeeExpenseManager() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<EmployeeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    expense_date: new Date().toISOString().split('T')[0],
    amount: '',
    expense_type: 'salary',
    description: '',
    currency: 'CHF'
  });

  const loadExpenses = async () => {
    if (!vendor) return;

    try {
      const { data, error } = await supabase
        .from('employee_expenses')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading employee expenses:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Mitarbeitergiderleri",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      const { error } = await supabase
        .from('employee_expenses')
        .insert({
          vendor_id: vendor.id,
          employee_name: formData.employee_name,
          expense_date: formData.expense_date,
          amount: parseFloat(formData.amount),
          expense_type: formData.expense_type,
          description: formData.description,
          currency: formData.currency,
          created_by: vendor.id
        });

      if (error) throw error;

      toast({
        title: "Erfolgreich",
        description: "Mitarbeiter-Ausgabe wurde hinzugefügt",
      });

      setFormData({
        employee_name: '',
        expense_date: new Date().toISOString().split('T')[0],
        amount: '',
        expense_type: 'salary',
        description: '',
        currency: 'CHF'
      });
      setIsAdding(false);
      loadExpenses();
    } catch (error) {
      console.error('Error adding employee expense:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hinzufügen der Mitarbeiter-Ausgabe",
        variant: "destructive",
      });
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employee_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Erfolgreich",
        description: "Mitarbeiter-Ausgabe wurde gelöscht",
      });

      loadExpenses();
    } catch (error) {
      console.error('Error deleting employee expense:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen der Mitarbeiter-Ausgabe",
        variant: "destructive",
      });
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateMonthlyExpenses = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return expenses
      .filter(expense => expense.expense_date.startsWith(currentMonth))
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getUniqueEmployees = () => {
    const employeeNames = expenses.map(exp => exp.employee_name);
    return [...new Set(employeeNames)].length;
  };

  const getExpenseTypeLabel = (type: string) => {
    return expenseTypes.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{calculateTotalExpenses().toFixed(0)} CHF</p>
                <p className="text-sm text-muted-foreground">Gesamt Mitarbeiter-Ausgaben</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{calculateMonthlyExpenses().toFixed(0)} CHF</p>
                <p className="text-sm text-muted-foreground">Monatlich</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{getUniqueEmployees()}</p>
                <p className="text-sm text-muted-foreground">Mitarbeiter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Expense Form */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle>Neue Mitarbeiter-Ausgabe hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_name">Mitarbeitername</Label>
                  <Input
                    id="employee_name"
                    type="text"
                    placeholder="Name des Mitarbeiters"
                    value={formData.employee_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, employee_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expense_date">Datum</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Betrag (CHF)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expense_type">Ausgabentyp</Label>
                  <Select 
                    value={formData.expense_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, expense_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  placeholder="Beschreibung der Ausgabe..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Hinzufügen</Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mitarbeiter-Ausgaben</CardTitle>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Ausgabe
            </Button>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Noch keine Mitarbeiter-Ausgaben vorhanden</p>
                <p className="text-sm text-muted-foreground">
                  Fügen Sie Ihre erste Mitarbeiter-Ausgabe hinzu
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.employee_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(expense.expense_date).toLocaleDateString('de-DE')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{getExpenseTypeLabel(expense.expense_type)}</span>
                      </TableCell>
                      <TableCell className="font-bold text-red-600">
                        -{expense.amount.toFixed(2)} {expense.currency}
                      </TableCell>
                      <TableCell>{expense.description || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}