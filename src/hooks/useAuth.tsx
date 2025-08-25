import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, AuthError, UserRole } from '@/types/auth';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  hasPermission: (permission: string) => boolean;
  userRole: UserRole | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Clear all auth state
  const clearAuthState = () => {
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Fetch user profile data with retry logic
  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    try {
      // Validate session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('No valid session for profile fetch:', sessionError);
        clearAuthState();
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Retry once if it's a network error
        if (retryCount < 1 && (error.message?.includes('network') || error.code === 'PGRST301')) {
          setTimeout(() => fetchUserProfile(userId, retryCount + 1), 1000);
          return;
        }
        
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          await createUserProfile(userId);
          return;
        }
        
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Create user profile if it doesn't exist
  const createUserProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: userId,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'staff' as UserRole,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session initialization error:', error);
          clearAuthState();
        } else if (session?.user && mounted) {
          setSession(session);
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthState();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Delay profile fetch to avoid race conditions
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id);
            }
          }, 100);
        } else {
          setProfile(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let message = 'Terjadi kesalahan saat login';
        
        if (error.message.includes('Invalid login credentials')) {
          message = 'Email atau password salah';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Email belum dikonfirmasi';
        } else if (error.message.includes('Too many requests')) {
          message = 'Terlalu banyak percobaan login. Coba lagi nanti';
        } else if (error.message.includes('network')) {
          message = 'Koneksi bermasalah. Periksa internet Anda';
        }

        return { error: { message } };
      }

      toast({
        title: "Login Berhasil",
        description: "Selamat datang di FINTracks Ultimate!",
      });

      return { error: null };
    } catch (error: any) {
      return { 
        error: { 
          message: error.message || 'Terjadi kesalahan yang tidak terduga' 
        } 
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        let message = 'Terjadi kesalahan saat mendaftar';
        
        if (error.message.includes('User already registered')) {
          message = 'Email sudah terdaftar. Silakan gunakan email lain atau login.';
        } else if (error.message.includes('Password should be at least')) {
          message = 'Password minimal 6 karakter';
        } else if (error.message.includes('Invalid email')) {
          message = 'Format email tidak valid';
        }

        return { error: { message } };
      }

      toast({
        title: "Registrasi Berhasil",
        description: "Silakan cek email Anda untuk konfirmasi akun",
      });

      return { error: null };
    } catch (error: any) {
      return { 
        error: { 
          message: error.message || 'Terjadi kesalahan yang tidak terduga' 
        } 
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { error: { message: 'Gagal mengirim email reset password' } };
      }

      toast({
        title: "Email Terkirim",
        description: "Silakan cek email Anda untuk reset password",
      });

      return { error: null };
    } catch (error: any) {
      return { 
        error: { 
          message: error.message || 'Terjadi kesalahan yang tidak terduga' 
        } 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Always clear local state first
      clearAuthState();
      
      // Clear localStorage
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-xkrtbwecvfdeqfkvrdcb-auth-token');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }

      // Try to sign out from Supabase (don't block on this)
      const signOutPromise = supabase.auth.signOut();
      
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari sistem",
      });

      // Force redirect immediately
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);

      // Wait for signOut to complete (but don't block the redirect)
      await signOutPromise;

    } catch (error: any) {
      console.error('SignOut error:', error);
      
      // Even if there's an error, ensure redirect happens
      toast({
        title: "Logout",
        description: "Anda telah keluar dari sistem",
      });
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    
    const rolePermissions: Record<UserRole, string[]> = {
      superadmin: ['*'],
      admin: [
        'dashboard.view', 'sales.*', 'purchases.*', 'inventory.*', 
        'finance.*', 'reports.*', 'settings.*'
      ],
      staff: [
        'dashboard.view', 'sales.create', 'sales.read', 'sales.update',
        'purchases.create', 'purchases.read', 'purchases.update',
        'inventory.read', 'inventory.update'
      ],
      viewers: ['dashboard.view', 'reports.read']
    };

    const permissions = rolePermissions[profile.role];
    return permissions.includes('*') || 
           permissions.includes(permission) ||
           permissions.some(p => p.endsWith('.*') && permission.startsWith(p.slice(0, -1)));
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasPermission,
    userRole: profile?.role || null,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
