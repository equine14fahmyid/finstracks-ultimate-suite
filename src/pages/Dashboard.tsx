import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Eye, Plus, ShoppingCart, CreditCard, FileText, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import DateFilter from '@/components/dashboard/DateFilter';
import SummaryCards from '@/components/dashboard/SummaryCards';
import InteractiveTopProductsChart from '@/components/dashboard/InteractiveTopProductsChart';
import InteractivePlatformChart from '@/components/dashboard/InteractivePlatformChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate, formatCurrency } from '@/utils/format';
import { useRealtimeDashboard, useInteractiveAnalytics } from '@/hooks/useRealtimeAnalytics';
import { useTopProducts, usePlatformPerformance } from '@/hooks/useSupabase';
import { exportToPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';
import { supabase } from '@/integrations/supabase/client';

// Interface untuk rentang tanggal
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Interface untuk data analytics
interface TopProductData {
  name: string;
  productName: string;
  variantName: string;
  quantity: number;
  revenue: number;
}

interface PlatformData {
  platform: string;
  revenue: number;
  transaction_count: number;
}

interface SalesChartData {
  date: string;
  total: number;
  transaction_count: number;
}

const Dashboard = () => {
  const { profile, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Hari pertama bulan ini
    to: new Date() // Hari ini
  });
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Menggunakan hooks analitik yang telah ditingkatkan
  const startDate = dateRange.from?.toISOString().split('T')[0] || '';
  const endDate = dateRange.to?.toISOString().split('T')[0] || '';
  
  // Data dashboard real-time
  const { 
    data: dashboardData, 
    salesChart: salesData, 
    loading: analyticsLoading,
    lastUpdate,
    refresh: refreshDashboard
  } = useRealtimeDashboard(startDate, endDate);

  // Data produk terlaris dan platform
  const { 
    data: topProductsData, 
    loading: topProductsLoading,
    error: topProductsError
  } = useTopProducts(startDate, endDate, 5);

  const { 
    data: platformData, 
    loading: platformLoading,
    error: platformError
  } = usePlatformPerformance(startDate, endDate);

  // Analitik interaktif untuk drill-down
  const {
    selectedProduct,
    selectedPlatform,
    drillDownData,
    loading: drillDownLoading,
    fetchProductDrillDown,
    fetchPlatformDrillDown,
    clearDrillDown,
  } = useInteractiveAnalytics(startDate, endDate);

  // Mengatur loading berdasarkan loading analitik
  const loading = analyticsLoading;

  // Transform data for charts
  const transformTopProductsData = (data: any[]): TopProductData[] => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      name: `${item.product_name} (${item.variant_display})`,
      productName: item.product_name,
      variantName: item.variant_display,
      quantity: item.quantity_sold || 0,
      revenue: item.total_revenue || 0
    }));
  };

  const transformPlatformData = (data: any[]): PlatformData[] => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      platform: item.platform_name,
      revenue: item.total_sales || 0,
      transaction_count: item.transaction_count || 0
    }));
  };

  const transformSalesData = (data: any[]): SalesChartData[] => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      date: item.date,
      total: item.total || 0,
      transaction_count: item.transaction_count || 0
    }));
  };

  // Fungsi untuk fetch detail produk
  const handleProductClick = async (productName: string) => {
    try {
      const { data: saleItemsData, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          harga_satuan,
          subtotal,
          product_variant:product_variants!inner(
            warna,
            size,
            product:products!inner(nama_produk)
          ),
          sale:sales!inner(
            tanggal,
            customer_name,
            store:stores!inner(
              nama_toko,
              platform:platforms!inner(nama_platform)
            )
          )
        `)
        .eq('product_variant.product.nama_produk', productName)
        .gte('sale.tanggal', startDate)
        .lte('sale.tanggal', endDate)
        .eq('sale.status', 'delivered');

      if (error) throw error;
      await fetchProductDrillDown(productName);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast({
        title: "Error",
        description: "Gagal memuat detail produk",
        variant: "destructive"
      });
    }
  };

  // Fungsi untuk fetch detail platform
  const handlePlatformClick = async (platformName: string) => {
    try {
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          total,
          tanggal,
          customer_name,
          no_pesanan_platform,
          status,
          store:stores!inner(
            nama_toko,
            platform:platforms!inner(nama_platform)
          ),
          sale_items(
            quantity,
            harga_satuan,
            product_variant:product_variants!inner(
              warna,
              size,
              product:products!inner(nama_produk)
            )
          )
        `)
        .eq('store.platform.nama_platform', platformName)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .eq('status', 'delivered');

      if (error) throw error;
      await fetchPlatformDrillDown(platformName);
    } catch (error) {
      console.error('Error fetching platform details:', error);
      toast({
        title: "Error",
        description: "Gagal memuat detail platform",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
    toast({
      title: "Berhasil",
      description: "Data dashboard telah diperbarui",
    });
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      await exportToPDF({
        elementId: 'dashboard-content',
        filename: `dashboard-${startDate}-${endDate}.pdf`,
        title: `Dashboard EQUINE Fashion - ${formatDate(dateRange.from || new Date())} s/d ${formatDate(dateRange.to || new Date())}`,
        orientation: 'landscape',
        companyInfo: {
          name: 'EQUINE Fashion',
          address: 'Indonesia',
          email: 'info@equinefashion.com',
        },
      });

      toast({
        title: "Berhasil",
        description: "Dashboard berhasil diekspor ke PDF",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      setExporting(true);
      
      const summaryData = [{
        'Periode': `${formatDate(dateRange.from || new Date())} - ${formatDate(dateRange.to || new Date())}`,
        'Total Penjualan': dashboardData?.total_penjualan || 0,
        'Total Pengeluaran': dashboardData?.total_pengeluaran || 0,
        'Laba Bersih': dashboardData?.laba_bersih || 0,
        'Saldo Kas & Bank': dashboardData?.saldo_kas_bank || 0,
        'Diekspor pada': new Date().toLocaleString('id-ID'),
      }];

      exportToCSV({
        filename: `dashboard-summary-${startDate}-${endDate}.csv`,
        data: summaryData,
        includeHeaders: true,
      });

      toast({
        title: "Berhasil",
        description: "Data dashboard berhasil diekspor ke CSV",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Pengecekan hak akses
  if (!hasPermission('dashboard.view')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card border-0 p-6 md:p-8 text-center">
          <Eye className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
          <p className="text-muted-foreground">
            Anda tidak memiliki izin untuk melihat dashboard ini.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6" id="dashboard-content">
      {/* Bagian Header */}
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Dashboard</h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm md:text-base">
              Selamat datang, {profile?.full_name}! Berikut ringkasan bisnis Anda.
            </p>
            {lastUpdate && (
              <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                <Clock className="h-3 w-3" />
                Update: {lastUpdate.toLocaleTimeString('id-ID')}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="glass-button h-10 md:h-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {hasPermission('reports.export') && (
            <div className="flex gap-2 md:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV}
                disabled={exporting}
                className="glass-button flex-1 md:flex-none h-10 md:h-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button 
                size="sm" 
                onClick={handleExportPDF}
                disabled={exporting}
                className="gradient-primary flex-1 md:flex-none h-10 md:h-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Mengekspor...' : 'PDF'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tanggal */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
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
            className="w-full md:max-w-md"
          />
        </CardContent>
      </Card>

      {/* Kartu Ringkasan */}
      <SummaryCards data={dashboardData} loading={loading} />

      {/* Sales Trend Chart */}
      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Tren Penjualan</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Grafik penjualan harian dalam periode terpilih
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Memuat data penjualan...</p>
              </div>
            </div>
          ) : !salesData || salesData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Tidak ada data penjualan</p>
                <p className="text-sm text-muted-foreground">pada periode yang dipilih</p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transformSalesData(salesData)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value) => formatDate(new Date(value))}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'total' ? formatCurrency(value) : value,
                      name === 'total' ? 'Penjualan' : 'Transaksi'
                    ]}
                    labelFormatter={(label) => formatDate(new Date(label))}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bagian Grafik */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Grafik Produk Terlaris */}
        <InteractiveTopProductsChart 
          data={transformTopProductsData(topProductsData)} 
          loading={topProductsLoading}
          onProductClick={handleProductClick}
          drillDownData={drillDownData as any}
          drillDownLoading={drillDownLoading}
          selectedProduct={selectedProduct}
          onCloseDrillDown={clearDrillDown}
        />

        {/* Grafik Performa Platform */}
        <InteractivePlatformChart 
          data={transformPlatformData(platformData)} 
          loading={platformLoading}
          onPlatformClick={handlePlatformClick}
          drillDownData={drillDownData as any}
          drillDownLoading={drillDownLoading}
          selectedPlatform={selectedPlatform}
          onCloseDrillDown={clearDrillDown}
        />
      </div>

      {/* Aksi Cepat */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg">Aksi Cepat</CardTitle>
          <p className="text-sm text-muted-foreground">Akses cepat ke fitur yang sering digunakan</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {hasPermission('sales.create') && (
              <Button 
                variant="outline" 
                className="glass-button justify-start h-auto p-3 md:p-4 flex-col items-start gap-2 min-h-[80px] md:min-h-[90px]"
                onClick={() => navigate('/sales')}
              >
                <Plus className="h-5 w-5 text-success" />
                <div className="text-left">
                  <div className="font-medium text-sm md:text-base">Tambah Penjualan</div>
                  <div className="text-xs text-muted-foreground">Input transaksi penjualan</div>
                </div>
              </Button>
            )}
            {hasPermission('purchases.create') && (
              <Button 
                variant="outline" 
                className="glass-button justify-start h-auto p-3 md:p-4 flex-col items-start gap-2 min-h-[80px] md:min-h-[90px]"
                onClick={() => navigate('/purchases')}
              >
                <ShoppingCart className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium text-sm md:text-base">Tambah Pembelian</div>
                  <div className="text-xs text-muted-foreground">Input pembelian barang</div>
                </div>
              </Button>
            )}
            {hasPermission('finance.create') && (
              <Button 
                variant="outline" 
                className="glass-button justify-start h-auto p-3 md:p-4 flex-col items-start gap-2 min-h-[80px] md:min-h-[90px]"
                onClick={() => navigate('/expenses')}
              >
                <CreditCard className="h-5 w-5 text-warning" />
                <div className="text-left">
                  <div className="font-medium text-sm md:text-base">Catat Pengeluaran</div>
                  <div className="text-xs text-muted-foreground">Input biaya operasional</div>
                </div>
              </Button>
            )}
            {hasPermission('reports.read') && (
              <Button 
                variant="outline" 
                className="glass-button justify-start h-auto p-3 md:p-4 flex-col items-start gap-2 min-h-[80px] md:min-h-[90px]"
                onClick={() => navigate('/reports/analytics')}
              >
                <FileText className="h-5 w-5 text-secondary" />
                <div className="text-left">
                  <div className="font-medium text-sm md:text-base">Lihat Laporan</div>
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
