import { openDB, DBSchema, IDBPDatabase } from 'idb'

// Database schema for offline storage
interface OfflineDB extends DBSchema {
  invoices: {
    key: string
    value: {
      id: string
      data: any
      lastModified: number
      syncStatus: 'synced' | 'pending' | 'failed'
      action: 'create' | 'update' | 'delete'
    }
  }
  customers: {
    key: string
    value: {
      id: string
      data: any
      lastModified: number
      syncStatus: 'synced' | 'pending' | 'failed'
      action: 'create' | 'update' | 'delete'
    }
  }
  products: {
    key: string
    value: {
      id: string
      data: any
      lastModified: number
      syncStatus: 'synced' | 'pending' | 'failed'
      action: 'create' | 'update' | 'delete'
    }
  }
  expenses: {
    key: string
    value: {
      id: string
      data: any
      lastModified: number
      syncStatus: 'synced' | 'pending' | 'failed'
      action: 'create' | 'update' | 'delete'
    }
  }
  syncQueue: {
    key: string
    value: {
      id: string
      table: string
      recordId: string
      action: 'create' | 'update' | 'delete'
      data: any
      timestamp: number
      retryCount: number
      lastError?: string
    }
  }
  appState: {
    key: string
    value: {
      lastSync: number
      isOnline: boolean
      syncInProgress: boolean
      queueCount: number
    }
  }
}

export class OfflineStorageManager {
  private db: IDBPDatabase<OfflineDB> | null = null
  private isInitialized = false
  private syncInProgress = false
  private eventListeners: Map<string, Function[]> = new Map()

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.db = await openDB<OfflineDB>('InvoiceAppOffline', 1, {
        upgrade(db) {
          // Create object stores
          const invoicesStore = db.createObjectStore('invoices', { keyPath: 'id' })
          invoicesStore.createIndex('syncStatus', 'syncStatus')
          invoicesStore.createIndex('lastModified', 'lastModified')

          const customersStore = db.createObjectStore('customers', { keyPath: 'id' })
          customersStore.createIndex('syncStatus', 'syncStatus')
          customersStore.createIndex('lastModified', 'lastModified')

          const productsStore = db.createObjectStore('products', { keyPath: 'id' })
          productsStore.createIndex('syncStatus', 'syncStatus')
          productsStore.createIndex('lastModified', 'lastModified')

          const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' })
          expensesStore.createIndex('syncStatus', 'syncStatus')
          expensesStore.createIndex('lastModified', 'lastModified')

          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncQueueStore.createIndex('timestamp', 'timestamp')
          syncQueueStore.createIndex('table', 'table')

          db.createObjectStore('appState', { keyPath: 'key' })
        },
      })

      this.isInitialized = true
      await this.initializeAppState()
      
      // Set up online/offline event listeners
      this.setupNetworkListeners()
      
