import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export function DataCleanup() {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const clearAllLocalStorageData = () => {
    setIsClearing(true);
    
    try {
      // List of localStorage keys that might contain old data
      const keysToRemove = [
        'invoice-app-customers',
        'invoice-app-invoices', 
        'invoice-app-products',
        'invoice-app-counter',
        'invoice-app-settings',
        'revenue-data',
        'expenses-data',
        'employee-expenses',
        'daily-revenue',
        'business-expenses',
        'general-expenses',
        'supabase_migration_completed'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Also clear any other keys that might be related
      Object.keys(localStorage).forEach(key => {
        if (key.includes('invoice') || key.includes('revenue') || key.includes('expense') || key.includes('umsatz')) {
          localStorage.removeItem(key);
        }
      });

      toast({
        title: "Erfolgreich",
        description: "Alle localStorage-Daten wurden gelöscht. Bitte laden Sie die Seite neu.",
        duration: 5000,
      });

    } catch (error) {
      console.error('Error clearing localStorage:', error);
      toast({
        title: "Fehler", 
        description: "Fehler beim Löschen der localStorage-Daten",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const checkLocalStorageData = () => {
    const relevantKeys = Object.keys(localStorage).filter(key => 
      key.includes('invoice') || 
      key.includes('revenue') || 
      key.includes('expense') || 
      key.includes('umsatz') ||
      key.includes('settings')
    );

    return relevantKeys;
  };

  const relevantKeys = checkLocalStorageData();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          localStorage Daten-Bereinigung
        </CardTitle>
        <CardDescription>
          Löschen Sie alte localStorage-Daten, die Konflikte mit der Supabase-Integration verursachen könnten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Warnung</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Diese Aktion löscht alle lokalen Daten unwiderruflich. Stellen Sie sicher, dass alle wichtigen Daten bereits in Supabase gespeichert sind.
          </p>
        </div>

        {relevantKeys.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-medium">Gefundene localStorage-Einträge:</h4>
            <div className="bg-muted p-3 rounded text-sm">
              {relevantKeys.map(key => (
                <div key={key} className="py-1">
                  <code>{key}</code>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span>Keine relevanten localStorage-Daten gefunden</span>
          </div>
        )}

        <Button 
          onClick={clearAllLocalStorageData}
          disabled={isClearing || relevantKeys.length === 0}
          variant="destructive"
          className="w-full"
        >
          {isClearing ? 'Lösche...' : 'localStorage-Daten löschen'}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>
            Nach dem Löschen wird empfohlen, die Seite neu zu laden, um sicherzustellen, 
            dass alle Komponenten nur noch Supabase-Daten verwenden.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}