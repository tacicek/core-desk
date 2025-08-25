import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('=== N8N WEBHOOK FUNCTION STARTED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('N8N Webhook function started - processing request');
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, vendor_id, n8n_webhook_url, user_id, file } = requestBody;
    
    console.log('Request data:', { action, vendor_id, user_id, n8n_webhook_url, hasFile: !!file });

    // Handle file upload to n8n
    if (action === 'upload_invoice') {
      console.log('=== UPLOADING INVOICE TO N8N ===');
      
      if (!n8n_webhook_url) {
        throw new Error('N8N webhook URL is required for file upload');
      }
      
      if (!file) {
        throw new Error('File data is required');
      }

      console.log('Sending file to n8n:', { filename: file.name, size: file.size, type: file.type });
      
      try {
        const n8nResponse = await fetch(n8n_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'process_invoice',
            file: file,
            vendor_id,
            timestamp: new Date().toISOString()
          }),
        });

        console.log('N8N response status:', n8nResponse.status);
        
        if (!n8nResponse.ok) {
          throw new Error(`N8N webhook failed with status: ${n8nResponse.status}`);
        }

        const n8nResult = await n8nResponse.text();
        console.log('N8N response:', n8nResult);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'File sent to n8n successfully',
            n8n_response: n8nResult
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      } catch (n8nError) {
        console.error('Error sending to n8n:', n8nError);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to send file to n8n',
            details: n8nError.message
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // Handle FormData file upload to n8n
    if (action === 'upload_invoice_formdata') {
      console.log('=== UPLOADING INVOICE AS FORMDATA TO N8N ===');
      
      if (!n8n_webhook_url) {
        throw new Error('N8N webhook URL is required for file upload');
      }
      
      if (!file || !file.content) {
        throw new Error('File data is required');
      }

      console.log('Preparing FormData for n8n:', { filename: file.name, size: file.size, type: file.type });
      
      try {
        // Convert base64 back to blob for FormData
        const binaryString = atob(file.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: file.type });
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', blob, file.name);
        formData.append('vendor_id', vendor_id || '');
        formData.append('timestamp', new Date().toISOString());

        console.log('Sending FormData to n8n webhook...');

        const n8nResponse = await fetch(n8n_webhook_url, {
          method: 'POST',
          body: formData
        });

        console.log('N8N FormData response status:', n8nResponse.status);
        
        if (!n8nResponse.ok) {
          const errorText = await n8nResponse.text();
          console.error('N8N webhook error response:', errorText);
          throw new Error(`N8N webhook failed with status: ${n8nResponse.status} - ${errorText}`);
        }

        const n8nResult = await n8nResponse.text();
        console.log('N8N FormData response:', n8nResult);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'File sent to n8n successfully as FormData',
            n8n_response: n8nResult
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      } catch (n8nError) {
        console.error('Error sending FormData to n8n:', n8nError);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to send file to n8n',
            details: n8nError.message
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    if (action === 'send_invoices') {
      // Get all incoming invoices for the vendor
      const { data: invoices, error } = await supabase
        .from('incoming_invoices')
        .select('*')
        .eq('vendor_id', vendor_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      console.log(`Found ${invoices?.length || 0} incoming invoices for vendor ${vendor_id}`);

      // If no webhook URL provided, return the data
      if (!n8n_webhook_url) {
        return new Response(
          JSON.stringify({
            success: true,
            data: invoices || [],
            count: invoices?.length || 0,
            message: 'Incoming invoices data retrieved successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // Send data to n8n webhook
      try {
        console.log(`Sending ${invoices?.length || 0} invoices to n8n webhook: ${n8n_webhook_url}`);
        
        const webhookResponse = await fetch(n8n_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendor_id,
            timestamp: new Date().toISOString(),
            invoices: invoices || [],
            count: invoices?.length || 0,
            source: 'supabase_incoming_invoices'
          }),
        });

        console.log('N8N webhook response status:', webhookResponse.status);

        return new Response(
          JSON.stringify({
            success: true,
            data: invoices || [],
            count: invoices?.length || 0,
            webhook_sent: true,
            webhook_status: webhookResponse.status,
            message: 'Data sent to n8n webhook successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      } catch (webhookError) {
        console.error('Error sending to n8n webhook:', webhookError);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to send data to n8n webhook',
            webhook_error: webhookError.message,
            data: invoices || [],
            count: invoices?.length || 0
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // Handle creating sample data
    if (action === 'create_sample_data') {
      console.log('=== CREATING SAMPLE INCOMING INVOICES DATA ===');
      console.log('Vendor ID:', vendor_id);
      
      // Use Service Role - no user authentication needed
      console.log('Using service role for data insertion');
      
      // Get the user who is making the request (we'll use the current session)
      const authHeader = req.headers.get('Authorization');
      console.log('Auth header present:', !!authHeader);
      
      // For sample data, we'll use the vendor_id as created_by since this is service role
      const created_by_id = vendor_id; // Temporary workaround
      
      const sampleInvoices = [
        {
          vendor_id,
          vendor_name: 'Büro Express AG',
          invoice_number: 'RE-2024-0249',
          invoice_date: '2024-09-23',
          due_date: '2024-10-23',
          amount: 194.40,
          currency: 'CHF',
          description: 'Büromaterial und Druckerpapier für Büroausstattung',
          category: 'Büromaterial',
          status: 'pending',
          ai_confidence: 0.95,
          needs_review: false,
          original_filename: 'rechnung_249.pdf',
          created_by: created_by_id  // Use vendor_id as created_by for now
        },
        {
          vendor_id,
          vendor_name: 'IT Solutions GmbH',
          invoice_number: 'INV-2024-1156',
          invoice_date: '2024-09-20',
          due_date: '2024-10-20',
          amount: 850.00,
          currency: 'CHF',
          description: 'Software-Lizenz und IT-Support für 3 Monate',
          category: 'IT-Dienstleistungen',
          status: 'pending',
          ai_confidence: 0.92,
          needs_review: false,
          original_filename: 'it_rechnung_1156.pdf',
          created_by: created_by_id
        },
        {
          vendor_id,
          vendor_name: 'Power Electric AG',
          invoice_number: 'EL-2024-0789',
          invoice_date: '2024-09-18',
          due_date: '2024-10-18',
          amount: 320.50,
          currency: 'CHF',
          description: 'Elektrische Installationsarbeiten im Büro',
          category: 'Handwerk',
          status: 'paid',
          ai_confidence: 0.88,
          needs_review: true,
          original_filename: 'elektro_789.pdf',
          created_by: created_by_id
        }
      ];
      
      console.log('Sample invoices to insert:', JSON.stringify(sampleInvoices, null, 2));

      console.log('Attempting to insert sample invoices...');
      const { data: insertedInvoices, error: insertError } = await supabase
        .from('incoming_invoices')
        .insert(sampleInvoices)
        .select();

      if (insertError) {
        console.error('=== INSERT ERROR ===');
        console.error('Error inserting sample invoices:', insertError);
        console.error('Error details:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }

      console.log(`Successfully created ${insertedInvoices?.length || 0} sample invoices`);

      return new Response(
        JSON.stringify({
          success: true,
          data: insertedInvoices || [],
          count: insertedInvoices?.length || 0,
          message: 'Sample incoming invoices created successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid action. Use "send_invoices" or "create_sample_data"'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error) {
    console.error('Error in n8n-webhook function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});