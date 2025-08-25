
import { useEffect, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export const useAuthSession = () => {
  const { user, session, signOut } = useAuth();
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Session timeout in minutes (30 minutes default)
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  
  // Check session validity
  const checkSessionValidity = useCallback(async () => {
    if (!session) return false;

    try {
      // Check if session is expired
      const now = Date.now();
      const sessionExp = session.expires_at ? session.expires_at * 1000 : 0;
      
      if (sessionExp && now > sessionExp) {
        console.log('Session expired, attempting refresh...');
        
        // Try to refresh the session
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Session refresh failed:', error);
          setIsSessionValid(false);
          
          toast({
            title: "Sesi Berakhir",
            description: "Silakan login kembali untuk melanjutkan",
            variant: "destructive"
          });
          
          await signOut();
          return false;
        }
        
        if (data.session) {
          console.log('Session refreshed successfully');
          setIsSessionValid(true);
          return true;
        }
      }

      // Check for inactivity timeout
      if (now - lastActivity > SESSION_TIMEOUT) {
        console.log('Session timeout due to inactivity');
        setIsSessionValid(false);
        
        toast({
          title: "Sesi Timeout",
          description: "Sesi berakhir karena tidak ada aktivitas",
          variant: "destructive"
        });
        
        await signOut();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      setIsSessionValid(false);
      return false;
    }
  }, [session, lastActivity, signOut]);

  // Update last activity
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Listen for user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  // Check session validity periodically
  useEffect(() => {
    if (!user || !session) return;

    const interval = setInterval(checkSessionValidity, 60000); // Check every minute
    
    // Initial check
    checkSessionValidity();

    return () => clearInterval(interval);
  }, [user, session, checkSessionValidity]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
          setIsSessionValid(true);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setIsSessionValid(false);
        } else if (event === 'SIGNED_IN') {
          console.log('User signed in');
          setIsSessionValid(true);
          updateActivity();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [updateActivity]);

  return {
    isSessionValid,
    checkSessionValidity,
    updateActivity,
    lastActivity
  };
};
