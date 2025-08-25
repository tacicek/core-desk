import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewEmployeeModalProps {
  onEmployeeCreated: () => void;
}

interface NewEmployeeForm {
  employee_number: string;
  first_name: string;
  last_name: string;
  department: string;
  position: string;
  hire_date: string;
  work_percentage: number;
  birth_date: string;
  address: string;
  phone: string;
  email: string;
  salary_grade: string;
  is_active: boolean;
}

const initialFormData: NewEmployeeForm = {
  employee_number: '',
  first_name: '',
  last_name: '',
  department: '',
  position: '',
  hire_date: '',
  work_percentage: 100,
  birth_date: '',
  address: '',
  phone: '',
  email: '',
  salary_grade: '',
  is_active: true
};

const departments = [
  'Geschäftsleitung',
  'Personal',
  'Buchhaltung',
  'Verkauf',
  'Marketing',
  'IT',
  'Produktion',
  'Einkauf',
  'Logistik',
  'Kundenservice'
];

const positions = [
  'Geschäftsführer',
  'Abteilungsleiter',
  'Teamleiter',
  'Senior Spezialist',
  'Spezialist',
  'Sachbearbeiter',
  'Assistent',
  'Praktikant',
  'Auszubildender'
];

export function NewEmployeeModal({ onEmployeeCreated }: NewEmployeeModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<NewEmployeeForm>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof NewEmployeeForm, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.first_name.trim()) {
      errors.push('Vorname ist erforderlich');
    }
    if (!formData.last_name.trim()) {
      errors.push('Nachname ist erforderlich');
    }
    if (!formData.department) {
      errors.push('Abteilung ist erforderlich');
    }
    if (!formData.position) {
      errors.push('Position ist erforderlich');
    }
    if (formData.work_percentage < 1 || formData.work_percentage > 100) {
      errors.push('Arbeitszeit muss zwischen 1% und 100% liegen');
    }
    if (formData.email && !formData.email.includes('@')) {
      errors.push('E-Mail-Adresse ist ungültig');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Get user's vendor_id from user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('vendor_id')
        .eq('user_id', user.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found');
      }

      const { error } = await supabase
        .from('payroll_employees')
        .insert({
          employee_number: formData.employee_number || null,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          department: formData.department,
          position: formData.position,
          hire_date: formData.hire_date || null,
          is_active: formData.is_active,
          vendor_id: profile.vendor_id,
          created_by: user.user.id
        });

      if (error) {
        throw error;
      }

      toast.success(`Mitarbeiter ${formData.first_name} ${formData.last_name} wurde erfolgreich erstellt`);
      setFormData(initialFormData);
      setOpen(false);
      onEmployeeCreated();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Fehler beim Erstellen des Mitarbeiters');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Neuer Mitarbeiter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
          <DialogDescription>
            Erfassen Sie die Grunddaten für einen neuen Mitarbeiter
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Vorname *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Max"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Nachname *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Mustermann"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_number">Mitarbeiternummer</Label>
              <Input
                id="employee_number"
                value={formData.employee_number}
                onChange={(e) => handleInputChange('employee_number', e.target.value)}
                placeholder="MA001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="max.mustermann@firma.de"
              />
            </div>
          </div>

          {/* Work Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Abteilung *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleInputChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Abteilung wählen" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleInputChange('position', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Position wählen" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date">Einstellungsdatum</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleInputChange('hire_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_percentage">Arbeitszeit (%)</Label>
              <Input
                id="work_percentage"
                type="number"
                min="1"
                max="100"
                value={formData.work_percentage}
                onChange={(e) => handleInputChange('work_percentage', parseInt(e.target.value) || 100)}
                placeholder="100"
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Geburtsdatum</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+41 44 123 45 67"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Musterstraße 123, 8001 Zürich"
              rows={2}
            />
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Aktiver Mitarbeiter</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}