import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Eye, Plus, ShoppingCart, CreditCard, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import DateFilter from '@/components/dashboard/DateFilter';
import SummaryCards from '@/components/dashboard/SummaryCards';
import SalesChart from '@/components/dashboard/SalesChart';
import { formatDate } from '@/utils/format';
import { useDashboardAnalytics } from '@/hooks/useSupabase';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DashboardData {
  total_penjualan: number;
  total_pengeluaran: number;
  laba_bersih: number;
  saldo_kas_bank: number;
}

interface SalesData {
  date: string;
  total: number;
  transaction_count: number;
}

const Dashboard = () => {
  const { profile, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date() // Today
  });
  const [refreshing, setRefreshing] = useState(false);

  // Use the new analytics hook
  const startDate = dateRange.from?.toISOString().split('T')[0] || '';
  const endDate = dateRange.to?.toISOString().split('T')[0] || '';
  
  const { 
    data: dashboardData, 
    salesChart: salesData, 
    loading: analyticsLoading 
  } = useDashboardAnalytics(startDate, endDate);

  // Set loading based on analytics loading
  const loading = analyticsLoading;

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger refresh by changing date range slightly
    setDateRange(prev => ({ ...prev }));
    setRefreshing(false);
    toast({
      title: "Berhasil",
      description: "Data dashboard telah diperbarui",
    });
  };

  // Check permissions
  if (!hasPermission('dashboard.view')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card border-0 p-8 text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
          <p className="text-muted-foreground">
            Anda tidak memiliki izin untuk melihat dashboard ini.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang, {profile?.full_name}! Berikut ringkasan bisnis Anda.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="glass-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {hasPermission('reports.export') && (
            <Button size="sm" className="gradient-primary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Filter Periode
            <span className="text-sm font-normal text-muted-foreground">
              ({formatDate(dateRange.from || new Date())} - {formatDate(dateRange.to || new Date())})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateFilter
            value={dateRange}
            onChange={setDateRange}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <SummaryCards data={dashboardData} loading={loading} />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2">
          <SalesChart data={salesData} loading={loading} />
        </div>

        {/* Additional Charts would go here */}
        <Card className="glass-card border-0 hover-lift">
          <CardHeader>
            <CardTitle className="text-lg">Top Produk</CardTitle>
            <p className="text-sm text-muted-foreground">Produk terlaris periode ini</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chart akan ditambahkan pada versi berikutnya</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 hover-lift">
          <CardHeader>
            <CardTitle className="text-lg">Performa Platform</CardTitle>
            <p className="text-sm text-muted-foreground">Penjualan per platform</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chart akan ditambahkan pada versi berikutnya</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          <p className="text-sm text-muted-foreground">Akses cepat ke fitur yang sering digunakan</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {hasPermission('sales.create') && (
              <Button 
                variant="outline" 
                className="glass-button justify-start h-auto p-4 flex-col items-start gap-2"
                onClick={() => navigate('/sales')}
              >
                <Plus className="h-5 w-5 text-success" />
                <div className="text-left">
                  <div className="font-medium">Tambah Penjualan</div>
                  <div className="text-xs text-muted-foreground">Input transaksi penjualan</div>
                </div>
              </Button>
            )}
            {hasPermission('purchases.create') && (
              <Button 
                variant="outline" 
                className="glass-button justify-start h-auto p-4 flex-col items-start gap-2"
                onClick={() => navigate('/purchases')}
              >
                <ShoppingCart className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Tambah Pembelian</div>
                  <div className="text-xs text-muted-foreground">Input pembelian barang</div>
                </div>
              </Button>
            )}
            {hasPermission('finance.create') && (
              <Button 
                variant="outline" 
                className="glass-button justify-start h-auto p-4 flex-col items-start gap-2"
                onClick={() => navigate('/expenses')}
              >
                <CreditCard className="h-5 w-5 text-warning" />
                <div className="text-left">
                  <div className="font-medium">Catat Pengeluaran</div>
                  <div className="text-xs text-muted-foreground">Input biaya operasional</div>
                </div>
              </Button>
            )}
            {hasPermission('reports.read') && (
              <Button 
                variant="outline" 
                className="glass-button justify-start h-auto p-4 flex-col items-start gap-2"
                onClick={() => navigate('/reports/analytics')}
              >
                <FileText className="h-5 w-5 text-secondary" />
                <div className="text-left">
                  <div className="font-medium">Lihat Laporan</div>
                  <div className="text-xs text-muted-foreground">Analisis & laporan</div>
                </div>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;