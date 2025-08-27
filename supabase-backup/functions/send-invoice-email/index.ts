import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import jsPDF from "https://esm.sh/jspdf@2.5.1";

// Force restart of edge function to pick up new secrets
const resendApiKey = Deno.env.get("RESEND_API_KEY");
console.log('=== CHECKING RESEND API KEY ===');
console.log('Resend API Key available:', !!resendApiKey);
console.log('API Key length:', resendApiKey?.length || 0);
console.log('All environment variables:', Object.keys(Deno.env.toObject()));

if (!resendApiKey) {
  console.error('RESEND_API_KEY environment variable is not set');
  throw new Error('RESEND_API_KEY environment variable is not set - Function will not work without this secret');
}

const resend = new Resend(resendApiKey);
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'invoice' | 'offer';
  itemId: string;
  to: string;
  subject?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Email Request Started ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { type, itemId, to, subject, message }: EmailRequest = requestBody;
    
    console.log(`Sending ${type} email for ID: ${itemId} to: ${to}`);

    let pdfData: Uint8Array;
    let filename: string;
    let emailSubject: string;
    let emailBody: string;
    let companySettings: any;

    if (type === 'invoice') {
      // Fetch invoice data
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .eq('id', itemId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error(`Invoice not found: ${invoiceError?.message}`);
      }

      // Fetch customer data
      let customerAddress = { street: '', number: '', postalCode: '', city: '' };
      if (invoice.customer_name) {
        const { data: customers } = await supabase
          .from('customers')
          .select('address')
          .eq('name', invoice.customer_name)
          .limit(1);
        
        if (customers && customers.length > 0 && customers[0].address) {
          const addressParts = customers[0].address.split(', ');
          if (addressParts.length >= 2) {
            const streetPart = addressParts[0] || '';
            const cityPart = addressParts[addressParts.length - 1] || '';
            const postalMatch = cityPart.match(/^(\d{4})\s+(.+)$/);
            
            customerAddress = {
              street: streetPart,
              number: '',
              postalCode: postalMatch ? postalMatch[1] : '',
              city: postalMatch ? postalMatch[2] : cityPart
            };
          }
        }
      }

      // Fetch company settings
      const { data: invoiceCompanySettings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('vendor_id', invoice.vendor_id)
        .single();

      // Set companySettings for later use
      companySettings = invoiceCompanySettings;

      // Generate PDF
      pdfData = generateInvoicePDF(invoice, invoice.invoice_items || [], customerAddress, companySettings);
      filename = `Rechnung_${invoice.invoice_no}.pdf`;
      emailSubject = subject || `Rechnung ${invoice.invoice_no} von ${companySettings?.name || 'Ihr Unternehmen'}`;
      emailBody = message || `Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung ${invoice.invoice_no} vom ${new Date(invoice.issue_date).toLocaleDateString('de-CH')}.

Betrag: CHF ${invoice.total.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
Fälligkeitsdatum: ${new Date(invoice.due_date).toLocaleDateString('de-CH')}

Vielen Dank für Ihr Vertrauen.

Mit freundlichen Grüssen
${companySettings?.name || 'Ihr Unternehmen'}`;

    } else if (type === 'offer') {
      // Fetch offer data
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select(`
          *,
          offer_items (*)
        `)
        .eq('id', itemId)
        .single();

      if (offerError || !offer) {
        throw new Error(`Offer not found: ${offerError?.message}`);
      }

      // Fetch customer data
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', offer.customer_id)
        .single();

      // Fetch company settings
      const { data: offerCompanySettings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('vendor_id', offer.vendor_id)
        .single();

      // Generate PDF
      pdfData = generateOfferPDF(offer, offer.offer_items || [], customer, offerCompanySettings);
      filename = `Offerte_${offer.offer_no}.pdf`;
      emailSubject = subject || `Offerte ${offer.offer_no} von ${offerCompanySettings?.name || 'Ihr Unternehmen'}`;
      emailBody = message || `Sehr geehrte Damen und Herren,

anbei erhalten Sie unsere Offerte ${offer.offer_no} vom ${new Date(offer.issue_date).toLocaleDateString('de-CH')}.

Gültig bis: ${offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('de-CH') : 'N/A'}
Betrag: CHF ${offer.total.toLocaleString('de-CH', { minimumFractionDigits: 2 })}

Wir freuen uns auf Ihre Rückmeldung.

Mit freundlichen Grüssen
${offerCompanySettings?.name || 'Ihr Unternehmen'}`;

      // Set companySettings for later use
      companySettings = offerCompanySettings;

    } else {
      throw new Error('Invalid type. Must be "invoice" or "offer"');
    }

    // Send email with PDF attachment
    const senderEmail = companySettings?.sender_email || companySettings?.email || "onboarding@resend.dev";
    const senderName = companySettings?.sender_name || companySettings?.name || "CoreDesk";
    
    console.log('=== EMAIL SENDING DEBUG ===');
    console.log('Company settings:', { 
      sender_email: companySettings?.sender_email, 
      email: companySettings?.email, 
      name: companySettings?.name 
    });
    console.log('Final sender email:', senderEmail);
    console.log('Final sender name:', senderName);
    console.log('Recipient email:', to);
    
    const emailResponse = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [to],
      subject: emailSubject,
      html: emailBody.replace(/\n/g, '<br>'),
      attachments: [
        {
          filename: filename,
          content: pdfData,
        }
      ]
    });

    console.log(`${type} email sent successfully:`, emailResponse);
    console.log('Email response data:', JSON.stringify(emailResponse.data, null, 2));
    console.log('Email response error:', emailResponse.error);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      filename: filename
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('=== Email Error ===');
    console.error('Error in send-invoice-email function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// PDF Generation Functions
function generateInvoicePDF(invoice: any, items: any[], customerAddress: any, companySettings: any): Uint8Array {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.text(companySettings?.name || 'Ihr Unternehmen', 20, 30);
  
  // Invoice title
  doc.setFontSize(16);
  doc.text('RECHNUNG', 20, 50);
  
  // Invoice details
  doc.setFontSize(12);
  doc.text(`Rechnungsnummer: ${invoice.invoice_no}`, 20, 70);
  doc.text(`Datum: ${new Date(invoice.issue_date).toLocaleDateString('de-CH')}`, 20, 80);
  doc.text(`Fällig: ${new Date(invoice.due_date).toLocaleDateString('de-CH')}`, 20, 90);
  
  // Customer details
  doc.text('Rechnungsempfänger:', 120, 70);
  doc.text(invoice.customer_name || '', 120, 80);
  if (customerAddress.street) {
    doc.text(customerAddress.street, 120, 90);
  }
  if (customerAddress.postalCode && customerAddress.city) {
    doc.text(`${customerAddress.postalCode} ${customerAddress.city}`, 120, 100);
  }
  
  // Items table header
  let yPos = 130;
  doc.text('Beschreibung', 20, yPos);
  doc.text('Menge', 120, yPos);
  doc.text('Preis', 150, yPos);
  doc.text('Total', 180, yPos);
  
  // Items
  yPos += 10;
  items.forEach((item: any) => {
    doc.text(item.description, 20, yPos);
    doc.text(item.qty.toString(), 120, yPos);
    doc.text(`CHF ${item.unit_price.toFixed(2)}`, 150, yPos);
    doc.text(`CHF ${item.line_total.toFixed(2)}`, 180, yPos);
    yPos += 10;
  });
  
  // Totals
  yPos += 10;
  doc.text(`Subtotal: CHF ${invoice.subtotal.toFixed(2)}`, 150, yPos);
  yPos += 10;
  doc.text(`MwSt: CHF ${invoice.tax_total.toFixed(2)}`, 150, yPos);
  yPos += 10;
  doc.setFontSize(14);
  doc.text(`TOTAL: CHF ${invoice.total.toFixed(2)}`, 150, yPos);
  
  return new Uint8Array(doc.output('arraybuffer'));
}

function generateOfferPDF(offer: any, items: any[], customer: any, companySettings: any): Uint8Array {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.text(companySettings?.name || 'Ihr Unternehmen', 20, 30);
  
  // Offer title
  doc.setFontSize(16);
  doc.text('OFFERTE', 20, 50);
  
  // Offer details
  doc.setFontSize(12);
  doc.text(`Offerten-Nr: ${offer.offer_no}`, 20, 70);
  doc.text(`Datum: ${new Date(offer.issue_date).toLocaleDateString('de-CH')}`, 20, 80);
  if (offer.valid_until) {
    doc.text(`Gültig bis: ${new Date(offer.valid_until).toLocaleDateString('de-CH')}`, 20, 90);
  }
  
  // Customer details
  doc.text('Kunde:', 120, 70);
  doc.text(customer?.name || '', 120, 80);
  if (customer?.address) {
    const addressLines = customer.address.split(', ');
    let lineY = 90;
    addressLines.forEach((line: string) => {
      doc.text(line, 120, lineY);
      lineY += 10;
    });
  }
  
  // Items table header
  let yPos = 130;
  doc.text('Beschreibung', 20, yPos);
  doc.text('Menge', 120, yPos);
  doc.text('Preis', 150, yPos);
  doc.text('Total', 180, yPos);
  
  // Items
  yPos += 10;
  items.forEach((item: any) => {
    doc.text(item.description, 20, yPos);
    doc.text(item.qty.toString(), 120, yPos);
    doc.text(`CHF ${item.unit_price.toFixed(2)}`, 150, yPos);
    doc.text(`CHF ${item.line_total.toFixed(2)}`, 180, yPos);
    yPos += 10;
  });
  
  // Totals
  yPos += 10;
  doc.text(`Subtotal: CHF ${offer.subtotal.toFixed(2)}`, 150, yPos);
  yPos += 10;
  doc.text(`MwSt: CHF ${offer.tax_total.toFixed(2)}`, 150, yPos);
  yPos += 10;
  doc.setFontSize(14);
  doc.text(`TOTAL: CHF ${offer.total.toFixed(2)}`, 150, yPos);
  
  return new Uint8Array(doc.output('arraybuffer'));
}

serve(handler);