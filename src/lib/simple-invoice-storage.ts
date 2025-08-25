import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types';

export const simpleInvoiceStorage = {
  add: async (invoice: Invoice): Promise<void> => {
    console.log('🟢 Simple invoice storage: Starting invoice creation', invoice.number);
    
    try {
      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('🔴 Authentication error:', userError);
        throw new Error(`Authentication failed: ${userError.message}`);
      }
      if (!user) {
        console.error('🔴 No user found');
        throw new Error('Not authenticated');
      }
      console.log('🟢 User authenticated:', user.id);

      // Get vendor ID  
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('vendor_id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.error('🔴 Profile error:', profileError);
        throw new Error(`Failed to get user profile: ${profileError.message}`);
      }
      if (!profile?.vendor_id) {
        console.error('🔴 No vendor found for user:', user.id);
        throw new Error('No vendor found for current user');
      }
      console.log('🟢 Vendor ID found:', profile.vendor_id);

      // Prepare invoice data
      const invoiceData = {
        invoice_no: invoice.number,
        customer_name: invoice.customerName,
        customer_email: invoice.customerEmail,
        vendor_id: profile.vendor_id,
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
      console.log('🟢 Invoice data prepared:', invoiceData);

      // Insert invoice
      const { data: newInvoice, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select('id')
        .single();

      if (error) {
        console.error('🔴 Simple invoice insert error:', error);
        throw new Error(`Invoice could not be created: ${error.message}`);
      }
      console.log('🟢 Invoice created with ID:', newInvoice.id);

      // Insert items
      if (invoice.items?.length > 0) {
        console.log('🟢 Adding', invoice.items.length, 'items...');
        
        const itemsData = invoice.items.map(item => ({
          invoice_id: newInvoice.id,
          created_by: user.id,
          description: item.description,
          qty: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate || 0,
          line_total: item.total
        }));
        console.log('🟢 Items data prepared:', itemsData);

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsData);

        if (itemsError) {
          console.error('🔴 Simple items insert error:', itemsError);
          throw new Error(`Invoice items could not be created: ${itemsError.message}`);
        }
        console.log('🟢 All items created successfully');
      } else {
        console.log('🟡 No items to add');
      }
      
      console.log('🟢 Invoice creation completed successfully!');
    } catch (error) {
      console.error('🔴 Simple invoice storage error:', error);
      throw error; // Re-throw to let the calling function handle it
    }
  }
};