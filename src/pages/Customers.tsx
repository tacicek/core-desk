import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CustomerTable } from '@/components/customer/CustomerTable';
import { CustomerModal } from '@/components/customer/CustomerModal';
import { customerStorage } from '@/lib/customerStorage';
import { Customer } from '@/types/index';
import { useToast } from '@/hooks/use-toast';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.contactPerson && customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    console.log('Customers Page: Loading customers...');
    setIsLoading(true);
    try {
      const customerList = await customerStorage.getAll();
      console.log('Customers Page: Loaded customers count:', customerList.length);
      console.log('Customers Page: Customer list:', customerList);
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Fehler',
        description: 'Kunden konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCustomer = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    setIsSaving(true);
    try {
      if (editingCustomer) {
        const updatedCustomer = await customerStorage.update(editingCustomer.id, customerData);
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updatedCustomer : c));
        toast({
          title: 'Erfolg',
          description: 'Kunde wurde erfolgreich aktualisiert.',
        });
      } else {
        const newCustomer = await customerStorage.add(customerData);
        setCustomers(prev => [newCustomer, ...prev]);
        toast({
          title: 'Erfolg',
          description: 'Kunde wurde erfolgreich erstellt.',
        });
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: 'Fehler',
        description: 'Kunde konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    setDeletingCustomerId(id);
  };

  const confirmDeleteCustomer = async () => {
    if (!deletingCustomerId) return;

    console.log('Customers Page: Confirming delete for customer ID:', deletingCustomerId);
    
    try {
      await customerStorage.delete(deletingCustomerId);
      console.log('Customers Page: Delete completed, updating state...');
      setCustomers(prev => {
        const newList = prev.filter(c => c.id !== deletingCustomerId);
        console.log('Customers Page: New customer list after delete:', newList.length, 'customers');
        return newList;
      });
      toast({
        title: 'Erfolg',
        description: 'Kunde wurde erfolgreich gelöscht.',
      });
      
      // Force reload to check if customers reappear
      console.log('Customers Page: Force reloading customers after 2 seconds...');
      setTimeout(() => {
        console.log('Customers Page: Executing force reload...');
        loadCustomers();
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Fehler',
        description: 'Kunde konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } finally {
      setDeletingCustomerId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Kunden werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-4 md:space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Kunden</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Kunden und deren Kontaktdaten.
          </p>
        </div>
        <Button onClick={handleNewCustomer}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Kunde
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Kunden suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <CustomerTable
        customers={filteredCustomers}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
      />

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        isLoading={isSaving}
      />

      <AlertDialog open={!!deletingCustomerId} onOpenChange={() => setDeletingCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kunde löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diesen Kunden löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCustomer}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}