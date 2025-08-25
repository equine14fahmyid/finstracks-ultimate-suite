
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/OptimizedLoading';

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading, profile } = useAuth();
  const { isSessionValid, checkSessionValidity } = useAuthSession();
  const location = useLocation();

  useEffect(() => {
    // Check session validity when component mounts or location changes
    if (user && !loading) {
      checkSessionValidity();
    }
  }, [user, loading, location, checkSessionValidity]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !isSessionValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user profile is active
  if (profile && !profile.is_active) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Akun Tidak Aktif</h2>
          <p className="text-muted-foreground">
            Akun Anda telah dinonaktifkan. Hubungi administrator untuk mengaktifkan kembali.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
