import { Card, CardContent } from '@/components/ui/card';
import { Receipt, Clock, AlertTriangle, Euro } from 'lucide-react';

interface InvoiceStatsCardsProps {
  total: number;
  pending: number;
  overdue: number;
  totalAmount: number;
}

export function InvoiceStatsCards({ total, pending, overdue, totalAmount }: InvoiceStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamt Rechnungen</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ausstehend</p>
              <p className="text-2xl font-bold">{pending}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Überfällig</p>
              <p className="text-2xl font-bold">{overdue}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Euro className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ausstehender Betrag</p>
              <p className="text-2xl font-bold">{totalAmount.toFixed(2)} CHF</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}