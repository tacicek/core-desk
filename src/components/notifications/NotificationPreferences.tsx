import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Volume2, 
  VolumeX,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  useNotifications, 
  NotificationType, 
  NotificationPreferences 
} from '@/contexts/NotificationContext'

// Notification type configurations
const NOTIFICATION_TYPES: Record<NotificationType, {
  label: string
  description: string
  category: 'invoices' | 'business' | 'system' | 'security'
  icon: React.ReactNode
  defaultEmail: boolean
  defaultPush: boolean
}> = {
  'invoice_created': {
    label: 'Invoice Created',
    description: 'When a new invoice is created',
    category: 'invoices',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: false,
    defaultPush: false
  },
  'invoice_sent': {
    label: 'Invoice Sent',
    description: 'When an invoice is sent to a customer',
    category: 'invoices',
    icon: <Mail className="h-4 w-4" />,
    defaultEmail: true,
    defaultPush: false
  },
  'invoice_paid': {
    label: 'Invoice Paid',
    description: 'When a payment is received',
    category: 'invoices',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: true,
    defaultPush: true
  },
  'invoice_overdue': {
    label: 'Invoice Overdue',
    description: 'When an invoice becomes overdue',
    category: 'invoices',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: true,
    defaultPush: true
  },
  'expense_added': {
    label: 'Expense Added',
    description: 'When a new expense is recorded',
    category: 'business',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: false,
    defaultPush: false
  },
  'customer_added': {
    label: 'Customer Added',
    description: 'When a new customer is added',
    category: 'business',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: false,
    defaultPush: false
  },
  'product_added': {
    label: 'Product Added',
    description: 'When a new product is added',
    category: 'business',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: false,
    defaultPush: false
  },
  'revenue_milestone': {
    label: 'Revenue Milestone',
    description: 'When revenue targets are reached',
    category: 'business',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: true,
    defaultPush: true
  },
  'system_update': {
    label: 'System Updates',
    description: 'When system features are updated',
    category: 'system',
    icon: <Settings className="h-4 w-4" />,
    defaultEmail: false,
    defaultPush: false
  },
  'security_alert': {
    label: 'Security Alerts',
    description: 'When security issues are detected',
    category: 'security',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: true,
    defaultPush: true
  },
  'api_key_expiry': {
    label: 'API Key Expiry',
    description: 'When API keys are about to expire',
    category: 'security',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: true,
    defaultPush: false
  },
  'backup_completed': {
    label: 'Backup Completed',
    description: 'When data backups are finished',
    category: 'system',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: false,
    defaultPush: false
  },
  'payment_received': {
    label: 'Payment Received',
    description: 'When payments are processed',
    category: 'business',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: true,
    defaultPush: true
  },
  'subscription_expiry': {
    label: 'Subscription Expiry',
    description: 'When subscription is about to expire',
    category: 'system',
    icon: <Bell className="h-4 w-4" />,
    defaultEmail: true,
    defaultPush: true
  }
}

const CATEGORIES = {
  'invoices': {
    label: 'Invoices & Payments',
    description: 'Notifications about invoice activities and payments'
  },
  'business': {
    label: 'Business Operations',
    description: 'Notifications about customers, products, and revenue'
  },
  'system': {
    label: 'System & Updates',
    description: 'Notifications about system updates and maintenance'
  },
  'security': {
    label: 'Security & Alerts',
    description: 'Important security notifications and alerts'
  }
}

