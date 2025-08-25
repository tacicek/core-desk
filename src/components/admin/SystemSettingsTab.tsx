import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, CreditCard, Mail, Smartphone, Database, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionManagement } from './SubscriptionManagement';

export default function SystemSettingsTab() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const { toast } = useToast();

  const plans = [
    {
      name: 'Basic',
      price: 29.00,
      currency: 'CHF',
      features: ['Rechnungserstellung', 'Kundenverwaltung', 'Basis-Support'],
      maxUsers: 5,
      maxInvoices: 100
    },
    {
      name: 'Professional',
      price: 79.00,
      currency: 'CHF',
      features: ['Alle Basic Features', 'Personalverwaltung', 'Erweiterte Berichte', 'Priority Support'],
      maxUsers: 25,
      maxInvoices: 500
    },
    {
      name: 'Enterprise',
      price: 149.00,
      currency: 'CHF',
      features: ['Alle Professional Features', 'API Zugang', 'Analytics', 'Dedicated Support'],
      maxUsers: 100,
      maxInvoices: 2000
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Global Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Globale Plattform-Einstellungen
          </CardTitle>
          <CardDescription>
            Systemweite Konfiguration und Wartungsmodus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance">Wartungsmodus</Label>
                  <p className="text-sm text-muted-foreground">
                    Blockiert den Zugang für alle Benutzer außer Admins
                  </p>
                </div>
                <Switch
                  id="maintenance"
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="registration">Neue Registrierungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Erlaubt neuen Mandanten sich zu registrieren
                  </p>
                </div>
                <Switch
                  id="registration"
                  checked={registrationEnabled}
                  onCheckedChange={setRegistrationEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">E-Mail Benachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Systemweite E-Mail Benachrichtigungen aktivieren
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-rate-limit">API Rate Limit</Label>
                <Input
                  id="api-rate-limit"
                  placeholder="1000 Requests/Stunde"
                  defaultValue="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (Minuten)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  placeholder="60"
                  defaultValue="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Backup Häufigkeit</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Stündlich</SelectItem>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button>
            Einstellungen speichern
          </Button>
        </CardContent>
      </Card>

      {/* Current Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle>Abonelik Yönetimi</CardTitle>
          <CardDescription>
            Mevcut aboneliğinizi görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionManagement />
        </CardContent>
      </Card>

      {/* Plan Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Abonnement-Pläne verwalten
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie verfügbare Pläne und deren Features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plans.map((plan, index) => (
              <Card key={index}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="text-2xl font-bold">
                        {formatCurrency(plan.price)}
                        <span className="text-sm font-normal text-muted-foreground">/Monat</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Bearbeiten
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium">Max. Benutzer</div>
                      <div className="text-lg">{plan.maxUsers}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Max. Rechnungen/Monat</div>
                      <div className="text-lg">{plan.maxInvoices}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Features</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {plan.features.slice(0, 2).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {plan.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{plan.features.length - 2} mehr
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outline" className="w-full">
              Neuen Plan hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Zahlungsanbieter
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie Stripe, PayPal und andere Zahlungsoptionen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stripe-key">Stripe Publishable Key</Label>
              <Input
                id="stripe-key"
                placeholder="pk_live_..."
                type="password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
              <Input
                id="stripe-secret"
                placeholder="sk_live_..."
                type="password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook Endpoint</Label>
              <Input
                id="webhook-url"
                placeholder="https://your-domain.com/webhooks/stripe"
                defaultValue="https://wnedqmxejgynelhtbpmw.supabase.co/functions/v1/stripe-webhook"
              />
            </div>
            
            <Button>
              Stripe Konfiguration speichern
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail Service
            </CardTitle>
            <CardDescription>
              SMTP und E-Mail-Provider Einstellungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  placeholder="587"
                  defaultValue="587"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-security">Verschlüsselung</Label>
                <Select defaultValue="tls">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine</SelectItem>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp-username">Benutzername</Label>
              <Input
                id="smtp-username"
                placeholder="your-email@domain.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp-password">Passwort</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="Ihr E-Mail Passwort"
              />
            </div>
            
            <Button>
              E-Mail Konfiguration speichern
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}