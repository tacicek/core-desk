import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { customerStorage } from '@/lib/customerStorage';
import { Customer } from '@/types/index';
import { cn } from '@/lib/utils';

interface CustomerSelectorProps {
  value?: string;
  onValueChange: (customerId: string, customer: Customer | null) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  className?: string;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Kunde auswählen...",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const customerList = await customerStorage.getAll();
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCustomer = customers.find(customer => customer.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCustomer ? (
            <span className="font-medium">{selectedCustomer.name}</span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Kunde suchen..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                "Kunden werden geladen..."
              ) : (
                <div className="p-2 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Keine Kunden gefunden.
                  </p>
                  {onCreateNew && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onCreateNew();
                        setOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Neuen Kunden erstellen
                    </Button>
                  )}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={(currentValue) => {
                    const selected = customers.find(c => c.id === currentValue);
                    onValueChange(currentValue === value ? "" : currentValue, selected || null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">{customer.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && customers.length > 0 && (
              <div className="border-t p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onCreateNew();
                    setOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neuen Kunden erstellen
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};