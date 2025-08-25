import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem } from '@/types';

/**
 * Supabase-based invoice storage functions
 * Replaces localStorage-based invoice storage for proper integration with revenue system
 */

// Get current vendor ID from vendor context
async function getCurrentVendorId(): Promise<string> {
  console.log('Getting current vendor ID...');
  
  const { data: user, error: userError } = await supabase.auth.getUser();
  console.log('Current user:', user.user?.id, 'Error:', userError);
  
  if (!user.user?.id) {
    throw new Error('User not authenticated');
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('vendor_id')
    .eq('user_id', user.user.id)
    .single();
  
  console.log('Profile query result:', profile, 'Error:', profileError);
  
  if (!profile?.vendor_id) {
    throw new Error('No vendor found for current user');
  }
  
  console.log('Found vendor ID:', profile.vendor_id);
  return profile.vendor_id;
}

export const invoiceStorage = {
  getAll: async (): Promise<Invoice[]> => {
    console.log('Loading invoices from Supabase');
    
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .order('issue_date', { ascending: false });

    if (invoicesError) {
      console.error('Error loading invoices:', invoicesError);
      throw new Error('Failed to load invoices');
    }

    // Transform Supabase data to match our Invoice type
    return (invoices || []).map(transformSupabaseInvoice);
  },

  add: async (invoice: Invoice): Promise<void> => {
    console.log('Adding invoice to Supabase:', invoice.number);
    
    // Get user info first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }
    console.log('Authenticated user:', user.id);

    // Get vendor ID
    const vendorId = await getCurrentVendorId();
    console.log('Using vendor ID:', vendorId);

    // Prepare invoice data (let database auto-generate ID)
    const invoiceData = {
      invoice_no: invoice.number,
      customer_name: invoice.customerName,
      customer_email: invoice.customerEmail,
      vendor_id: vendorId,
      created_by: user.id,
      issue_date: invoice.date,
      due_date: invoice.dueDate,
      subtotal: invoice.subtotal,
      tax_total: invoice.taxTotal,
      total: invoice.total,
      status: invoice.status,
      notes: invoice.notes || '',
      currency: 'CHF'
    };

    console.log('Invoice data to insert:', invoiceData);

    // Insert invoice
    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select('id')
      .single();

    if (invoiceError) {
      console.error('Invoice insertion error:', invoiceError);
      throw new Error(`Invoice creation failed: ${invoiceError.message}`);
    }

    console.log('Invoice created with ID:', newInvoice.id);

    // Add items if any
    if (invoice.items?.length > 0) {
      console.log('Adding', invoice.items.length, 'items...');
      
      const itemsData = invoice.items.map(item => ({
        invoice_id: newInvoice.id,
        created_by: user.id,
        description: item.description,
        qty: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate || 0,
        line_total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsData);

      if (itemsError) {
        console.error('Items insertion error:', itemsError);
        throw new Error(`Items creation failed: ${itemsError.message}`);
      }

      console.log('Items added successfully');
    }

    console.log('Invoice creation completed successfully');
  },

  update: async (id: string, updatedInvoice: Partial<Invoice>): Promise<void> => {
    console.log('Updating invoice in Supabase:', id);
    
    const updateData: any = {};
    
    if (updatedInvoice.number) updateData.invoice_no = updatedInvoice.number;
    if (updatedInvoice.customerName) updateData.customer_name = updatedInvoice.customerName;
    if (updatedInvoice.customerEmail) updateData.customer_email = updatedInvoice.customerEmail;
    if (updatedInvoice.date) updateData.issue_date = updatedInvoice.date;
    if (updatedInvoice.dueDate) updateData.due_date = updatedInvoice.dueDate;
    if (updatedInvoice.subtotal !== undefined) updateData.subtotal = updatedInvoice.subtotal;
    if (updatedInvoice.taxTotal !== undefined) updateData.tax_total = updatedInvoice.taxTotal;
    if (updatedInvoice.total !== undefined) updateData.total = updatedInvoice.total;
    if (updatedInvoice.status) updateData.status = updatedInvoice.status;
    if (updatedInvoice.notes !== undefined) updateData.notes = updatedInvoice.notes;

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating invoice:', error);
      throw new Error('Failed to update invoice');
    }

    // If items are being updated, handle them separately
    if (updatedInvoice.items) {
      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      // Add new items
      if (updatedInvoice.items.length > 0) {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        
        const itemsToInsert = updatedInvoice.items.map(item => ({
          invoice_id: id,
          created_by: userId!,
          description: item.description,
          qty: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          line_total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error updating invoice items:', itemsError);
          throw new Error('Failed to update invoice items');
        }
      }
    }
  },

  delete: async (id: string): Promise<void> => {
    console.log('Deleting invoice from Supabase:', id);
    
    // Items will be deleted automatically due to foreign key constraint
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invoice:', error);
      throw new Error('Failed to delete invoice');
    }
  },

  getById: async (id: string): Promise<Invoice | undefined> => {
    console.log('Loading invoice by ID from Supabase:', id);
    
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error loading invoice by ID:', error);
      throw new Error('Failed to load invoice');
    }

    return invoice ? transformSupabaseInvoice(invoice) : undefined;
  }
};

/**
 * Transform Supabase invoice data to match our Invoice type
 */
function transformSupabaseInvoice(supabaseInvoice: any): Invoice {
    return {
      id: supabaseInvoice.id,
      number: supabaseInvoice.invoice_no,
      invoiceNumber: supabaseInvoice.invoice_no, // For backward compatibility
      customerName: supabaseInvoice.customer_name || '',
      customerEmail: supabaseInvoice.customer_email || '',
    date: supabaseInvoice.issue_date,
    dueDate: supabaseInvoice.due_date,
    items: (supabaseInvoice.invoice_items || []).map((item: any): InvoiceItem => ({
      id: item.id,
      description: item.description,
      quantity: item.qty,
      unitPrice: item.unit_price,
      taxRate: item.tax_rate,
      total: item.line_total
    })),
    subtotal: supabaseInvoice.subtotal,
    taxTotal: supabaseInvoice.tax_total,
    total: supabaseInvoice.total,
    status: supabaseInvoice.status as 'draft' | 'sent' | 'paid' | 'overdue',
    notes: supabaseInvoice.notes,
    createdAt: supabaseInvoice.created_at || new Date().toISOString(),
    updatedAt: supabaseInvoice.updated_at || new Date().toISOString()
  };
}

/**
 * Generate next invoice number
 */
export const invoiceNumberGenerator = {
  getNext: async (): Promise<string> => {
    // Get the last invoice number from Supabase
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_no')
      .order('issue_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    let counter = 1;
    
    if (lastInvoice?.invoice_no) {
      // Extract counter from last invoice number (assumes format F-YYYY-MM-XXX)
      const match = lastInvoice.invoice_no.match(/F-\d{4}-\d{2}-(\d+)/);
      if (match) {
        counter = parseInt(match[1]) + 1;
      }
    }
    
    return `F-${year}-${month}-${counter.toString().padStart(3, '0')}`;
  },
  
  getCurrent: async (): Promise<string> => {
    return await invoiceNumberGenerator.getNext();
  }
};

/**
 * Legacy compatibility
 */
export const getAllInvoices = invoiceStorage.getAll;