
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Calendar } from 'lucide-react';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import AdvancedMetricsCards from './AdvancedMetricsCards';
import SalesChart from './SalesChart';
import TopProductsChart from './TopProductsChart';
import PlatformComparisonChart from './PlatformComparisonChart';
import LowStockAlertsCard from './LowStockAlertsCard';
import { toast } from '@/hooks/use-toast';

const EnhancedDashboard = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });

  const { analytics, loading, error, refetch } = useAdvancedAnalytics(dateRange);

  const handleExportData = () => {
    toast({
      title: "Info",
      description: "Fitur export akan segera tersedia"
    });
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Berhasil",
      description: "Data dashboard telah diperbarui"
    });
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Dashboard Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Pantau performa bisnis Anda secara real-time
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
            className="w-full sm:w-auto"
          />
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Advanced Metrics Cards */}
      <AdvancedMetricsCards analytics={analytics} loading={loading} />

      {/* Charts Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2">
          <SalesChart 
            data={[]} // Will be populated from analytics
            loading={loading} 
          />
        </div>

        {/* Platform Comparison */}
        <PlatformComparisonChart 
          data={analytics?.platformPerformance || []} 
          loading={loading}
        />

        {/* Top Products */}
        <TopProductsChart 
          data={analytics?.topProducts?.map(p => ({
            name: p.variant_name,
            productName: p.product_name,
            variantName: p.variant_name,
            quantity: p.quantity_sold,
            revenue: p.revenue
          })) || []} 
          loading={loading}
        />
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-1">
          <LowStockAlertsCard />
        </div>

        {/* Recent Activities Card */}
        <div className="lg:col-span-2">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Aktivitas Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.recentActivities?.length ? (
                  analytics.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(activity.amount)}</p>
                        <p className="text-sm text-muted-foreground capitalize">{activity.type}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Tidak ada aktivitas terbaru</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
