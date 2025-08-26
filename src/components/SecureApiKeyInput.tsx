import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Save, Trash2, Check, AlertCircle, Shield, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SecureApiKeyManager } from '@/lib/secureStorage';
import { useErrorReporting } from '@/components/ErrorBoundary';

interface SecureApiKeyInputProps {
  service: string;
  label: string;
  placeholder?: string;
  description?: string;
  onUpdate?: (hasKey: boolean) => void;
}

export function SecureApiKeyInput({ 
  service, 
  label, 
  placeholder = '', 
  description,
  onUpdate 
}: SecureApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const { toast } = useToast();
  const { reportError } = useErrorReporting();

  useEffect(() => {
    checkExistingKey();
  }, [service]);

  const checkExistingKey = async () => {
    try {
      setIsVerifying(true);
      const hasKey = await SecureApiKeyManager.hasApiKey(service);
      setHasExistingKey(hasKey);
      onUpdate?.(hasKey);
    } catch (error) {
      console.error('Error checking existing key:', error);
      await reportError(error as Error, { context: 'checkExistingKey', service });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen API-Schlüssel ein.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Validate API key format
      if (!validateApiKeyFormat(service, apiKey.trim())) {
        toast({
          title: "Ungültiger API-Schlüssel",
          description: `Der API-Schlüssel für ${service} hat ein ungültiges Format.`,
          variant: "destructive"
        });
        return;
      }

      const success = await SecureApiKeyManager.storeApiKey(service, apiKey.trim());
      
      if (success) {
        setHasExistingKey(true);
        setApiKey('');
        onUpdate?.(true);
        
        toast({
          title: "API-Schlüssel gespeichert",
          description: `${label} wurde erfolgreich sicher gespeichert.`
        });
      } else {
        throw new Error('Failed to store API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      await reportError(error as Error, { context: 'saveApiKey', service });
      
      toast({
        title: "Speicherung fehlgeschlagen",
        description: "Der API-Schlüssel konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      const success = await SecureApiKeyManager.removeApiKey(service);
      
      if (success) {
        setHasExistingKey(false);
        setApiKey('');
        onUpdate?.(false);
        
        toast({
          title: "API-Schlüssel entfernt",
          description: `${label} wurde erfolgreich entfernt.`
        });
      } else {
        throw new Error('Failed to remove API key');
      }
    } catch (error) {
      console.error('Error removing API key:', error);
      await reportError(error as Error, { context: 'removeApiKey', service });
      
      toast({
        title: "Entfernung fehlgeschlagen",
        description: "Der API-Schlüssel konnte nicht entfernt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateApiKeyFormat = (service: string, key: string): boolean => {
    switch (service.toLowerCase()) {
      case 'openai':
        return key.startsWith('sk-') && key.length > 20;
      case 'resend':
        return key.startsWith('re_') && key.length > 10;
      case 'anthropic':
        return key.startsWith('sk-ant-') && key.length > 20;
      default:
        return key.length > 5; // Generic validation
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'openai':
        return '🤖';
      case 'resend':
        return '📧';
      case 'anthropic':
        return '🧠';
      default:
        return '🔑';
    }
  };

  const getKeyDisplayText = (service: string) => {
    switch (service.toLowerCase()) {
      case 'openai':
        return 'sk-••••••••••••••••••••••••••••••••••••••••••••••••';
      case 'resend':
        return 're_••••••••••••••••••••••••••••••••';
      default:
        return '••••••••••••••••••••••••••••••••';
    }
  };

  if (isVerifying) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span className="text-sm text-muted-foreground">API-Schlüssel wird überprüft...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getServiceIcon(service)}</span>
          <div>
            <h3 className="font-medium flex items-center gap-2">
              {label}
              {hasExistingKey && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  <Check className="h-3 w-3" />
                  Konfiguriert
                </span>
              )}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {hasExistingKey ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    API-Schlüssel ist sicher gespeichert
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Verschlüsselt mit AES-256-GCM • {getKeyDisplayText(service)}
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              Um den API-Schlüssel zu ändern, entfernen Sie den aktuellen Schlüssel und fügen Sie einen neuen hinzu.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor={`${service}-api-key`}>
                {label} eingeben
              </Label>
              <div className="relative mt-1">
                <Input
                  id={`${service}-api-key`}
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={placeholder}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!apiKey.trim() || isSaving}
                size="sm"
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sicher speichern
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Key className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Sicherheitsgarantie:</p>
                  <ul className="space-y-1">
                    <li>• Clientseitige AES-256-GCM Verschlüsselung</li>
                    <li>• Speicherung in Supabase-Benutzerprofil</li>
                    <li>• Niemals in Browser-Speicher oder Logs</li>
                    <li>• Übertragung nur über HTTPS</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}