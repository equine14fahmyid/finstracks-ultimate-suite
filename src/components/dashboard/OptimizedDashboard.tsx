
import { Suspense, lazy, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useAutoNotifications } from '@/hooks/useAutoNotifications';
import { LoadingSpinner, LoadingCard } from '@/components/common/OptimizedLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DateFilter from './DateFilter';
import { formatCurrency } from '@/utils/format';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertCircle, Users } from 'lucide-react';

// Lazy load heavy components
const SalesChart = lazy(() => import('./SalesChart'));
const PlatformComparisonChart = lazy(() => import('./PlatformComparisonChart'));
const TopProductsChart = lazy(() => import('./TopProductsChart'));
const LowStockAlertsCard = lazy(() => import('./LowStockAlertsCard'));

const OptimizedDashboard = () => {
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const { metrics, loading: metricsLoading, error } = useDashboardMetrics(thirtyDaysAgo, today);
  
  // Auto notifications
  useAutoNotifications();

  // Memoized metrics calculations
  const calculatedMetrics = useMemo(() => {
    if (!metrics) return null;

    const profitMargin = metrics.total_penjualan > 0 
      ? ((metrics.laba_bersih / metrics.total_penjualan) * 100) 
      : 0;

    const expenseRatio = metrics.total_penjualan > 0 
      ? ((metrics.total_pengeluaran / metrics.total_penjualan) * 100) 
      : 0;

    return {
      profitMargin: profitMargin.toFixed(1),
      expenseRatio: expenseRatio.toFixed(1),
      isProfit: metrics.laba_bersih >= 0
    };
  }, [metrics]);

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-semibold text-lg mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Selamat datang kembali, {profile?.full_name || 'User'}
          </p>
        </div>
        <DateFilter />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Penjualan */}
        <Card className="bg-gradient-card hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Penjualan
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {metricsLoading ? (
              <LoadingCard lines={2} />
            ) : (
              <>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(metrics?.total_penjualan || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  30 hari terakhir
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Laba Bersih */}
        <Card className="bg-gradient-card hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Laba Bersih
              </CardTitle>
              {calculatedMetrics?.isProfit ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {metricsLoading ? (
              <LoadingCard lines={2} />
            ) : (
              <>
                <p className={`text-2xl font-bold ${calculatedMetrics?.isProfit ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(metrics?.laba_bersih || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Margin: {calculatedMetrics?.profitMargin || 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Pengeluaran */}
        <Card className="bg-gradient-card hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengeluaran
              </CardTitle>
              <Package className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {metricsLoading ? (
              <LoadingCard lines={2} />
            ) : (
              <>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(metrics?.total_pengeluaran || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rasio: {calculatedMetrics?.expenseRatio || 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Saldo Kas & Bank */}
        <Card className="bg-gradient-card hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Kas & Bank
              </CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {metricsLoading ? (
              <LoadingCard lines={2} />
            ) : (
              <>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(metrics?.saldo_kas_bank || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo saat ini
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-3">
          <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs md:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs md:text-sm">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<LoadingCard className="h-80" />}>
              <SalesChart />
            </Suspense>
            <Suspense fallback={<LoadingCard className="h-80" />}>
              <PlatformComparisonChart data={[]} loading={metricsLoading} />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<LoadingCard className="h-80" />}>
              <TopProductsChart />
            </Suspense>
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Keuangan</CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <LoadingCard lines={4} />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">HPP (COGS)</span>
                      <span className="font-medium">{formatCurrency(metrics?.total_cogs || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Laba Kotor</span>
                      <span className="font-medium">{formatCurrency((metrics?.total_penjualan || 0) - (metrics?.total_cogs || 0))}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Biaya</span>
                      <span className="font-medium">{formatCurrency(metrics?.total_pengeluaran || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 font-semibold">
                      <span>Laba Bersih</span>
                      <span className={calculatedMetrics?.isProfit ? 'text-success' : 'text-destructive'}>
                        {formatCurrency(metrics?.laba_bersih || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="alerts">
          <Suspense fallback={<LoadingCard className="h-60" />}>
            <LowStockAlertsCard />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptimizedDashboard;
