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
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  userRole: UserRole | null;
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

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile when logged in
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Error",
          description: "Gagal logout: " + error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout Berhasil",
          description: "Anda telah keluar dari sistem",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat logout",
        variant: "destructive",
      });
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
    signOut,
    hasPermission,
    userRole: profile?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};