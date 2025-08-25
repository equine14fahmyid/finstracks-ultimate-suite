
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Settings from "./pages/Settings";
import Incomes from "./pages/Incomes";
import Expenses from "./pages/Expenses";
import Banks from "./pages/Banks";
import Platforms from "./pages/Platforms";
import Stores from "./pages/Stores";
import Expeditions from "./pages/Expeditions";
import Assets from "./pages/Assets";
import Users from "./pages/Users";
import Settlements from "./pages/Settlements";
import Adjustments from "./pages/Adjustments";
import NotFound from "./pages/NotFound";
import ProfitLoss from "./pages/reports/ProfitLoss";
import BalanceSheet from "./pages/reports/BalanceSheet";
import CashFlow from "./pages/reports/CashFlow";
import Analytics from "./pages/reports/Analytics";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<AppLayout><Outlet /></AppLayout>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Sales Routes */}
                <Route path="sales" element={<Sales />} />
                <Route path="sales/create" element={<Sales />} />
                
                {/* Purchase Routes */}
                <Route path="purchases" element={<Purchases />} />
                <Route path="purchases/create" element={<Purchases />} />
                
                {/* Inventory Routes */}
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="suppliers" element={<Suppliers />} />
                
                {/* Finance Routes */}
                <Route path="incomes" element={<Incomes />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="banks" element={<Banks />} />
                <Route path="settlements" element={<Settlements />} />
                <Route path="adjustments" element={<Adjustments />} />
                
                {/* Master Data Routes */}
                <Route path="platforms" element={<Platforms />} />
                <Route path="stores" element={<Stores />} />
                <Route path="expeditions" element={<Expeditions />} />
                <Route path="categories" element={<Categories />} />
                <Route path="assets" element={<Assets />} />
                
                {/* Report Routes */}
                <Route path="reports/profit-loss" element={<ProfitLoss />} />
                <Route path="reports/balance-sheet" element={<BalanceSheet />} />
                <Route path="reports/cash-flow" element={<CashFlow />} />
                <Route path="reports/analytics" element={<Analytics />} />
                
                {/* Admin Routes */}
                <Route path="users" element={<Users />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
