import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  notification_id: string
  delivery_methods: string[]
  email_template?: string
  webhook_url?: string
}

interface NotificationData {
  id: string
  vendor_id: string
  user_id: string | null
  type: string
  priority: string
  title: string
  message: string
  metadata: Record<string, any>
  action_url?: string
  action_label?: string
}

interface UserProfile {
  email: string
  full_name?: string
}

interface VendorData {
  name: string
  email: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { notification_id, delivery_methods, email_template, webhook_url }: NotificationPayload = await req.json()

    if (!notification_id || !delivery_methods || delivery_methods.length === 0) {
      return new Response(
        JSON.stringify({ error: 'notification_id and delivery_methods are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch notification data
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single()

    if (notificationError || !notification) {
      return new Response(
        JSON.stringify({ error: 'Notification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const notificationData = notification as NotificationData
    const results: Record<string, { success: boolean; message: string; attempts: number }> = {}

    // Process each delivery method
    for (const method of delivery_methods) {
      const deliveryResult = await processDeliveryMethod(
        supabaseClient,
        notificationData,
        method,
        email_template,
        webhook_url
      )
      
      results[method] = deliveryResult

      // Log delivery attempt
      await supabaseClient
        .from('notification_delivery_log')
        .insert({
          notification_id: notification_id,
          delivery_method: method,
          status: deliveryResult.success ? 'delivered' : 'failed',
          error_message: deliveryResult.success ? null : deliveryResult.message,
          attempts: deliveryResult.attempts,
          delivered_at: deliveryResult.success ? new Date().toISOString() : null
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification_id,
        delivery_results: results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in notification delivery:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processDeliveryMethod(
  supabaseClient: any,
  notification: NotificationData,
  method: string,
  emailTemplate?: string,
  webhookUrl?: string
): Promise<{ success: boolean; message: string; attempts: number }> {
  
  switch (method) {
    case 'email':
      return await sendEmailNotification(supabaseClient, notification, emailTemplate)
    
    case 'webhook':
      return await sendWebhookNotification(notification, webhookUrl)
    
    case 'in_app':
      // In-app notifications are handled via real-time subscriptions
      return { success: true, message: 'In-app notification sent via real-time channel', attempts: 1 }
    
    default:
      return { success: false, message: `Unsupported delivery method: ${method}`, attempts: 0 }
  }
}

async function sendEmailNotification(
  supabaseClient: any,
  notification: NotificationData,
  customTemplate?: string
): Promise<{ success: boolean; message: string; attempts: number }> {
  
  try {
    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return { success: false, message: 'Resend API key not configured', attempts: 0 }
    }

    // Fetch user email
    let recipientEmail: string
    let recipientName: string = 'User'

    if (notification.user_id) {
      // Get user email from auth.users
      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(notification.user_id)
      
      if (userError || !userData.user?.email) {
        return { success: false, message: 'Could not fetch user email', attempts: 1 }
      }
      
      recipientEmail = userData.user.email
      recipientName = userData.user.user_metadata?.full_name || userData.user.email.split('@')[0]
    } else {
      // Fallback to vendor email
      const { data: vendorData, error: vendorError } = await supabaseClient
        .from('vendors')
        .select('email, name')
        .eq('id', notification.vendor_id)
        .single()

      if (vendorError || !vendorData?.email) {
        return { success: false, message: 'Could not fetch vendor email', attempts: 1 }
      }

      recipientEmail = vendorData.email
      recipientName = vendorData.name || 'Business Owner'
    }

    // Build email content
    const emailSubject = `[Invoice System] ${notification.title}`
    
    const emailHtml = customTemplate || buildDefaultEmailTemplate(notification, recipientName)

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Invoice System <notifications@your-domain.com>',
        to: [recipientEmail],
        subject: emailSubject,
        html: emailHtml,
        tags: [
          { name: 'notification_type', value: notification.type },
          { name: 'priority', value: notification.priority },
          { name: 'vendor_id', value: notification.vendor_id }
        ]
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      return { 
        success: false, 
        message: `Email delivery failed: ${errorData}`, 
        attempts: 1 
      }
    }

    const emailResult = await emailResponse.json()
    
    return { 
      success: true, 
      message: `Email sent successfully (ID: ${emailResult.id})`, 
      attempts: 1 
    }

  } catch (error) {
    return { 
      success: false, 
      message: `Email delivery error: ${error.message}`, 
      attempts: 1 
    }
  }
}

async function sendWebhookNotification(
  notification: NotificationData,
  webhookUrl?: string
): Promise<{ success: boolean; message: string; attempts: number }> {
  
  if (!webhookUrl) {
    return { success: false, message: 'Webhook URL not provided', attempts: 0 }
  }

  try {
    const webhookPayload = {
      event: 'notification',
      data: {
        id: notification.id,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
        action_url: notification.action_url,
        vendor_id: notification.vendor_id,
        timestamp: new Date().toISOString()
      }
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Invoice-System-Notifications/1.0',
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!webhookResponse.ok) {
      return { 
        success: false, 
        message: `Webhook delivery failed: ${webhookResponse.status} ${webhookResponse.statusText}`, 
        attempts: 1 
      }
    }

    return { 
      success: true, 
      message: 'Webhook delivered successfully', 
      attempts: 1 
    }

  } catch (error) {
    return { 
      success: false, 
      message: `Webhook delivery error: ${error.message}`, 
      attempts: 1 
    }
  }
}

function buildDefaultEmailTemplate(notification: NotificationData, recipientName: string): string {
  const actionButton = notification.action_url ? `
    <tr>
      <td style="padding: 20px 0;">
        <a href="${notification.action_url}" 
           style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          ${notification.action_label || 'View Details'}
        </a>
      </td>
    </tr>
  ` : ''

  const priorityColor = {
    'critical': '#ef4444',
    'high': '#f97316',
    'medium': '#3b82f6',
    'low': '#10b981'
  }[notification.priority] || '#3b82f6'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white;">
        <tr>
          <td style="padding: 40px 40px 20px;">
            <div style="border-left: 4px solid ${priorityColor}; padding-left: 16px; margin-bottom: 24px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">
                ${notification.title}
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                ${notification.priority} Priority
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 24px;">
              Hello ${recipientName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 6px;">
              ${notification.message}
            </p>
            
            ${actionButton}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              This notification was sent by your Invoice Management System.<br>
              If you no longer wish to receive these notifications, you can 
              <a href="#" style="color: #3b82f6;">update your preferences</a>.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}