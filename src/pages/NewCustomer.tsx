import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from '@/components/customer/CustomerForm';
import { customerStorage } from '@/lib/customerStorage';
import { Customer } from '@/types/index';
import { useToast } from '@/hooks/use-toast';

export default function NewCustomer() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    setIsSaving(true);
    try {
      await customerStorage.add(customerData);
      toast({
        title: 'Erfolg',
        description: 'Kunde wurde erfolgreich erstellt.',
      });
      navigate('/dashboard/customers');
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

  const handleCancel = () => {
    navigate('/dashboard/customers');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/customers')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Kunden
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Neuer Kunde</h1>
        <p className="text-muted-foreground">
          Erstellen Sie einen neuen Kunden und verwalten Sie dessen Kontaktdaten.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kundeninformationen</CardTitle>
          <CardDescription>
            Geben Sie die Details für den neuen Kunden ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm
            onSave={handleSaveCustomer}
            onCancel={handleCancel}
            isLoading={isSaving}
            submitText="Kunde erstellen"
            cancelText="Zurück zu Kunden"
          />
        </CardContent>
      </Card>
    </div>
  );
}