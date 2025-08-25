import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Customer } from '@/types/index';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onEdit,
  onDelete,
}) => {
  const isMobile = useIsMobile();

  if (customers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Noch keine Kunden vorhanden. Erstellen Sie Ihren ersten Kunden.
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {customers.map((customer) => (
          <div key={customer.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{customer.name}</h3>
                {customer.contactPerson && (
                  <p className="text-sm text-muted-foreground truncate">
                    Ansprechpartner: {customer.contactPerson}
                  </p>
                )}
              </div>
              <div className="flex space-x-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(customer)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(customer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Email: </span>
                <span className="break-all">{customer.email}</span>
              </div>
              {customer.phone && (
                <div>
                  <span className="text-muted-foreground">Telefon: </span>
                  <span>{customer.phone}</span>
                </div>
              )}
              {(customer.street || customer.houseNumber || customer.postalCode || customer.city) ? (
                <div>
                  <span className="text-muted-foreground">Adresse: </span>
                  <div className="break-words">
                    {customer.street && customer.houseNumber ? (
                      <div>{customer.street} {customer.houseNumber}</div>
                    ) : (
                      customer.street && <div>{customer.street}</div>
                    )}
                    {customer.postalCode && customer.city ? (
                      <div>{customer.postalCode} {customer.city}</div>
                    ) : (
                      (customer.postalCode || customer.city) && <div>{customer.postalCode} {customer.city}</div>
                    )}
                  </div>
                </div>
              ) : (
                customer.address && (
                  <div>
                    <span className="text-muted-foreground">Adresse: </span>
                    <span className="break-words">{customer.address}</span>
                  </div>
                )
              )}
              <div>
                <span className="text-muted-foreground">Erstellt: </span>
                <span>{format(new Date(customer.createdAt), 'dd.MM.yyyy')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px] md:min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[150px] md:min-w-[200px]">Email</TableHead>
              <TableHead className="hidden md:table-cell min-w-[120px]">Telefon</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[200px]">Adresse</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[100px]">Erstellt am</TableHead>
              <TableHead className="text-right min-w-[80px] md:min-w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="truncate">{customer.name}</div>
                    {customer.contactPerson && (
                      <div className="text-sm text-muted-foreground truncate">
                        {customer.contactPerson}
                      </div>
                    )}
                    {/* Show phone on tablet when column is hidden */}
                    <div className="md:hidden text-sm text-muted-foreground">
                      {customer.phone || 'Kein Telefon'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="break-all">{customer.email}</div>
                  {/* Show address on tablet when column is hidden */}
                  <div className="lg:hidden text-sm text-muted-foreground mt-1 break-words">
                    {customer.address && customer.address.length > 30 
                      ? `${customer.address.substring(0, 30)}...`
                      : customer.address || 'Keine Adresse'
                    }
                  </div>
                  {/* Show date on tablet when column is hidden */}
                  <div className="lg:hidden text-sm text-muted-foreground mt-1">
                    {format(new Date(customer.createdAt), 'dd.MM.yyyy')}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{customer.phone || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                  {customer.address || '-'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {format(new Date(customer.createdAt), 'dd.MM.yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(customer)}
                    >
                      <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(customer.id)}
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};