
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Suppliers from '@/pages/Suppliers';
import Products from '@/pages/Products';
import Sales from '@/pages/Sales';
import Inventory from '@/pages/Inventory';
import Incomes from '@/pages/Incomes';
import Expenses from '@/pages/Expenses';
import Banks from '@/pages/Banks';
import Settlements from '@/pages/Settlements';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            } />
            
            <Route path="/sales" element={
              <AppLayout>
                <Sales />
              </AppLayout>
            } />
            
            <Route path="/products" element={
              <AppLayout>
                <Products />
              </AppLayout>
            } />
            
            <Route path="/suppliers" element={
              <AppLayout>
                <Suppliers />
              </AppLayout>
            } />
            
            {/* Sales Routes */}
            <Route path="/sales/create" element={
              <AppLayout>
                <Sales />
              </AppLayout>
            } />
            
            {/* Purchase Routes */}
            <Route path="/purchases" element={
              <AppLayout>
                <div className="p-6"><h1>Purchases - Coming Soon</h1></div>
              </AppLayout>
            } />
            <Route path="/purchases/create" element={
              <AppLayout>
                <div className="p-6"><h1>Create Purchase - Coming Soon</h1></div>
              </AppLayout>
            } />
            
            {/* Inventory Routes */}
            <Route path="/inventory" element={
              <AppLayout>
                <Inventory />
              </AppLayout>
            } />
            
            {/* Finance Routes */}
            <Route path="/incomes" element={
              <AppLayout>
                <Incomes />
              </AppLayout>
            } />
            <Route path="/expenses" element={
              <AppLayout>
                <Expenses />
              </AppLayout>
            } />
            <Route path="/banks" element={
              <AppLayout>
                <Banks />
              </AppLayout>
            } />
            <Route path="/settlements" element={
              <AppLayout>
                <Settlements />
              </AppLayout>
            } />
            
            {/* Master Data Routes */}
            <Route path="/platforms" element={
              <AppLayout>
                <div className="p-6"><h1>Platforms - Coming Soon</h1></div>
              </AppLayout>
            } />
            <Route path="/stores" element={
              <AppLayout>
                <div className="p-6"><h1>Stores - Coming Soon</h1></div>
              </AppLayout>
            } />
            <Route path="/expeditions" element={
              <AppLayout>
                <div className="p-6"><h1>Expeditions - Coming Soon</h1></div>
              </AppLayout>
            } />
            <Route path="/categories" element={
              <AppLayout>
                <div className="p-6"><h1>Categories - Coming Soon</h1></div>
              </AppLayout>
            } />
            
            {/* Report Routes */}
            <Route path="/reports/profit-loss" element={
              <AppLayout>
                <div className="p-6"><h1>Profit Loss Report - Coming Soon</h1></div>
              </AppLayout>
            } />
            <Route path="/reports/balance-sheet" element={
              <AppLayout>
                <div className="p-6"><h1>Balance Sheet - Coming Soon</h1></div>
              </AppLayout>
            } />
            <Route path="/reports/cash-flow" element={
              <AppLayout>
                <div className="p-6"><h1>Cash Flow Report - Coming Soon</h1></div>
              </AppLayout>
            } />
            <Route path="/reports/analytics" element={
              <AppLayout>
                <div className="p-6"><h1>Analytics - Coming Soon</h1></div>
              </AppLayout>
            } />
            
            {/* Admin Routes */}
            <Route path="/users" element={
              <AppLayout>
                <div className="p-6"><h1>User Management - Coming Soon</h1></div>
              </AppLayout>
            } />
            <Route path="/settings" element={
              <AppLayout>
                <div className="p-6"><h1>Settings - Coming Soon</h1></div>
              </AppLayout>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
