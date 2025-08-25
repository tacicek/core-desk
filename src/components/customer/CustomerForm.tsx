import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types/index';

const customerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  contactPerson: z.string().optional(),
  contactGender: z.enum(['male', 'female', 'neutral']).optional(),
  email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  phone: z.string().optional(),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  taxNumber: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  onSave: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
  customer?: Customer | null;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  onSave,
  onCancel,
  customer,
  isLoading = false,
  submitText,
  cancelText = 'Abbrechen',
}) => {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      contactPerson: customer?.contactPerson || '',
      contactGender: customer?.contactGender || undefined,
      email: customer?.email || '',
      phone: customer?.phone || '',
      street: customer?.street || '',
      houseNumber: customer?.houseNumber || '',
      postalCode: customer?.postalCode || '',
      city: customer?.city || '',
      taxNumber: customer?.taxNumber || '',
    },
  });

  React.useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        contactPerson: customer.contactPerson || '',
        contactGender: customer.contactGender || undefined,
        email: customer.email,
        phone: customer.phone || '',
        street: customer.street || '',
        houseNumber: customer.houseNumber || '',
        postalCode: customer.postalCode || '',
        city: customer.city || '',
        taxNumber: customer.taxNumber || '',
      });
    } else {
      form.reset({
        name: '',
        contactPerson: '',
        contactGender: undefined,
        email: '',
        phone: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        taxNumber: '',
      });
    }
  }, [customer, form]);

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      await onSave(data);
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Firmenname *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Firmenname eingeben" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ansprechpartner</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Name der Kontaktperson" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactGender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anrede</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Anrede wählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Herr</SelectItem>
                    <SelectItem value="female">Frau</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail *</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="kunde@beispiel.de" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl>
                <Input {...field} placeholder="+41 XX XXX XX XX" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Adresse</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strasse</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Bahnhofstrasse" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-1">
              <FormField
                control={form.control}
                name="houseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nummer</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PLZ</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="8000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ort</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Zürich" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="taxNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Steuernummer</FormLabel>
              <FormControl>
                <Input {...field} placeholder="CHE-123.456.789" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Speichern...' : submitText || (customer ? 'Aktualisieren' : 'Erstellen')}
          </Button>
        </div>
      </form>
    </Form>
  );
};