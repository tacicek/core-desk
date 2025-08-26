import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Bell, 
  X, 
  Check, 
  Archive, 
  Settings,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  ExternalLink,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { 
  useNotifications, 
  Notification, 
  NotificationPriority,
  NotificationStatus 
} from '@/contexts/NotificationContext'

// Notification Bell Icon with Badge
export const NotificationBell = () => {
  const { unreadCount, stats } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getPriorityColor = () => {
    if (stats.critical_count > 0) return 'bg-red-500'
    if (stats.high_priority_count > 0) return 'bg-orange-500'
    if (unreadCount > 0) return 'bg-blue-500'
    return 'bg-gray-400'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                getPriorityColor()
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationCenter onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

// Main Notification Center
interface NotificationCenterProps {
  onClose?: () => void
}

export const NotificationCenter = ({ onClose }: NotificationCenterProps) => {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    isLoading,
    refreshNotifications 
  } = useNotifications()
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return notification.status === 'unread'
    }
    return notification.status !== 'archived' && notification.status !== 'dismissed'
  })

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const handleRefresh = async () => {
    await refreshNotifications()
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            filter === 'all' 
              ? "border-b-2 border-blue-500 text-blue-600" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            filter === 'unread' 
              ? "border-b-2 border-blue-500 text-blue-600" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <ScrollArea className="h-96">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Notification Settings
        </Button>
      </div>
    </div>
  )
}

// Individual Notification Item
interface NotificationItemProps {
  notification: Notification
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { markAsRead, archiveNotification, dismissNotification } = useNotifications()

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const handleMarkRead = async () => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id)
    }
  }

  const handleArchive = async () => {
    await archiveNotification(notification.id)
  }

  const handleDismiss = async () => {
    await dismissNotification(notification.id)
  }

  const handleActionClick = () => {
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
    handleMarkRead()
  }

  return (
    <div 
      className={cn(
        "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
        notification.status === 'unread' && "bg-blue-50 border-l-4 border-l-blue-500"
      )}
      onClick={handleMarkRead}
    >
      <div className="flex items-start gap-3">
        {/* Priority Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getPriorityIcon(notification.priority)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={cn(
                "text-sm font-medium truncate",
                notification.status === 'unread' ? "text-gray-900" : "text-gray-700"
              )}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {notification.status === 'unread' && (
                  <DropdownMenuItem onClick={handleMarkRead}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark as read
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDismiss}>
                  <X className="h-4 w-4 mr-2" />
                  Dismiss
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            
            {notification.action_url && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-6 px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleActionClick()
                }}
              >
                {notification.action_label || 'View'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Notification Badge for displaying counts
interface NotificationBadgeProps {
  count: number
  priority?: NotificationPriority
  className?: string
}

export const NotificationBadge = ({ count, priority = 'medium', className }: NotificationBadgeProps) => {
  if (count === 0) return null

  const getPriorityStyle = () => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-blue-500 text-white'
      case 'low':
        return 'bg-green-500 text-white'
    }
  }

  return (
    <Badge 
      className={cn(
        "h-5 w-5 flex items-center justify-center p-0 text-xs",
        getPriorityStyle(),
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  )
}

// Notification Toast Component (for use with sonner)
export const createNotificationToast = (notification: Notification) => {
  const getToastAction = () => {
    if (!notification.action_url) return undefined
    
    return {
      label: notification.action_label || 'View',
      onClick: () => window.location.href = notification.action_url!
    }
  }

  return {
    title: notification.title,
    description: notification.message,
    action: getToastAction(),
    duration: notification.priority === 'critical' ? 10000 : 5000
  }
}

// Notification Status Indicator
interface NotificationStatusProps {
  status: NotificationStatus
  className?: string
}

export const NotificationStatus = ({ status, className }: NotificationStatusProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'unread':
        return 'bg-blue-500'
      case 'read':
        return 'bg-gray-400'
      case 'archived':
        return 'bg-yellow-500'
      case 'dismissed':
        return 'bg-red-500'
    }
  }

  return (
    <div 
      className={cn(
        "w-2 h-2 rounded-full",
        getStatusColor(),
        className
      )}
      title={`Status: ${status}`}
    />
  )
}

// Empty State Component
export const NotificationEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Bell className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No notifications yet
      </h3>
      <p className="text-sm text-gray-500 max-w-sm">
        When you have new activities, invoices, or important updates, 
        they'll appear here.
      </p>
    </div>
  )
}