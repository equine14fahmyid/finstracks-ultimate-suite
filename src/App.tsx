import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
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
            
            {/* Placeholder routes for future features */}
            <Route path="/sales" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Penjualan</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/purchases" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Pembelian</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/products" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Produk</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/inventory" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Stok</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/incomes" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Pemasukan</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/expenses" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Pengeluaran</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/banks" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Bank</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/suppliers" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Supplier</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/platforms" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Platform</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/stores" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Toko</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/reports/*" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Laporan</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/settings" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Pengaturan</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
              </AppLayout>
            } />
            
            <Route path="/users" element={
              <AppLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Pengguna</h1>
                  <p className="text-muted-foreground">Fitur akan ditambahkan pada versi berikutnya</p>
                </div>
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
