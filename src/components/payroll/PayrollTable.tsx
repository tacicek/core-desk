import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Download, 
  Filter, 
  Eye, 
  Calendar,
  Users,
  TrendingUp,
  Calculator,
  Trash2
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

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

interface PayrollTableProps {
  records: PayrollRecord[];
  onViewDetails: (recordId: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onExportData: () => void;
}

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export function PayrollTable({ records, onViewDetails, onDeleteRecord, onExportData }: PayrollTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof PayrollRecord>('payroll_year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get unique values for filters
  const departments = useMemo(() => {
    const depts = [...new Set(records.map(r => r.department).filter(Boolean))];
    return depts.sort();
  }, [records]);

  const years = useMemo(() => {
    const yearSet = [...new Set(records.map(r => r.payroll_year))];
    return yearSet.sort((a, b) => b - a);
  }, [records]);

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records.filter(record => {
      const matchesSearch = !searchTerm || 
        record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === 'all' || record.department === selectedDepartment;
      const matchesYear = selectedYear === 'all' || record.payroll_year.toString() === selectedYear;
      const matchesMonth = selectedMonth === 'all' || record.payroll_month.toString() === selectedMonth;

      return matchesSearch && matchesDepartment && matchesYear && matchesMonth;
    });

    // Sort records
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [records, searchTerm, selectedDepartment, selectedYear, selectedMonth, sortField, sortDirection]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalRecords = filteredAndSortedRecords.length;
    const totalGrossSalary = filteredAndSortedRecords.reduce((sum, r) => sum + r.gross_salary, 0);
    const totalNetSalary = filteredAndSortedRecords.reduce((sum, r) => sum + r.net_salary, 0);
    const totalEmployerCosts = filteredAndSortedRecords.reduce((sum, r) => sum + r.total_employer_costs, 0);
    const totalCompanyCost = filteredAndSortedRecords.reduce((sum, r) => sum + r.total_company_cost, 0);

    return {
      totalRecords,
      totalGrossSalary,
      totalNetSalary,
      totalEmployerCosts,
      totalCompanyCost
    };
  }, [filteredAndSortedRecords]);

  const handleSort = (field: keyof PayrollRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Verarbeitet</Badge>;
      case 'pending':
        return <Badge variant="secondary">Ausstehend</Badge>;
      case 'error':
        return <Badge variant="destructive">Fehler</Badge>;
      case 'no_records':
        return <Badge variant="outline" className="bg-gray-100 text-gray-600">Keine Abrechnung</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Mitarbeiter</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.totalRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Bruttolohn Gesamt</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(summaryStats.totalGrossSalary)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Arbeitgeberkosten</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(summaryStats.totalEmployerCosts)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Gesamtkosten</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(summaryStats.totalCompanyCost)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter und Suche
            </span>
            <Button onClick={onExportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Excel Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mitarbeiter suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Abteilung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Abteilungen</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Jahr" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Jahre</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Monat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Monate</SelectItem>
                {monthNames.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('all');
                setSelectedYear('all');
                setSelectedMonth('all');
              }}
            >
              Filter zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lohnabrechnungen ({filteredAndSortedRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('employee_name')}>
                    Mitarbeiter
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('department')}>
                    Abteilung
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('payroll_year')}>
                    Periode
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('gross_salary')}>
                    Bruttolohn
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('net_salary')}>
                    Nettolohn
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('total_employer_costs')}>
                    Arbeitgeberkosten
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('total_company_cost')}>
                    Gesamtkosten
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.employee_name}</div>
                        {record.employee_number && (
                          <div className="text-sm text-muted-foreground">
                            #{record.employee_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{record.department || '-'}</TableCell>
                    <TableCell>
                      {record.payroll_year > 0 ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {monthNames[record.payroll_month - 1]} {record.payroll_year}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(record.gross_salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(record.net_salary)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(record.total_employer_costs)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-purple-600">
                      {formatCurrency(record.total_company_cost)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.processing_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(record.id)}
                          title="Details anzeigen"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!record.id.startsWith('placeholder-') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteRecord(record.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedRecords.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Keine Lohnabrechnungseinträge gefunden
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}