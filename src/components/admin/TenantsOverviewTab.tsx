import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Plus, Edit, Pause, Play, MessageSquare, Eye, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TenantWithSubscription } from '@/types/admin';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import TenantDetailsModal from './TenantDetailsModal';
import NewTenantModal from './NewTenantModal';

interface TenantsOverviewTabProps {
  onStatsChange: () => void;
}

export default function TenantsOverviewTab({ onStatsChange }: TenantsOverviewTabProps) {
  const [tenants, setTenants] = useState<TenantWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantWithSubscription | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showNewTenant, setShowNewTenant] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      
      // Load real tenants from database
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          subscriptions (*)
        `)
        .order('created_at', { ascending: false });

      if (tenantsError) {
        console.error('Error loading tenants:', tenantsError);
        setTenants([]);
        return;
      }

      const tenantsWithSubscriptions: TenantWithSubscription[] = tenantsData?.map(tenant => ({
        ...tenant,
        status: tenant.status as 'active' | 'suspended' | 'trial' | 'cancelled',
        settings: tenant.settings as Record<string, any>,
        subscription: tenant.subscriptions?.[0] || undefined
      })) || [];

      setTenants(tenantsWithSubscriptions);
      console.log('Loaded tenants from database:', tenantsWithSubscriptions.length);

      /* When real database is ready, replace with:
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          subscriptions (*)
        `)
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;

      const tenantsWithSubscriptions: TenantWithSubscription[] = tenantsData?.map(tenant => ({
        ...tenant,
        status: tenant.status as 'active' | 'suspended' | 'trial' | 'cancelled',
        settings: tenant.settings as Record<string, any>,
        subscription: tenant.subscriptions?.[0] || undefined
      })) || [];

      setTenants(tenantsWithSubscriptions);
      */
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast({
        title: "Fehler",
        description: "Mandanten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', tenantId);

      if (error) throw error;

      await loadTenants();
      onStatsChange();
      
      toast({
        title: "Erfolg",
        description: "Mandanten-Status wurde aktualisiert."
      });
    } catch (error) {
      console.error('Error updating tenant status:', error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      cancelled: 'outline'
    } as const;
    
    const labels = {
      active: 'Aktiv',
      trial: 'Test',
      suspended: 'Gesperrt',
      cancelled: 'Gekündigt'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPlanBadge = (planType?: string) => {
    if (!planType) return <Badge variant="outline">Kein Plan</Badge>;
    
    const labels = {
      basic: 'Basic',
      professional: 'Professional',
      enterprise: 'Enterprise'
    };

    return (
      <Badge variant="secondary">
        {labels[planType as keyof typeof labels] || planType}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    const matchesPlan = planFilter === 'all' || tenant.subscription?.plan_type === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Mandanten Übersicht</CardTitle>
          <CardDescription>
            Verwalten Sie alle Mandanten und deren Abonnements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Suchen nach Unternehmen oder E-Mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="trial">Test</SelectItem>
                <SelectItem value="suspended">Gesperrt</SelectItem>
                <SelectItem value="cancelled">Gekündigt</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plan Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Pläne</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowNewTenant(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Mandant
            </Button>
          </div>

          {/* Tenants Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unternehmen</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Umsatz</TableHead>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Läuft ab</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.company_name}</div>
                        <div className="text-sm text-muted-foreground">{tenant.domain}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.contact_person}</div>
                        <div className="text-sm text-muted-foreground">{tenant.contact_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(tenant.subscription?.plan_type)}</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>
                      {tenant.subscription ? 
                        `${formatCurrency(tenant.subscription.price)}/${tenant.subscription.billing_cycle === 'monthly' ? 'Mo' : 'Jahr'}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {tenant.subscription ? 
                        `${tenant.user_count || 0}/${tenant.subscription.max_users}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {tenant.subscription?.expires_at ? 
                        formatDistanceToNow(new Date(tenant.subscription.expires_at), { 
                          addSuffix: true, 
                          locale: de 
                        })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(tenant.created_at), { 
                        addSuffix: true, 
                        locale: de 
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Details anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              console.log('Bearbeiten clicked for tenant:', tenant.id);
                              // TODO: Implement tenant editing functionality
                              // For now, we can open the details modal
                              setSelectedTenant(tenant);
                              setShowDetails(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              console.log('Nachricht senden clicked for tenant:', tenant.contact_email);
                              // Open email client with tenant's email
                              if (tenant.contact_email) {
                                window.open(`mailto:${tenant.contact_email}`, '_blank');
                              }
                            }}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Nachricht senden
                          </DropdownMenuItem>
                          {tenant.status === 'active' ? (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(tenant.id, 'suspended')}
                              className="text-destructive"
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Sperren
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(tenant.id, 'active')}
                              className="text-green-600"
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Aktivieren
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTenants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Keine Mandanten gefunden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedTenant && (
        <TenantDetailsModal
          open={showDetails}
          onOpenChange={setShowDetails}
          tenant={selectedTenant}
          onUpdate={loadTenants}
        />
      )}

      <NewTenantModal
        open={showNewTenant}
        onOpenChange={setShowNewTenant}
        onSuccess={() => {
          loadTenants();
          onStatsChange();
        }}
      />
    </div>
  );
}