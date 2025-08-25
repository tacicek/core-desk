import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TenantWithSubscription } from '@/types/admin';

interface SubscriptionEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantWithSubscription;
  onUpdate: () => void;
}

export default function SubscriptionEditModal({ 
  open, 
  onOpenChange, 
  tenant, 
  onUpdate 
}: SubscriptionEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [planType, setPlanType] = useState<'basic' | 'professional' | 'enterprise'>(tenant.subscription?.plan_type as 'basic' | 'professional' | 'enterprise' || 'basic');
  const [price, setPrice] = useState(tenant.subscription?.price || 0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(tenant.subscription?.billing_cycle as 'monthly' | 'yearly' || 'monthly');
  const [maxUsers, setMaxUsers] = useState(tenant.subscription?.max_users || 1);
  const [maxInvoices, setMaxInvoices] = useState(tenant.subscription?.max_invoices_per_month || 10);
  const [expiresAt, setExpiresAt] = useState(
    tenant.subscription?.expires_at 
      ? new Date(tenant.subscription.expires_at).toISOString().split('T')[0]
      : ''
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('Updating subscription for tenant:', tenant.id, {
        planType,
        price,
        billingCycle,
        maxUsers,
        maxInvoices,
        expiresAt
      });

      // Update subscription in database
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          tenant_id: tenant.id,
          plan_type: planType,
          price: parseFloat(price),
          billing_cycle: billingCycle,
          max_users: parseInt(maxUsers),
          max_invoices: parseInt(maxInvoices),
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (subError) {
        console.error('Error updating subscription:', subError);
        throw subError;
      }

      // Also update tenant status if needed
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', tenant.id);

      if (tenantError) {
        console.error('Error updating tenant:', tenantError);
        // Don't throw error for tenant update failure
      }

      toast({
        title: "Abonnement aktualisiert",
        description: `Das Abonnement für ${tenant.company_name} wurde erfolgreich aktualisiert.`,
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Fehler",
        description: "Beim Aktualisieren des Abonnements ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const planOptions = [
    { value: 'basic', label: 'Basic', basePrice: 29, maxUsers: 1, maxInvoices: 10 },
    { value: 'professional', label: 'Professional', basePrice: 79, maxUsers: 5, maxInvoices: 100 },
    { value: 'enterprise', label: 'Enterprise', basePrice: 199, maxUsers: 20, maxInvoices: 1000 }
  ];

  const handlePlanChange = (newPlan: string) => {
    const validPlan = newPlan as 'basic' | 'professional' | 'enterprise';
    setPlanType(validPlan);
    const selectedPlan = planOptions.find(p => p.value === validPlan);
    if (selectedPlan) {
      setPrice(billingCycle === 'yearly' ? selectedPlan.basePrice * 10 : selectedPlan.basePrice);
      setMaxUsers(selectedPlan.maxUsers);
      setMaxInvoices(selectedPlan.maxInvoices);
    }
  };

  const handleBillingCycleChange = (newCycle: string) => {
    const validCycle = newCycle as 'monthly' | 'yearly';
    setBillingCycle(validCycle);
    const selectedPlan = planOptions.find(p => p.value === planType);
    if (selectedPlan) {
      setPrice(validCycle === 'yearly' ? selectedPlan.basePrice * 10 : selectedPlan.basePrice);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Abonnement bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie das Abonnement für {tenant.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planType">Plan Typ</Label>
                  <Select value={planType} onValueChange={handlePlanChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {planOptions.map(plan => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="billingCycle">Abrechnungszyklus</Label>
                  <Select value={billingCycle} onValueChange={handleBillingCycleChange}>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preis (CHF)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="expiresAt">Läuft ab am</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUsers">Max. Benutzer</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxInvoices">Max. Rechnungen/Monat</Label>
                  <Input
                    id="maxInvoices"
                    type="number"
                    value={maxInvoices}
                    onChange={(e) => setMaxInvoices(Number(e.target.value))}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}