import { Offer, OfferItem } from '@/types/offer';
import { supabase } from '@/integrations/supabase/client';

// Supabase-based offer storage functions
export const offerStorage = {
  getAll: async (vendorId: string): Promise<Offer[]> => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          offer_items (*)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading offers:', error);
        return [];
      }

      return (data || []) as any[];
    } catch (error) {
      console.error('Error loading offers:', error);
      return [];
    }
  },

  add: async (offer: Offer, vendorId: string, userId: string): Promise<boolean> => {
    try {
      // Insert offer
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .insert({
          id: offer.id,
          vendor_id: vendorId,
          created_by: userId,
          customer_id: offer.customer_id,
          offer_no: offer.offer_no,
          issue_date: offer.issue_date,
          valid_until: offer.valid_until,
          status: offer.status,
          notes: offer.notes,
          total: offer.total,
          subtotal: offer.subtotal,
          tax_total: offer.tax_total,
          currency: offer.currency || 'CHF'
        })
        .select()
        .single();

      if (offerError) {
        console.error('Error adding offer:', offerError);
        return false;
      }

      // Insert offer items
      if (offer.items && offer.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('offer_items')
          .insert(
            offer.items.map(item => ({
              id: item.id,
              offer_id: offer.id,
              created_by: userId,
              description: item.description,
              qty: item.qty,
              unit_price: item.unit_price,
              tax_rate: item.tax_rate,
              line_total: item.line_total
            }))
          );

        if (itemsError) {
          console.error('Error adding offer items:', itemsError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error adding offer:', error);
      return false;
    }
  },

  update: async (id: string, updatedOffer: Partial<Offer>, vendorId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({
          offer_no: updatedOffer.offer_no,
          issue_date: updatedOffer.issue_date,
          valid_until: updatedOffer.valid_until,
          status: updatedOffer.status,
          notes: updatedOffer.notes,
          total: updatedOffer.total,
          subtotal: updatedOffer.subtotal,
          tax_total: updatedOffer.tax_total,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('vendor_id', vendorId);

      if (error) {
        console.error('Error updating offer:', error);
        return false;
      }

      // Update offer items if provided
      if (updatedOffer.items) {
        // Delete existing items
        await supabase
          .from('offer_items')
          .delete()
          .eq('offer_id', id);

        // Insert new items
        if (updatedOffer.items.length > 0) {
          const { error: itemsError } = await supabase
            .from('offer_items')
            .insert(
              updatedOffer.items.map(item => ({
                id: item.id,
                offer_id: id,
                created_by: item.created_by || '',
                description: item.description,
                qty: item.qty,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                line_total: item.line_total
              }))
            );

          if (itemsError) {
            console.error('Error updating offer items:', itemsError);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating offer:', error);
      return false;
    }
  },

  delete: async (id: string, vendorId: string): Promise<boolean> => {
    try {
      // Delete offer items first (due to foreign key constraint)
      await supabase
        .from('offer_items')
        .delete()
        .eq('offer_id', id);

      // Delete offer
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id)
        .eq('vendor_id', vendorId);

      if (error) {
        console.error('Error deleting offer:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting offer:', error);
      return false;
    }
  },

  getById: async (id: string, vendorId: string): Promise<Offer | undefined> => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          offer_items (*)
        `)
        .eq('id', id)
        .eq('vendor_id', vendorId)
        .single();

      if (error) {
        console.error('Error loading offer:', error);
        return undefined;
      }

      return data as any || undefined;
    } catch (error) {
      console.error('Error loading offer:', error);
      return undefined;
    }
  },

  getNextOfferNumber: async (vendorId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('offer_no')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error getting offer counter:', error);
        return 'ANG-001';
      }

      if (!data || data.length === 0) {
        return 'ANG-001';
      }

      // Extract number from the last offer number (e.g., "ANG-005" -> 5)
      const lastNumber = data[0].offer_no;
      const match = lastNumber.match(/ANG-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        return `ANG-${nextNum.toString().padStart(3, '0')}`;
      }

      return 'ANG-001';
    } catch (error) {
      console.error('Error getting offer counter:', error);
      return 'ANG-001';
    }
  }
};

// Offer item functions
export const offerItemStorage = {
  getByOfferId: async (offerId: string): Promise<OfferItem[]> => {
    try {
      const { data, error } = await supabase
        .from('offer_items')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading offer items:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error loading offer items:', error);
      return [];
    }
  },

  add: async (offerId: string, item: OfferItem, vendorId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('offer_items')
        .insert({
          id: item.id,
          offer_id: offerId,
          created_by: userId,
          description: item.description,
          qty: item.qty,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          line_total: item.line_total
        });

      if (error) {
        console.error('Error adding offer item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding offer item:', error);
      return false;
    }
  },

  updateByOfferId: async (offerId: string, items: OfferItem[], vendorId: string, userId: string): Promise<boolean> => {
    try {
      // Delete existing items
      await supabase
        .from('offer_items')
        .delete()
        .eq('offer_id', offerId);

      // Insert new items
      if (items.length > 0) {
        const { error } = await supabase
          .from('offer_items')
          .insert(
            items.map(item => ({
              id: item.id,
              offer_id: offerId,
              created_by: userId,
              description: item.description,
              qty: item.qty,
              unit_price: item.unit_price,
              tax_rate: item.tax_rate,
              line_total: item.line_total
            }))
          );

        if (error) {
          console.error('Error updating offer items:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating offer items:', error);
      return false;
    }
  }
};