// Compatibility wrapper for the offer storage that works with VendorContext
import { offerStorage as supabaseOfferStorage, offerItemStorage as supabaseOfferItemStorage } from './offerStorageSupabase';
import { Offer, OfferItem } from '@/types/offer';

// Utility functions for compatibility
export const generateId = () => crypto.randomUUID();
export const offerNumberGenerator = { getNext: () => 'ANG-001' };

// Create wrapper functions that work with the existing page code
export const offerStorage = {
  getAll: async (vendorId?: string): Promise<Offer[]> => {
    if (!vendorId) {
      console.error('Vendor ID is required for getAll');
      return [];
    }
    return supabaseOfferStorage.getAll(vendorId);
  },

  add: async (offer: Offer, vendorId?: string, userId?: string): Promise<void | boolean> => {
    if (!vendorId || !userId) {
      console.error('Vendor ID and User ID are required for add');
      return false;
    }
    const result = await supabaseOfferStorage.add(offer, vendorId, userId);
    if (!result) throw new Error('Failed to add offer');
  },

  update: async (id: string, updatedOffer: Partial<Offer>, vendorId?: string): Promise<void | boolean> => {
    if (!vendorId) {
      console.error('Vendor ID is required for update');
      return false;
    }
    const result = await supabaseOfferStorage.update(id, updatedOffer, vendorId);
    if (!result) throw new Error('Failed to update offer');
  },

  delete: async (id: string, vendorId?: string): Promise<void | boolean> => {
    if (!vendorId) {
      console.error('Vendor ID is required for delete');
      return false;
    }
    const result = await supabaseOfferStorage.delete(id, vendorId);
    if (!result) throw new Error('Failed to delete offer');
  },

  getById: async (id: string, vendorId?: string): Promise<Offer | undefined> => {
    if (!vendorId) {
      console.error('Vendor ID is required for getById');
      return undefined;
    }
    return supabaseOfferStorage.getById(id, vendorId);
  },

  getNextOfferNumber: async (vendorId?: string): Promise<string> => {
    if (!vendorId) {
      console.error('Vendor ID is required for getNextOfferNumber');
      return 'ANG-001';
    }
    return supabaseOfferStorage.getNextOfferNumber(vendorId);
  }
};

// Offer item storage wrapper
export const offerItemStorage = {
  getByOfferId: async (offerId: string): Promise<OfferItem[]> => {
    return supabaseOfferItemStorage.getByOfferId(offerId);
  },

  add: async (offerId: string, item?: OfferItem, vendorId?: string, userId?: string): Promise<boolean> => {
    if (!item || !vendorId || !userId) {
      console.error('All parameters are required for add');
      return false;
    }
    return supabaseOfferItemStorage.add(offerId, item, vendorId, userId);
  },

  updateByOfferId: async (offerId: string, items?: OfferItem[], vendorId?: string, userId?: string): Promise<boolean> => {
    if (!items || !vendorId || !userId) {
      console.error('All parameters are required for updateByOfferId');
      return false;
    }
    return supabaseOfferItemStorage.updateByOfferId(offerId, items, vendorId, userId);
  }
};