import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";

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
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="sales" element={<Sales />} />
                <Route path="customers" element={<Customers />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="settings" element={<Settings />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
