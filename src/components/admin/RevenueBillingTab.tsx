import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, Calendar, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SubscriptionPlansManagement from './SubscriptionPlansManagement';

export default function RevenueBillingTab() {
  const [revenueData, setRevenueData] = useState({
    thisMonth: 15240,
    lastMonth: 14100,
    growth: 8.1,
    churnRate: 2.3
  });
  
  const [overduePayments, setOverduePayments] = useState([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Umsatz-Übersicht</TabsTrigger>
        <TabsTrigger value="plans">Abonnement-Pläne verwalten</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dieser Monat</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData.thisMonth)}</div>
              <p className="text-xs text-muted-foreground">
                Monatlicher Umsatz
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Letzter Monat</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData.lastMonth)}</div>
              <p className="text-xs text-muted-foreground">
                Vormonat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wachstum</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{revenueData.growth}%</div>
              <p className="text-xs text-muted-foreground">
                Monatliches Wachstum
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abwanderungsrate</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{revenueData.churnRate}%</div>
              <p className="text-xs text-muted-foreground">
                Monatliche Abwanderung
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Überfällige Zahlungen
              </CardTitle>
              <CardDescription>
                Zahlungen, die sofortige Aufmerksamkeit benötigen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">ABC GmbH</div>
                    <div className="text-sm text-muted-foreground">Professional Plan</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">{formatCurrency(79)}</div>
                    <div className="text-sm text-muted-foreground">5 Tage überfällig</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">XYZ AG</div>
                    <div className="text-sm text-muted-foreground">Enterprise Plan</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">{formatCurrency(149)}</div>
                    <div className="text-sm text-muted-foreground">12 Tage überfällig</div>
                  </div>
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                Alle überfälligen Zahlungen anzeigen
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Renewals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Anstehende Verlängerungen
              </CardTitle>
              <CardDescription>
                Abonnements, die in den nächsten 30 Tagen erneuert werden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Tech Solutions Ltd</div>
                    <div className="text-sm text-muted-foreground">Basic Plan</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(29)}</div>
                    <div className="text-sm text-muted-foreground">In 3 Tagen</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Business Corp</div>
                    <div className="text-sm text-muted-foreground">Professional Plan</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(79)}</div>
                    <div className="text-sm text-muted-foreground">In 15 Tagen</div>
                  </div>
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                Alle anstehenden Verlängerungen
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Umsatz-Trend</CardTitle>
            <CardDescription>
              Monatlicher wiederkehrender Umsatz (MRR) der letzten 12 Monate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-medium text-muted-foreground">Umsatz-Diagramm</div>
                <div className="text-sm text-muted-foreground">Chart.js Integration geplant</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="plans">
        <SubscriptionPlansManagement />
      </TabsContent>
    </Tabs>
  );
}