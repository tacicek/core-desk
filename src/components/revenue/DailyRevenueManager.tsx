import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus,
  TrendingUp,
  Calendar,
  Trash2,
  Euro,
  Pencil
} from 'lucide-react';

interface DailyRevenue {
  id: string;
  revenue_date: string;
  amount: number;
  currency: string;
  description: string;
  source: string;
  vat_category?: 'dine_in' | 'takeaway_delivery';
  vat_rate?: number;
  vat_amount?: number;
  net_amount?: number;
  created_at: string;
}

export function DailyRevenueManager() {
  const { vendor, userProfile } = useVendor();
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<DailyRevenue | null>(null);
  const [formData, setFormData] = useState({
    revenue_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    currency: 'CHF',
    vat_category: 'dine_in' as 'dine_in' | 'takeaway_delivery'
  });

  const loadRevenues = async () => {
    if (!vendor) return;
    
    try {
      console.log('Loading revenues from Supabase...');
      const { data, error } = await supabase
        .from('daily_revenue')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('revenue_date', { ascending: false });

      if (error) {
        console.error('Error loading revenues:', error);
        toast({
          title: "Fehler",
          description: "Fehler beim Laden der Umsatz-Daten",
          variant: "destructive",
        });
        return;
      }

      setRevenues(data || []);
    } catch (error) {
      console.error('Error loading revenues:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Umsatz-Daten",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenues();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      const grossAmount = parseFloat(formData.amount);
      const vatRate = formData.vat_category === 'dine_in' ? 8.1 : 2.6;
      const netAmount = grossAmount / (1 + vatRate / 100);
      const vatAmount = grossAmount - netAmount;

      const { error } = await supabase
        .from('daily_revenue')
        .insert({
          vendor_id: vendor.id,
          created_by: userProfile?.id || '',
          revenue_date: formData.revenue_date,
          amount: grossAmount,
          net_amount: netAmount,
          vat_amount: vatAmount,
          vat_rate: vatRate,
          vat_category: formData.vat_category,
          description: formData.description,
          currency: formData.currency,
          source: 'manual'
        });

      if (error) {
        console.error('Error adding revenue:', error);
        toast({
          title: "Fehler",
          description: "Fehler beim Hinzufügen des Umsatzes",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erfolgreich",
        description: "Täglicher Umsatz wurde hinzugefügt",
      });

      setFormData({
        revenue_date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        currency: 'CHF',
        vat_category: 'dine_in'
      });
      setIsAdding(false);
      loadRevenues();
    } catch (error) {
      console.error('Error adding revenue:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hinzufügen des Umsatzes",
        variant: "destructive",
      });
    }
  };

  const editRevenue = (revenue: DailyRevenue) => {
    setEditingRevenue(revenue);
    setFormData({
      revenue_date: revenue.revenue_date,
      amount: revenue.amount.toString(),
      description: revenue.description || '',
      currency: revenue.currency,
      vat_category: revenue.vat_category || 'dine_in'
    });
    setIsAdding(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !editingRevenue) return;

    try {
      const grossAmount = parseFloat(formData.amount);
      const vatRate = formData.vat_category === 'dine_in' ? 8.1 : 2.6;
      const netAmount = grossAmount / (1 + vatRate / 100);
      const vatAmount = grossAmount - netAmount;

      const { error } = await supabase
        .from('daily_revenue')
        .update({
          revenue_date: formData.revenue_date,
          amount: grossAmount,
          net_amount: netAmount,
          vat_amount: vatAmount,
          vat_rate: vatRate,
          vat_category: formData.vat_category,
          description: formData.description,
          currency: formData.currency,
        })
        .eq('id', editingRevenue.id)
        .select();

      if (error) {
        console.error('Error updating revenue:', error);
        toast({
          title: "Fehler",
          description: "Fehler beim Aktualisieren des Umsatzes",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erfolgreich",
        description: "Umsatz wurde aktualisiert",
      });

      setFormData({
        revenue_date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        currency: 'CHF',
        vat_category: 'dine_in'
      });
      setEditingRevenue(null);
      setIsAdding(false);
      loadRevenues();
    } catch (error) {
      console.error('Error updating revenue:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Umsatzes",
        variant: "destructive",
      });
    }
  };

  const deleteRevenue = async (id: string) => {
    if (!vendor?.id) {
      toast({
        title: "Fehler", 
        description: "Vendor-ID nicht gefunden",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Deleting revenue with ID:', id, 'for vendor:', vendor.id);
      
      const { error } = await supabase
        .from('daily_revenue')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting revenue:', error);
        toast({
          title: "Fehler",
          description: `Fehler beim Löschen des Umsatzes: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erfolgreich",
        description: "Umsatz wurde gelöscht",
      });

      loadRevenues();
    } catch (error) {
      console.error('Error deleting revenue:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Umsatzes",
        variant: "destructive",
      });
    }
  };

  const calculateTotalRevenue = () => {
    return revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  };

  const calculateVATByCategory = () => {
    const dineInVAT = revenues
      .filter(r => r.vat_category === 'dine_in')
      .reduce((sum, r) => sum + (r.vat_amount || 0), 0);
    
    const takeawayVAT = revenues
      .filter(r => r.vat_category === 'takeaway_delivery')
      .reduce((sum, r) => sum + (r.vat_amount || 0), 0);
    
    // For legacy entries without vat_category, assume dine_in with 8.1% rate
    const legacyVAT = revenues
      .filter(r => !r.vat_category)
      .reduce((sum, r) => sum + (r.amount * 0.081 / 1.081), 0);
    
    return { 
      dineInVAT: dineInVAT + legacyVAT, 
      takeawayVAT, 
      totalVAT: dineInVAT + takeawayVAT + legacyVAT 
    };
  };

  const calculateMonthlyRevenue = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return revenues
      .filter(revenue => revenue.revenue_date.startsWith(currentMonth))
      .reduce((sum, revenue) => sum + revenue.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const vatData = calculateVATByCategory();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-lg font-bold">{calculateTotalRevenue().toFixed(0)} CHF</p>
                <p className="text-sm text-muted-foreground">Gesamt Umsatz</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-lg font-bold">{calculateMonthlyRevenue().toFixed(0)} CHF</p>
                <p className="text-sm text-muted-foreground">Monatlicher Umsatz</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-lg font-bold">{revenues.length}</p>
                <p className="text-sm text-muted-foreground">Einträge</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-lg font-bold">{vatData.totalVAT.toFixed(2)} CHF</p>
                <p className="text-sm text-muted-foreground">Gesamt MwSt.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VAT Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">MwSt. Aufschlüsselung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Dine-In (8.1%)</span>
                <span className="font-bold text-green-600">{vatData.dineInVAT.toFixed(2)} CHF</span>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Takeaway/Delivery (2.6%)</span>
                <span className="font-bold text-blue-600">{vatData.takeawayVAT.toFixed(2)} CHF</span>
              </div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Gesamt MwSt.</span>
                <span className="font-bold text-primary">{vatData.totalVAT.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Revenue Form */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {editingRevenue ? 'Umsatz bearbeiten' : 'Neuen täglichen Umsatz hinzufügen'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingRevenue ? handleUpdate : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="revenue_date">Datum</Label>
                  <Input
                    id="revenue_date"
                    type="date"
                    value={formData.revenue_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, revenue_date: e.target.value }))}
                    required
                  />
                </div>
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
                  <Label htmlFor="vat_category">MwSt. Kategorie</Label>
                  <Select
                    value={formData.vat_category}
                    onValueChange={(value: 'dine_in' | 'takeaway_delivery') => 
                      setFormData(prev => ({ ...prev, vat_category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine_in">Dine-In (8.1% MwSt.)</SelectItem>
                      <SelectItem value="takeaway_delivery">Takeaway/Delivery (2.6% MwSt.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  placeholder="Beschreibung des Umsatzes..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingRevenue ? 'Aktualisieren' : 'Hinzufügen'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingRevenue(null);
                    setFormData({
                      revenue_date: new Date().toISOString().split('T')[0],
                      amount: '',
                      description: '',
                      currency: 'CHF',
                      vat_category: 'dine_in'
                    });
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">Täglicher Umsatz</CardTitle>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Umsatz
            </Button>
          </CardHeader>
          <CardContent>
            {revenues.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Noch keine Umsatz-Daten vorhanden</p>
                <p className="text-sm text-muted-foreground">
                  Fügen Sie Ihren ersten täglichen Umsatz hinzu
                </p>
              </div>
            ) : (
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Datum</TableHead>
                     <TableHead>Betrag</TableHead>
                     <TableHead>MwSt. Kategorie</TableHead>
                     <TableHead>MwSt. Betrag</TableHead>
                     <TableHead>Beschreibung</TableHead>
                     <TableHead>Aktionen</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                   {revenues.map((revenue) => (
                     <TableRow key={revenue.id}>
                       <TableCell>
                         <div className="flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           {new Date(revenue.revenue_date).toLocaleDateString('de-DE')}
                         </div>
                       </TableCell>
                       <TableCell className="font-bold text-green-600">
                         {revenue.amount.toFixed(2)} {revenue.currency}
                       </TableCell>
                        <TableCell>
                          {revenue.vat_category ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              revenue.vat_category === 'dine_in' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {revenue.vat_category === 'dine_in' ? 'Dine-In (8.1%)' : 'Takeaway (2.6%)'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Legacy (8.1%)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {revenue.vat_amount ? 
                            revenue.vat_amount.toFixed(2) : 
                            (revenue.amount * 0.081 / 1.081).toFixed(2)
                          } CHF
                        </TableCell>
                       <TableCell>{revenue.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editRevenue(revenue)}
                              title="Bearbeiten"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteRevenue(revenue.id)}
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
