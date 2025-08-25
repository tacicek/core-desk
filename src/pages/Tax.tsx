import { TaxReport } from '@/components/reports/TaxReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Receipt,
  TrendingUp,
  Calculator,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Tax() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-clamp-2xl font-bold">Steuer</h1>
          <p className="text-clamp-base text-muted-foreground">
            Steuerberichte und Übersichten für Ihre Steuererklärung
          </p>
        </div>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausgaben verwalten</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Alle Geschäftsausgaben erfassen und kategorisieren
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/dashboard/expenses">
                <Receipt className="h-4 w-4 mr-2" />
                Zu Ausgaben
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eingaben verwalten</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Alle Einnahmen und Umsätze erfassen
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/dashboard/revenue">
                <TrendingUp className="h-4 w-4 mr-2" />
                Zu Eingaben
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechnungen scannen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              PDF Rechnungen automatisch erfassen
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/dashboard/incoming-invoices">
                <FileText className="h-4 w-4 mr-2" />
                Scannen
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <TaxReport />
    </div>
  );
}