
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
import SalesChart from '@/components/dashboard/SalesChart';
import InteractiveTopProductsChart from '@/components/dashboard/InteractiveTopProductsChart';
import InteractivePlatformChart from '@/components/dashboard/InteractivePlatformChart';
import { formatDate } from '@/utils/format';
import { useRealtimeDashboard, useInteractiveAnalytics } from '@/hooks/useRealtimeAnalytics';
import { useTopProducts, usePlatformPerformance } from '@/hooks/useSupabase';
import { exportToPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';

// Interface untuk rentang tanggal
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
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
    loading: topProductsLoading 
  } = useTopProducts(startDate, endDate, 5);

  const { 
    data: platformData, 
    loading: platformLoading 
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

  // Fungsi refresh manual
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
    toast({
      title: "Berhasil",
      description: "Data dashboard telah diperbarui",
    });
  };

 // Cari fungsi ini di dalam file src/pages/Dashboard.tsx

const handleExportPDF = async () => {
    try {
      setExporting(true);

      // --- PERBAIKAN DI SINI ---
      // Kita hapus properti 'includeHeader' dan 'includeFooter'
      await exportToPDF('dashboard-content', {
        filename: `dashboard-${startDate}-${endDate}.pdf`,
        title: `Dashboard EQUINE Fashion - ${formatDate(dateRange.from || new Date())} s/d ${formatDate(dateRange.to || new Date())}`,
        orientation: 'landscape',
        companyInfo: {
          name: 'EQUINE Fashion',
          address: 'Indonesia',
          email: 'info@equinefashion.com',
        },
      });
      // --- BATAS PERBAIKAN ---

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
      
      // Menyiapkan data ringkasan dashboard untuk CSV
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
        
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">Dashboard</h1>
            {/* ... (kode lainnya) ... */}
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="glass-button h-10 md:h-auto" // Atur tinggi untuk mobile
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
                  className="glass-button flex-1 md:flex-none h-10 md:h-auto" // Atur tinggi & lebar untuk mobile
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="gradient-primary flex-1 md:flex-none h-10 md:h-auto" // Atur tinggi & lebar untuk mobile
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Mengekspor...' : 'PDF'}
                </Button>
              </div>
            )}
          </div>
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

      {/* Bagian Grafik */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Grafik Tren Penjualan */}
        <div className="lg:col-span-2">
          <SalesChart data={salesData} loading={loading} />
        </div>

        {/* Grafik Interaktif dengan Drill-down */}
        <InteractiveTopProductsChart 
          data={topProductsData} 
          loading={topProductsLoading}
          onProductClick={fetchProductDrillDown}
          drillDownData={drillDownData as any}
          drillDownLoading={drillDownLoading}
          selectedProduct={selectedProduct}
          onCloseDrillDown={clearDrillDown}
        />

        <InteractivePlatformChart 
          data={platformData} 
          loading={platformLoading}
          onPlatformClick={fetchPlatformDrillDown}
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