export const NotificationPreferencesManager = () => {
  const { preferences, updatePreferences, getPreferences } = useNotifications()
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [localPreferences, setLocalPreferences] = useState<Record<NotificationType, Partial<NotificationPreferences>>>({})
  const [globalSettings, setGlobalSettings] = useState({
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    emailDigest: 'daily' as 'instant' | 'daily' | 'weekly' | 'never'
  })

  // Initialize local preferences from context
  useEffect(() => {
    const newLocalPrefs: Record<NotificationType, Partial<NotificationPreferences>> = {}
    
    Object.keys(NOTIFICATION_TYPES).forEach(type => {
      const notificationType = type as NotificationType
      const existing = getPreferences(notificationType)
      const typeConfig = NOTIFICATION_TYPES[notificationType]
      
      newLocalPrefs[notificationType] = {
        enabled: existing?.enabled ?? true,
        in_app: existing?.in_app ?? true,
        email: existing?.email ?? typeConfig.defaultEmail,
        push: existing?.push ?? typeConfig.defaultPush,
        frequency: existing?.frequency ?? 'instant'
      }
    })
    
    setLocalPreferences(newLocalPrefs)
  }, [preferences, getPreferences])

  const updateLocalPreference = (type: NotificationType, updates: Partial<NotificationPreferences>) => {
    setLocalPreferences(prev => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }))
    setHasChanges(true)
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    try {
      const updatePromises = Object.entries(localPreferences).map(([type, prefs]) => 
        updatePreferences(type as NotificationType, prefs)
      )
      
      await Promise.all(updatePromises)
      setHasChanges(false)
      toast.success('Notification preferences saved successfully')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetToDefaults = () => {
    const newLocalPrefs: Record<NotificationType, Partial<NotificationPreferences>> = {}
    
    Object.keys(NOTIFICATION_TYPES).forEach(type => {
      const notificationType = type as NotificationType
      const typeConfig = NOTIFICATION_TYPES[notificationType]
      
      newLocalPrefs[notificationType] = {
        enabled: true,
        in_app: true,
        email: typeConfig.defaultEmail,
        push: typeConfig.defaultPush,
        frequency: 'instant'
      }
    })
    
    setLocalPreferences(newLocalPrefs)
    setHasChanges(true)
    toast.info('Preferences reset to defaults')
  }

  const toggleCategoryEnabled = (category: string, enabled: boolean) => {
    const categoryTypes = Object.entries(NOTIFICATION_TYPES)
      .filter(([, config]) => config.category === category)
      .map(([type]) => type as NotificationType)
    
    const updates: Record<NotificationType, Partial<NotificationPreferences>> = {}
    categoryTypes.forEach(type => {
      updates[type] = { ...localPreferences[type], enabled }
    })
    
    setLocalPreferences(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const renderNotificationRow = (type: NotificationType) => {
    const config = NOTIFICATION_TYPES[type]
    const prefs = localPreferences[type] || {}

    return (
      <div key={type} className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {config.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label className="font-medium">{config.label}</Label>
              {!prefs.enabled && (
                <Badge variant="secondary" className="text-xs">Disabled</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* In-App */}
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" />
            <Switch
              checked={prefs.enabled && prefs.in_app}
              onCheckedChange={(checked) => 
                updateLocalPreference(type, { in_app: checked })
              }
              disabled={!prefs.enabled}
            />
          </div>
          
          {/* Email */}
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <Switch
              checked={prefs.enabled && prefs.email}
              onCheckedChange={(checked) => 
                updateLocalPreference(type, { email: checked })
              }
              disabled={!prefs.enabled}
            />
          </div>
          
          {/* Push */}
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-gray-500" />
            <Switch
              checked={prefs.enabled && prefs.push}
              onCheckedChange={(checked) => 
                updateLocalPreference(type, { push: checked })
              }
              disabled={!prefs.enabled}
            />
          </div>
          
          {/* Master Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={prefs.enabled}
              onCheckedChange={(checked) => 
                updateLocalPreference(type, { enabled: checked })
              }
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Preferences</h2>
          <p className="text-gray-600">
            Manage how and when you receive notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={!hasChanges || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Settings
          </CardTitle>
          <CardDescription>
            Configure general notification behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quiet Hours */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4" />
              <div>
                <Label className="font-medium">Quiet Hours</Label>
                <p className="text-sm text-gray-600">
                  Disable notifications during specified hours
                </p>
              </div>
            </div>
            <Switch
              checked={globalSettings.quietHoursEnabled}
              onCheckedChange={(checked) => 
                setGlobalSettings(prev => ({ ...prev, quietHoursEnabled: checked }))
              }
            />
          </div>
          
          {globalSettings.quietHoursEnabled && (
            <div className="flex items-center gap-4 ml-7">
              <div>
                <Label className="text-sm">From</Label>
                <Input
                  type="time"
                  value={globalSettings.quietHoursStart}
                  onChange={(e) => 
                    setGlobalSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))
                  }
                  className="w-24"
                />
              </div>
              <div>
                <Label className="text-sm">To</Label>
                <Input
                  type="time"
                  value={globalSettings.quietHoursEnd}
                  onChange={(e) => 
                    setGlobalSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))
                  }
                  className="w-24"
                />
              </div>
            </div>
          )}

          {/* Email Digest */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <div>
                <Label className="font-medium">Email Digest</Label>
                <p className="text-sm text-gray-600">
                  How often to send email summaries
                </p>
              </div>
            </div>
            <Select
              value={globalSettings.emailDigest}
              onValueChange={(value: any) => 
                setGlobalSettings(prev => ({ ...prev, emailDigest: value }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types by Category */}
      {Object.entries(CATEGORIES).map(([categoryKey, categoryConfig]) => {
        const categoryTypes = Object.entries(NOTIFICATION_TYPES)
          .filter(([, config]) => config.category === categoryKey)
        
        const enabledCount = categoryTypes.filter(([type]) => 
          localPreferences[type as NotificationType]?.enabled
        ).length

        return (
          <Card key={categoryKey}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {categoryConfig.label}
                    <Badge variant="outline">
                      {enabledCount}/{categoryTypes.length} enabled
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {categoryConfig.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCategoryEnabled(categoryKey, false)}
                  >
                    <VolumeX className="h-4 w-4 mr-1" />
                    Disable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCategoryEnabled(categoryKey, true)}
                  >
                    <Volume2 className="h-4 w-4 mr-1" />
                    Enable All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Column Headers */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Notification Type</Label>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2 w-16 justify-center">
                    <Bell className="h-4 w-4" />
                    <span>App</span>
                  </div>
                  <div className="flex items-center gap-2 w-16 justify-center">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <div className="flex items-center gap-2 w-16 justify-center">
                    <Smartphone className="h-4 w-4" />
                    <span>Push</span>
                  </div>
                  <div className="w-16 text-center">
                    <span>Enabled</span>
                  </div>
                </div>
              </div>

              {/* Notification Rows */}
              <div className="divide-y">
                {categoryTypes.map(([type]) => 
                  renderNotificationRow(type as NotificationType)
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Save Notice */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm text-blue-800">You have unsaved changes</span>
            <Button size="sm" onClick={handleSaveChanges} disabled={isLoading}>
              Save Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}