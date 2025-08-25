
import { useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePerformance } from '@/hooks/usePerformance';
import Header from './Header';
import Sidebar from './Sidebar';
import { LoadingSpinner } from '@/components/common/OptimizedLoading';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const { metrics } = usePerformance('AppLayout');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center glass-card p-8 rounded-lg">
          <LoadingSpinner size="lg" className="mx-auto mb-4 text-white" />
          <p className="text-white/80 font-medium">Memuat aplikasi...</p>
          {metrics && (
            <p className="text-white/60 text-xs mt-2">
              Render: {metrics.renderTime.toFixed(2)}ms
            </p>
          )}
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        <div className="flex">
          {/* Sidebar */}
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={closeSidebar}
          />
          
          {/* Main Content */}
          <main className="flex-1 min-h-[calc(100vh-3rem)] md:min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5">
            <div className="container mx-auto max-w-7xl w-full px-3 md:px-4 lg:px-6 py-4 md:py-6">
              <Suspense 
                fallback={
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <LoadingSpinner size="lg" className="mx-auto mb-4" />
                      <p className="text-muted-foreground">Memuat halaman...</p>
                    </div>
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AppLayout;
