
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  AlertTriangle, 
  Eye,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { useTopProducts, usePlatformPerformance } from '@/hooks/useSupabase';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { PlatformPerformanceChart } from '@/components/dashboard/PlatformPerformanceChart';
import { InteractiveTopProductsChart } from '@/components/dashboard/InteractiveTopProductsChart';
import { InteractivePlatformChart } from '@/components/dashboard/InteractivePlatformChart';
import { formatCurrency, formatDate } from '@/utils/format';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  const startDate = dateRange.from.toISOString().split('T')[0];
  const endDate = dateRange.to.toISOString().split('T')[0];

  const { 
    salesData, 
    totalRevenue, 
    totalOrders, 
    loading: realtimeLoading, 
    error: realtimeError,
    refreshData: refreshRealtimeData
  } = useRealtimeAnalytics(startDate, endDate);

  const { 
    data: topProducts, 
    loading: topProductsLoading, 
    error: topProductsError 
  } = useTopProducts(startDate, endDate, 5);

  const { 
    data: platformPerformance, 
    loading: platformLoading, 
    error: platformError 
  } = usePlatformPerformance(startDate, endDate);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshRealtimeData();
    } finally {
      setRefreshing(false);
    }
  };

  const totalCustomers = salesData?.length || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Transform sales data for charts
  const salesChartData = salesData?.map(sale => ({
    date: formatDate(sale.tanggal),
    revenue: sale.total,
    orders: 1
  })) || [];

  // Group sales by date for trend analysis
  const salesByDate = salesData?.reduce((acc, sale) => {
    const date = sale.tanggal;
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, orders: 0 };
    }
    acc[date].revenue += sale.total;
    acc[date].orders += 1;
    return acc;
  }, {} as Record<string, { date: string; revenue: number; orders: number }>) || {};

  const trendData = Object.values(salesByDate).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Recent activity data
  const recentActivity = salesData?.slice(0, 5).map(sale => ({
    id: sale.id,
    type: 'sale' as const,
    description: `Penjualan ${sale.no_pesanan_platform}`,
    amount: sale.total,
    date: sale.tanggal,
    customer: sale.customer_name,
    status: sale.status
  })) || [];

  // Low stock alerts (mock data for now)
  const lowStockAlerts = [
    { id: 1, product: 'Kaos Polos Hitam', variant: 'M', stock: 3 },
    { id: 2, product: 'Celana Jeans', variant: 'L', stock: 2 },
    { id: 3, product: 'Jaket Hoodie', variant: 'XL', stock: 1 }
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang di sistem manajemen keuangan EQUINE
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('overview')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('detailed')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Detailed
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Dari Tanggal</label>
              <Input
                type="date"
                value={dateRange.from.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sampai Tanggal</label>
              <Input
                type="date"
                value={dateRange.to.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filter
            </Button>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Menampilkan data dari {formatDate(dateRange.from)} sampai {formatDate(dateRange.to)}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Periode terpilih</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Transaksi selesai</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Nilai Pesanan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">Per transaksi</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Pelanggan aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tren Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {realtimeLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : realtimeError ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Error loading sales data</p>
              </div>
            ) : trendData.length > 0 ? (
              <SalesChart data={trendData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Tidak ada data penjualan untuk periode ini</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : topProductsError ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Error loading top products</p>
              </div>
            ) : topProducts.length > 0 ? (
              viewMode === 'detailed' ? (
                <InteractiveTopProductsChart data={topProducts} />
              ) : (
                <TopProductsChart data={topProducts} />
              )
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Tidak ada data produk untuk periode ini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performa Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          {platformLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : platformError ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Error loading platform performance</p>
            </div>
          ) : platformPerformance.length > 0 ? (
            viewMode === 'detailed' ? (
              <InteractivePlatformChart data={platformPerformance} />
            ) : (
              <PlatformPerformanceChart data={platformPerformance} />
            )
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Tidak ada data platform untuk periode ini</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.customer} • {formatDate(activity.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        {formatCurrency(activity.amount)}
                      </p>
                      <Badge variant={activity.status === 'delivered' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Tidak ada aktivitas terbaru</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <p className="font-medium">{alert.product}</p>
                    <p className="text-sm text-muted-foreground">Varian: {alert.variant}</p>
                  </div>
                  <Badge variant="destructive">
                    {alert.stock} pcs
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
