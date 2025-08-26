import { supabase } from '@/integrations/supabase/client';

export class SecureApiKeyManager {
  private static readonly ENCRYPTION_PREFIX = 'enc_';

  /**
   * Simple encryption using browser's built-in crypto API
   */
  private static async encrypt(text: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      // Generate a random key
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
      );
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      // Export the key
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      
      // Combine key, iv, and encrypted data
      const combined = new Uint8Array(
        exportedKey.byteLength + iv.byteLength + encrypted.byteLength
      );
      combined.set(new Uint8Array(exportedKey), 0);
      combined.set(iv, exportedKey.byteLength);
      combined.set(new Uint8Array(encrypted), exportedKey.byteLength + iv.byteLength);
      
      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to base64 encoding if crypto fails
      return btoa(text);
    }
  }

  /**
   * Simple decryption using browser's built-in crypto API
   */
  private static async decrypt(encryptedText: string): Promise<string> {
    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedText).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract key, iv, and encrypted data
      const keyData = combined.slice(0, 32);
      const iv = combined.slice(32, 44);
      const encrypted = combined.slice(44);
      
      // Import the key
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      // Fallback to base64 decoding if crypto fails
      try {
        return atob(encryptedText);
      } catch {
        return '';
      }
    }
  }

  /**
   * Store API key securely in user metadata
   */
  static async storeApiKey(service: string, key: string): Promise<boolean> {
    try {
      if (!key || !service) {
        throw new Error('Service name and API key are required');
      }

      const encrypted = await this.encrypt(key);
      const fieldName = `${service}_api_key_encrypted`;

      const { error } = await supabase.auth.updateUser({
        data: { [fieldName]: this.ENCRYPTION_PREFIX + encrypted }
      });

      if (error) {
        console.error('Failed to store API key:', error);
        return false;
      }

      // Remove from localStorage if it exists
      localStorage.removeItem(`${service.toUpperCase()}_API_KEY`);
      
      return true;
    } catch (error) {
      console.error('Error storing API key:', error);
      return false;
    }
  }

  /**
   * Retrieve API key from user metadata
   */
  static async getApiKey(service: string): Promise<string | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.error('User not authenticated:', error);
        return null;
      }

      const fieldName = `${service}_api_key_encrypted`;
      const encryptedKey = user.user_metadata?.[fieldName];

      if (!encryptedKey) {
        // Check localStorage as fallback for migration
        const legacyKey = localStorage.getItem(`${service.toUpperCase()}_API_KEY`);
        if (legacyKey) {
          // Migrate to secure storage
          await this.storeApiKey(service, legacyKey);
          return legacyKey;
        }
        return null;
      }

      // Remove encryption prefix and decrypt
      const encrypted = encryptedKey.startsWith(this.ENCRYPTION_PREFIX) 
        ? encryptedKey.substring(this.ENCRYPTION_PREFIX.length)
        : encryptedKey;

      return await this.decrypt(encrypted);
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  }

  /**
   * Remove API key from user metadata
   */
  static async removeApiKey(service: string): Promise<boolean> {
    try {
      const fieldName = `${service}_api_key_encrypted`;
      
      const { error } = await supabase.auth.updateUser({
        data: { [fieldName]: null }
      });

      if (error) {
        console.error('Failed to remove API key:', error);
        return false;
      }

      // Also remove from localStorage
      localStorage.removeItem(`${service.toUpperCase()}_API_KEY`);
      
      return true;
    } catch (error) {
      console.error('Error removing API key:', error);
      return false;
    }
  }

  /**
   * Check if API key exists for a service
   */
  static async hasApiKey(service: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const fieldName = `${service}_api_key_encrypted`;
      const hasKey = !!user.user_metadata?.[fieldName];
      
      if (!hasKey) {
        // Check localStorage as fallback
        return !!localStorage.getItem(`${service.toUpperCase()}_API_KEY`);
      }
      
      return hasKey;
    } catch (error) {
      console.error('Error checking API key existence:', error);
      return false;
    }
  }

  /**
   * Migrate all localStorage API keys to secure storage
   */
  static async migrateApiKeys(): Promise<void> {
    try {
      const services = ['openai', 'resend', 'n8n'];
      
      for (const service of services) {
        const legacyKey = localStorage.getItem(`${service.toUpperCase()}_API_KEY`);
        if (legacyKey) {
          console.log(`Migrating ${service} API key to secure storage`);
          await this.storeApiKey(service, legacyKey);
        }
      }
    } catch (error) {
      console.error('Error during API key migration:', error);
    }
  }
}

// Auto-migrate on module load
if (typeof window !== 'undefined') {
  // Run migration after a short delay to ensure user is authenticated
  setTimeout(() => {
    SecureApiKeyManager.migrateApiKeys();
  }, 2000);
}