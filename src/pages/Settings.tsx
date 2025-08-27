import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { settingsStorage } from "@/lib/storage-simple";
import { supabase } from "@/integrations/supabase/client";
import { CompanySettings } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SecureApiKeyInput } from "@/components/SecureApiKeyInput";
import { useErrorReporting } from "@/components/ErrorBoundary";
// Migration manager removed

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { reportError } = useErrorReporting();
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxNumber: '',
    qrIban: '',
    bankName: '',
    logo: '',
    invoiceNumberFormat: 'QR-{YYYY}-{MM}-{###}',
    defaultDueDays: 30,
    defaultTaxRate: 8.1,
    senderEmail: '',
    senderName: '',
    emailSubjectTemplate: 'Rechnung {invoiceNumber} von {companyName}',
    emailBodyTemplate: 'Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung {invoiceNumber} vom {invoiceDate}.\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüssen\n{companyName}',
    contactPerson: '',
    contactPosition: ''
  });

  // Separate address fields for UI
  const [addressFields, setAddressFields] = useState({
    street: '',
    number: '',
    postalCode: '',
    city: ''
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: false,
    overdueInvoices: false,
    paymentReceived: false
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load settings from Supabase on component mount
    const loadSettings = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Get current user's vendor ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Benutzer nicht angemeldet');
          return;
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('vendor_id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setError('Benutzerprofil nicht gefunden');
          return;
        }

        // Load company settings from Supabase
        const { data: supabaseSettings } = await supabase
          .from('company_settings')
          .select('*')
          .eq('vendor_id', profile.vendor_id)
          .single();

        if (supabaseSettings) {
          const companySettings: CompanySettings = {
            name: supabaseSettings.name || '',
            address: supabaseSettings.address || '',
            phone: supabaseSettings.phone || '',
            email: supabaseSettings.email || '',
            taxNumber: supabaseSettings.tax_number || '',
            qrIban: supabaseSettings.qr_iban || '',
            bankName: supabaseSettings.bank_name || '',
            logo: supabaseSettings.logo || '',
            invoiceNumberFormat: supabaseSettings.invoice_number_format || 'F-{YYYY}-{MM}-{###}',
            defaultDueDays: supabaseSettings.default_due_days || 30,
            defaultTaxRate: supabaseSettings.default_tax_rate || 8.1,
            senderEmail: supabaseSettings.sender_email || '',
            senderName: supabaseSettings.sender_name || '',
            emailSubjectTemplate: supabaseSettings.email_subject_template || 'Rechnung {invoiceNumber} von {companyName}',
            emailBodyTemplate: supabaseSettings.email_body_template || 'Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung {invoiceNumber} vom {invoiceDate}.\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüssen\n{companyName}',
            contactPerson: '',
            contactPosition: ''
          };
          
          console.log('✅ Loaded settings from Supabase in Settings page:', companySettings);
          setSettings(companySettings);
          
          // Parse existing address into separate fields
          if (companySettings.address) {
            const addressLines = companySettings.address.split('\n');
            if (addressLines.length >= 2) {
              const firstLine = addressLines[0] || '';
              const lastSpaceIndex = firstLine.lastIndexOf(' ');
              const street = lastSpaceIndex > 0 ? firstLine.substring(0, lastSpaceIndex) : firstLine;
              const number = lastSpaceIndex > 0 ? firstLine.substring(lastSpaceIndex + 1) : '';
              
              const secondLine = addressLines[1] || '';
              const spaceIndex = secondLine.indexOf(' ');
              const postalCode = spaceIndex > 0 ? secondLine.substring(0, spaceIndex) : '';
              const city = spaceIndex > 0 ? secondLine.substring(spaceIndex + 1) : secondLine;
              
              setAddressFields({
                street,
                number,
                postalCode,
                city
              });
            }
          }
        } else {
          console.log('No company settings found in Supabase');
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
        setError('Fehler beim Laden der Einstellungen');
        reportError(error, 'Settings page - loadSettings');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleInputChange = (field: keyof CompanySettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressFieldChange = (field: keyof typeof addressFields, value: string) => {
    setAddressFields(prev => {
      const newFields = { ...prev, [field]: value };
      
      // Combine address fields into a single address string
      const addressParts = [];
      if (newFields.street.trim()) {
        const streetAndNumber = [newFields.street.trim(), newFields.number.trim()].filter(Boolean).join(' ');
        addressParts.push(streetAndNumber);
      }
      if (newFields.postalCode.trim() || newFields.city.trim()) {
        const postalAndCity = [newFields.postalCode.trim(), newFields.city.trim()].filter(Boolean).join(' ');
        addressParts.push(postalAndCity);
      }
      const fullAddress = addressParts.join('\n');
      
      // Update settings with combined address
      setSettings(prevSettings => ({
        ...prevSettings,
        address: fullAddress
      }));
      
      return newFields;
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSettings(prev => ({
          ...prev,
          logo: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    try {
      // Save to localStorage (for compatibility)
      await settingsStorage.save(settings);
      
      // Also save to Supabase database for email notifications
      try {
        // Get current user and vendor ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get user's vendor ID
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('vendor_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.vendor_id) {
          throw new Error('No vendor found for user');
        }

        // Check if settings already exist for this vendor
        const { data: existingSettings } = await supabase
          .from('company_settings')
          .select('id')
          .eq('vendor_id', profile.vendor_id)
          .single();

        const settingsData = {
          name: settings.name,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          tax_number: settings.taxNumber,
          qr_iban: settings.qrIban,
          bank_name: settings.bankName,
          logo: settings.logo,
          invoice_number_format: settings.invoiceNumberFormat,
          default_due_days: settings.defaultDueDays,
          default_tax_rate: settings.defaultTaxRate,
          sender_email: settings.senderEmail,
          sender_name: settings.senderName,
          email_subject_template: settings.emailSubjectTemplate,
          email_body_template: settings.emailBodyTemplate,
          user_id: user.id,
          vendor_id: profile.vendor_id
        };

        if (existingSettings) {
          // Update existing settings
          await supabase
            .from('company_settings')
            .update(settingsData)
            .eq('id', existingSettings.id);
        } else {
          // Insert new settings
          await supabase
            .from('company_settings')
            .insert(settingsData);
        }
        
        console.log('✅ Settings saved to database for email notifications');
      } catch (dbError) {
        console.log('⚠️ Could not save to database (email notifications may not work):', dbError);
      }
      
      toast({
        title: "Firma erfolgreich erstellt!",
        description: "Ihre Firmeninformationen wurden gespeichert. Sie werden zur Firmenübersicht weitergeleitet.",
      });
      
      // Redirect to company info page after a short delay
      setTimeout(() => {
        navigate('/dashboard/company-info');
      }, 1500);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Speichern der Einstellungen ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  };

  const resetSettings = () => {
    const defaultSettings: CompanySettings = {
      name: '',
      address: '',
      phone: '',
      email: '',
      taxNumber: '',
      qrIban: '',
      bankName: '',
      logo: '',
      invoiceNumberFormat: 'QR-{YYYY}-{MM}-{###}',
      defaultDueDays: 30,
      defaultTaxRate: 7.7,
      senderEmail: '',
      senderName: '',
      emailSubjectTemplate: 'Rechnung {invoiceNumber} von {companyName}',
      emailBodyTemplate: 'Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung {invoiceNumber} vom {invoiceDate}.\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüssen\n{companyName}',
      contactPerson: '',
      contactPosition: ''
    };
    setSettings(defaultSettings);
    setAddressFields({
      street: '',
      number: '',
      postalCode: '',
      city: ''
    });
    toast({
      title: "Einstellungen zurückgesetzt",
      description: "Alle Einstellungen wurden auf Standardwerte zurückgesetzt.",
    });
  };

  const migrationCompleted = localStorage.getItem('supabase_migration_completed');

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Fehler beim Laden</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()}>
              🔄 Seite neu laden
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              🏠 Zurück zum Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Einstellungen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalten Sie Ihre Anwendungseinstellungen</p>
      </div>

      {/* Migration manager removed */}

      <div className="grid gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Firmeninformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {/* Logo Upload */}
            <div>
              <Label htmlFor="company-logo">Firmenlogo</Label>
              <div className="mt-2 space-y-2">
                <Input 
                  id="company-logo" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                />
                {settings.logo && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <img 
                      src={settings.logo} 
                      alt="Firmenlogo" 
                      className="h-12 w-12 md:h-16 md:w-16 object-contain border border-border rounded"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, logo: '' }))}
                    >
                      Logo entfernen
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label htmlFor="company-name">Firmenname</Label>
                <Input 
                  id="company-name" 
                  placeholder="Ihre Firma GmbH" 
                  value={settings.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tax-number">Steuernummer</Label>
                <Input 
                  id="tax-number" 
                  placeholder="CHE-123.456.789" 
                  value={settings.taxNumber || ''}
                  onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="qr-iban">IBAN für Rechnungen</Label>
              <Input 
                id="qr-iban" 
                placeholder="CH93 0076 2011 6238 5295 7" 
                value={settings.qrIban || ''}
                onChange={(e) => handleInputChange('qrIban', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                Ihre IBAN für Zahlungen. Format: CH + 2 Ziffern + 5 Ziffern + 12 Zeichen (21 Zeichen total)
              </p>
            </div>
            <div>
              <Label htmlFor="bank-name">Bankname</Label>
              <Input 
                id="bank-name" 
                placeholder="Credit Suisse, UBS, PostFinance..." 
                value={settings.bankName || ''}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                Name Ihrer Bank (optional, aber empfohlen für professionelle Rechnungen)
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Firmenadresse</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="company-street" className="text-xs text-muted-foreground">Strasse</Label>
                  <Input
                    id="company-street"
                    placeholder="Musterstrasse"
                    value={addressFields.street}
                    onChange={(e) => handleAddressFieldChange('street', e.target.value)}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="company-number" className="text-xs text-muted-foreground">Nummer</Label>
                  <Input
                    id="company-number"
                    placeholder="123"
                    value={addressFields.number}
                    onChange={(e) => handleAddressFieldChange('number', e.target.value)}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="company-postal" className="text-xs text-muted-foreground">PLZ</Label>
                  <Input
                    id="company-postal"
                    placeholder="8000"
                    value={addressFields.postalCode}
                    onChange={(e) => handleAddressFieldChange('postalCode', e.target.value)}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="company-city" className="text-xs text-muted-foreground">Ort</Label>
                  <Input
                    id="company-city"
                    placeholder="Zürich"
                    value={addressFields.city}
                    onChange={(e) => handleAddressFieldChange('city', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label htmlFor="company-email">E-Mail</Label>
                <Input 
                  id="company-email" 
                  type="email" 
                  placeholder="info@firma.ch" 
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company-phone">Telefon</Label>
                <Input 
                  id="company-phone" 
                  placeholder="+41 44 123 45 67" 
                  value={settings.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Ansprechpartner für PDF-Schlusswort</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Diese Informationen werden im PDF unter "Mit freundlichen Grüssen" angezeigt
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="contact-person">Name</Label>
                  <Input 
                    id="contact-person" 
                    placeholder="Max Mustermann" 
                    value={settings.contactPerson || ''}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leer lassen für Firmenname
                  </p>
                </div>
                <div>
                  <Label htmlFor="contact-position">Position</Label>
                  <Input 
                    id="contact-position" 
                    placeholder="Geschäftsführer" 
                    value={settings.contactPosition || ''}
                    onChange={(e) => handleInputChange('contactPosition', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional
                  </p>
                </div>
              </div>
            </div>
            <SecureApiKeyInput
              secretType="resend_api_key"
              label="Resend API Schlüssel"
              placeholder="re_..."
              helpText="Für automatische E-Mail-Benachrichtigungen. Holen Sie sich Ihren kostenlosen API-Schlüssel von"
              helpLink="https://resend.com"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benachrichtigungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>E-Mail-Benachrichtigungen</Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Erhalten Sie E-Mails für wichtige Ereignisse
                </p>
              </div>
              <Switch 
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Überfällige Rechnungen</Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Benachrichtigung bei überfälligen Rechnungen
                </p>
              </div>
              <Switch 
                checked={notifications.overdueInvoices}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, overdueInvoices: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Zahlungseingänge</Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Benachrichtigung bei Zahlungseingängen
                </p>
              </div>
              <Switch 
                checked={notifications.paymentReceived}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, paymentReceived: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Button onClick={saveSettings} className="flex-1 sm:flex-none">Einstellungen speichern</Button>
          <Button variant="outline" onClick={resetSettings} className="flex-1 sm:flex-none">Zurücksetzen</Button>
        </div>
      </div>
    </div>
  );
}