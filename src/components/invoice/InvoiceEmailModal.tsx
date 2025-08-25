import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, X } from 'lucide-react';
import { Invoice } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceEmailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: { to: string; subject: string; message: string }) => Promise<void>;
}

export function InvoiceEmailModal({ invoice, isOpen, onClose, onSend }: InvoiceEmailModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEmailTemplate = async () => {
      if (!invoice) return;

      // Load email template from company settings
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('vendor_id')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;

        const { data: settings } = await supabase
          .from('company_settings')
          .select('*')
          .eq('vendor_id', profile.vendor_id)
          .single();

        if (settings) {
          // Set recipient email
          setTo(invoice.customerEmail || '');

          // Generate subject from template
          const subjectTemplate = settings.email_subject_template || 'Rechnung {invoiceNumber} von {companyName}';
          const generatedSubject = subjectTemplate
            .replace(/{invoiceNumber}/g, invoice.number)
            .replace(/{companyName}/g, settings.name || 'Ihr Unternehmen');
          setSubject(generatedSubject);

          // Generate message from template
          const bodyTemplate = settings.email_body_template || 
            'Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung {invoiceNumber} vom {invoiceDate}.\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüssen\n{companyName}';
          
          const invoiceDate = new Date(invoice.date).toLocaleDateString('de-CH');
          const generatedMessage = bodyTemplate
            .replace(/{invoiceNumber}/g, invoice.number)
            .replace(/{companyName}/g, settings.name || 'Ihr Unternehmen')
            .replace(/{customerName}/g, invoice.customerName || 'Kunde')
            .replace(/{invoiceDate}/g, invoiceDate)
            .replace(/{amount}/g, `CHF ${invoice.total.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`)
            .replace(/{dueDate}/g, new Date(invoice.dueDate).toLocaleDateString('de-CH'));
          
          setMessage(generatedMessage);
        }
      } catch (error) {
        console.error('Error loading email template:', error);
        // Set default values
        setTo(invoice.customerEmail || '');
        setSubject(`Rechnung ${invoice.number}`);
        setMessage(`Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung ${invoice.number}.\n\nMit freundlichen Grüssen`);
      }
    };

    if (isOpen && invoice) {
      loadEmailTemplate();
    }
  }, [isOpen, invoice]);

  const handleSend = async () => {
    if (!to || !subject || !message) {
      return;
    }

    setLoading(true);
    try {
      await onSend({ to, subject, message });
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>E-Mail senden - Rechnung {invoice.number}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="to">An</Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="kunde@example.com"
            />
          </div>

          <div>
            <Label htmlFor="subject">Betreff</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Rechnung..."
            />
          </div>

          <div>
            <Label htmlFor="message">Nachricht</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ihre Nachricht..."
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Die Rechnung wird automatisch als PDF-Anhang beigefügt.
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={loading || !to || !subject || !message}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? 'Wird gesendet...' : 'Senden'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}