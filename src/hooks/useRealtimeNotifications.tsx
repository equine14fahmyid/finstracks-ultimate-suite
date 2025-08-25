
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action_url?: string;
  created_at: string;
  read: boolean;
}

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch existing notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    };

    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as NotificationData;
          setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default'
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
          const updatedNotification = payload.new as NotificationData;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          if (updatedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user?.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    } else {
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
