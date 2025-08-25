import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  User, 
  Calendar, 
  MapPin, 
  Briefcase,
  TrendingUp,
  FileText,
  Plus,
  Edit,
  Eye,
  Users,
  Percent,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { PayrollTable } from '../payroll/PayrollTable';
import { NewEmployeeModal } from './NewEmployeeModal';

interface Employee {
  id: string;
  employee_number?: string;
  first_name: string;
  last_name: string;
  department?: string;
  position?: string;
  hire_date?: string;
  is_active: boolean;
  work_percentage?: number;
  birth_date?: string;
  address?: string;
  phone?: string;
  email?: string;
  salary_grade?: string;
  created_at: string;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  payroll_month: number;
  payroll_year: number;
  base_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  total_employer_costs: number;
  total_company_cost: number;
  processing_status: string;
}

interface EmployeeStats {
  totalGrossSalary: number;
  avgMonthlySalary: number;
  totalRecords: number;
  lastPayrollMonth: string;
}

export function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
    totalGrossSalary: 0,
    avgMonthlySalary: 0,
    totalRecords: 0,
    lastPayrollMonth: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeePayrollRecords(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payroll_employees')
        .select('*')
        .order('last_name');

      if (error) throw error;

      setEmployees(data || []);
      // Clear search when loading employees to show all
      setSearchTerm('');
      setSelectedEmployee(null);
      setPayrollRecords([]);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Fehler beim Laden der Mitarbeiterdaten');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployeePayrollRecords = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('payroll_year', { ascending: false })
        .order('payroll_month', { ascending: false });

      if (error) throw error;

      const records = data || [];
      setPayrollRecords(records);
      calculateEmployeeStats(records);
    } catch (error) {
      console.error('Error loading payroll records:', error);
      toast.error('Fehler beim Laden der Lohnabrechnungsdaten');
    }
  };

  const calculateEmployeeStats = (records: PayrollRecord[]) => {
    const totalGrossSalary = records.reduce((sum, r) => sum + (r.gross_salary || 0), 0);
    const avgMonthlySalary = records.length > 0 ? totalGrossSalary / records.length : 0;
    const totalRecords = records.length;
    
    let lastPayrollMonth = '';
    if (records.length > 0) {
      const latest = records[0];
      lastPayrollMonth = `${latest.payroll_month}/${latest.payroll_year}`;
    }

    setEmployeeStats({
      totalGrossSalary,
      avgMonthlySalary,
      totalRecords,
      lastPayrollMonth
    });
  };

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    
    const term = searchTerm.toLowerCase();
    return employees.filter(emp => 
      emp.first_name.toLowerCase().includes(term) ||
      emp.last_name.toLowerCase().includes(term) ||
      emp.employee_number?.toLowerCase().includes(term) ||
      emp.department?.toLowerCase().includes(term) ||
      emp.position?.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchTerm(`${employee.first_name} ${employee.last_name}`);
    setShowSuggestions(false);
  };

  const calculateAge = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleViewDetails = (recordId: string) => {
    toast.info('Detailansicht wird geöffnet...');
  };

  const handleDeletePayrollRecord = async (recordId: string) => {
    // Don't allow deletion of placeholder records
    if (recordId.startsWith('placeholder-')) {
      toast.error('Platzhalter-Einträge können nicht gelöscht werden');
      return;
    }

    try {
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast.success('Lohnabrechnung wurde erfolgreich gelöscht');
      
      // Reload payroll records for the selected employee
      if (selectedEmployee) {
        loadEmployeePayrollRecords(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Error deleting payroll record:', error);
      toast.error('Fehler beim Löschen der Lohnabrechnung');
    }
  };

  const handleExportData = () => {
    toast.info('Excel-Export wird vorbereitet...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-clamp-2xl font-bold">Mitarbeiterverwaltung</h1>
          <p className="text-clamp-base text-muted-foreground">
            Mitarbeiterinformationen und Lohnabrechnungen verwalten
          </p>
        </div>
        <NewEmployeeModal onEmployeeCreated={loadEmployees} />
      </div>

      {/* Search and Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Mitarbeiter suchen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Name, Mitarbeiternummer, Abteilung oder Position eingeben..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
                if (!e.target.value) {
                  setSelectedEmployee(null);
                  setPayrollRecords([]);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pr-4"
            />
            
            {/* Auto-complete suggestions */}
            {showSuggestions && searchTerm && filteredEmployees.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto mt-1">
                {filteredEmployees.slice(0, 8).map((employee) => (
                  <div
                    key={employee.id}
                    className="px-4 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleEmployeeSelect(employee)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.employee_number && `#${employee.employee_number} • `}
                          {employee.department} • {employee.position}
                        </p>
                      </div>
                      <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                        {employee.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Details */}
      {selectedEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Mitarbeiterinformationen
              </CardTitle>
              <CardDescription>
                Persönliche und berufliche Details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[120px]">Mitarbeiter-Nr:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedEmployee.employee_number || 'Nicht vergeben'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium min-w-[100px]">Position:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedEmployee.position || 'Nicht angegeben'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium min-w-[100px]">Abteilung:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedEmployee.department || 'Nicht angegeben'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium min-w-[100px]">Arbeitszeit:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedEmployee.work_percentage ? `${selectedEmployee.work_percentage}%` : 'Nicht angegeben'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium min-w-[100px]">Alter:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedEmployee.birth_date 
                      ? `${calculateAge(selectedEmployee.birth_date)} Jahre`
                      : 'Nicht angegeben'
                    }
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium min-w-[100px]">Einstellungsdatum:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedEmployee.hire_date 
                      ? new Date(selectedEmployee.hire_date).toLocaleDateString('de-DE')
                      : 'Nicht angegeben'
                    }
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[100px]">Status:</span>
                  <Badge variant={selectedEmployee.is_active ? 'default' : 'secondary'}>
                    {selectedEmployee.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Statistics */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Lohnstatistiken
              </CardTitle>
              <CardDescription>
                Übersicht der Lohnabrechnungsdaten für {selectedEmployee.first_name} {selectedEmployee.last_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Durchschnittsgehalt</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(employeeStats.avgMonthlySalary)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lohnabrechnungen</p>
                        <p className="text-xl font-bold text-blue-600">
                          {employeeStats.totalRecords}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Letzte Abrechnung</p>
                        <p className="text-xl font-bold text-purple-600">
                          {employeeStats.lastPayrollMonth || 'Keine'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gesamtvergütung</p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(employeeStats.totalGrossSalary)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employee Payroll Records */}
      {selectedEmployee && payrollRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lohnabrechnungen für {selectedEmployee.first_name} {selectedEmployee.last_name}
            </CardTitle>
            <CardDescription>
              Alle Lohnabrechnungsdatensätze für diesen Mitarbeiter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PayrollTable 
              records={payrollRecords.map(record => ({
                id: record.id,
                employee_id: record.employee_id,
                employee_name: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
                employee_number: selectedEmployee.employee_number,
                department: selectedEmployee.department,
                payroll_month: record.payroll_month,
                payroll_year: record.payroll_year,
                base_salary: record.base_salary,
                gross_salary: record.gross_salary,
                total_deductions: record.total_deductions,
                net_salary: record.net_salary,
                total_employer_costs: record.total_employer_costs,
                total_company_cost: record.total_company_cost,
                processing_status: record.processing_status
              }))}
              onViewDetails={handleViewDetails}
              onDeleteRecord={handleDeletePayrollRecord}
              onExportData={handleExportData}
            />
          </CardContent>
        </Card>
      )}

      {selectedEmployee && payrollRecords.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Lohnabrechnungen gefunden</h3>
            <p className="text-muted-foreground">
              Für {selectedEmployee.first_name} {selectedEmployee.last_name} sind noch keine Lohnabrechnungen verfügbar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alle Mitarbeiter ({employees.length})
          </CardTitle>
          <CardDescription>
            Übersicht aller Mitarbeiter mit Bearbeitungsmöglichkeiten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Keine Mitarbeiter gefunden</h3>
              <p>Fügen Sie Ihren ersten Mitarbeiter über die Schaltfläche "Neuer Mitarbeiter" hinzu.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {employees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {employee.first_name} {employee.last_name}
                            </h3>
                            <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                              {employee.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {employee.employee_number && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium">MA-Nr:</span>
                                {employee.employee_number}
                              </span>
                            )}
                            {employee.position && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {employee.position}
                              </span>
                            )}
                            {employee.department && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {employee.department}
                              </span>
                            )}
                            {employee.work_percentage && (
                              <span className="flex items-center gap-1">
                                <Percent className="h-3 w-3" />
                                {employee.work_percentage}%
                              </span>
                            )}
                          </div>
                          {employee.hire_date && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Eingestellt: {new Date(employee.hire_date).toLocaleDateString('de-DE')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEmployeeSelect(employee)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // TODO: Implement edit functionality
                            toast.info('Bearbeitungsfunktion wird implementiert...');
                          }}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Bearbeiten
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}