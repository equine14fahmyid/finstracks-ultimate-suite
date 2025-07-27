
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export const useSystemNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      const formattedNotifications = data?.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type as 'info' | 'warning' | 'error' | 'success',
        read: notification.read,
        action_url: notification.action_url,
        created_at: notification.created_at
      })) || [];

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (notification: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    action_url?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          action_url: notification.action_url,
          read: false
        }]);

      if (error) {
        console.error('Error creating notification:', error);
        return;
      }

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default'
      });

      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error in createNotification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as SystemNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as SystemNotification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    createNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
};
