
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import SalesChart from '@/components/dashboard/SalesChart';
import TopProductsChart from '@/components/dashboard/TopProductsChart';
import PlatformPerformanceChart from '@/components/dashboard/PlatformPerformanceChart';
import { LowStockAlertsCard } from '@/components/dashboard/LowStockAlertsCard';
import DateFilter from '@/components/dashboard/DateFilter';
import InteractiveTopProductsChart from '@/components/dashboard/InteractiveTopProductsChart';
import InteractivePlatformChart from '@/components/dashboard/InteractivePlatformChart';
import { useAutoAlerts } from '@/hooks/useAutoAlerts';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { from: start, to: end };
  });

  // Initialize auto alerts system
  useAutoAlerts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang di FINTracks Ultimate - Dashboard Keuangan EQUINE
          </p>
        </div>
        <DateFilter 
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Summary Cards */}
      <SummaryCards 
        startDate={dateRange.from?.toISOString().split('T')[0] || ''} 
        endDate={dateRange.to?.toISOString().split('T')[0] || ''} 
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Penjualan</CardTitle>
            <CardDescription>
              Grafik penjualan harian dalam periode yang dipilih
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart data={[]} loading={false} />
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <LowStockAlertsCard />
      </div>

      {/* Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
            <CardDescription>
              5 produk dengan penjualan tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveTopProductsChart data={[]} loading={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performa Platform</CardTitle>
            <CardDescription>
              Perbandingan performa antar platform penjualan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InteractivePlatformChart data={[]} loading={false} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