      console.log('Offline storage initialized successfully')
    } catch (error) {
      console.error('Failed to initialize offline storage:', error)
      throw error
    }
  }

  private async initializeAppState(): Promise<void> {
    if (!this.db) return

    const existingState = await this.db.get('appState', 'main')
    if (!existingState) {
      await this.db.put('appState', {
        key: 'main',
        lastSync: 0,
        isOnline: navigator.onLine,
        syncInProgress: false,
        queueCount: 0
      })
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  private async handleOnline(): Promise<void> {
    await this.updateAppState({ isOnline: true })
    this.emit('online')
    
    // Start auto-sync when coming back online
    setTimeout(() => this.syncPendingChanges(), 1000)
  }

  private async handleOffline(): Promise<void> {
    await this.updateAppState({ isOnline: false })
    this.emit('offline')
  }

  // Store data offline
  async storeOffline(
    table: keyof OfflineDB,
    id: string,
    data: any,
    action: 'create' | 'update' | 'delete' = 'update'
  ): Promise<void> {
    if (!this.db || table === 'syncQueue' || table === 'appState') return

    const record = {
      id,
      data,
      lastModified: Date.now(),
      syncStatus: navigator.onLine ? 'pending' : 'pending' as const,
      action
    }

    await this.db.put(table, record)

    // Add to sync queue
    await this.addToSyncQueue(table as string, id, action, data)
    
    this.emit('dataStored', { table, id, action })
  }

  // Retrieve data from offline storage
  async getOfflineData(table: keyof OfflineDB, id?: string): Promise<any> {
    if (!this.db || table === 'syncQueue' || table === 'appState') return null

    if (id) {
      const record = await this.db.get(table, id)
      return record?.data || null
    } else {
      const records = await this.db.getAll(table)
      return records.map(r => r.data)
    }
  }

  // Add operation to sync queue
  private async addToSyncQueue(
    table: string,
    recordId: string,
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    if (!this.db) return

    const queueItem = {
      id: `${table}_${recordId}_${Date.now()}`,
      table,
      recordId,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0
    }

    await this.db.put('syncQueue', queueItem)
    await this.incrementQueueCount()
  }

  // Sync pending changes to server
  async syncPendingChanges(): Promise<void> {
    if (!this.db || this.syncInProgress || !navigator.onLine) return

    this.syncInProgress = true
    await this.updateAppState({ syncInProgress: true })

    try {
      const queueItems = await this.db.getAll('syncQueue')
      const sortedItems = queueItems.sort((a, b) => a.timestamp - b.timestamp)

      let successCount = 0
      let failureCount = 0

      for (const item of sortedItems) {
        try {
          const success = await this.syncSingleItem(item)
          if (success) {
            await this.db.delete('syncQueue', item.id)
            await this.markAsSynced(item.table as keyof OfflineDB, item.recordId)
            successCount++
          } else {
            await this.handleSyncFailure(item)
            failureCount++
          }
        } catch (error) {
          console.error('Sync error for item:', item, error)
          await this.handleSyncFailure(item, error.message)
          failureCount++
        }
      }

      await this.updateAppState({
        lastSync: Date.now(),
        syncInProgress: false,
        queueCount: failureCount
      })

      this.emit('syncComplete', { successCount, failureCount })
      
      console.log(`Sync completed: ${successCount} successful, ${failureCount} failed`)
    } catch (error) {
      console.error('Sync process failed:', error)
      await this.updateAppState({ syncInProgress: false })
      this.emit('syncError', error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncSingleItem(item: any): Promise<boolean> {
    // This would integrate with your actual Supabase sync logic
    // For now, we'll simulate the sync process
    
    const { supabase } = await import('@/integrations/supabase/client')
    
    try {
      switch (item.action) {
        case 'create':
          const { error: createError } = await supabase
            .from(item.table)
            .insert(item.data)
          return !createError

        case 'update':
          const { error: updateError } = await supabase
            .from(item.table)
            .update(item.data)
            .eq('id', item.recordId)
          return !updateError

        case 'delete':
          const { error: deleteError } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.recordId)
          return !deleteError

        default:
          return false
      }
    } catch (error) {
      console.error('Supabase sync error:', error)
      return false
    }
  }

  private async markAsSynced(table: keyof OfflineDB, id: string): Promise<void> {
    if (!this.db || table === 'syncQueue' || table === 'appState') return

    const record = await this.db.get(table, id)
    if (record) {
      record.syncStatus = 'synced'
      await this.db.put(table, record)
    }
  }

  private async handleSyncFailure(item: any, errorMessage?: string): Promise<void> {
    if (!this.db) return

    item.retryCount = (item.retryCount || 0) + 1
    item.lastError = errorMessage

    // Remove items that have failed too many times
    if (item.retryCount >= 3) {
      await this.db.delete('syncQueue', item.id)
      await this.markAsFailed(item.table as keyof OfflineDB, item.recordId)
    } else {
      await this.db.put('syncQueue', item)
    }
  }

  private async markAsFailed(table: keyof OfflineDB, id: string): Promise<void> {
    if (!this.db || table === 'syncQueue' || table === 'appState') return

    const record = await this.db.get(table, id)
    if (record) {
      record.syncStatus = 'failed'
      await this.db.put(table, record)
    }
  }

  // Cache management for frequently accessed data
  async cacheData(table: string, data: any[], expiryMinutes: number = 30): Promise<void> {
    if (!this.db) return

    const cacheKey = `cache_${table}`
    const expiryTime = Date.now() + (expiryMinutes * 60 * 1000)

    try {
      await this.db.put('appState', {
        key: cacheKey,
        data,
        expiry: expiryTime,
        cached: Date.now()
      })
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }

  async getCachedData(table: string): Promise<any[] | null> {
    if (!this.db) return null

    const cacheKey = `cache_${table}`
    
    try {
      const cached = await this.db.get('appState', cacheKey)
      
      if (cached && cached.expiry > Date.now()) {
        return cached.data
      } else if (cached) {
        // Remove expired cache
        await this.db.delete('appState', cacheKey)
      }
      
      return null
    } catch (error) {
      console.error('Failed to get cached data:', error)
      return null
    }
  }

  // Utility methods
  async getAppState(): Promise<any> {
    if (!this.db) return null
    return await this.db.get('appState', 'main')
  }

  private async updateAppState(updates: Partial<any>): Promise<void> {
    if (!this.db) return

    const currentState = await this.getAppState()
    const newState = { ...currentState, ...updates }
    await this.db.put('appState', newState)
  }

  private async incrementQueueCount(): Promise<void> {
    const state = await this.getAppState()
    await this.updateAppState({ queueCount: (state?.queueCount || 0) + 1 })
  }

  async getPendingChangesCount(): Promise<number> {
    if (!this.db) return 0
    const items = await this.db.getAll('syncQueue')
    return items.length
  }

  async clearOfflineData(): Promise<void> {
    if (!this.db) return

    const tx = this.db.transaction(['invoices', 'customers', 'products', 'expenses', 'syncQueue'], 'readwrite')
    
    await Promise.all([
      tx.objectStore('invoices').clear(),
      tx.objectStore('customers').clear(),
      tx.objectStore('products').clear(),
      tx.objectStore('expenses').clear(),
      tx.objectStore('syncQueue').clear()
    ])

    await tx.done
    await this.updateAppState({ queueCount: 0, lastSync: 0 })
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  // Cleanup
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
    this.isInitialized = false
    this.eventListeners.clear()
    
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageManager()