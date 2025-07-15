
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
import Platforms from '@/pages/Platforms';
import Stores from '@/pages/Stores';
import Expeditions from '@/pages/Expeditions';
import Categories from '@/pages/Categories';
import Purchases from '@/pages/Purchases';
import Users from '@/pages/Users';
import Settings from '@/pages/Settings';
import NotFound from "./pages/NotFound";
import ProfitLoss from '@/pages/reports/ProfitLoss';
import BalanceSheet from '@/pages/reports/BalanceSheet';
import CashFlow from '@/pages/reports/CashFlow';
import Analytics from '@/pages/reports/Analytics';
import Adjustments from '@/pages/Adjustments';
import Assets from '@/pages/Assets';

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
                <Purchases />
              </AppLayout>
            } />
            <Route path="/purchases/create" element={
              <AppLayout>
                <Purchases />
              </AppLayout>
            } />
            
            {/* Inventory Routes */}
            <Route path="/inventory" element={
              <AppLayout>
                <Inventory />
              </AppLayout>
            } />
            <Route path="/inventori/stok" element={
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
            <Route path="/adjustments" element={
              <AppLayout>
                <Adjustments />
              </AppLayout>
            } />
            
            {/* Master Data Routes */}
            <Route path="/platforms" element={
              <AppLayout>
                <Platforms />
              </AppLayout>
            } />
            <Route path="/stores" element={
              <AppLayout>
                <Stores />
              </AppLayout>
            } />
            <Route path="/expeditions" element={
              <AppLayout>
                <Expeditions />
              </AppLayout>
            } />
            <Route path="/categories" element={
              <AppLayout>
                <Categories />
              </AppLayout>
            } />
            <Route path="/master-data/asset" element={
              <AppLayout>
                <Assets />
              </AppLayout>
            } />
            <Route path="/master/assets" element={
              <AppLayout>
                <Assets />
              </AppLayout>
            } />
            <Route path="/assets" element={
              <AppLayout>
                <Assets />
              </AppLayout>
            } />
            
            {/* Report Routes */}
            <Route path="/reports/profit-loss" element={
              <AppLayout>
                <ProfitLoss />
              </AppLayout>
            } />
            <Route path="/reports/balance-sheet" element={
              <AppLayout>
                <BalanceSheet />
              </AppLayout>
            } />
            <Route path="/reports/cash-flow" element={
              <AppLayout>
                <CashFlow />
              </AppLayout>
            } />
            <Route path="/reports/analytics" element={
              <AppLayout>
                <Analytics />
              </AppLayout>
            } />
            
            {/* Admin Routes */}
            <Route path="/users" element={
              <AppLayout>
                <Users />
              </AppLayout>
            } />
            <Route path="/settings" element={
              <AppLayout>
                <Settings />
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
