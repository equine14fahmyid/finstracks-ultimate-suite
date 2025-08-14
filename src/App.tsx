
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/hooks/useNotifications";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Banks from "./pages/Banks";
import Platforms from "./pages/Platforms";
import Stores from "./pages/Stores";
import Expeditions from "./pages/Expeditions";
import Categories from "./pages/Categories";
import Assets from "./pages/Assets";
import Expenses from "./pages/Expenses";
import Incomes from "./pages/Incomes";
import Settlements from "./pages/Settlements";
import Adjustments from "./pages/Adjustments";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProfitLoss from "./pages/reports/ProfitLoss";
import BalanceSheet from "./pages/reports/BalanceSheet";
import CashFlow from "./pages/reports/CashFlow";
import Analytics from "./pages/reports/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/sales" element={<AppLayout><Sales /></AppLayout>} />
              <Route path="/purchases" element={<AppLayout><Purchases /></AppLayout>} />
              <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
              <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
              <Route path="/suppliers" element={<AppLayout><Suppliers /></AppLayout>} />
              <Route path="/banks" element={<AppLayout><Banks /></AppLayout>} />
              <Route path="/platforms" element={<AppLayout><Platforms /></AppLayout>} />
              <Route path="/stores" element={<AppLayout><Stores /></AppLayout>} />
              <Route path="/expeditions" element={<AppLayout><Expeditions /></AppLayout>} />
              <Route path="/categories" element={<AppLayout><Categories /></AppLayout>} />
              <Route path="/assets" element={<AppLayout><Assets /></AppLayout>} />
              <Route path="/expenses" element={<AppLayout><Expenses /></AppLayout>} />
              <Route path="/incomes" element={<AppLayout><Incomes /></AppLayout>} />
              <Route path="/settlements" element={<AppLayout><Settlements /></AppLayout>} />
              <Route path="/adjustments" element={<AppLayout><Adjustments /></AppLayout>} />
              <Route path="/users" element={<AppLayout><Users /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
              <Route path="/reports/profit-loss" element={<AppLayout><ProfitLoss /></AppLayout>} />
              <Route path="/reports/balance-sheet" element={<AppLayout><BalanceSheet /></AppLayout>} />
              <Route path="/reports/cash-flow" element={<AppLayout><CashFlow /></AppLayout>} />
              <Route path="/reports/analytics" element={<AppLayout><Analytics /></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
