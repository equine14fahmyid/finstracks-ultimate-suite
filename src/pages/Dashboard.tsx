
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Eye, Plus, ShoppingCart, CreditCard, FileText, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
import { exportToCSV, formatDataForCSV } from '@/utils/csvExport';

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
  const [exporting, setExporting] = useState(false);

  // Use the enhanced analytics hooks
  const startDate = dateRange.from?.toISOString().split('T')[0] || '';
  const endDate = dateRange.to?.toISOString().split('T')[0] || '';
  
  // Real-time dashboard data
  const { 
    data: dashboardData, 
    salesChart: salesData, 
    loading: analyticsLoading,
    lastUpdate,
    refresh: refreshDashboard
  } = useRealtimeDashboard(startDate, endDate);

  // Top products and platform data
  const { 
    data: topProductsData, 
    loading: topProductsLoading 
  } = useTopProducts(startDate, endDate, 5);

  const { 
    data: platformData, 
    loading: platformLoading 
  } = usePlatformPerformance(startDate, endDate);

  // Interactive analytics for drill-down
  const {
    selectedProduct,
    selectedPlatform,
    drillDownData,
    loading: drillDownLoading,
    fetchProductDrillDown,
    fetchPlatformDrillDown,
    clearDrillDown,
  } = useInteractiveAnalytics(startDate, endDate);

  // Set loading based on analytics loading
  const loading = analyticsLoading;

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
    toast({
      title: "Berhasil",
      description: "Data dashboard telah diperbarui",
    });
  };

  // Export functionality
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      await exportToPDF('dashboard-content', {
        filename: `dashboard-${startDate}-${endDate}.pdf`,
        title: `Dashboard EQUINE Fashion - ${formatDate(dateRange.from || new Date())} s/d ${formatDate(dateRange.to || new Date())}`,
        orientation: 'landscape',
        includeHeader: true,
        includeFooter: true,
        companyInfo: {
          name: 'EQUINE Fashion',
          address: 'Indonesia',
          email: 'info@equinefashion.com',
        },
      });
      toast({
        title: "Berhasil",
        description: "Dashboard berhasil diexport ke PDF",
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
      
      // Prepare dashboard summary data for CSV
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
        description: "Data dashboard berhasil diexport ke CSV",
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
    <div className="space-y-6 p-6" id="dashboard-content">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              Selamat datang, {profile?.full_name}! Berikut ringkasan bisnis Anda.
            </p>
            {lastUpdate && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Update: {lastUpdate.toLocaleTimeString('id-ID')}
              </Badge>
            )}
          </div>
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
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV}
                disabled={exporting}
                className="glass-button"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button 
                size="sm" 
                onClick={handleExportPDF}
                disabled={exporting}
                className="gradient-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'PDF'}
              </Button>
            </>
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

        {/* Interactive Charts with Drill-down - Simplified for now */}
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
