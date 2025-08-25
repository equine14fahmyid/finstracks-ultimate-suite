
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import AuthErrorBoundary from '@/components/auth/ErrorBoundary';
import SessionWarning from '@/components/common/SessionWarning';
import { LoadingSpinner } from '@/components/common/OptimizedLoading';
import AppLayout from '@/components/layout/AppLayout';

// Lazy load pages for better performance
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Sales = lazy(() => import('@/pages/Sales'));
const Purchases = lazy(() => import('@/pages/Purchases'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Products = lazy(() => import('@/pages/Products'));
const Suppliers = lazy(() => import('@/pages/Suppliers'));
const Banks = lazy(() => import('@/pages/Banks'));
const Platforms = lazy(() => import('@/pages/Platforms'));
const Stores = lazy(() => import('@/pages/Stores'));
const Expeditions = lazy(() => import('@/pages/Expeditions'));
const Categories = lazy(() => import('@/pages/Categories'));
const Assets = lazy(() => import('@/pages/Assets'));
const Expenses = lazy(() => import('@/pages/Expenses'));
const Incomes = lazy(() => import('@/pages/Incomes'));
const Settlements = lazy(() => import('@/pages/Settlements'));
const Adjustments = lazy(() => import('@/pages/Adjustments'));
const Users = lazy(() => import('@/pages/Users'));
const Settings = lazy(() => import('@/pages/Settings'));
const ProfitLoss = lazy(() => import('@/pages/reports/ProfitLoss'));
const BalanceSheet = lazy(() => import('@/pages/reports/BalanceSheet'));
const CashFlow = lazy(() => import('@/pages/reports/CashFlow'));
const Analytics = lazy(() => import('@/pages/reports/Analytics'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  return (
    <AuthErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background font-sans antialiased">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected routes */}
                    <Route path="/*" element={
                      <AuthGuard>
                        <SessionWarning />
                        <AppLayout>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/sales" element={<Sales />} />
                            <Route path="/purchases" element={<Purchases />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/suppliers" element={<Suppliers />} />
                            <Route path="/banks" element={<Banks />} />
                            <Route path="/platforms" element={<Platforms />} />
                            <Route path="/stores" element={<Stores />} />
                            <Route path="/expeditions" element={<Expeditions />} />
                            <Route path="/categories" element={<Categories />} />
                            <Route path="/assets" element={<Assets />} />
                            <Route path="/expenses" element={<Expenses />} />
                            <Route path="/incomes" element={<Incomes />} />
                            <Route path="/settlements" element={<Settlements />} />
                            <Route path="/adjustments" element={<Adjustments />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/reports/profit-loss" element={<ProfitLoss />} />
                            <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
                            <Route path="/reports/cash-flow" element={<CashFlow />} />
                            <Route path="/reports/analytics" element={<Analytics />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </AppLayout>
                      </AuthGuard>
                    } />
                  </Routes>
                </Suspense>
                <Toaster />
              </div>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthErrorBoundary>
  );
}

export default App;
