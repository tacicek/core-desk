import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NewTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function NewTenantModal({ open, onOpenChange, onSuccess }: NewTenantModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    contact_person: '',
    phone: '',
    address: '',
    domain: '',
    plan_type: 'basic',
    billing_cycle: 'monthly',
    max_users: 5,
    max_invoices_per_month: 100
  });
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating tenant with data:', formData);
      
      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          company_name: formData.company_name,
          contact_email: formData.contact_email,
          contact_person: formData.contact_person,
          phone: formData.phone,
          address: formData.address,
          domain: formData.domain,
          status: 'trial'
        })
        .select()
        .maybeSingle();

      console.log('Tenant creation result:', { tenant, tenantError });

      if (tenantError) {
        console.error('Tenant creation error:', tenantError);
        throw tenantError;
      }

      if (!tenant) {
        throw new Error('Tenant was not created - no data returned');
      }

      // Create subscription
      const planPrices = {
        basic: 29.00,
        professional: 79.00,
        enterprise: 149.00
      };

      console.log('Creating subscription for tenant:', tenant.id);

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenant.id,
          plan_type: formData.plan_type,
          status: 'active',
          billing_cycle: formData.billing_cycle,
          price: planPrices[formData.plan_type as keyof typeof planPrices],
          currency: 'CHF',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + (formData.billing_cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
          max_users: formData.max_users,
          max_invoices_per_month: formData.max_invoices_per_month,
          features: formData.plan_type === 'basic' ? ['invoicing'] : 
                   formData.plan_type === 'professional' ? ['invoicing', 'hr', 'reports'] :
                   ['invoicing', 'hr', 'reports', 'api', 'analytics']
        });

      console.log('Subscription creation result:', { subscriptionError });

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError);
        throw subscriptionError;
      }

      toast({
        title: "Erfolg",
        description: "Neuer Mandant wurde erfolgreich erstellt."
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        company_name: '',
        contact_email: '',
        contact_person: '',
        phone: '',
        address: '',
        domain: '',
        plan_type: 'basic',
        billing_cycle: 'monthly',
        max_users: 5,
        max_invoices_per_month: 100
      });

    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        title: "Fehler",
        description: "Mandant konnte nicht erstellt werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuen Mandanten erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Mandanten mit zugehörigem Abonnement
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unternehmensinformationen</CardTitle>
              <CardDescription>Grundlegende Informationen über das Unternehmen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Firmenname *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => updateFormData('company_name', e.target.value)}
                    placeholder="ABC GmbH"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => updateFormData('domain', e.target.value)}
                    placeholder="abc-gmbh.ch"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Ansprechpartner</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => updateFormData('contact_person', e.target.value)}
                    placeholder="Max Mustermann"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_email">E-Mail *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => updateFormData('contact_email', e.target.value)}
                    placeholder="max@abc-gmbh.ch"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+41 44 123 45 67"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder="Musterstraße 123, 8000 Zürich, Schweiz"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abonnement Konfiguration</CardTitle>
              <CardDescription>Wählen Sie den passenden Plan für den Mandanten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan_type">Plan *</Label>
                  <Select value={formData.plan_type} onValueChange={(value) => updateFormData('plan_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (CHF 29/Monat)</SelectItem>
                      <SelectItem value="professional">Professional (CHF 79/Monat)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (CHF 149/Monat)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Abrechnungszyklus *</Label>
                  <Select value={formData.billing_cycle} onValueChange={(value) => updateFormData('billing_cycle', value)}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_users">Max. Benutzer</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => updateFormData('max_users', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_invoices">Max. Rechnungen/Monat</Label>
                  <Input
                    id="max_invoices"
                    type="number"
                    value={formData.max_invoices_per_month}
                    onChange={(e) => updateFormData('max_invoices_per_month', parseInt(e.target.value))}
                    min="10"
                    max="10000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Wird erstellt...' : 'Mandant erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}