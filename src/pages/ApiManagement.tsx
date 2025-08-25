import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { N8nWebhookIntegration } from '@/components/invoice/N8nWebhookIntegration';
import { LocalApiKeyInput } from '@/components/LocalApiKeyInput';
import { 
  Webhook,
  Mail,
  Brain,
  Zap,
  Settings,
  Key
} from 'lucide-react';

export default function ApiManagement() {
  const [activeTab, setActiveTab] = useState('n8n');
  const [apiKeys, setApiKeys] = useState({
    openai: false,
    resend: false
  });

  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = () => {
    // Check localStorage for API keys
    const openaiKey = localStorage.getItem('OPENAI_API_KEY');
    const resendKey = localStorage.getItem('RESEND_API_KEY');

    setApiKeys({
      openai: !!openaiKey,
      resend: !!resendKey
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">API Management</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle API-Integrationen und externe Dienste
          </p>
        </div>
      </div>

      {/* API Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => setActiveTab('n8n')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">n8n</p>
                <p className="text-sm text-muted-foreground">Workflow Automation</p>
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
              <Brain className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">OpenAI</p>
                <p className="text-sm text-muted-foreground">AI Services</p>
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
              <Mail className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">Resend</p>
                <p className="text-sm text-muted-foreground">Email Delivery</p>
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
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">More</p>
                <p className="text-sm text-muted-foreground">Coming Soon</p>
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
                OpenAI API Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Verfügbare OpenAI Services:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>GPT Models für Textverarbeitung und Dokumentenanalyse</li>
                    <li>Whisper für Spracherkennung</li>
                    <li>DALL-E für Bildgenerierung</li>
                    <li>Embedding Models für Textsuche</li>
                  </ul>
                </div>
                
                
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span className="font-medium">OpenAI API Key Konfiguration</span>
                  </div>
                  
                  <LocalApiKeyInput
                    keyName="OPENAI_API_KEY"
                    label="OpenAI API Key"
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    helpText="Erstellen Sie einen API Key in Ihrem OpenAI Dashboard."
                    helpLink="https://platform.openai.com/api-keys"
                    onKeyChange={checkApiKeys}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>OpenAI API wird bereits für die Rechnungsanalyse und PDF-Scanning verwendet.</p>
                  <p>Weitere Integrationen können über Edge Functions implementiert werden.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Resend Email API Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Resend Features:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Transactional Email Versand</li>
                    <li>Email Templates</li>
                    <li>Delivery Analytics</li>
                    <li>Domain Verification</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span className="font-medium">Resend API Key Konfiguration</span>
                  </div>
                  
                  <LocalApiKeyInput
                    keyName="RESEND_API_KEY"
                    label="Resend API Key"
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    helpText="Erstellen Sie einen API Key in Ihrem Resend Dashboard."
                    helpLink="https://resend.com/api-keys"
                    onKeyChange={checkApiKeys}
                  />
                  
                  <div className="text-xs text-muted-foreground">
                    <p>Wichtig: Stellen Sie sicher, dass Ihre Domain in Resend verifiziert ist.</p>
                    <p>Domain Verification: https://resend.com/domains</p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Verwendung für:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Rechnung per E-Mail versenden</li>
                    <li>Erinnerungen für überfällige Rechnungen</li>
                    <li>System-Benachrichtigungen</li>
                    <li>Benutzer-Willkommensnachrichten</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                API Konfiguration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Konfigurierte APIs</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>OpenAI API</span>
                        <span className={apiKeys.openai ? "text-green-600" : "text-yellow-600"}>
                          {apiKeys.openai ? "✓ Aktiv" : "⚠ Nicht konfiguriert"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Supabase API</span>
                        <span className="text-green-600">✓ Aktiv</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Resend API</span>
                        <span className={apiKeys.resend ? "text-green-600" : "text-yellow-600"}>
                          {apiKeys.resend ? "✓ Aktiv" : "⚠ Nicht konfiguriert"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">API Nutzung</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">OpenAI Requests heute:</span>
                        <div className="text-lg font-bold">--</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email versandt heute:</span>
                        <div className="text-lg font-bold">--</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-800">Sicherheitshinweise</h4>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>API Keys werden sicher in Supabase Secrets gespeichert</li>
                    <li>Alle API-Aufrufe erfolgen über sichere Edge Functions</li>
                    <li>Keine API Keys werden im Frontend-Code gespeichert</li>
                    <li>Regelmäßige Rotation der API Keys empfohlen</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
