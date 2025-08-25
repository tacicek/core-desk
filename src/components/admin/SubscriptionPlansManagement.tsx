import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Users, 
  FileText, 
  Settings,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: 'monthly' | 'yearly';
  max_users: number;
  max_invoices_per_month: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  stripe_price_id: string;
  trial_period_days: number;
  created_at: string;
  updated_at: string;
}

export default function SubscriptionPlansManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    price: 0,
    currency: 'CHF',
    billing_interval: 'monthly',
    max_users: 5,
    max_invoices_per_month: 100,
    features: [],
    is_active: true,
    sort_order: 0,
    stripe_price_id: '',
    trial_period_days: 0
  });
  const [featureInput, setFeatureInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans((data as SubscriptionPlan[]) || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: "Fehler",
        description: "Abonnement-Pläne konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const handleSavePlan = async () => {
    try {
      const planData = {
        name: formData.name || '',
        description: formData.description || '',
        price: formData.price || 0,
        currency: formData.currency || 'CHF',
        billing_interval: formData.billing_interval || 'monthly',
        max_users: formData.max_users === -1 ? null : formData.max_users,
        max_invoices_per_month: formData.max_invoices_per_month === -1 ? null : formData.max_invoices_per_month,
        features: formData.features || [],
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        sort_order: formData.sort_order || 0,
        stripe_price_id: formData.stripe_price_id || '',
        trial_period_days: formData.trial_period_days || 0
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: "Erfolg",
          description: "Abonnement-Plan wurde aktualisiert."
        });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(planData);

        if (error) throw error;

        toast({
          title: "Erfolg",
          description: "Neuer Abonnement-Plan wurde erstellt."
        });
      }

      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Fehler",
        description: "Plan konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Abonnement-Plan wurde gelöscht."
      });
      
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Fehler",
        description: "Plan konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !isActive })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: `Plan wurde ${!isActive ? 'aktiviert' : 'deaktiviert'}.`
      });
      
      loadPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      max_users: plan.max_users || -1,
      max_invoices_per_month: plan.max_invoices_per_month || -1,
      features: plan.features,
      is_active: plan.is_active,
      sort_order: plan.sort_order,
      stripe_price_id: plan.stripe_price_id,
      trial_period_days: plan.trial_period_days
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'CHF',
      billing_interval: 'monthly',
      max_users: 5,
      max_invoices_per_month: 100,
      features: [],
      is_active: true,
      sort_order: 0,
      stripe_price_id: '',
      trial_period_days: 0
    });
    setFeatureInput('');
  };

  const addFeature = () => {
    if (featureInput.trim() && formData.features) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()]
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    if (formData.features) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData({ ...formData, features: newFeatures });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Abonnement-Pläne verwalten</h2>
          <p className="text-purple-200">Erstellen und bearbeiten Sie Ihre Abonnement-Pläne</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingPlan(null);
                resetForm();
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuer Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Plan bearbeiten' : 'Neuer Abonnement-Plan'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Bearbeiten Sie die Details dieses Plans' : 'Erstellen Sie einen neuen Abonnement-Plan'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Professional"
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">Sortierung</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kurze Beschreibung des Plans"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Preis</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Währung</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="billing_interval">Abrechnungsintervall</Label>
                  <Select 
                    value={formData.billing_interval} 
                    onValueChange={(value: 'monthly' | 'yearly') => setFormData({ ...formData, billing_interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                      <SelectItem value="yearly">Jährlich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_users">Max. Benutzer (-1 = unbegrenzt)</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_invoices_per_month">Max. Rechnungen/Monat (-1 = unbegrenzt)</Label>
                  <Input
                    id="max_invoices_per_month"
                    type="number"
                    value={formData.max_invoices_per_month}
                    onChange={(e) => setFormData({ ...formData, max_invoices_per_month: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="trial_period_days">Testzeitraum (Tage)</Label>
                  <Input
                    id="trial_period_days"
                    type="number"
                    value={formData.trial_period_days}
                    onChange={(e) => setFormData({ ...formData, trial_period_days: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {/* Stripe Integration */}
              <div>
                <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                <Input
                  id="stripe_price_id"
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                  placeholder="price_xxxxxxxxxxxxx"
                />
              </div>

              {/* Features */}
              <div>
                <Label>Features</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Feature hinzufügen"
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button type="button" onClick={addFeature} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features?.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Plan ist aktiv</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSavePlan}>
                <Save className="h-4 w-4 mr-2" />
                {editingPlan ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Table */}
      <Card className="bg-slate-800/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Alle Abonnement-Pläne
          </CardTitle>
          <CardDescription className="text-purple-200">
            Verwalten Sie Ihre verfügbaren Abonnement-Pläne und deren Eigenschaften
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-purple-200">Plan</TableHead>
                <TableHead className="text-purple-200">Preis</TableHead>
                <TableHead className="text-purple-200">Intervall</TableHead>
                <TableHead className="text-purple-200">Limits</TableHead>
                <TableHead className="text-purple-200">Status</TableHead>
                <TableHead className="text-purple-200">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{plan.name}</div>
                      <div className="text-sm text-purple-300">{plan.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-white">
                      {formatCurrency(plan.price)}
                    </div>
                    <div className="text-sm text-purple-300">
                      {plan.billing_interval === 'monthly' ? 'Monatlich' : 'Jährlich'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-purple-300">
                      {plan.billing_interval === 'monthly' ? 'Monatlich' : 'Jährlich'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-purple-300">
                      <div>Benutzer: {plan.max_users === null ? 'Unbegrenzt' : plan.max_users}</div>
                      <div>Rechnungen: {plan.max_invoices_per_month === null ? 'Unbegrenzt' : plan.max_invoices_per_month}/Monat</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(plan.id, plan.is_active)}
                      >
                        {plan.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Aktive Pläne</CardTitle>
            <Eye className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {plans.filter(p => p.is_active).length}
            </div>
            <p className="text-xs text-purple-300">
              von {plans.length} Gesamtplänen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Monatliche Pläne</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {plans.filter(p => p.billing_interval === 'monthly').length}
            </div>
            <p className="text-xs text-purple-300">
              Abrechenbar monatlich
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Jährliche Pläne</CardTitle>
            <FileText className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {plans.filter(p => p.billing_interval === 'yearly').length}
            </div>
            <p className="text-xs text-purple-300">
              Abrechenbar jährlich
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}