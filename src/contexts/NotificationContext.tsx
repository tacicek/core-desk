import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useVendor } from '@/contexts/VendorContext'
import { toast } from 'sonner'

// Notification types
export interface Notification {
  id: string
  vendor_id: string
  user_id: string | null
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  title: string
  message: string
  metadata: Record<string, any>
  action_url?: string
  action_label?: string
  expires_at?: string
  read_at?: string
  created_at: string
  updated_at: string
}

export type NotificationType = 
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'expense_added'
  | 'customer_added'
  | 'product_added'
  | 'revenue_milestone'
  | 'system_update'
  | 'security_alert'
  | 'api_key_expiry'
  | 'backup_completed'
  | 'payment_received'
  | 'subscription_expiry'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed'

export interface NotificationPreferences {
  id: string
  vendor_id: string
  user_id: string | null
  type: NotificationType
  enabled: boolean
  in_app: boolean
  email: boolean
  push: boolean
  frequency: string
  quiet_hours_start?: string
  quiet_hours_end?: string
}

export interface NotificationStats {
  total_count: number
  unread_count: number
  high_priority_count: number
  critical_count: number
}

interface NotificationContextType {
  // State
  notifications: Notification[]
  unreadCount: number
  stats: NotificationStats
  preferences: NotificationPreferences[]
  isLoading: boolean
  
  // Actions
  createNotification: (notification: Partial<Notification>) => Promise<string | null>
  markAsRead: (notificationId: string) => Promise<boolean>
  markAllAsRead: () => Promise<void>
  archiveNotification: (notificationId: string) => Promise<boolean>
  dismissNotification: (notificationId: string) => Promise<boolean>
  
  // Preferences
  updatePreferences: (type: NotificationType, prefs: Partial<NotificationPreferences>) => Promise<void>
  getPreferences: (type: NotificationType) => NotificationPreferences | undefined
  
