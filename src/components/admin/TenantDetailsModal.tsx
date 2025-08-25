import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, User, Mail, Phone, MapPin, Calendar, CreditCard, Users, FileText } from 'lucide-react';
import { TenantWithSubscription } from '@/types/admin';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import SubscriptionEditModal from './SubscriptionEditModal';

interface TenantDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantWithSubscription;
  onUpdate: () => void;
}

export default function TenantDetailsModal({ 
  open, 
  onOpenChange, 
  tenant, 
  onUpdate 
}: TenantDetailsModalProps) {
  const [showSubscriptionEdit, setShowSubscriptionEdit] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const { toast } = useToast();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      cancelled: 'outline'
    } as const;
    
    const labels = {
      active: 'Aktiv',
      trial: 'Test',
      suspended: 'Gesperrt',
      cancelled: 'Gekündigt'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPlanBadge = (planType?: string) => {
    if (!planType) return <Badge variant="outline">Kein Plan</Badge>;
    
    const labels = {
      basic: 'Basic',
      professional: 'Professional',
      enterprise: 'Enterprise'
    };

    return (
      <Badge variant="secondary">
        {labels[planType as keyof typeof labels] || planType}
      </Badge>
    );
  };

  const handleStatusChange = async (newStatus: 'active' | 'suspended') => {
    setStatusLoading(true);
    try {
      console.log('Changing tenant status:', tenant.id, 'to', newStatus);

      // Update tenant status in database
      const { error } = await supabase
        .from('tenants')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenant.id);

      if (error) {
        console.error('Error updating tenant status:', error);
        throw error;
      }

      // Also update subscription status if exists
      if (tenant.subscription) {
        const subscriptionStatus = newStatus === 'active' ? 'active' : 'suspended';
        
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ 
            status: subscriptionStatus,
            updated_at: new Date().toISOString()
          })
          .eq('tenant_id', tenant.id);

        if (subError) {
          console.error('Error updating subscription status:', subError);
          // Don't throw error for subscription update failure
        }
      }

      toast({
        title: "Status aktualisiert",
        description: `Mandant wurde erfolgreich ${newStatus === 'active' ? 'aktiviert' : 'gesperrt'}.`,
      });

      // Refresh parent component
      onUpdate();
      
      // Close modal after success
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      console.error('Error changing tenant status:', error);
      toast({
        title: "Fehler",
        description: `Beim ${newStatus === 'active' ? 'Aktivieren' : 'Sperren'} des Mandanten ist ein Fehler aufgetreten.`,
        variant: "destructive",
      });
    } finally {
      setStatusLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {tenant.company_name}
          </DialogTitle>
          <DialogDescription>
            Detaillierte Informationen über den Mandanten
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unternehmensinformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{tenant.company_name}</div>
                  <div className="text-sm text-muted-foreground">{tenant.domain}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{tenant.contact_person || 'Nicht angegeben'}</div>
                  <div className="text-sm text-muted-foreground">Ansprechpartner</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{tenant.contact_email}</div>
                  <div className="text-sm text-muted-foreground">Kontakt E-Mail</div>
                </div>
              </div>

              {tenant.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{tenant.phone}</div>
                    <div className="text-sm text-muted-foreground">Telefon</div>
                  </div>
                </div>
              )}

              {tenant.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{tenant.address}</div>
                    <div className="text-sm text-muted-foreground">Adresse</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {format(new Date(tenant.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Erstellt vor {formatDistanceToNow(new Date(tenant.created_at), { locale: de })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="font-medium">Status:</div>
                {getStatusBadge(tenant.status)}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abonnement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.subscription ? (
                <>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {getPlanBadge(tenant.subscription.plan_type)}
                      </div>
                      <div className="text-sm text-muted-foreground">Plan</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-medium">
                      {formatCurrency(tenant.subscription.price)} / {tenant.subscription.billing_cycle === 'monthly' ? 'Monat' : 'Jahr'}
                    </div>
                    <div className="text-sm text-muted-foreground">Preis</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {tenant.user_count || 0} / {tenant.subscription.max_users}
                      </div>
                      <div className="text-sm text-muted-foreground">Benutzer</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{tenant.subscription.max_invoices_per_month}</div>
                      <div className="text-sm text-muted-foreground">Max. Rechnungen/Monat</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {format(new Date(tenant.subscription.expires_at), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Läuft ab in {formatDistanceToNow(new Date(tenant.subscription.expires_at), { locale: de })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {tenant.subscription.features?.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      )) || <span className="text-sm text-muted-foreground">Keine Features definiert</span>}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Kein aktives Abonnement
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Separator />
        <div className="flex justify-between">
          <div className="space-x-2">
            <Button 
              variant="outline"
              onClick={() => {
                console.log('Abonnement bearbeiten clicked for tenant:', tenant.id);
                setShowSubscriptionEdit(true);
              }}
            >
              Abonnement bearbeiten
            </Button>
            <Button 
              variant="outline"
              onClick={async () => {
                console.log('Nachricht senden clicked for tenant:', tenant.contact_email);
                try {
                  if (tenant.contact_email) {
                    // Open email client with pre-filled subject
                    const subject = `Nachricht von ${window.location.hostname} Support`;
                    const body = `Hallo ${tenant.company_name},\n\n`;
                    const mailtoUrl = `mailto:${tenant.contact_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.open(mailtoUrl, '_blank');
                    
                    toast({
                      title: "E-Mail geöffnet",
                      description: `E-Mail an ${tenant.contact_email} wurde in Ihrem Standard-E-Mail-Client geöffnet.`,
                    });
                  } else {
                    toast({
                      title: "Keine E-Mail-Adresse",
                      description: "Für diesen Mandanten ist keine E-Mail-Adresse hinterlegt.",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  toast({
                    title: "Fehler",
                    description: "Fehler beim Öffnen des E-Mail-Clients.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Nachricht senden
            </Button>
            <Button 
              variant="outline"
              onClick={async () => {
                console.log('Als Mandant anmelden clicked for tenant:', tenant.id);
                try {
                  // Create a temporary login session for the tenant
                  // This would typically involve generating a secure token
                  const loginUrl = `/auth?tenant=${tenant.id}&temp_access=true`;
                  window.open(loginUrl, '_blank');
                  
                  toast({
                    title: "Tenant-Login",
                    description: `Login-Link für ${tenant.company_name} wurde geöffnet.`,
                  });
                } catch (error) {
                  toast({
                    title: "Fehler",
                    description: "Fehler beim Erstellen des Login-Links.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Als Mandant anmelden
            </Button>
          </div>
          <div className="space-x-2">
            {tenant.status === 'active' ? (
              <Button 
                variant="destructive"
                onClick={() => handleStatusChange('suspended')}
                disabled={statusLoading}
              >
                {statusLoading ? 'Wird gesperrt...' : 'Mandant sperren'}
              </Button>
            ) : (
              <Button 
                variant="default"
                onClick={() => handleStatusChange('active')}
                disabled={statusLoading}
              >
                {statusLoading ? 'Wird aktiviert...' : 'Mandant aktivieren'}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </div>
        </div>
        
        {/* Subscription Edit Modal */}
        <SubscriptionEditModal
          open={showSubscriptionEdit}
          onOpenChange={setShowSubscriptionEdit}
          tenant={tenant}
          onUpdate={onUpdate}
        />
      </DialogContent>
    </Dialog>
  );
}