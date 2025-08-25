import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  try {
    // Hem GET hem POST destekleyelim
    let note = 'ok';
    if (event.httpMethod === 'GET') {
      note = event.queryStringParameters?.note || 'ok';
    } else if (event.httpMethod === 'POST') {
      note = (JSON.parse(event.body || '{}').note) || 'ok';
    } else {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE // sadece backend!
    );

    const { data, error } = await supabase
      .from('hello_events')
      .insert({ note })
      .select()
      .single();

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ ok:false, error: error.message }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok:true, inserted: data })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: e.message }) };
  }
};