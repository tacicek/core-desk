import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Webhook, Brain, Mail, Settings, Shield, CheckCircle, XCircle, Key, AlertTriangle } from 'lucide-react';
import { N8nWebhookIntegration } from '@/components/invoice/N8nWebhookIntegration';
import { SecureApiKeyInput } from '@/components/SecureApiKeyInput';
import { LocalApiKeyInput } from '@/components/LocalApiKeyInput';
import { useToast } from '@/hooks/use-toast';
import { SecureApiKeyManager } from '@/lib/secureStorage';
import { useErrorReporting } from '@/components/ErrorBoundary';

export default function ApiManagement() {
  const [activeTab, setActiveTab] = useState('n8n');
  const [apiKeys, setApiKeys] = useState({
    openai: false,
    resend: false,
    n8n: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'completed' | 'error'>('pending');
  const { toast } = useToast();
  const { reportError } = useErrorReporting();

  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = async () => {
    try {
      setIsLoading(true);
      
      // Check secure storage first
      const [openaiSecure, resendSecure] = await Promise.all([
        SecureApiKeyManager.hasApiKey('openai'),
        SecureApiKeyManager.hasApiKey('resend')
      ]);
      
      // Check localStorage as fallback
      const openaiLocal = !!localStorage.getItem('OPENAI_API_KEY');
      const resendLocal = !!localStorage.getItem('RESEND_API_KEY');
      
      setApiKeys({
        openai: openaiSecure || openaiLocal,
        resend: resendSecure || resendLocal,
        n8n: true // n8n is webhook-based, always available
      });
      
      // Trigger migration if keys found in localStorage
      if ((openaiLocal || resendLocal) && !(openaiSecure && resendSecure)) {
        setMigrationStatus('pending');
        await handleMigration();
      } else {
        setMigrationStatus('completed');
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
      await reportError(error as Error, { context: 'checkApiKeys' });
      setMigrationStatus('error');
      
      // Fallback to localStorage check
      const openaiKey = localStorage.getItem('OPENAI_API_KEY');
      const resendKey = localStorage.getItem('RESEND_API_KEY');

      setApiKeys({
        openai: !!openaiKey,
        resend: !!resendKey,
        n8n: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigration = async () => {
    try {
      await SecureApiKeyManager.migrateApiKeys();
      setMigrationStatus('completed');
      toast({
        title: "API Keys migriert",
        description: "Ihre API-Schlüssel wurden erfolgreich zu sicherem Speicher migriert."
      });
      // Recheck after migration
      await checkApiKeys();
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus('error');
      await reportError(error as Error, { context: 'apiKeyMigration' });
      toast({
        title: "Migration fehlgeschlagen",
        description: "API-Schlüssel konnten nicht migriert werden. Bitte kontaktieren Sie den Support.",
        variant: "destructive"
      });
    }
  };

  const handleApiKeyUpdate = (service: string, hasKey: boolean) => {
    setApiKeys(prev => ({ ...prev, [service]: hasKey }));
  };

  const getStatusBadge = (hasKey: boolean, service: string) => {
    if (isLoading) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          Wird geladen...
        </Badge>
      );
    }

    if (hasKey) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Konfiguriert
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Nicht konfiguriert
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">API Management</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle API-Integrationen und externe Dienste sicher
          </p>
        </div>
        {migrationStatus === 'pending' && (
          <Button onClick={handleMigration} variant="outline" size="sm">
            <Key className="h-4 w-4 mr-2" />
            Zu sicherem Speicher migrieren
          </Button>
        )}
      </div>

      {/* Migration Status Banner */}
      {migrationStatus === 'pending' && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  API-Schlüssel Migration verfügbar
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Ihre API-Schlüssel können zu sicherem, verschlüsseltem Speicher migriert werden.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => setActiveTab('n8n')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-2xl font-bold">n8n</p>
                <p className="text-sm text-muted-foreground">Workflow Automation</p>
              </div>
              <div className="ml-auto">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aktiv
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => setActiveTab('openai')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-2xl font-bold">OpenAI</p>
                <p className="text-sm text-muted-foreground">KI-gestützte Analyse</p>
              </div>
              <div className="ml-auto">
                {getStatusBadge(apiKeys.openai, 'openai')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => setActiveTab('resend')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-2xl font-bold">Resend</p>
                <p className="text-sm text-muted-foreground">E-Mail Versand</p>
              </div>
              <div className="ml-auto">
                {getStatusBadge(apiKeys.resend, 'resend')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => setActiveTab('settings')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-2xl font-bold">Security</p>
                <p className="text-sm text-muted-foreground">Sichere Verwaltung</p>
              </div>
              <div className="ml-auto">
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  <Key className="h-3 w-3 mr-1" />
                  Sicher
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="n8n" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            n8n Integration
          </TabsTrigger>
          <TabsTrigger value="openai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            OpenAI API
          </TabsTrigger>
          <TabsTrigger value="resend" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Resend API
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="n8n" className="space-y-6">
          <N8nWebhookIntegration />
        </TabsContent>

        <TabsContent value="openai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                OpenAI API Konfiguration
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Ihren OpenAI API-Schlüssel für KI-gestützte PDF-Analyse und Rechnungsscanning.
                Der Schlüssel wird sicher verschlüsselt in Ihrem Benutzerprofil gespeichert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecureApiKeyInput
                service="openai"
                label="OpenAI API Key"
                placeholder="sk-..."
                onUpdate={(hasKey) => handleApiKeyUpdate('openai', hasKey)}
              />
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🔒 Sicherheitshinweis
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Ihr API-Schlüssel wird verschlüsselt in Ihrem Supabase-Benutzerprofil gespeichert 
                  und niemals im Browser-Speicher abgelegt. Die Verschlüsselung erfolgt clientseitig 
                  mit der Web Crypto API.
                </p>
              </div>
              
              {apiKeys.openai && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">OpenAI API erfolgreich konfiguriert</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Sie können jetzt PDFs mit KI-Unterstützung analysieren lassen.
                  </p>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium mb-2">Verfügbare OpenAI Services:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">
                  <li>GPT-4 Vision für PDF-Dokumentenanalyse</li>
                  <li>GPT-4 für intelligente Textverarbeitung</li>
                  <li>Automatische Rechnungsdatenextraktion</li>
                  <li>Konfidenz-Bewertung für extrahierte Daten</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Resend API Konfiguration
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Ihren Resend API-Schlüssel für automatischen E-Mail-Versand.
                Der Schlüssel wird sicher verschlüsselt in Ihrem Benutzerprofil gespeichert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecureApiKeyInput
                service="resend"
                label="Resend API Key"
                placeholder="re_..."
                onUpdate={(hasKey) => handleApiKeyUpdate('resend', hasKey)}
              />
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🔒 Sicherheitshinweis
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Ihr API-Schlüssel wird verschlüsselt in Ihrem Supabase-Benutzerprofil gespeichert 
                  und niemals im Browser-Speicher abgelegt. Die Verschlüsselung erfolgt clientseitig 
                  mit der Web Crypto API.
                </p>
              </div>
              
              {apiKeys.resend && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Resend API erfolgreich konfiguriert</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Sie können jetzt automatisch E-Mails versenden.
                  </p>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium mb-2">Resend Features:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">
                  <li>Transactional E-Mail Versand</li>
                  <li>Automatischer Rechnungsversand</li>
                  <li>E-Mail Templates und Vorlagen</li>
                  <li>Erinnerungen und Benachrichtigungen</li>
                  <li>Delivery-Status-Tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sicherheitseinstellungen
              </CardTitle>
              <CardDescription>
                Verwalten Sie die Sicherheit Ihrer API-Integrationen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API-Schlüssel Verschlüsselung
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Alle API-Schlüssel werden clientseitig mit AES-256-GCM verschlüsselt, 
                    bevor sie in Ihrem Supabase-Benutzerprofil gespeichert werden.
                  </p>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Verschlüsselung aktiv</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Migration Status</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Status der Migration von lokalem Speicher zu sicherem Speicher.
                  </p>
                  <div className="flex items-center gap-2">
                    {migrationStatus === 'completed' ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Migration abgeschlossen</span>
                      </>
                    ) : migrationStatus === 'pending' ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-600">Migration verfügbar</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Migration fehlgeschlagen</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Datenverarbeitung</h4>
                  <p className="text-sm text-muted-foreground">
                    API-Schlüssel werden nur über sichere HTTPS-Verbindungen übertragen 
                    und niemals in Logs oder Zwischenspeichern gespeichert.
                  </p>
                </div>
              </div>

              {migrationStatus === 'pending' && (
                <Button onClick={handleMigration} className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Jetzt zu sicherem Speicher migrieren
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}