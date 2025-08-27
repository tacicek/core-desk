import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, phone, subject, message }: ContactEmailRequest = await req.json();

    // Send notification email to CoreDesk
    const notificationEmail = await resend.emails.send({
      from: "CoreDesk Kontakt <noreply@coredesk.ch>",
      to: ["info@coredesk.ch"],
      subject: `Neue Kontaktanfrage: ${subject}`,
      html: `
        <h2>Neue Kontaktanfrage über CoreDesk Website</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Kontaktinformationen:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>E-Mail:</strong> ${email}</p>
          ${company ? `<p><strong>Unternehmen:</strong> ${company}</p>` : ''}
          ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
          <p><strong>Betreff:</strong> ${subject}</p>
        </div>
        <div style="margin: 20px 0;">
          <h3>Nachricht:</h3>
          <div style="background: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <p style="color: #666; font-size: 12px;">
          Gesendet über CoreDesk Kontaktformular am ${new Date().toLocaleString('de-DE')}
        </p>
      `,
    });

    // Send confirmation email to customer
    const confirmationEmail = await resend.emails.send({
      from: "CoreDesk <noreply@coredesk.ch>",
      to: [email],
      subject: "Ihre Anfrage bei CoreDesk wurde empfangen",
      html: `
        <h1>Vielen Dank für Ihre Nachricht, ${name}!</h1>
        <p>Wir haben Ihre Anfrage erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Ihre Anfrage im Überblick:</h3>
          <p><strong>Betreff:</strong> ${subject}</p>
          <p><strong>Nachricht:</strong></p>
          <div style="background: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>

        <h3>So können Sie uns auch erreichen:</h3>
        <ul>
          <li><strong>E-Mail:</strong> info@coredesk.ch</li>
          <li><strong>Telefon:</strong> +41 44 123 45 67</li>
          <li><strong>Öffnungszeiten:</strong> Mo-Fr: 08:00 - 18:00 Uhr</li>
        </ul>

        <p>Mit freundlichen Grüßen,<br>
        Ihr CoreDesk Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          CoreDesk AG, Bahnhofstrasse 42, 8001 Zürich, Schweiz<br>
          Diese E-Mail wurde automatisch generiert.
        </p>
      `,
    });

    console.log("Contact emails sent successfully:", {
      notification: notificationEmail,
      confirmation: confirmationEmail
    });

    return new Response(JSON.stringify({
      success: true,
      notificationId: notificationEmail.data?.id,
      confirmationId: confirmationEmail.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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