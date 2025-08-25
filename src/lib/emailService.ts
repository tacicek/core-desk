import { Invoice } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachmentName?: string;
  attachmentData?: string;
}

export class EmailService {
  private static replaceTemplateVariables(template: string, invoice: Invoice, settings: any): string {
    const customerName = invoice.customerName || 'Kunde';
    const invoiceDate = new Date(invoice.date).toLocaleDateString('de-CH');
    
    return template
      .replace(/{invoiceNumber}/g, invoice.number)
      .replace(/{companyName}/g, settings.name || 'Ihr Unternehmen')
      .replace(/{customerName}/g, customerName)
      .replace(/{invoiceDate}/g, invoiceDate)
      .replace(/{amount}/g, `CHF ${invoice.total.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`)
      .replace(/{dueDate}/g, new Date(invoice.dueDate).toLocaleDateString('de-CH'));
  }

  static async sendInvoiceEmail(invoice: Invoice): Promise<boolean> {
    try {
      if (!invoice.customerEmail) {
        throw new Error('Kunde hat keine E-Mail-Adresse.');
      }

      console.log('Sending invoice email for:', {
        invoiceId: invoice.id,
        customerEmail: invoice.customerEmail
      });

      // Call the Supabase edge function to send email with PDF
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          type: 'invoice',
          itemId: invoice.id,
          to: invoice.customerEmail
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Try to get more detailed error information
        let errorMessage = error.message || 'Unknown error';
        if (error.context) {
          errorMessage += ` Context: ${JSON.stringify(error.context)}`;
        }
        
        throw new Error(`Failed to send email: ${errorMessage}`);
      }

      console.log('Email sent successfully:', data);
      return true;

    } catch (error) {
      console.error('Error sending email:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
  }

  static async sendOfferEmail(offerId: string, customerEmail: string): Promise<boolean> {
    try {
      if (!customerEmail) {
        throw new Error('Kunde hat keine E-Mail-Adresse.');
      }

      // Call the Supabase edge function to send offer email with PDF
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          type: 'offer',
          itemId: offerId,
          to: customerEmail
        }
      });

      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('Offer email sent successfully:', data);
      return true;

    } catch (error) {
      console.error('Error sending offer email:', error);
      throw error;
    }
  }
}