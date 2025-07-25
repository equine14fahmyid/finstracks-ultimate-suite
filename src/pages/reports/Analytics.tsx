
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { InteractiveTopProductsChart } from '@/components/dashboard/InteractiveTopProductsChart';
import { InteractivePlatformChart } from '@/components/dashboard/InteractivePlatformChart';
import { useInteractiveAnalytics } from '@/hooks/useRealtimeAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Package, ShoppingCart, Users, DollarSign, Download, RefreshCw } from 'lucide-react';
import { exportToPDF } from '@/utils/pdfExport';

// Define proper types for analytics data
interface TopProductData {
  name: string;
  productName: string;
  variantName: string;
  quantity: number;
  revenue: number;
}

interface PlatformData {
  name: string;
  revenue: number;
  orders: number;
  commission: number;
}

interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  topProducts: TopProductData[];
  platformPerformance: PlatformData[];
  salesTrend: Array<{ date: string; sales: number; orders: number }>;
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [analyticsData, setAnalyticsData] = useState<SalesAnalytics>({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topProducts: [],
    platformPerformance: [],
    salesTrend: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const {
    selectedProduct,
    selectedPlatform,
    drillDownData,
    loading: drillDownLoading,
    fetchProductDrillDown,
    fetchPlatformDrillDown,
    clearDrillDown
  } = useInteractiveAnalytics(dateRange.startDate, dateRange.endDate);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            quantity,
            harga_satuan,
            product_variant:product_variants(
              id,
              warna,
              size,
              product:products(nama_produk)
            )
          ),
          store:stores(
            nama_toko,
            platform:platforms(nama_platform, komisi_default_persen)
          )
        `)
        .gte('tanggal', dateRange.startDate)
        .lte('tanggal', dateRange.endDate)
        .eq('status', 'delivered');

      if (salesError) throw salesError;

      // Process data
      const totalSales = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalOrders = salesData?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Top products analysis
      const productMap = new Map<string, { quantity: number; revenue: number; productName: string; variantName: string }>();
      
      salesData?.forEach(sale => {
        sale.sale_items?.forEach((item: any) => {
          if (item.product_variant?.product?.nama_produk) {
            const key = `${item.product_variant.product.nama_produk}-${item.product_variant.warna}-${item.product_variant.size}`;
            const existing = productMap.get(key) || { 
              quantity: 0, 
              revenue: 0, 
              productName: item.product_variant.product.nama_produk,
              variantName: `${item.product_variant.warna} / ${item.product_variant.size}`
            };
            existing.quantity += item.quantity || 0;
            existing.revenue += (item.quantity || 0) * (item.harga_satuan || 0);
            productMap.set(key, existing);
          }
        });
      });

      const topProducts: TopProductData[] = Array.from(productMap.entries())
        .map(([key, data]) => ({
          name: key,
          productName: data.productName,
          variantName: data.variantName,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Platform performance
      const platformMap = new Map<string, { revenue: number; orders: number; commission: number }>();
      
      salesData?.forEach(sale => {
        if (sale.store?.platform?.nama_platform) {
          const platformName = sale.store.platform.nama_platform;
          const existing = platformMap.get(platformName) || { revenue: 0, orders: 0, commission: 0 };
          existing.revenue += sale.total || 0;
          existing.orders += 1;
          existing.commission += (sale.total || 0) * ((sale.store.platform.komisi_default_persen || 0) / 100);
          platformMap.set(platformName, existing);
        }
      });

      const platformPerformance: PlatformData[] = Array.from(platformMap.entries())
        .map(([name, data]) => ({
          name,
          revenue: data.revenue,
          orders: data.orders,
          commission: data.commission
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Sales trend (daily)
      const trendMap = new Map<string, { sales: number; orders: number }>();
      salesData?.forEach(sale => {
        const date = sale.tanggal;
        const existing = trendMap.get(date) || { sales: 0, orders: 0 };
        existing.sales += sale.total || 0;
        existing.orders += 1;
        trendMap.set(date, existing);
      });

      const salesTrend = Array.from(trendMap.entries())
        .map(([date, data]) => ({
          date: formatDate(date),
          sales: data.sales,
          orders: data.orders
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setAnalyticsData({
        totalSales,
        totalOrders,
        avgOrderValue,
        topProducts,
        platformPerformance,
        salesTrend
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange.startDate, dateRange.endDate]);

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF('analytics-report', `Analytics_Report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <div className="container mx-auto py-4 md:py-8 px-3 md:px-6 space-y-4 md:space-y-8" id="analytics-report">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Analisis mendalam performa penjualan dan produk
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <DateFilter onDateRangeChange={handleDateRangeChange} />
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm" disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Penjualan</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.totalSales)}</p>
              </div>
              <DollarSign className="h-4 w-4 text-success ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pesanan</p>
                <p className="text-2xl font-bold">{analyticsData.totalOrders}</p>
              </div>
              <ShoppingCart className="h-4 w-4 text-info ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rata-rata Pesanan</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.avgOrderValue)}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-warning ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produk Aktif</p>
                <p className="text-2xl font-bold">{analyticsData.topProducts.length}</p>
              </div>
              <Package className="h-4 w-4 text-success ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="products" className="flex-1 sm:flex-none">Produk</TabsTrigger>
          <TabsTrigger value="platforms" className="flex-1 sm:flex-none">Platform</TabsTrigger>
          <TabsTrigger value="trends" className="flex-1 sm:flex-none">Tren</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tren Penjualan Harian</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'sales' ? formatCurrency(Number(value)) : value,
                      name === 'sales' ? 'Penjualan' : 'Pesanan'
                    ]} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Penjualan" />
                    <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Pesanan" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.platformPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {analyticsData.platformPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Produk (Interactive)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Klik pada produk untuk melihat detail performa
              </p>
            </CardHeader>
            <CardContent>
              <InteractiveTopProductsChart
                data={analyticsData.topProducts}
                onProductClick={fetchProductDrillDown}
                loading={loading}
              />
            </CardContent>
          </Card>

          {selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle>Detail Performa Produk</CardTitle>
                <Button onClick={clearDrillDown} variant="outline" size="sm">
                  Kembali ke Overview
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={drillDownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity_sold" fill="#8884d8" name="Qty Terjual" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performa Platform (Interactive)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Klik pada platform untuk melihat detail performa
              </p>
            </CardHeader>
            <CardContent>
              <InteractivePlatformChart
                data={analyticsData.platformPerformance}
                onPlatformClick={fetchPlatformDrillDown}
                loading={loading}
              />
            </CardContent>
          </Card>

          {selectedPlatform && (
            <Card>
              <CardHeader>
                <CardTitle>Detail Performa Platform</CardTitle>
                <Button onClick={clearDrillDown} variant="outline" size="sm">
                  Kembali ke Overview
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={drillDownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="transaction_count" stroke="#8884d8" name="Transaksi" />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisis Tren Mendalam</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'sales' ? formatCurrency(Number(value)) : value,
                    name === 'sales' ? 'Penjualan' : 'Pesanan'
                  ]} />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Penjualan" />
                  <Bar dataKey="orders" fill="#82ca9d" name="Pesanan" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
