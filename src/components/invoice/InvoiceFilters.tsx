import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, RotateCcw } from 'lucide-react';

interface FilterState {
  status: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  searchTerm: string;
}

interface InvoiceFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function InvoiceFilters({ filters, onFiltersChange }: InvoiceFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      searchTerm: ''
    });
  };

  const statusButtons = [
    { value: 'all', label: 'Alle', variant: 'outline' as const },
    { value: 'pending', label: 'Ausstehend', variant: 'secondary' as const },
    { value: 'paid', label: 'Bezahlt', variant: 'default' as const },
    { value: 'overdue', label: 'Überfällig', variant: 'destructive' as const },
  ];

  return (
    <div className="space-y-4">
      {/* Status Filter Buttons */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Status</Label>
        <div className="flex flex-wrap gap-2">
          {statusButtons.map((status) => (
            <Button
              key={status.value}
              variant={filters.status === status.value ? status.variant : 'outline'}
              size="sm"
              onClick={() => updateFilter('status', status.value)}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">Suche</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Firmenname, Rechnungsnummer oder Beschreibung..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateFrom" className="text-sm font-medium">Startdatum</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo" className="text-sm font-medium">Enddatum</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>
      </div>

      {/* Amount Range */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="minAmount" className="text-sm font-medium">Min. Betrag (CHF)</Label>
          <Input
            id="minAmount"
            type="number"
            placeholder="0.00"
            value={filters.minAmount}
            onChange={(e) => updateFilter('minAmount', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxAmount" className="text-sm font-medium">Max. Betrag (CHF)</Label>
          <Input
            id="maxAmount"
            type="number"
            placeholder="9999.99"
            value={filters.maxAmount}
            onChange={(e) => updateFilter('maxAmount', e.target.value)}
          />
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Filter zurücksetzen
        </Button>
      </div>
    </div>
  );
}