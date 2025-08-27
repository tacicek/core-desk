import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvoiceReportRequest {
  to: string;
  period: string;
  invoicesCount: number;
  totalAmount: number;
  attachment: {
    filename: string;
    content: string; // base64 encoded Excel file
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, period, invoicesCount, totalAmount, attachment }: InvoiceReportRequest = await req.json();

    console.log(`Sending invoice report to ${to} for period ${period}`);

    // Convert base64 content to Uint8Array for attachment
    const attachmentBuffer = Uint8Array.from(atob(attachment.content), c => c.charCodeAt(0));

    const emailResponse = await resend.emails.send({
      from: "Rechnungsverwaltung <onboarding@resend.dev>",
      to: [to],
      subject: `Rechnungsübersicht ${period} - ${invoicesCount} Rechnungen`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            Rechnungsübersicht ${period}
          </h1>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #0066cc; margin-top: 0;">Zusammenfassung</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold;">Zeitraum:</td>
                <td style="padding: 8px;">${period}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Anzahl Rechnungen:</td>
                <td style="padding: 8px;">${invoicesCount}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Gesamtbetrag:</td>
                <td style="padding: 8px; font-weight: bold; color: #0066cc;">${totalAmount.toFixed(2)} CHF</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">📎 Anhang</h3>
            <p>Die detaillierte Rechnungsübersicht finden Sie in der angehängten Excel-Datei.</p>
            <p style="font-size: 14px; color: #666;">
              Die Excel-Datei enthält alle Rechnungsdaten einschließlich:
            </p>
            <ul style="color: #666; font-size: 14px;">
              <li>Firmenname und Rechnungsnummern</li>
              <li>Rechnungs- und Fälligkeitsdaten</li>
              <li>Beträge und Status</li>
              <li>Kategorien und KI-Analysedaten</li>
            </ul>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>Diese E-Mail wurde automatisch von Ihrem Rechnungsverwaltungssystem generiert.</p>
            <p>Exportiert am: ${new Date().toLocaleDateString('de-DE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: attachment.filename,
          content: attachmentBuffer,
        }
      ]
    });

    console.log("Invoice report email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      sentTo: to,
      period: period,
      invoicesCount: invoicesCount
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-report function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);