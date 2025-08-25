import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Mail, Phone, CreditCard, Edit, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { CompanySettings } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export default function CompanyInfo() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No authenticated user found');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('vendor_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.vendor_id) {
          console.log('No vendor found for user');
          setLoading(false);
          return;
        }

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
            emailSubjectTemplate: supabaseSettings.email_subject_template || '',
            emailBodyTemplate: supabaseSettings.email_body_template || '',
          };
          console.log('✅ Loaded settings from Supabase:', companySettings);
          console.log('🔍 Tax Number:', supabaseSettings.tax_number);
          console.log('🔍 QR IBAN:', supabaseSettings.qr_iban);
          console.log('🔍 Bank Name:', supabaseSettings.bank_name);
          setSettings(companySettings);
        } else {
          console.log('No company settings found in database');
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Firmendaten</h1>
          <p className="text-muted-foreground">Übersicht Ihrer Unternehmensinformationen</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Firmendaten</h1>
          <p className="text-muted-foreground">Übersicht Ihrer Unternehmensinformationen</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Noch keine Firmendaten vorhanden</p>
            <Button asChild>
              <Link to="/dashboard/settings">
                <Edit className="h-4 w-4 mr-2" />
                Firmendaten eingeben
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const companyData = [
    { label: "Firmenname", value: settings.name, icon: Building2 },
    { label: "Adresse", value: settings.address, icon: Building2, multiline: true },
    { label: "Telefon", value: settings.phone, icon: Phone },
    { label: "E-Mail", value: settings.email, icon: Mail },
    { label: "Steuernummer", value: settings.taxNumber, icon: FileText },
    { label: "IBAN", value: settings.qrIban, icon: CreditCard },
    { label: "Bank", value: settings.bankName, icon: CreditCard },
  ];

  const invoiceSettings = [
    { label: "Rechnungsnummer Format", value: settings.invoiceNumberFormat },
    { label: "Standard Zahlungsziel", value: `${settings.defaultDueDays} Tage` },
    { label: "Standard Steuersatz", value: `${settings.defaultTaxRate}%` },
  ];

  const emailSettings = [
    { label: "Absender E-Mail", value: settings.senderEmail },
    { label: "Absender Name", value: settings.senderName },
    { label: "E-Mail Betreff Vorlage", value: settings.emailSubjectTemplate },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Firmendaten</h1>
          <p className="text-muted-foreground">Übersicht Ihrer Unternehmensinformationen</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/settings">
            <Edit className="h-4 w-4 mr-2" />
            Bearbeiten
          </Link>
        </Button>
      </div>

      {/* Company Logo */}
      {settings.logo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Firmenlogo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img 
                src={settings.logo} 
                alt="Firmenlogo" 
                className="h-16 w-16 md:h-20 md:w-20 object-contain border border-border rounded"
              />
              <div className="text-sm text-muted-foreground">
                Logo wird auf Rechnungen angezeigt
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Unternehmensdaten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {companyData.map((item) => (
                <TableRow key={item.label}>
                  <TableCell className="font-medium w-1/3">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.value ? (
                      item.multiline ? (
                        <div className="whitespace-pre-line">{item.value}</div>
                      ) : (
                        <span>{item.value}</span>
                      )
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Nicht angegeben
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rechnungseinstellungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {invoiceSettings.map((item) => (
                <TableRow key={item.label}>
                  <TableCell className="font-medium w-1/3">{item.label}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.value}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {emailSettings.map((item) => (
                <TableRow key={item.label}>
                  <TableCell className="font-medium w-1/3">{item.label}</TableCell>
                  <TableCell>
                    {item.value ? (
                      <span className="text-sm">{item.value}</span>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Nicht konfiguriert
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Body Template */}
      {settings.emailBodyTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>E-Mail Text Vorlage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {settings.emailBodyTemplate}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}