
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface MetricsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  lowStockCount: number;
  activeCustomers: number;
  revenueGrowth: number;
  orderGrowth: number;
}

interface AdvancedMetricsCardsProps {
  data: MetricsData;
  loading?: boolean;
}

const AdvancedMetricsCards = ({ data, loading }: AdvancedMetricsCardsProps) => {
  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      icon: DollarSign,
      trend: data.revenueGrowth,
      color: 'text-green-600'
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toString(),
      icon: ShoppingCart,
      trend: data.orderGrowth,
      color: 'text-blue-600'
    },
    {
      title: 'Rata-rata Order',
      value: formatCurrency(data.averageOrderValue),
      icon: TrendingUp,
      trend: 0,
      color: 'text-purple-600'
    },
    {
      title: 'Total Products',
      value: data.totalProducts.toString(),
      icon: Package,
      trend: 0,
      color: 'text-orange-600'
    },
    {
      title: 'Stok Rendah',
      value: data.lowStockCount.toString(),
      icon: TrendingDown,
      trend: 0,
      color: 'text-red-600'
    },
    {
      title: 'Active Customers',
      value: data.activeCustomers.toString(),
      icon: Users,
      trend: 0,
      color: 'text-indigo-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isPositiveTrend = metric.trend >= 0;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.trend !== 0 && (
                <div className={`flex items-center text-xs ${
                  isPositiveTrend ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositiveTrend ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(metric.trend).toFixed(1)}% dari bulan lalu
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdvancedMetricsCards;
