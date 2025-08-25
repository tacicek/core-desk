// Simple storage utilities for products and settings (without customer functionality)
import { Product, CompanySettings } from "@/types";

export const productStorage = {
  async getAll(): Promise<Product[]> {
    try {
      const data = localStorage.getItem('invoice-app-products');
      if (!data) return [];
      
      const parsedData = JSON.parse(data);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('invoice-app-products');
      } catch (removeError) {
        console.error('Error removing corrupted localStorage data:', removeError);
      }
      return [];
    }
  },

  async add(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      // Fallback ID generation for browsers that don't support crypto.randomUUID()
      let id: string;
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        // Fallback: generate a random ID using Math.random()
        id = 'product_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
      const newProduct: Product = {
        ...product,
        id
      };
      
      const products = await this.getAll();
      products.push(newProduct);
      
      const dataToStore = JSON.stringify(products);
      localStorage.setItem('invoice-app-products', dataToStore);
      return newProduct;
    } catch (error) {
      console.error('Error adding product to localStorage:', error);
      throw new Error('Failed to save product. Please check browser storage permissions.');
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const products = await this.getAll();
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return null;
      
      products[index] = { ...products[index], ...updates };
      const dataToStore = JSON.stringify(products);
      localStorage.setItem('invoice-app-products', dataToStore);
      return products[index];
    } catch (error) {
      console.error('Error updating product in localStorage:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const products = await this.getAll();
      const filtered = products.filter(p => p.id !== id);
      if (filtered.length === products.length) return false;
      
      const dataToStore = JSON.stringify(filtered);
      localStorage.setItem('invoice-app-products', dataToStore);
      return true;
    } catch (error) {
      console.error('Error deleting product from localStorage:', error);
      return false;
    }
  }
};

export const settingsStorage = {
  async get(): Promise<CompanySettings> {
    try {
      const data = localStorage.getItem('invoice-app-settings');
      if (data) {
        const parsedData = JSON.parse(data);
        // Validate the parsed data structure
        if (typeof parsedData === 'object' && parsedData !== null) {
          return {
            name: parsedData.name || "Meine Firma",
            address: parsedData.address || "",
            phone: parsedData.phone || "",
            email: parsedData.email || "",
            invoiceNumberFormat: parsedData.invoiceNumberFormat || "F-{YYYY}-{MM}-{###}",
            defaultDueDays: parsedData.defaultDueDays || 30,
            defaultTaxRate: parsedData.defaultTaxRate || 8.1
          };
        }
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      // Clear corrupted settings data
      try {
        localStorage.removeItem('invoice-app-settings');
      } catch (removeError) {
        console.error('Error removing corrupted settings:', removeError);
      }
    }
    
    // Default settings
    return {
      name: "Meine Firma",
      address: "",
      phone: "",
      email: "",
      invoiceNumberFormat: "F-{YYYY}-{MM}-{###}",
      defaultDueDays: 30,
      defaultTaxRate: 8.1
    };
  },

  async update(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    try {
      const current = await this.get();
      const updated = { ...current, ...updates };
      const dataToStore = JSON.stringify(updated);
      localStorage.setItem('invoice-app-settings', dataToStore);
      return updated;
    } catch (error) {
      console.error('Error updating settings in localStorage:', error);
      throw new Error('Failed to save settings. Please check browser storage permissions.');
    }
  },

  async save(settings: CompanySettings): Promise<void> {
    try {
      const dataToStore = JSON.stringify(settings);
      localStorage.setItem('invoice-app-settings', dataToStore);
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      throw new Error('Failed to save settings. Please check browser storage permissions.');
    }
  }
};

// Helper function for generating IDs
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  } else {
    // Fallback: generate a random ID using Math.random()
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
};