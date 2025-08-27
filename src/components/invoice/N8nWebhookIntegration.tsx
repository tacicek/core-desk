import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import { Loader2, Webhook, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const N8nWebhookIntegration = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingData, setIsCreatingData] = useState(false);
  const { toast } = useToast();
  const { vendor } = useVendor();

  const testInvoiceWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Fehler",
        description: "Webhook URL eingeben",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const testData = {
        vendor_name: "Test Firma",
        invoice_number: "TEST-001",
        invoice_date: "2024-01-15",
        due_date: "2024-02-15",
        amount: 100.50,
        currency: "CHF",
        description: "Test Rechnung",
        category: "office",
        vendor_id: vendor?.id,
        user_id: "test-user-id"
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        toast({
          title: "Test erfolgreich",
          description: "Rechnungs-Webhook-Testdaten wurden gesendet.",
        });
      } else {
        throw new Error('Webhook test failed');
      }
    } catch (error) {
      toast({
        title: "Test fehlgeschlagen",
        description: "Webhook konnte nicht getestet werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSampleData = async () => {
    if (!vendor?.id) {
      toast({
        title: "Fehler",
        description: "Vendor-ID nicht gefunden",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingData(true);
    try {
      console.log('🔵 Creating sample data for vendor:', vendor.id);
      
      const { data, error } = await supabase.functions.invoke('n8n-webhook', {
        body: {
          action: 'create_sample_data',
          vendor_id: vendor.id
        }
      });

      console.log('🔵 Response from n8n-webhook:', { data, error });

      if (error) {
        console.error('🔴 Supabase function error:', error);
        throw error;
      }

      toast({
        title: "Beispieldaten erstellt",
        description: `${data.count} Beispiel-Rechnungen wurden erfolgreich erstellt.`,
      });
    } catch (error) {
      console.error('🔴 Error creating sample data:', error);
      console.error('🔴 Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Fehler",
        description: `Fehler beim Erstellen der Beispieldaten: ${error.message || 'Unbekannter Fehler'}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingData(false);
    }
  };

  const sendInvoicesToN8n = async () => {
    if (!vendor?.id) {
      toast({
        title: "Fehler",
        description: "Vendor-ID nicht gefunden",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('n8n-webhook', {
        body: {
          action: 'send_invoices',
          vendor_id: vendor.id,
          n8n_webhook_url: webhookUrl || undefined
        }
      });

      if (error) throw error;

      if (webhookUrl) {
        toast({
          title: "Daten an n8n gesendet",
          description: `${data.count} Incoming Invoices wurden an n8n Webhook gesendet.`,
        });
      } else {
        toast({
          title: "Daten abgerufen",
          description: `${data.count} Incoming Invoices gefunden (ohne Webhook-Übertragung).`,
        });
      }
    } catch (error) {
      console.error('Error sending invoices to n8n:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Senden der Daten an n8n",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testRevenueWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Fehler",
        description: "Webhook URL eingeben",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const testData = {
        revenue_date: "2024-01-15",
        amount: 1500.00,
        currency: "CHF",
        description: "Täglicher Umsatz",
        vendor_id: vendor?.id,
        user_id: "test-user-id"
      };

      const testUrl = webhookUrl + (webhookUrl.includes('?') ? '&' : '?') + 'type=revenue';

      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        toast({
          title: "Test erfolgreich",
          description: "Umsatz-Webhook-Testdaten wurden gesendet.",
        });
      } else {
        throw new Error('Webhook test failed');
      }
    } catch (error) {
      toast({
        title: "Test fehlgeschlagen",
        description: "Webhook konnte nicht getestet werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmployeeWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Fehler",
        description: "Webhook URL eingeben",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const testData = {
        employee_name: "Test Mitarbeiter",
        expense_date: "2024-01-15",
        amount: 5000.00,
        currency: "CHF",
        expense_type: "salary",
        description: "Monatliche Gehaltsabrechnung",
        vendor_id: vendor?.id,
        user_id: "test-user-id"
      };

      const testUrl = webhookUrl + (webhookUrl.includes('?') ? '&' : '?') + 'type=employee';

      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        toast({
          title: "Test erfolgreich",
          description: "Mitarbeitergehalt-Webhook-Testdaten wurden gesendet.",
        });
      } else {
        throw new Error('Webhook test failed');
      }
    } catch (error) {
      toast({
        title: "Test fehlgeschlagen",
        description: "Webhook konnte nicht getestet werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testBusinessExpenseWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Fehler",
        description: "Webhook URL eingeben",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const testData = {
        vendor_name: "Test Supermarkt",
        document_number: "RECEIPT-001",
        expense_date: "2024-01-15",
        amount: 85.50,
        currency: "CHF",
        description: "Büromaterial und Snacks",
        business_purpose: "Büroausstattung",
        expense_type: "purchase",
        tax_category: "operating_expenses",
        vendor_id: vendor?.id,
        user_id: "test-user-id"
      };

      const testUrl = webhookUrl + (webhookUrl.includes('?') ? '&' : '?') + 'type=expense';

      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        toast({
          title: "Test erfolgreich",
          description: "Geschäftsausgaben-Webhook-Testdaten wurden gesendet.",
        });
      } else {
        throw new Error('Webhook test failed');
      }
    } catch (error) {
      toast({
        title: "Test fehlgeschlagen",
        description: "Webhook konnte nicht getestet werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          n8n Webhook Integration
        </CardTitle>
        <CardDescription>
          Übertragen Sie automatisch Rechnung-, Umsatz-, Mitarbeiter- und Ausgabendaten von Ihrem n8n Workflow ins System
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webhook-url">n8n Webhook URL</Label>
          <Input
            id="webhook-url"
            placeholder="https://your-n8n-instance.com/webhook/data"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={createSampleData} 
            disabled={isCreatingData || !vendor?.id}
            variant="default"
          >
            {isCreatingData ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Beispieldaten erstellen
          </Button>
          <Button 
            onClick={sendInvoicesToN8n} 
            disabled={isLoading || !vendor?.id}
            variant="default"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Incoming Invoices an n8n senden
          </Button>
          <Button 
            onClick={testInvoiceWebhook} 
            disabled={isLoading || !webhookUrl}
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Rechnungs Webhook
          </Button>
          <Button 
            onClick={testRevenueWebhook} 
            disabled={isLoading || !webhookUrl}
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Umsatz Webhook
          </Button>
          <Button 
            onClick={testEmployeeWebhook} 
            disabled={isLoading || !webhookUrl}
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Mitarbeiter Webhook
          </Button>
          <Button 
            onClick={testBusinessExpenseWebhook} 
            disabled={isLoading || !webhookUrl}
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Geschäftsausgaben Webhook
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            n8n Docs
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">🔄 Integration Anweisungen:</h4>
          <div className="text-sm space-y-3">
            <div className="p-3 bg-background border border-border rounded">
              <p><strong>Schritt 1:</strong> Geben Sie Ihre n8n Webhook URL oben ein:</p>
              <p className="text-muted-foreground italic">Beispiel: https://tuncaycicek02.app.n8n.cloud/webhook/dabd9821-a87d-48c1-ab60-3c6c6841c5f3</p>
            </div>
            <div className="p-3 bg-background border border-border rounded">
              <p><strong>Schritt 2:</strong> Verwenden Sie diese URLs in Ihrem n8n Workflow als HTTP Request Ziele:</p>
              <div className="mt-2 space-y-1">
                <p><strong>Rechnungen senden:</strong></p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">https://wnedqmxejgynelhtbpmw.supabase.co/functions/v1/n8n-webhook</code>
                <p><strong>Umsatz senden:</strong></p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">https://wnedqmxejgynelhtbpmw.supabase.co/functions/v1/n8n-webhook?type=revenue</code>
                <p><strong>Mitarbeiter senden:</strong></p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">https://wnedqmxejgynelhtbpmw.supabase.co/functions/v1/n8n-webhook?type=employee</code>
                <p><strong>Ausgaben senden:</strong></p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">https://wnedqmxejgynelhtbpmw.supabase.co/functions/v1/n8n-webhook?type=expense</code>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};