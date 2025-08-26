import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { offlineStorage } from '@/lib/offlineStorage'
import { useAuth } from '@/contexts/AuthContext'
import { useVendor } from '@/contexts/VendorContext'
import { toast } from 'sonner'

interface PWAContextType {
  // Connection state
  isOnline: boolean
  isOfflineReady: boolean
  
  // Sync state
  isSyncing: boolean
  pendingChanges: number
  lastSync: Date | null
  syncProgress: number
  
  // PWA state
  isInstallable: boolean
  isInstalled: boolean
  installPrompt: any
  
  // Actions
  syncNow: () => Promise<void>
  goOffline: () => void
  storeOfflineData: (table: string, id: string, data: any, action?: 'create' | 'update' | 'delete') => Promise<void>
  getOfflineData: (table: string, id?: string) => Promise<any>
  installPWA: () => Promise<void>
  clearOfflineData: () => Promise<void>
  
  // Cache actions
  cacheData: (table: string, data: any[], expiryMinutes?: number) => Promise<void>
  getCachedData: (table: string) => Promise<any[] | null>
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export const usePWA = () => {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}

interface PWAProviderProps {
  children: ReactNode
}

export const PWAProvider = ({ children }: PWAProviderProps) => {
  const { user } = useAuth()
  const { vendor } = useVendor()
  
  // Connection state
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isOfflineReady, setIsOfflineReady] = useState(false)
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingChanges, setPendingChanges] = useState(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)
  
  // PWA state
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  // Initialize offline storage
  useEffect(() => {
    const initOfflineStorage = async () => {
      try {
        await offlineStorage.initialize()
        setIsOfflineReady(true)
        
        // Get initial state
        const appState = await offlineStorage.getAppState()
        if (appState) {
          setLastSync(appState.lastSync ? new Date(appState.lastSync) : null)
          setPendingChanges(appState.queueCount || 0)
        }
        
        // Set up event listeners
        offlineStorage.on('online', handleOnlineEvent)
        offlineStorage.on('offline', handleOfflineEvent)
        offlineStorage.on('syncComplete', handleSyncComplete)
        offlineStorage.on('syncError', handleSyncError)
        offlineStorage.on('dataStored', handleDataStored)
        
        console.log('PWA offline storage initialized')
      } catch (error) {
        console.error('Failed to initialize offline storage:', error)
        toast.error('Failed to initialize offline functionality')
      }
    }

    initOfflineStorage()

    return () => {
      offlineStorage.off('online', handleOnlineEvent)
      offlineStorage.off('offline', handleOfflineEvent)
      offlineStorage.off('syncComplete', handleSyncComplete)
      offlineStorage.off('syncError', handleSyncError)
      offlineStorage.off('dataStored', handleDataStored)
    }
  }, [])

  // Handle online/offline events
  const handleOnlineEvent = useCallback(() => {
    setIsOnline(true)
    toast.success('🌐 Back online! Syncing data...', {
      duration: 3000
    })
  }, [])

  const handleOfflineEvent = useCallback(() => {
    setIsOnline(false)
    toast.warning('📱 You\'re offline. Changes will be saved locally.', {
      duration: 5000
    })
  }, [])

  const handleSyncComplete = useCallback((data: { successCount: number; failureCount: number }) => {
    setIsSyncing(false)
    setSyncProgress(0)
    setLastSync(new Date())
    setPendingChanges(data.failureCount)
    
    if (data.successCount > 0) {
      toast.success(`✅ Synced ${data.successCount} changes successfully`)
    }
    
    if (data.failureCount > 0) {
      toast.error(`❌ Failed to sync ${data.failureCount} changes`)
    }
  }, [])

  const handleSyncError = useCallback((error: any) => {
    setIsSyncing(false)
    setSyncProgress(0)
    toast.error('Sync failed. Will retry automatically.')
    console.error('Sync error:', error)
  }, [])

  const handleDataStored = useCallback(() => {
    // Update pending changes count
    offlineStorage.getPendingChangesCount().then(setPendingChanges)
  }, [])

  // Network state listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // PWA install listeners
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
      toast.success('App installed successfully!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && isOfflineReady && pendingChanges > 0 && !isSyncing) {
      // Delay sync to avoid immediate sync on page load
      const timer = setTimeout(() => {
        syncNow()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isOnline, isOfflineReady, pendingChanges, isSyncing])

  // Sync now function
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing || !isOfflineReady) return

    setIsSyncing(true)
    setSyncProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      await offlineStorage.syncPendingChanges()
      
      clearInterval(progressInterval)
      setSyncProgress(100)
      
      // Complete progress after a short delay
      setTimeout(() => setSyncProgress(0), 500)
    } catch (error) {
      console.error('Manual sync failed:', error)
      toast.error('Sync failed. Please try again.')
      setIsSyncing(false)
      setSyncProgress(0)
    }
  }, [isOnline, isSyncing, isOfflineReady])

  // Go offline for testing
  const goOffline = useCallback(() => {
    // This is mainly for development/testing
    setIsOnline(false)
    toast.info('Simulating offline mode')
  }, [])

  // Store data offline
  const storeOfflineData = useCallback(async (
    table: string, 
    id: string, 
    data: any, 
    action: 'create' | 'update' | 'delete' = 'update'
  ) => {
    if (!isOfflineReady) return

    try {
      await offlineStorage.storeOffline(table as any, id, data, action)
      
      if (!isOnline) {
        toast.info(`💾 ${action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Deleted'} offline. Will sync when online.`)
      }
    } catch (error) {
      console.error('Failed to store offline data:', error)
      toast.error('Failed to save data offline')
    }
  }, [isOfflineReady, isOnline])

  // Get offline data
  const getOfflineData = useCallback(async (table: string, id?: string) => {
    if (!isOfflineReady) return null

    try {
      return await offlineStorage.getOfflineData(table as any, id)
    } catch (error) {
      console.error('Failed to get offline data:', error)
      return null
    }
  }, [isOfflineReady])

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt) return

    try {
      const result = await installPrompt.prompt()
      console.log('Install prompt result:', result)
      
      if (result.outcome === 'accepted') {
        toast.success('Installing app...')
      }
      
      setInstallPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Failed to install PWA:', error)
      toast.error('Failed to install app')
    }
  }, [installPrompt])

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    if (!isOfflineReady) return

    try {
      await offlineStorage.clearOfflineData()
      setPendingChanges(0)
      setLastSync(null)
      toast.success('Offline data cleared')
    } catch (error) {
      console.error('Failed to clear offline data:', error)
      toast.error('Failed to clear offline data')
    }
  }, [isOfflineReady])

  // Cache data
  const cacheData = useCallback(async (table: string, data: any[], expiryMinutes: number = 30) => {
    if (!isOfflineReady) return

    try {
      await offlineStorage.cacheData(table, data, expiryMinutes)
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }, [isOfflineReady])

  // Get cached data
  const getCachedData = useCallback(async (table: string) => {
    if (!isOfflineReady) return null

    try {
      return await offlineStorage.getCachedData(table)
    } catch (error) {
      console.error('Failed to get cached data:', error)
      return null
    }
  }, [isOfflineReady])

  // Periodic sync for authenticated users
  useEffect(() => {
    if (!user || !vendor || !isOnline || !isOfflineReady) return

    const syncInterval = setInterval(() => {
      if (pendingChanges > 0 && !isSyncing) {
        syncNow()
      }
    }, 30000) // Sync every 30 seconds if there are pending changes

    return () => clearInterval(syncInterval)
  }, [user, vendor, isOnline, isOfflineReady, pendingChanges, isSyncing, syncNow])

  const value: PWAContextType = {
    // Connection state
    isOnline,
    isOfflineReady,
    
    // Sync state
    isSyncing,
    pendingChanges,
    lastSync,
    syncProgress,
    
    // PWA state
    isInstallable,
    isInstalled,
    installPrompt,
    
    // Actions
    syncNow,
    goOffline,
    storeOfflineData,
    getOfflineData,
    installPWA,
    clearOfflineData,
    
    // Cache actions
    cacheData,
    getCachedData
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  )
}

// Specific hooks for different aspects
export const useOfflineSync = () => {
  const { isSyncing, pendingChanges, lastSync, syncProgress, syncNow } = usePWA()
  return { isSyncing, pendingChanges, lastSync, syncProgress, syncNow }
}

export const useConnectionStatus = () => {
  const { isOnline, isOfflineReady } = usePWA()
  return { isOnline, isOfflineReady }
}

export const usePWAInstall = () => {
  const { isInstallable, isInstalled, installPWA } = usePWA()
  return { isInstallable, isInstalled, installPWA }
}

export const useOfflineStorage = () => {
  const { storeOfflineData, getOfflineData, clearOfflineData } = usePWA()
  return { storeOfflineData, getOfflineData, clearOfflineData }
}

export const useDataCache = () => {
  const { cacheData, getCachedData } = usePWA()
  return { cacheData, getCachedData }
}