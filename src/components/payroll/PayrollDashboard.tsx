import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  Calculator, 
  FileText,
  Upload,
  Download,
  Calendar,
  Building2
} from 'lucide-react';
import { PayrollUploadArea } from './PayrollUploadArea';
import { PayrollTable } from './PayrollTable';
import { EmployeeManager } from '../employee/EmployeeManager';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PayrollStats {
  totalEmployees: number;
  totalGrossSalary: number;
  totalEmployerCosts: number;
  totalCompanyCosts: number;
  avgSalaryPerEmployee: number;
  pendingRecords: number;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_number?: string;
  department?: string;
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

export function PayrollDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [payrollStats, setPayrollStats] = useState<PayrollStats>({
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalEmployerCosts: 0,
    totalCompanyCosts: 0,
    avgSalaryPerEmployee: 0,
    pendingRecords: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPayrollData();
  }, []);

  const loadPayrollData = async () => {
    try {
      setIsLoading(true);

      // First fetch all employees
      const { data: employees, error: employeesError } = await supabase
        .from('payroll_employees')
        .select('*')
        .order('last_name');

      if (employeesError) {
        throw employeesError;
      }

      // Then fetch payroll records
      const { data: records, error: recordsError } = await supabase
        .from('payroll_records')
        .select('*')
        .order('payroll_year', { ascending: false })
        .order('payroll_month', { ascending: false });

      if (recordsError) {
        throw recordsError;
      }

      // Create a map of employees for quick lookup
      const employeeMap = new Map(
        (employees || []).map(emp => [emp.id, emp])
      );

      // Transform payroll records with employee data
      const transformedRecords: PayrollRecord[] = (records || []).map(record => {
        const employee = employeeMap.get(record.employee_id);
        return {
          id: record.id,
          employee_id: record.employee_id,
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee',
          employee_number: employee?.employee_number,
          department: employee?.department,
          payroll_month: record.payroll_month,
          payroll_year: record.payroll_year,
          base_salary: record.base_salary || 0,
          gross_salary: record.gross_salary || 0,
          total_deductions: record.total_deductions || 0,
          net_salary: record.net_salary || 0,
          total_employer_costs: record.total_employer_costs || 0,
          total_company_cost: record.total_company_cost || 0,
          processing_status: record.processing_status || 'pending'
        };
      });

      // Add employees without payroll records as placeholder entries
      const employeesWithoutRecords = (employees || []).filter(emp => 
        !records?.some(record => record.employee_id === emp.id)
      ).map(emp => ({
        id: `placeholder-${emp.id}`,
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        employee_number: emp.employee_number,
        department: emp.department,
        payroll_month: 0,
        payroll_year: 0,
        base_salary: 0,
        gross_salary: 0,
        total_deductions: 0,
        net_salary: 0,
        total_employer_costs: 0,
        total_company_cost: 0,
        processing_status: 'no_records'
      }));

      const allRecords = [...transformedRecords, ...employeesWithoutRecords];
      setPayrollRecords(allRecords);
      calculateStats(transformedRecords); // Only calculate stats from actual records
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast.error('Fehler beim Laden der Bordro-Daten');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (records: PayrollRecord[]) => {
    const totalEmployees = new Set(records.map(r => r.employee_id)).size;
    const totalGrossSalary = records.reduce((sum, r) => sum + r.gross_salary, 0);
    const totalEmployerCosts = records.reduce((sum, r) => sum + r.total_employer_costs, 0);
    const totalCompanyCosts = records.reduce((sum, r) => sum + r.total_company_cost, 0);
    const avgSalaryPerEmployee = totalEmployees > 0 ? totalGrossSalary / totalEmployees : 0;
    const pendingRecords = records.filter(r => r.processing_status === 'pending').length;

    setPayrollStats({
      totalEmployees,
      totalGrossSalary,
      totalEmployerCosts,
      totalCompanyCosts,
      avgSalaryPerEmployee,
      pendingRecords
    });
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      // In a real implementation, you would:
      // 1. Upload files to Supabase Storage
      // 2. Process them with AI/OCR to extract payroll data
      // 3. Store the extracted data in the database
      
      toast.success(`${files.length} Datei(en) erfolgreich hochgeladen`);
      
      // Reload data after upload
      await loadPayrollData();
      
      // Switch to table view
      setActiveTab('records');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Fehler beim Hochladen der Dateien');
    }
  };

  const handleViewDetails = (recordId: string) => {
    // In a real implementation, this would open a detailed view
    toast.info('Detailansicht wird geöffnet...');
  };

  const handleDeleteRecord = async (recordId: string) => {
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
      
      // Reload data after deletion
      await loadPayrollData();
    } catch (error) {
      console.error('Error deleting payroll record:', error);
      toast.error('Fehler beim Löschen der Lohnabrechnung');
    }
  };

  const handleExportData = () => {
    // In a real implementation, this would export to Excel
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
          <h1 className="text-clamp-2xl font-bold">Schweizer Lohnabrechnungs-Analysesystem</h1>
          <p className="text-clamp-base text-muted-foreground">
            Lohnabrechnungsdateien hochladen, analysieren und Sozialversicherungskosten kategorisieren
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mitarbeiter
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Datei hochladen
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Lohnabrechnungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mitarbeiter gesamt</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {payrollStats.totalEmployees}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bruttolohn gesamt</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(payrollStats.totalGrossSalary)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calculator className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Arbeitgeberkosten</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(payrollStats.totalEmployerCosts)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamte Unternehmenskosten</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(payrollStats.totalCompanyCosts)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Durchschnittliche Lohninformationen</CardTitle>
                <CardDescription>
                  Durchschnittliche Kosten pro Mitarbeiter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Durchschnittlicher Bruttolohn:</span>
                  <span className="font-medium">
                    {formatCurrency(payrollStats.avgSalaryPerEmployee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Durchschnittliche Arbeitgeberkosten:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(payrollStats.totalEmployerCosts / (payrollStats.totalEmployees || 1))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Durchschnittliche Gesamtkosten:</span>
                  <span className="font-medium text-purple-600">
                    {formatCurrency(payrollStats.totalCompanyCosts / (payrollStats.totalEmployees || 1))}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verarbeitungsstatus</CardTitle>
                <CardDescription>
                  Zusammenfassung des Lohnabrechnungsverarbeitungsstatus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Datensätze gesamt:</span>
                  <span className="font-medium">{payrollRecords.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verarbeitete Datensätze:</span>
                  <span className="font-medium text-green-600">
                    {payrollRecords.filter(r => r.processing_status === 'processed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ausstehende Datensätze:</span>
                  <span className="font-medium text-orange-600">
                    {payrollStats.pendingRecords}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fehlerhafte Datensätze:</span>
                  <span className="font-medium text-red-600">
                    {payrollRecords.filter(r => r.processing_status === 'error').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
              <CardHeader>
                <CardTitle>Schnellaktionen</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => setActiveTab('upload')}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Neue Lohnabrechnung hochladen
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportData}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Nach Excel exportieren
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('records')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Alle Datensätze anzeigen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <EmployeeManager />
        </TabsContent>

        <TabsContent value="upload">
          <PayrollUploadArea onUpload={handleFileUpload} />
        </TabsContent>

        <TabsContent value="records">
          <PayrollTable 
            records={payrollRecords}
            onViewDetails={handleViewDetails}
            onDeleteRecord={handleDeleteRecord}
            onExportData={handleExportData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}