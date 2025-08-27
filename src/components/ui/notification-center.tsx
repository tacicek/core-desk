import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bell, 
  Mail, 
  FileText, 
  Upload, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  X,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useVendor } from '@/contexts/VendorContext';

interface Notification {
  id: string;
  type: 'email' | 'upload' | 'invoice_due' | 'payment' | 'system' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

const NotificationCenter = () => {
  const { vendor } = useVendor();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load notifications from Supabase or fallback to local storage
  const loadNotifications = async () => {
    if (!vendor?.id) {
      setLoading(false);
      return;
    }

    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedNotifications: Notification[] = (data || []).map(n => ({
        id: n.id,
        type: n.type as Notification['type'],
        title: n.title,
        message: n.message,
        timestamp: new Date(n.created_at),
        read: n.read,
        priority: n.priority as Notification['priority'],
        actionUrl: n.action_url
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications from Supabase, falling back to local storage:', error);
      
      // Fallback to local storage
      try {
        const localData = localStorage.getItem('invoice-app-notifications');
        if (localData) {
          const localNotifications = JSON.parse(localData);
          const vendorNotifications = localNotifications.filter((n: any) => 
            n.vendor_id === vendor.id
          );
          
          const formattedNotifications: Notification[] = vendorNotifications.map((n: any) => ({
            id: n.id || crypto.randomUUID(),
            type: n.type || 'system',
            title: n.title || 'Notification',
            message: n.message || 'No message',
            timestamp: new Date(n.created_at || Date.now()),
            read: n.read || false,
            priority: n.priority || 'medium',
            actionUrl: n.action_url
          }));
          
          setNotifications(formattedNotifications);
        } else {
          // Create sample notifications for demonstration
          const sampleNotifications: Notification[] = [
            {
              id: '1',
              type: 'invoice_due',
              title: 'Fällige Rechnung',
              message: 'Rechnung F-2024-001 ist in 3 Tagen fällig',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
              read: false,
              priority: 'high',
              actionUrl: '/invoices'
            },
            {
              id: '2',
              type: 'payment',
              title: 'Zahlung erhalten',
              message: 'Rechnung F-2024-002 wurde bezahlt',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
              read: true,
              priority: 'medium',
              actionUrl: '/invoices'
            },
            {
              id: '3',
              type: 'system',
              title: 'System Update',
              message: 'Neue Features sind verfügbar',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
              read: false,
              priority: 'low',
              actionUrl: '/settings'
            }
          ];
          
          setNotifications(sampleNotifications);
        }
      } catch (localError) {
        console.error('Error loading from local storage:', localError);
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!vendor?.id) return;

    loadNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `vendor_id=eq.${vendor.id}`
        },
        () => {
          loadNotifications(); // Reload notifications on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendor?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'upload': return <Upload className="h-4 w-4" />;
      case 'invoice_due': return <Clock className="h-4 w-4" />;
      case 'payment': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'high') return 'text-red-500';
    if (type === 'payment') return 'text-green-500';
    if (type === 'warning') return 'text-yellow-500';
    return 'text-blue-500';
  };

  const markAsRead = async (id: string) => {
    try {
      // Try to update in Supabase first
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read in Supabase, updating locally:', error);
      
      // Update locally
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      
      // Save to local storage
      try {
        const localData = localStorage.getItem('invoice-app-notifications');
        if (localData) {
          const localNotifications = JSON.parse(localData);
          const updatedNotifications = localNotifications.map((n: any) => 
            n.id === id ? { ...n, read: true } : n
          );
          localStorage.setItem('invoice-app-notifications', JSON.stringify(updatedNotifications));
        }
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!vendor?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('vendor_id', vendor.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 p-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Benachrichtigungen</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Alle als gelesen markieren
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Keine Benachrichtigungen</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.read ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={getNotificationColor(notification.type, notification.priority)}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <CardTitle className="text-sm">{notification.title}</CardTitle>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {notification.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            Wichtig
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <CardDescription className="text-xs mb-2">
                      {notification.message}
                    </CardDescription>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notification.timestamp, { 
                        addSuffix: true, 
                        locale: de 
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-3">
          <Button 
            variant="outline" 
            className="w-full text-sm" 
            onClick={() => setOpen(false)}
          >
            Schließen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;