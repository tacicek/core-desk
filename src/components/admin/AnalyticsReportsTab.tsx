import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, Activity, Download, FileText } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsReportsTab() {
  const [timeRange, setTimeRange] = useState('last30days');

  // Chart data for user activity
  const userActivityData = {
    labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    datasets: [
      {
        label: 'Aktive Benutzer',
        data: [1200, 1900, 3000, 2500, 2000, 3000, 2000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  // Chart data for feature adoption
  const featureAdoptionData = {
    labels: ['Rechnungen', 'Kunden', 'Berichte', 'API', 'Personal'],
    datasets: [
      {
        label: 'Nutzung (%)',
        data: [87, 76, 45, 34, 28],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const usageStats = [
    { feature: 'Rechnungserstellung', usage: 87, trend: '+12%' },
    { feature: 'Kundenverwaltung', usage: 76, trend: '+8%' },
    { feature: 'Berichte', usage: 45, trend: '+15%' },
    { feature: 'API Aufrufe', usage: 34, trend: '+22%' },
    { feature: 'Personalverwaltung', usage: 28, trend: '+5%' }
  ];

  const tenantHealth = [
    { tenant: 'ABC GmbH', score: 92, risk: 'Niedrig', lastLogin: '2 Stunden' },
    { tenant: 'XYZ AG', score: 78, risk: 'Mittel', lastLogin: '3 Tage' },
    { tenant: 'Tech Solutions', score: 95, risk: 'Niedrig', lastLogin: '1 Stunde' },
    { tenant: 'Business Corp', score: 45, risk: 'Hoch', lastLogin: '14 Tage' }
  ];

  const getRiskBadge = (risk: string) => {
    const variants = {
      'Niedrig': 'default',
      'Mittel': 'secondary', 
      'Hoch': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[risk as keyof typeof variants] || 'outline'}>
        {risk}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Berichte</h2>
          <p className="text-muted-foreground">Umfassende Einblicke in die Plattform-Nutzung</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7days">Letzte 7 Tage</SelectItem>
            <SelectItem value="last30days">Letzte 30 Tage</SelectItem>
            <SelectItem value="last90days">Letzte 90 Tage</SelectItem>
            <SelectItem value="last12months">Letzte 12 Monate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt API Aufrufe</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234,567</div>
            <p className="text-xs text-muted-foreground">
              +15% seit letztem Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Benutzer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,842</div>
            <p className="text-xs text-muted-foreground">
              +8% seit letztem Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Speichernutzung</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847 GB</div>
            <p className="text-xs text-muted-foreground">
              68% der Kapazität
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">99.97%</div>
            <p className="text-xs text-muted-foreground">
              System-Verfügbarkeit
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Feature-Nutzung</CardTitle>
            <CardDescription>
              Die am häufigsten genutzten Features der Plattform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usageStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium">{stat.feature}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-muted-foreground">{stat.usage}%</div>
                    <div className="text-sm text-green-600">{stat.trend}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tenant Health Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Mandanten-Gesundheit</CardTitle>
            <CardDescription>
              Aktivitäts-Scores und Abwanderungsrisiko
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mandant</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Risiko</TableHead>
                  <TableHead>Letzter Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantHealth.map((tenant, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{tenant.tenant}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="text-sm font-medium">{tenant.score}/100</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRiskBadge(tenant.risk)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      vor {tenant.lastLogin}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Nutzer-Aktivität</CardTitle>
            <CardDescription>Tägliche aktive Benutzer über Zeit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={userActivityData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature-Adoption</CardTitle>
            <CardDescription>Adoption neuer Features über Zeit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={featureAdoptionData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Berichts-Generator</CardTitle>
          <CardDescription>
            Erstellen Sie benutzerdefinierte Berichte für Stakeholder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Mandanten-Bericht
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Umsatz-Bericht
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Nutzungs-Bericht
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance-Bericht
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}