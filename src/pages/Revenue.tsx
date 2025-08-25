import { useState } from 'react';
import { DailyRevenueManager } from '@/components/revenue/DailyRevenueManager';
import { DataCleanup } from '@/components/DataCleanup';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Revenue() {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-clamp-2xl font-bold">{t('pages.revenue.title')}</h1>
          <p className="text-clamp-base text-muted-foreground">
            {t('pages.revenue.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Daten-Bereinigung
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Datenbereinigung</DialogTitle>
              </DialogHeader>
              <DataCleanup />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DailyRevenueManager key={refreshKey} />
    </div>
  );
}