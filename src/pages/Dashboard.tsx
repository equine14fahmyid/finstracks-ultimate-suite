import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { SalesChart } from '@/components/dashboard/SalesChart';
import {
  KpiCard,
  InventoryHighlights,
  RecentActivity,
  KpiCardSkeleton,
  InventoryHighlightsSkeleton,
  RecentActivitySkeleton,
} from '@/components/dashboard/DashboardWidgets';
import { DollarSign, ShoppingCart, TrendingUp, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { data, loading, fetchAnalytics } = useDashboardAnalytics();

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];
      fetchAnalytics(startDate, endDate);
    }
  }, [dateRange, fetchAnalytics]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dasbor</h2>
        <DateFilter dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading || !data ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard title="Total Pendapatan" value={data.totalRevenue} icon={DollarSign} />
            <KpiCard title="Laba Kotor" value={data.grossProfit} icon={TrendingUp} />
            <KpiCard title="Total Penjualan" value={data.salesCount} icon={ShoppingCart} isCurrency={false} />
            <KpiCard title="Laba Bersih" value={data.netProfit} icon={Receipt} />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Grafik Penjualan</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loading || !data ? (
                <Skeleton className="h-[350px] w-full" />
            ) : (
                <SalesChart data={data.salesOverTime} />
            )}
          </CardContent>
        </Card>
        <div className="col-span-12 lg:col-span-3 space-y-4">
            {loading || !data ? (
                <RecentActivitySkeleton />
            ) : (
                <RecentActivity activities={data.recentActivity} />
            )}
        </div>
      </div>

      <div>
        {loading || !data ? (
            <InventoryHighlightsSkeleton />
        ) : (
            <InventoryHighlights 
                lowStockProducts={data.lowStockProducts} 
                topSellingProducts={data.topSellingProducts}
            />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
