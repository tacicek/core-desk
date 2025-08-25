import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Database, 
  Server, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  Users,
  Download,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PlatformManagementTab() {
  const [systemHealth, setSystemHealth] = useState({
    cpu: 45,
    memory: 67,
    disk: 32,
    uptime: '99.97%',
    responseTime: 245
  });

  const [securityLogs, setSecurityLogs] = useState([
    {
      id: 1,
      timestamp: '2024-08-16 14:30:15',
      event: 'Admin Login',
      user: 'admin@geschaeftscockpit.ch',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: 2,
      timestamp: '2024-08-16 13:45:22',
      event: 'Failed Login Attempt',
      user: 'unknown@example.com',
      ip: '185.220.101.42',
      status: 'failed'
    },
    {
      id: 3,
      timestamp: '2024-08-16 12:15:08',
      event: 'Tenant Status Change',
      user: 'admin@geschaeftscockpit.ch',
      ip: '192.168.1.100',
      status: 'success'
    }
  ]);

  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    return status === 'success' ? (
      <Badge variant="default">
        <CheckCircle className="h-3 w-3 mr-1" />
        Erfolgreich
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Fehlgeschlagen
      </Badge>
    );
  };

  const getHealthColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Auslastung</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.cpu}%</div>
            <Progress value={systemHealth.cpu} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Normal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arbeitsspeicher</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.memory}%</div>
            <Progress value={systemHealth.memory} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Mittel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Festplatte</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.disk}%</div>
            <Progress value={systemHealth.disk} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Niedrig
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verfügbarkeit</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemHealth.uptime}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Antwortzeit: {systemHealth.responseTime}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              System Warnungen
            </CardTitle>
            <CardDescription>
              Aktive Systemwarnungen und Benachrichtigungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Hohe Speichernutzung</AlertTitle>
                <AlertDescription>
                  Der Arbeitsspeicher ist zu 67% ausgelastet. Erwägen Sie ein Upgrade.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Backup läuft</AlertTitle>
                <AlertDescription>
                  Das tägliche Backup läuft derzeit. Geschätzte Dauer: 15 Minuten.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datenbank Performance
            </CardTitle>
            <CardDescription>
              Datenbankstatistiken und Performance-Metriken
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Aktive Verbindungen</span>
                <span className="text-sm">124 / 200</span>
              </div>
              <Progress value={62} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Abfragen/Sekunde</span>
                <span className="text-sm">1,247</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Durchschn. Antwortzeit</span>
                <span className="text-sm">12ms</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cache Hit Rate</span>
                <span className="text-sm text-green-600">94.7%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sicherheit & Zugriffskontrolle
          </CardTitle>
          <CardDescription>
            Überwachen Sie Sicherheitsereignisse und Zugriffe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Aktuelle Sicherheitslogs</h3>
              <Select defaultValue="today">
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Heute</SelectItem>
                  <SelectItem value="week">Diese Woche</SelectItem>
                  <SelectItem value="month">Dieser Monat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitstempel</TableHead>
                  <TableHead>Ereignis</TableHead>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>IP-Adresse</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>{log.event}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Wartungs-Tools
            </CardTitle>
            <CardDescription>
              Datenbank-Operationen und System-Wartung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                DB Backup
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                DB Restore
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Performance Scan
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Logs Export
              </Button>
            </div>
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Datenbank optimieren
              </Button>
              <Button variant="outline" className="w-full">
                Cache leeren
              </Button>
              <Button variant="destructive" className="w-full">
                Notfall-Wartungsmodus
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin-Benutzer verwalten
            </CardTitle>
            <CardDescription>
              Super-Admin Berechtigungen und Zugriffe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">admin@geschaeftscockpit.ch</div>
                  <div className="text-sm text-muted-foreground">Super Administrator</div>
                </div>
                <Badge variant="default">Aktiv</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">support@geschaeftscockpit.ch</div>
                  <div className="text-sm text-muted-foreground">Support Administrator</div>
                </div>
                <Badge variant="secondary">Aktiv</Badge>
              </div>
            </div>
            
            <Button className="w-full">
              Neuen Admin hinzufügen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}