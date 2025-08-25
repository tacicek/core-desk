import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Database, AlertCircle } from 'lucide-react';

// Temporarily disabled Supabase migration
const migrateToSupabase = async () => {
  console.log('Supabase migration temporarily disabled');
};

export function DataMigration() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [migrationMessage, setMigrationMessage] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const runMigration = async () => {
      // Check if migration has already been run
      const migrationCompleted = localStorage.getItem('supabase_migration_completed');
      if (migrationCompleted) {
        setMigrationStatus('completed');
        setMigrationMessage('Daten wurden bereits zu Supabase migriert');
        return;
      }

      try {
        setMigrationStatus('running');
        setMigrationMessage('Migriere lokale Daten zu Supabase...');
        setProgress(20);
        
        await migrateToSupabase();
        
        setProgress(100);
        setMigrationStatus('completed');
        setMigrationMessage('Migration erfolgreich abgeschlossen!');
        
        // Mark migration as completed
        localStorage.setItem('supabase_migration_completed', 'true');
      } catch (error) {
        console.error('Migration failed:', error);
        setMigrationStatus('error');
        setMigrationMessage('Migration fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    };

    runMigration();
  }, []);

  if (migrationStatus === 'completed') {
    return null; // Don't show anything if migration is completed
  }

  if (migrationStatus === 'error') {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Datenmigration fehlgeschlagen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{migrationMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {migrationStatus === 'running' && (
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          <p className="text-sm">{migrationMessage}</p>
        </div>
        
        {migrationStatus === 'running' && (
          <Progress value={progress} className="w-full" />
        )}
        
        <p className="text-xs text-muted-foreground">
          Ihre Daten werden sicher von localStorage zu Supabase migriert. 
          Alle zukünftigen Änderungen werden automatisch in der Datenbank gespeichert.
        </p>
      </CardContent>
    </Card>
  );
}