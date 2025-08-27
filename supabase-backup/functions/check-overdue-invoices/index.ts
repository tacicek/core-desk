import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Invoice {
  id: string;
  invoice_no: string;
  customer_id: string;
  issue_date: string;
  due_date: string;
  total: number;
  status: string;
  currency: string;
  vendor_id: string;
  customers?: {
    name: string;
    email?: string;
  };
}

interface IncomingInvoice {
  id: string;
  vendor_name: string;
  invoice_number: string;
  due_date: string;
  amount: number;
  currency: string;
  vendor_id: string;
  category?: string;
  status: string;
  reminder_sent?: boolean;
}

interface CompanySettings {
  user_id: string;
  vendor_id: string;
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Checking for overdue invoices and incoming bills for all users...');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Fetch all company settings with vendors that have API keys
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('user_id, vendor_id, email, name')
      .not('email', 'is', null)
      .not('vendor_id', 'is', null);

    if (settingsError) {
      console.error('Error fetching company settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch company settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!companySettings || companySettings.length === 0) {
      console.log('No users to process');
      return new Response(
        JSON.stringify({ message: 'No users to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processedUsers = [];

    // Process each user separately
    for (const userSettings of companySettings) {
      console.log(`Processing user: ${userSettings.email}`);

      try {
        // Get API key securely from vendor_secrets table
        const { data: apiKey, error: apiKeyError } = await supabase
          .rpc('get_vendor_api_key', {
            vendor_id_param: userSettings.vendor_id,
            secret_type_param: 'resend_api_key'
          });

        if (apiKeyError || !apiKey) {
          console.log(`No Resend API key for vendor ${userSettings.vendor_id}, skipping`);
          continue;
        }
        // Query for overdue outgoing invoices for this user
        const { data: overdueInvoices, error: overdueError } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_no,
            total,
            due_date,
            status,
            vendor_id,
            customer_id,
            currency,
            customers(name, email)
          `)
          .eq('status', 'sent')
          .eq('vendor_id', userSettings.vendor_id)
          .lt('due_date', today);

        if (overdueError) {
          console.error(`Error fetching overdue invoices for user ${userSettings.email}:`, overdueError);
          continue;
        }

        // Query for overdue incoming invoices for this user
        const { data: overdueIncoming, error: incomingError } = await supabase
          .from('incoming_invoices')
          .select('id, vendor_name, amount, due_date, invoice_number, vendor_id, currency, category')
          .eq('status', 'pending')
          .eq('vendor_id', userSettings.vendor_id)
          .lt('due_date', today);

        if (incomingError) {
          console.error(`Error fetching overdue incoming invoices for user ${userSettings.email}:`, incomingError);
          continue;
        }

        // Query for upcoming payment reminders for this user (due tomorrow)
        const { data: upcomingReminders, error: reminderError } = await supabase
          .from('incoming_invoices')
          .select('id, vendor_name, amount, due_date, invoice_number, vendor_id, currency, category')
          .eq('status', 'pending')
          .eq('vendor_id', userSettings.vendor_id)
          .eq('reminder_sent', false)
          .eq('due_date', tomorrowStr);

        if (reminderError) {
          console.error(`Error fetching upcoming reminders for user ${userSettings.email}:`, reminderError);
          continue;
        }

        // Update overdue incoming invoices status for this user
        if (overdueIncoming && overdueIncoming.length > 0) {
          const { error: updateError } = await supabase
            .from('incoming_invoices')
            .update({ status: 'overdue' })
            .in('id', overdueIncoming.map(inv => inv.id));

          if (updateError) {
            console.error(`Error updating incoming invoice status for user ${userSettings.email}:`, updateError);
          }
        }

        // Mark upcoming reminders as sent for this user
        if (upcomingReminders && upcomingReminders.length > 0) {
          const { error: markSentError } = await supabase
            .from('incoming_invoices')
            .update({ reminder_sent: true })
            .in('id', upcomingReminders.map(inv => inv.id));

          if (markSentError) {
            console.error(`Error marking reminders as sent for user ${userSettings.email}:`, markSentError);
          }
        }

        // Check if there are any notifications to send for this user
        const hasOutgoingOverdue = overdueInvoices && overdueInvoices.length > 0;
        const hasIncomingOverdue = overdueIncoming && overdueIncoming.length > 0;
        const hasUpcomingReminders = upcomingReminders && upcomingReminders.length > 0;

        if (!hasOutgoingOverdue && !hasIncomingOverdue && !hasUpcomingReminders) {
          console.log(`No notifications needed for user: ${userSettings.email}`);
          continue;
        }

        // Construct email content for this user
        let emailContent = `
          <h2>Täglicher Rechnungsbericht für ${userSettings.name || 'Ihr Unternehmen'}</h2>
          <p>Datum: ${new Date().toLocaleDateString('de-DE')}</p>
        `;

        if (hasOutgoingOverdue) {
          emailContent += `
            <h3 style="color: #dc2626;">📤 Überfällige Ausgehende Rechnungen (${overdueInvoices!.length})</h3>
            <table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Rechnungsnummer</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Kunde</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Betrag</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Fälligkeitsdatum</th>
              </tr>
          `;
          
          for (const invoice of overdueInvoices!) {
            emailContent += `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${invoice.invoice_no}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${invoice.customers?.name || 'Unbekannt'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${invoice.currency} ${invoice.total.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(invoice.due_date).toLocaleDateString('de-DE')}</td>
              </tr>
            `;
          }
          emailContent += '</table><br>';
        }

        if (hasIncomingOverdue) {
          emailContent += `
            <h3 style="color: #dc2626;">💳 Überfällige Eingehende Rechnungen (${overdueIncoming!.length})</h3>
            <table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Rechnungsnummer</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Lieferant</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Betrag</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Fälligkeitsdatum</th>
              </tr>
          `;
          
          for (const invoice of overdueIncoming!) {
            emailContent += `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${invoice.invoice_number || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${invoice.vendor_name || 'Unbekannt'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${invoice.currency} ${invoice.amount.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(invoice.due_date).toLocaleDateString('de-DE')}</td>
              </tr>
            `;
          }
          emailContent += '</table><br>';
        }

        if (hasUpcomingReminders) {
          emailContent += `
            <h3 style="color: #f59e0b;">⏰ Erinnerungen - Morgen fällige Rechnungen (${upcomingReminders!.length})</h3>
            <table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Rechnungsnummer</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Lieferant</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Betrag</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Fälligkeitsdatum</th>
              </tr>
          `;
          
          for (const invoice of upcomingReminders!) {
            emailContent += `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${invoice.invoice_number || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${invoice.vendor_name || 'Unbekannt'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${invoice.currency} ${invoice.amount.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(invoice.due_date).toLocaleDateString('de-DE')}</td>
              </tr>
            `;
          }
          emailContent += '</table><br>';
        }

        emailContent += `
          <p><em>Diese Benachrichtigung wurde automatisch generiert.</em></p>
        `;

        // Send email notification using user's own API key
        const userResend = new Resend(apiKey);
        
        const emailResponse = await userResend.emails.send({
          from: 'BillGen <noreply@billgen.com>',
          to: [userSettings.email],
          subject: 'Täglicher Rechnungsbericht - Überfällige Rechnungen',
          html: emailContent,
        });

        console.log(`Email sent successfully to ${userSettings.email}:`, emailResponse);

        // Update overdue outgoing invoices status to 'overdue' if not already
        if (overdueInvoices && overdueInvoices.length > 0) {
          const { error: updateOutgoingError } = await supabase
            .from('invoices')
            .update({ status: 'overdue' })
            .in('id', overdueInvoices.map(inv => inv.id))
            .eq('status', 'sent');

          if (updateOutgoingError) {
            console.error(`Error updating outgoing invoice status for user ${userSettings.email}:`, updateOutgoingError);
          }
        }

        processedUsers.push({
          email: userSettings.email,
          success: true,
          stats: {
            overdueOutgoing: overdueInvoices?.length || 0,
            overdueIncoming: overdueIncoming?.length || 0,
            upcomingReminders: upcomingReminders?.length || 0
          }
        });

      } catch (error) {
        console.error(`Error processing user ${userSettings.email}:`, error);
        processedUsers.push({
          email: userSettings.email,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedUsers.length} users`,
        results: processedUsers
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error in check-overdue-invoices function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);