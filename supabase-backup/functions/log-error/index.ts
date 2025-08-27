import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  userId?: string | null;
  vendorId?: string | null;
  context?: Record<string, any>;
  type?: string;
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
    const errorReport: ErrorReport = await req.json()

    // Validate required fields
    if (!errorReport.errorId || !errorReport.message || !errorReport.timestamp) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: errorId, message, timestamp' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sanitize and prepare error log entry
    const errorLogEntry = {
      error_id: errorReport.errorId,
      message: errorReport.message.substring(0, 1000), // Limit message length
      stack: errorReport.stack?.substring(0, 5000), // Limit stack length
      component_stack: errorReport.componentStack?.substring(0, 5000),
      user_agent: errorReport.userAgent?.substring(0, 500),
      url: errorReport.url?.substring(0, 500),
      timestamp: errorReport.timestamp,
      user_id: errorReport.userId,
      vendor_id: errorReport.vendorId,
      context: errorReport.context || {},
      error_type: errorReport.type || 'frontend',
      severity: determineSeverity(errorReport),
      created_at: new Date().toISOString()
    }

    // Insert error log
    const { error: insertError } = await supabaseClient
      .from('error_logs')
      .insert([errorLogEntry])

    if (insertError) {
      console.error('Failed to insert error log:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to log error', 
          details: insertError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if this is a critical error that needs immediate attention
    const isCritical = checkIfCritical(errorReport)
    
    if (isCritical) {
      // Send notification to admin (could be email, Slack, etc.)
      await notifyAdminOfCriticalError(errorReport, supabaseClient)
    }

    // Log success
    console.log(`✅ Error logged successfully: ${errorReport.errorId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        errorId: errorReport.errorId,
        logged: true,
        critical: isCritical
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in log-error function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function determineSeverity(errorReport: ErrorReport): string {
  const message = errorReport.message.toLowerCase()
  const stack = (errorReport.stack || '').toLowerCase()
  
  // Critical errors
  if (
    message.includes('network') ||
    message.includes('supabase') ||
    message.includes('database') ||
    message.includes('auth') ||
    message.includes('payment') ||
    stack.includes('supabase') ||
    stack.includes('auth')
  ) {
    return 'critical'
  }
  
  // High priority errors
  if (
    message.includes('chunk') ||
    message.includes('load') ||
    message.includes('fetch') ||
    message.includes('api') ||
    stack.includes('api')
  ) {
    return 'high'
  }
  
  // Medium priority errors
  if (
    message.includes('validation') ||
    message.includes('form') ||
    message.includes('input')
  ) {
    return 'medium'
  }
  
  // Default to low priority
  return 'low'
}

function checkIfCritical(errorReport: ErrorReport): boolean {
  const severity = determineSeverity(errorReport)
  const message = errorReport.message.toLowerCase()
  
  // Critical conditions
  return (
    severity === 'critical' ||
    message.includes('unable to') ||
    message.includes('failed to') ||
    message.includes('cannot') ||
    (errorReport.userId && message.includes('auth')) ||
    (errorReport.vendorId && message.includes('data'))
  )
}

async function notifyAdminOfCriticalError(
  errorReport: ErrorReport, 
  supabaseClient: any
): Promise<void> {
  try {
    // Create a critical error notification
    const notification = {
      type: 'critical_error',
      title: 'Critical System Error',
      message: `Critical error occurred: ${errorReport.message}`,
      priority: 'critical',
      metadata: {
        errorId: errorReport.errorId,
        userId: errorReport.userId,
        vendorId: errorReport.vendorId,
        url: errorReport.url,
        userAgent: errorReport.userAgent
      },
      created_at: new Date().toISOString()
    }

    // Insert notification for all super admins
    const { data: superAdmins } = await supabaseClient
      .from('admin_users')
      .select('user_id')
      .eq('is_super_admin', true)

    if (superAdmins && superAdmins.length > 0) {
      const notifications = superAdmins.map((admin: any) => ({
        ...notification,
        user_id: admin.user_id
      }))

      await supabaseClient
        .from('admin_notifications')
        .insert(notifications)
    }

    console.log(`🚨 Critical error notification sent for: ${errorReport.errorId}`)
  } catch (error) {
    console.error('Failed to notify admin of critical error:', error)
  }
}