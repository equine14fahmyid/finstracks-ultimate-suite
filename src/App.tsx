
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/auth/AuthGuard";
import AuthErrorBoundary from "@/components/auth/ErrorBoundary";
import SessionWarning from "@/components/common/SessionWarning";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Banks from "./pages/Banks";
import Expenses from "./pages/Expenses";
import Incomes from "./pages/Incomes";
import Settlements from "./pages/Settlements";
import Adjustments from "./pages/Adjustments";
import Platforms from "./pages/Platforms";
import Stores from "./pages/Stores";
import Expeditions from "./pages/Expeditions";
import Categories from "./pages/Categories";
import Assets from "./pages/Assets";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import ProfitLoss from "./pages/reports/ProfitLoss";
import BalanceSheet from "./pages/reports/BalanceSheet";
import CashFlow from "./pages/reports/CashFlow";
import Analytics from "./pages/reports/Analytics";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.message?.includes('auth') || error?.code === 401) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <AuthErrorBoundary>
            <AuthProvider>
              <BrowserRouter>
                <div className="min-h-screen bg-background font-sans antialiased">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected routes */}
                    <Route path="/" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Index />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/dashboard" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Dashboard />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/sales/*" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Sales />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/purchases/*" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Purchases />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/products" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Products />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/inventory" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Inventory />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/suppliers" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Suppliers />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/banks" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Banks />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/expenses" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Expenses />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/incomes" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Incomes />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/settlements" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Settlements />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/adjustments" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Adjustments />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/platforms" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Platforms />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/stores" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Stores />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/expeditions" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Expeditions />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/categories" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Categories />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/assets" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Assets />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/users" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Users />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/settings" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Settings />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/reports/profit-loss" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <ProfitLoss />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/reports/balance-sheet" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <BalanceSheet />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/reports/cash-flow" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <CashFlow />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    <Route path="/reports/analytics" element={
                      <AuthGuard>
                        <AppLayout>
                          <SessionWarning />
                          <Analytics />
                        </AppLayout>
                      </AuthGuard>
                    } />
                    
                    {/* 404 Page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Toaster />
                  <Sonner />
                </div>
              </BrowserRouter>
            </AuthProvider>
          </AuthErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