  // Utilities
  refreshNotifications: () => Promise<void>
  clearExpired: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth()
  const { vendor } = useVendor()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    total_count: 0,
    unread_count: 0,
    high_priority_count: 0,
    critical_count: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!vendor?.id) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    }
  }, [vendor?.id])

  // Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    if (!vendor?.id || !user?.id) return

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('user_id', user.id)

      if (error) throw error
      setPreferences(data || [])
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
  }, [vendor?.id, user?.id])

  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    if (!vendor?.id) return

    try {
      const { data, error } = await supabase
        .rpc('get_notification_stats', {
          p_vendor_id: vendor.id,
          p_user_id: user?.id || null
        })

      if (error) throw error
      if (data && data.length > 0) {
        setStats(data[0])
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error)
    }
  }, [vendor?.id, user?.id])

  // Initialize data
  const initializeData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([
      fetchNotifications(),
      fetchPreferences(),
      fetchStats()
    ])
    setIsLoading(false)
  }, [fetchNotifications, fetchPreferences, fetchStats])

  // Setup real-time subscription
  useEffect(() => {
    if (!vendor?.id) return

    const channel = supabase
      .channel(`notification_${vendor.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `vendor_id=eq.${vendor.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification
        setNotifications(prev => [newNotification, ...prev])
        
        // Show toast for real-time notifications
        if (newNotification.priority === 'critical') {
          toast.error(newNotification.title, {
            description: newNotification.message,
            action: newNotification.action_url ? {
              label: newNotification.action_label || 'View',
              onClick: () => window.location.href = newNotification.action_url!
            } : undefined
          })
        } else if (newNotification.priority === 'high') {
          toast.warning(newNotification.title, {
            description: newNotification.message
          })
        } else {
          toast.info(newNotification.title, {
            description: newNotification.message
          })
        }
        
        // Update stats
        fetchStats()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `vendor_id=eq.${vendor.id}`
      }, (payload) => {
        const updatedNotification = payload.new as Notification
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        )
        fetchStats()
      })
      .subscribe()

    setRealtimeChannel(channel)

    return () => {
      channel.unsubscribe()
    }
  }, [vendor?.id, fetchStats])

  // Initialize on mount
  useEffect(() => {
    if (vendor?.id && user?.id) {
      initializeData()
    }
  }, [vendor?.id, user?.id, initializeData])

  // Create notification
  const createNotification = useCallback(async (notification: Partial<Notification>): Promise<string | null> => {
    if (!vendor?.id) return null

    try {
      const { data, error } = await supabase
        .rpc('create_notification', {
          p_vendor_id: vendor.id,
          p_user_id: notification.user_id || user?.id || null,
          p_type: notification.type!,
          p_title: notification.title!,
          p_message: notification.message!,
          p_metadata: notification.metadata || {},
          p_priority: notification.priority || 'medium',
          p_action_url: notification.action_url || null,
          p_action_label: notification.action_label || null,
          p_expires_at: notification.expires_at || null
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating notification:', error)
      toast.error('Failed to create notification')
      return null
    }
  }, [vendor?.id, user?.id])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const { data, error } = await supabase
        .rpc('mark_notification_read', {
          p_notification_id: notificationId,
          p_user_id: user.id
        })

      if (error) throw error
      return data || false
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }, [user?.id])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!vendor?.id || !user?.id) return

    try {
      const unreadNotifications = notifications.filter(n => n.status === 'unread')
      
      const updates = unreadNotifications.map(notification => 
        supabase
          .from('notifications')
          .update({ 
            status: 'read', 
            read_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)
      )

      await Promise.all(updates)
      await fetchNotifications()
      await fetchStats()
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }, [vendor?.id, user?.id, notifications, fetchNotifications, fetchStats])

  // Archive notification
  const archiveNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, status: 'archived' as NotificationStatus } : n)
      )
      
      await fetchStats()
      return true
    } catch (error) {
      console.error('Error archiving notification:', error)
      toast.error('Failed to archive notification')
      return false
    }
  }, [fetchStats])

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'dismissed', updated_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, status: 'dismissed' as NotificationStatus } : n)
      )
      
      await fetchStats()
      return true
    } catch (error) {
      console.error('Error dismissing notification:', error)
      toast.error('Failed to dismiss notification')
      return false
    }
  }, [fetchStats])

  // Update notification preferences
  const updatePreferences = useCallback(async (
    type: NotificationType, 
    prefs: Partial<NotificationPreferences>
  ) => {
    if (!vendor?.id || !user?.id) return

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          vendor_id: vendor.id,
          user_id: user.id,
          type,
          ...prefs,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      await fetchPreferences()
      toast.success('Notification preferences updated')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    }
  }, [vendor?.id, user?.id, fetchPreferences])

  // Get preferences for a specific type
  const getPreferences = useCallback((type: NotificationType): NotificationPreferences | undefined => {
    return preferences.find(p => p.type === type)
  }, [preferences])

  // Refresh all notifications
  const refreshNotifications = useCallback(async () => {
    await initializeData()
  }, [initializeData])

  // Clear expired notifications
  const clearExpired = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_notifications')

      if (error) throw error
      
      if (data > 0) {
        toast.success(`Cleared ${data} expired notifications`)
        await fetchNotifications()
        await fetchStats()
      }
    } catch (error) {
      console.error('Error clearing expired notifications:', error)
      toast.error('Failed to clear expired notifications')
    }
  }, [fetchNotifications, fetchStats])

  const value: NotificationContextType = {
    // State
    notifications,
    unreadCount: stats.unread_count,
    stats,
    preferences,
    isLoading,
    
    // Actions
    createNotification,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    dismissNotification,
    
    // Preferences
    updatePreferences,
    getPreferences,
    
    // Utilities
    refreshNotifications,
    clearExpired
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Notification utility hooks
export const useNotificationActions = () => {
  const { createNotification } = useNotifications()

  const notifyInvoiceCreated = useCallback(async (invoiceNumber: string, customerName: string, amount: number) => {
    return createNotification({
      type: 'invoice_created',
      title: 'New Invoice Created',
      message: `Invoice ${invoiceNumber} has been created for ${customerName}`,
      metadata: { invoice_number: invoiceNumber, customer_name: customerName, amount },
      priority: 'low',
      action_url: `/invoices/${invoiceNumber}`,
      action_label: 'View Invoice'
    })
  }, [createNotification])

  const notifyInvoicePaid = useCallback(async (invoiceNumber: string, customerName: string, amount: number) => {
    return createNotification({
      type: 'invoice_paid',
      title: 'Payment Received',
      message: `Invoice ${invoiceNumber} has been paid by ${customerName}`,
      metadata: { invoice_number: invoiceNumber, customer_name: customerName, amount },
      priority: 'high',
      action_url: `/invoices/${invoiceNumber}`,
      action_label: 'View Invoice'
    })
  }, [createNotification])

  const notifyInvoiceOverdue = useCallback(async (invoiceNumber: string, customerName: string, daysOverdue: number) => {
    return createNotification({
      type: 'invoice_overdue',
      title: 'Invoice Overdue',
      message: `Invoice ${invoiceNumber} is now ${daysOverdue} days overdue`,
      metadata: { invoice_number: invoiceNumber, customer_name: customerName, days_overdue: daysOverdue },
      priority: 'high',
      action_url: `/invoices/${invoiceNumber}`,
      action_label: 'Send Reminder'
    })
  }, [createNotification])

  const notifySecurityAlert = useCallback(async (activityType: string, details: Record<string, any>) => {
    return createNotification({
      type: 'security_alert',
      title: 'Security Alert',
      message: `Unusual activity detected: ${activityType}`,
      metadata: { activity_type: activityType, ...details },
      priority: 'critical',
      action_url: '/settings/security',
      action_label: 'Review Activity'
    })
  }, [createNotification])

  const notifyApiKeyExpiry = useCallback(async (service: string, daysUntilExpiry: number) => {
    return createNotification({
      type: 'api_key_expiry',
      title: 'API Key Expiring',
      message: `Your ${service} API key will expire in ${daysUntilExpiry} days`,
      metadata: { service, days: daysUntilExpiry },
      priority: 'high',
      action_url: '/settings/api-management',
      action_label: 'Renew Key'
    })
  }, [createNotification])

  return {
    notifyInvoiceCreated,
    notifyInvoicePaid,
    notifyInvoiceOverdue,
    notifySecurityAlert,
    notifyApiKeyExpiry
  }
}