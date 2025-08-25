import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceData {
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  confidence: number;
  needs_review: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Handle both file upload and base64 data
    let file: File | null = null;
    let imageBase64: string | null = null;
    let vendorId: string;
    let userId: string;

    // Check if request is FormData (for file uploads) or JSON (for base64)
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      file = formData.get('file') as File;
      vendorId = formData.get('vendor_id') as string;
      userId = formData.get('user_id') as string;

      if (!file || !vendorId || !userId) {
        return new Response(
          JSON.stringify({ error: 'File, vendor_id and user_id are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

      // Check if file is supported - fix the recursion issue
      if (!file.type) {
        return new Response(
          JSON.stringify({ error: 'File type could not be determined' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      
      if (!isImage && !isPDF) {
        return new Response(
          JSON.stringify({ error: 'Only image and PDF files are supported' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Convert file to base64
      try {
        const fileBuffer = await file.arrayBuffer();
        imageBase64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
      } catch (conversionError) {
        console.error('File conversion error:', conversionError);
        return new Response(
          JSON.stringify({ error: 'Failed to process file' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Handle JSON request (existing functionality)
      const body = await req.json();
      imageBase64 = body.image_base64;
      vendorId = body.vendor_id;
      userId = body.user_id;
      
      if (!imageBase64 || !vendorId || !userId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Processing invoice with OpenAI API...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store file in Supabase Storage if it's a file upload
    let fileUrl: string | null = null;
    if (file) {
      try {
        const fileName = `${crypto.randomUUID()}-${file.name}`;
        const fileBuffer = await file.arrayBuffer();
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoice-uploads')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          return new Response(
            JSON.stringify({ error: 'Failed to upload file' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: { publicUrl } } = supabase.storage
          .from('invoice-uploads')
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
        console.log('File uploaded successfully:', uploadData.path);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload file' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Process with OpenAI based on file type
    let invoiceData: InvoiceData;
    
    if (file?.type === 'application/pdf') {
      // For PDF, convert to text-based analysis since PDFs can't be processed as images
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',  // Use gpt-4o for better PDF text analysis
          max_tokens: 500,
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content: `You are an expert invoice data extractor. Analyze the provided PDF content and extract ONLY the actual invoice information. 

CRITICAL: Do NOT return placeholder values like "YYYY-MM-DD" or empty strings if you cannot find the data.

IMPORTANT RULES:
- Extract REAL values from the document text
- For dates, use YYYY-MM-DD format only if you find actual dates
- For amounts, extract the numerical value 
- If you cannot find a field, leave it empty but set needs_review to true
- Look for: company name, invoice/rechnung number, dates, total amount
- Common German terms: Rechnung (invoice), Firma/Unternehmen (company), Betrag (amount), Datum (date), Fällig (due)

Return ONLY this JSON format:
{"vendor_name":"","invoice_number":"","invoice_date":"","due_date":"","amount":0,"currency":"CHF","description":"","category":"utilities|office|travel|food|transport|healthcare|insurance|rent|other","confidence":0.8,"needs_review":true}`
            },
            {
              role: 'user',
              content: `Analyze this PDF content and extract real invoice data. Look for actual company names, invoice numbers, dates and amounts. PDF content (base64 decoded sample): ${imageBase64 ? atob(imageBase64.substring(0, 1000)) : 'No content'}`
            }
          ]
        }),
      });

      const openaiResult = await openaiResponse.json();
      console.log('OpenAI PDF response:', JSON.stringify(openaiResult, null, 2));

      if (openaiResult.error) {
        console.error('OpenAI API error:', openaiResult.error);
        throw new Error(`OpenAI API error: ${openaiResult.error.message}`);
      }

      if (!openaiResult.choices?.[0]?.message?.content) {
        throw new Error('No response from OpenAI API');
      }

      try {
        const content = openaiResult.choices[0].message.content.trim();
        console.log('OpenAI response content:', content);
        
        // Extract JSON from response (handle markdown formatting)
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        invoiceData = JSON.parse(jsonStr);
        
        // Validate that we got real data, not placeholders
        if (invoiceData.invoice_date === 'YYYY-MM-DD' || invoiceData.due_date === 'YYYY-MM-DD') {
          invoiceData.invoice_date = '';
          invoiceData.due_date = '';
          invoiceData.needs_review = true;
          invoiceData.confidence = 0.3;
        }
        
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        throw new Error('Failed to parse extracted PDF invoice data');
      }
    } else {
      // For images, use faster GPT-4o-mini instead of GPT-4o for speed
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 400,
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content: `Extract invoice data and return ONLY JSON:
{"vendor_name":"","invoice_number":"","invoice_date":"YYYY-MM-DD","due_date":"YYYY-MM-DD","amount":0,"currency":"CHF","description":"","category":"utilities|office|travel|food|transport|healthcare|insurance|rent|other","confidence":0.8,"needs_review":true}`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract invoice data from this image:'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file?.type || 'image/jpeg'};base64,${imageBase64}`
                  }
                }
              ]
            }
          ]
        }),
      });

      const openaiResult = await openaiResponse.json();
      console.log('OpenAI image response time:', Date.now());

      if (!openaiResult.choices?.[0]?.message?.content) {
        throw new Error('Failed to extract invoice data from image');
      }

      try {
        const content = openaiResult.choices[0].message.content.trim();
        // Extract JSON from response (handle markdown formatting)
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        invoiceData = JSON.parse(jsonStr);
      } catch {
        throw new Error('Failed to parse extracted invoice data');
      }
    }

    console.log('Extracted invoice data:', invoiceData);

    // Save to database
    const { data: savedInvoice, error: dbError } = await supabase
      .from('incoming_invoices')
      .insert({
        vendor_id: vendorId,
        created_by: userId,
        vendor_name: invoiceData.vendor_name,
        invoice_number: invoiceData.invoice_number,
        invoice_date: invoiceData.invoice_date && invoiceData.invoice_date !== 'YYYY-MM-DD' && !isNaN(Date.parse(invoiceData.invoice_date)) ? invoiceData.invoice_date : null,
        due_date: invoiceData.due_date && invoiceData.due_date !== 'YYYY-MM-DD' && !isNaN(Date.parse(invoiceData.due_date)) ? invoiceData.due_date : null,
        amount: invoiceData.amount,
        currency: invoiceData.currency || 'CHF',
        description: invoiceData.description,
        category: invoiceData.category,
        ai_confidence: invoiceData.confidence,
        needs_review: invoiceData.needs_review,
        image_url: fileUrl, // Store file URL if uploaded
        original_filename: file?.name || 'scanned-invoice',
        reminder_date: invoiceData.due_date && invoiceData.due_date !== 'YYYY-MM-DD' && !isNaN(Date.parse(invoiceData.due_date)) ? new Date(Date.parse(invoiceData.due_date) - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save invoice data');
    }

    console.log('Invoice saved successfully:', savedInvoice);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice: savedInvoice,
        extracted_data: invoiceData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in scan-invoice function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process invoice',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});