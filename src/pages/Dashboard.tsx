import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import DateFilter from '@/components/dashboard/DateFilter';
import SummaryCards from '@/components/dashboard/SummaryCards';
import SalesChart from '@/components/dashboard/SalesChart';
import { formatDate } from '@/utils/format';

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
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date() // Today
  });
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    total_penjualan: 0,
    total_pengeluaran: 0,
    laba_bersih: 0,
    saldo_kas_bank: 0
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard summary data
  const fetchDashboardData = async () => {
    try {
      if (!dateRange.from || !dateRange.to) return;

      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];

      // Fetch sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total, tanggal')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .eq('status', 'delivered');

      if (salesError) throw salesError;

      // Fetch expenses data
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('jumlah')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (expensesError) throw expensesError;

      // Fetch bank balances
      const { data: banksData, error: banksError } = await supabase
        .from('banks')
        .select('saldo_akhir')
        .eq('is_active', true);

      if (banksError) throw banksError;

      // Calculate totals
      const totalPenjualan = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalPengeluaran = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
      const saldoKasBank = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;

      setDashboardData({
        total_penjualan: totalPenjualan,
        total_pengeluaran: totalPengeluaran,
        laba_bersih: totalPenjualan - totalPengeluaran,
        saldo_kas_bank: saldoKasBank
      });

      // Process sales chart data
      const salesByDate = salesData?.reduce((acc, sale) => {
        const date = sale.tanggal;
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0 };
        }
        acc[date].total += sale.total || 0;
        acc[date].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const chartData = Object.entries(salesByDate || {})
        .map(([date, data]) => ({
          date,
          total: data.total,
          transaction_count: data.count
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setSalesData(chartData);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard: " + error.message,
        variant: "destructive",
      });
    }
  };

  // Initial load and refresh on date change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    loadData();
  }, [dateRange]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
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
              <Button variant="outline" className="glass-button justify-start">
                Tambah Penjualan
              </Button>
            )}
            {hasPermission('purchases.create') && (
              <Button variant="outline" className="glass-button justify-start">
                Tambah Pembelian
              </Button>
            )}
            {hasPermission('finance.create') && (
              <Button variant="outline" className="glass-button justify-start">
                Catat Pengeluaran
              </Button>
            )}
            {hasPermission('reports.read') && (
              <Button variant="outline" className="glass-button justify-start">
                Lihat Laporan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;