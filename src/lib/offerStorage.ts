// Local storage-based offer storage (temporary fix for Supabase issues)
import { Offer, OfferItem } from '@/types/offer';

// Utility functions for compatibility
export const generateId = () => crypto.randomUUID();
export const offerNumberGenerator = { getNext: () => 'ANG-001' };

// Create wrapper functions that work with local storage
export const offerStorage = {
  getAll: async (vendorId?: string): Promise<Offer[]> => {
    try {
      console.log('Loading offers from localStorage, vendorId:', vendorId);
      const data = localStorage.getItem('invoice-app-offers');
      if (!data) return [];
      
      const parsedData = JSON.parse(data);
      const offers = Array.isArray(parsedData) ? parsedData : [];
      
      // Filter by vendor if specified
      if (vendorId) {
        return offers.filter(offer => offer.vendor_id === vendorId);
      }
      
      return offers;
    } catch (error) {
      console.error('Error loading offers from localStorage:', error);
      return [];
    }
  },

  add: async (offer: Offer, vendorId?: string, userId?: string): Promise<void | boolean> => {
    try {
      console.log('Adding offer to localStorage:', offer);
      
      if (!vendorId) {
        console.error('Vendor ID is required for add');
        return false;
      }
      
      // Add vendor_id and created_by to offer
      const offerWithMetadata = {
        ...offer,
        vendor_id: vendorId,
        created_by: userId || 'unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Get existing offers
      const existingOffers = await this.getAll();
      existingOffers.push(offerWithMetadata);
      
      // Save back to localStorage
      localStorage.setItem('invoice-app-offers', JSON.stringify(existingOffers));
      
      console.log('Offer added successfully');
      return true;
    } catch (error) {
      console.error('Error adding offer to localStorage:', error);
      return false;
    }
  },

  update: async (id: string, updatedOffer: Partial<Offer>, vendorId?: string): Promise<void | boolean> => {
    try {
      console.log('Updating offer in localStorage:', id, updatedOffer);
      
      if (!vendorId) {
        console.error('Vendor ID is required for update');
        return false;
      }
      
      const existingOffers = await this.getAll();
      const offerIndex = existingOffers.findIndex(o => o.id === id && o.vendor_id === vendorId);
      
      if (offerIndex === -1) {
        console.error('Offer not found for update');
        return false;
      }
      
      existingOffers[offerIndex] = {
        ...existingOffers[offerIndex],
        ...updatedOffer,
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('invoice-app-offers', JSON.stringify(existingOffers));
      console.log('Offer updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating offer in localStorage:', error);
      return false;
    }
  },

  delete: async (id: string, vendorId?: string): Promise<void | boolean> => {
    try {
      console.log('Deleting offer from localStorage:', id);
      
      if (!vendorId) {
        console.error('Vendor ID is required for delete');
        return false;
      }
      
      const existingOffers = await this.getAll();
      const filteredOffers = existingOffers.filter(o => !(o.id === id && o.vendor_id === vendorId));
      
      if (filteredOffers.length === existingOffers.length) {
        console.error('Offer not found for deletion');
        return false;
      }
      
      localStorage.setItem('invoice-app-offers', JSON.stringify(filteredOffers));
      console.log('Offer deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting offer from localStorage:', error);
      return false;
    }
  },

  getById: async (id: string, vendorId?: string): Promise<Offer | undefined> => {
    try {
      if (!vendorId) {
        console.error('Vendor ID is required for getById');
        return undefined;
      }
      
      const existingOffers = await this.getAll();
      return existingOffers.find(o => o.id === id && o.vendor_id === vendorId);
    } catch (error) {
      console.error('Error getting offer by ID from localStorage:', error);
      return undefined;
    }
  },

  getNextOfferNumber: async (vendorId?: string): Promise<string> => {
    try {
      if (!vendorId) {
        console.error('Vendor ID is required for getNextOfferNumber');
        return 'ANG-001';
      }
      
      const existingOffers = await this.getAll(vendorId);
      const maxNumber = Math.max(...existingOffers.map(o => {
        const match = o.offer_no?.match(/ANG-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }));
      
      return `ANG-${String(maxNumber + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error getting next offer number from localStorage:', error);
      return 'ANG-001';
    }
  }
};

// Offer item storage wrapper (local storage)
export const offerItemStorage = {
  getByOfferId: async (offerId: string): Promise<OfferItem[]> => {
    try {
      console.log('Getting offer items by offer ID:', offerId);
      const data = localStorage.getItem('invoice-app-offer-items');
      if (!data) return [];
      
      const parsedData = JSON.parse(data);
      const items = Array.isArray(parsedData) ? parsedData : [];
      
      return items.filter(item => item.offer_id === offerId);
    } catch (error) {
      console.error('Error getting offer items from localStorage:', error);
      return [];
    }
  },

  add: async (offerId: string, item?: OfferItem, vendorId?: string, userId?: string): Promise<boolean> => {
    try {
      if (!item || !vendorId || !userId) {
        console.error('All parameters are required for add');
        return false;
      }
      
      console.log('Adding offer item to localStorage:', item);
      
      const data = localStorage.getItem('invoice-app-offer-items');
      const items = data ? JSON.parse(data) : [];
      
      const newItem = {
        ...item,
        offer_id: offerId,
        vendor_id: vendorId,
        created_by: userId,
        created_at: new Date().toISOString()
      };
      
      items.push(newItem);
      localStorage.setItem('invoice-app-offer-items', JSON.stringify(items));
      
      console.log('Offer item added successfully');
      return true;
    } catch (error) {
      console.error('Error adding offer item to localStorage:', error);
      return false;
    }
  },

  updateByOfferId: async (offerId: string, items?: OfferItem[], vendorId?: string, userId?: string): Promise<boolean> => {
    try {
      if (!items || !vendorId || !userId) {
        console.error('All parameters are required for updateByOfferId');
        return false;
      }
      
      console.log('Updating offer items by offer ID:', offerId);
      
      const data = localStorage.getItem('invoice-app-offer-items');
      const existingItems = data ? JSON.parse(data) : [];
      
      // Remove existing items for this offer
      const filteredItems = existingItems.filter(item => item.offer_id !== offerId);
      
      // Add new items
      const newItems = items.map(item => ({
        ...item,
        offer_id: offerId,
        vendor_id: vendorId,
        created_by: userId,
        updated_at: new Date().toISOString()
      }));
      
      const allItems = [...filteredItems, ...newItems];
      localStorage.setItem('invoice-app-offer-items', JSON.stringify(allItems));
      
      console.log('Offer items updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating offer items in localStorage:', error);
      return false;
    }
  }
};