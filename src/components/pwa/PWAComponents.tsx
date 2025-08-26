import React, { useState } from 'react'
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  Clock,
  Database,
  Smartphone,
  Globe,
  X,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { 
  usePWA, 
  useOfflineSync, 
  useConnectionStatus, 
  usePWAInstall,
  useOfflineStorage 
} from '@/contexts/PWAContext'

// Connection Status Indicator (for header/navbar)
export const ConnectionStatusIndicator = () => {
  const { isOnline, isOfflineReady } = useConnectionStatus()
  const { pendingChanges, isSyncing } = useOfflineSync()

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      )}>
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Pending Changes Badge */}
      {pendingChanges > 0 && (
        <Badge variant="secondary" className="text-xs">
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Clock className="h-3 w-3 mr-1" />
          )}
          {pendingChanges} pending
        </Badge>
      )}

      {/* Offline Ready Indicator */}
      {isOfflineReady && !isOnline && (
        <div className="flex items-center gap-1 text-blue-600">
          <Database className="h-3 w-3" />
          <span className="text-xs">Offline Ready</span>
        </div>
      )}
    </div>
  )
}

// Sync Status Component
export const SyncStatusManager = () => {
  const { isSyncing, pendingChanges, lastSync, syncProgress, syncNow } = useOfflineSync()
  const { isOnline } = useConnectionStatus()

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={syncNow}
            disabled={!isOnline || isSyncing || pendingChanges === 0}
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Sync Progress */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Syncing...</span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        {/* Pending Changes */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Pending Changes</span>
          <Badge variant={pendingChanges > 0 ? "secondary" : "outline"}>
            {pendingChanges}
          </Badge>
        </div>

        {/* Last Sync */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Sync</span>
          <span className="text-sm">{formatLastSync(lastSync)}</span>
        </div>

        {/* Status Message */}
        {!isOnline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're offline. Changes will be synced when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {pendingChanges > 0 && isOnline && !isSyncing && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              You have {pendingChanges} changes waiting to sync.
              <Button variant="link" className="p-0 ml-2 h-auto" onClick={syncNow}>
                Sync now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {pendingChanges === 0 && isOnline && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              All changes are synced.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// PWA Install Prompt
export const PWAInstallPrompt = () => {
  const { isInstallable, installPWA } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  if (!isInstallable || dismissed) return null

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Smartphone className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div>
          <strong>Install App</strong>
          <p className="text-sm text-gray-600 mt-1">
            Install our app for a better experience and offline access.
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button size="sm" onClick={installPWA}>
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Offline Storage Manager
export const OfflineStorageManager = () => {
  const { clearOfflineData } = useOfflineStorage()
  const { pendingChanges } = useOfflineSync()
  const { isOfflineReady } = useConnectionStatus()
  const [showClearDialog, setShowClearDialog] = useState(false)

  const handleClearData = async () => {
    await clearOfflineData()
    setShowClearDialog(false)
  }

  if (!isOfflineReady) return null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Storage
          </CardTitle>
          <CardDescription>
            Manage your locally stored data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Offline Ready</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Check className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Pending Changes</span>
            <Badge variant={pendingChanges > 0 ? "secondary" : "outline"}>
              {pendingChanges}
            </Badge>
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="w-full"
            >
              Clear Offline Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Offline Data</DialogTitle>
            <DialogDescription>
              This will remove all locally stored data including pending changes. 
              Make sure you've synced your changes before proceeding.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Connection Settings
export const ConnectionSettings = () => {
  const { isOnline, isOfflineReady } = useConnectionStatus()
  const { syncNow } = useOfflineSync()
  const [autoSync, setAutoSync] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Connection Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-sync">Auto Sync</Label>
            <p className="text-sm text-gray-500">
              Automatically sync when online
            </p>
          </div>
          <Switch
            id="auto-sync"
            checked={autoSync}
            onCheckedChange={setAutoSync}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="offline-mode">Offline Mode</Label>
            <p className="text-sm text-gray-500">
              Work entirely offline (for testing)
            </p>
          </div>
          <Switch
            id="offline-mode"
            checked={offlineMode}
            onCheckedChange={setOfflineMode}
          />
        </div>

        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status</span>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <Globe className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </div>

          {isOfflineReady && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Offline Ready</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Database className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            </div>
          )}
        </div>

        <Button 
          onClick={syncNow} 
          disabled={!isOnline}
          className="w-full"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Now
        </Button>
      </CardContent>
    </Card>
  )
}

// Main PWA Dashboard Component
export const PWADashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SyncStatusManager />
        <OfflineStorageManager />
        <ConnectionSettings />
      </div>
    </div>
  )
}

// Floating Sync Status (for persistent display)
export const FloatingSyncStatus = () => {
  const { isSyncing, pendingChanges } = useOfflineSync()
  const { isOnline } = useConnectionStatus()
  const [isVisible, setIsVisible] = useState(true)

  // Only show when there are pending changes or syncing
  if ((!isSyncing && pendingChanges === 0) || !isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="bg-white shadow-lg border">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm">Syncing...</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm">{pendingChanges} pending</span>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}