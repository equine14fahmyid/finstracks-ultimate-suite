
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown, Package, Users, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { exportToPDF } from '@/utils/pdfExport';
import { useInteractiveAnalytics } from '@/hooks/useRealtimeAnalytics';
import InteractiveTopProductsChart from '@/components/dashboard/InteractiveTopProductsChart';
import InteractivePlatformChart from '@/components/dashboard/InteractivePlatformChart';

interface AnalyticsData {
  salesTrend: Array<{
    date: string;
    total: number;
    transaction_count: number;
  }>;
  topProducts: Array<{
    name: string;
    productName: string;
    variantName: string;
    quantity: number;
    revenue: number;
  }>;
  platformPerformance: Array<{
    platform: string;
    revenue: number;
    transaction_count: number;
  }>;
  lowStockItems: Array<{
    product_name: string;
    variant_display: string;
    current_stock: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics = () => {
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Use interactive analytics hook for drill-down functionality
  const {
    selectedProduct,
    selectedPlatform,
    drillDownData,
    loading: drillDownLoading,
    fetchProductDrillDown,
    fetchPlatformDrillDown,
    clearDrillDown
  } = useInteractiveAnalytics(
    format(startDate, 'yyyy-MM-dd'),
    format(endDate, 'yyyy-MM-dd')
  );

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics', startDate, endDate],
    queryFn: async (): Promise<AnalyticsData> => {
      try {
        // Fetch sales trend data with better error handling
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            tanggal,
            total,
            store_id,
            status,
            stores!inner(
              platform_id,
              platforms!inner(nama_platform)
            )
          `)
          .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal', format(endDate, 'yyyy-MM-dd'))
          .eq('status', 'delivered')
          .order('tanggal');

        if (salesError) throw salesError;

        // Fetch top products data with proper joins
        const { data: saleItemsData, error: itemsError } = await supabase
          .from('sale_items')
          .select(`
            quantity,
            harga_satuan,
            product_variant_id,
            product_variants!inner(
              warna,
              size,
              products!inner(nama_produk)
            ),
            sales!inner(
              tanggal,
              status
            )
          `)
          .gte('sales.tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('sales.tanggal', format(endDate, 'yyyy-MM-dd'))
          .eq('sales.status', 'delivered');

        if (itemsError) throw itemsError;

        // Fetch low stock items
        const { data: lowStockData, error: stockError } = await supabase
          .from('product_variants')
          .select(`
            stok,
            warna,
            size,
            products!inner(nama_produk)
          `)
          .eq('is_active', true)
          .lt('stok', 10)
          .order('stok');

        if (stockError) throw stockError;

        // Process sales trend
        const salesByDate = salesData?.reduce((acc: any, sale) => {
          const date = sale.tanggal;
          if (!acc[date]) {
            acc[date] = { total: 0, count: 0 };
          }
          acc[date].total += sale.total || 0;
          acc[date].count += 1;
          return acc;
        }, {}) || {};

        const salesTrend = Object.entries(salesByDate).map(([date, data]: [string, any]) => ({
          date: format(new Date(date), 'dd/MM', { locale: id }),
          total: data.total,
          transaction_count: data.count
        }));

        // Process platform performance
        const platformSales = salesData?.reduce((acc: any, sale) => {
          const platformName = sale.stores?.platforms?.nama_platform || 'Unknown';
          if (!acc[platformName]) {
            acc[platformName] = { total: 0, count: 0 };
          }
          acc[platformName].total += sale.total || 0;
          acc[platformName].count += 1;
          return acc;
        }, {}) || {};

        const platformPerformance = Object.entries(platformSales).map(([platform, data]: [string, any]) => ({
          platform,
          revenue: data.total,
          transaction_count: data.count
        }));

        // Process top products
        const productSales = saleItemsData?.reduce((acc: any, item) => {
          const productName = item.product_variants?.products?.nama_produk || 'Unknown';
          const variantName = `${item.product_variants?.warna} - ${item.product_variants?.size}`;
          const key = `${productName}_${variantName}`;
          
          if (!acc[key]) {
            acc[key] = {
              name: key,
              productName,
              variantName,
              quantity: 0,
              revenue: 0
            };
          }
          acc[key].quantity += item.quantity || 0;
          acc[key].revenue += (item.quantity || 0) * (item.harga_satuan || 0);
          return acc;
        }, {}) || {};

        const topProducts = Object.values(productSales)
          .sort((a: any, b: any) => b.revenue - a.revenue)
          .slice(0, 10);

        // Process low stock items
        const lowStockItems = lowStockData?.map(item => ({
          product_name: item.products?.nama_produk || 'Unknown',
          variant_display: `${item.warna} - ${item.size}`,
          current_stock: item.stok || 0
        })) || [];

        return {
          salesTrend,
          topProducts,
          platformPerformance,
          lowStockItems
        };
      } catch (error) {
        console.error('Analytics fetch error:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data analitik",
          variant: "destructive"
        });
        throw error;
      }
    }
  });

  const exportToPDFReport = async () => {
    try {
      await exportToPDF('analytics-content', {
        filename: `analitik-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.pdf`,
        title: 'Analitik & Laporan Performa',
        orientation: 'landscape',
        companyInfo: {
          name: 'EQUINE Fashion',
          address: 'Indonesia'
        }
      });
      toast({
        title: "Sukses",
        description: "Laporan PDF berhasil diunduh"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor PDF",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Data Diperbarui",
      description: "Data analitik telah dimuat ulang"
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analitik & Laporan Performa</h1>
          <p className="text-muted-foreground">
            Periode: {format(startDate, 'dd MMM yyyy', { locale: id })} - {format(endDate, 'dd MMM yyyy', { locale: id })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportToPDFReport} variant="outline" disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="text-sm font-medium">Tanggal Mulai</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium">Tanggal Akhir</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat data analitik...</p>
          </CardContent>
        </Card>
      ) : (
        <div id="analytics-content" className="space-y-6">
          {/* Sales Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tren Penjualan Harian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData?.salesTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'total' ? formatCurrency(value) : value,
                      name === 'total' ? 'Total Penjualan' : 'Jumlah Transaksi'
                    ]}
                  />
                  <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Interactive Platform Performance */}
            <InteractivePlatformChart
              data={analyticsData?.platformPerformance || []}
              loading={isLoading}
              onPlatformClick={fetchPlatformDrillDown}
              drillDownData={drillDownData}
              drillDownLoading={drillDownLoading}
              selectedPlatform={selectedPlatform}
              onCloseDrillDown={clearDrillDown}
            />

            {/* Interactive Top Products */}
            <InteractiveTopProductsChart
              data={analyticsData?.topProducts || []}
              loading={isLoading}
              onProductClick={fetchProductDrillDown}
              drillDownData={drillDownData}
              drillDownLoading={drillDownLoading}
              selectedProduct={selectedProduct}
              onCloseDrillDown={clearDrillDown}
            />
          </div>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingDown className="h-5 w-5" />
                Peringatan Stok Rendah (&lt; 10 pcs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData?.lowStockItems?.length ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.lowStockItems.map((item, index) => (
                    <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">{item.variant_display}</p>
                      <p className="text-sm font-bold text-red-600">Stok: {item.current_stock} pcs</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Tidak ada produk dengan stok rendah
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics;
