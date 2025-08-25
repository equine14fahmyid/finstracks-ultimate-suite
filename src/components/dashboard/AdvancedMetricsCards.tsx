
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: any;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const MetricCard = ({ title, value, change, changeLabel, icon: Icon, color = 'primary' }: MetricCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    danger: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <Card className="glass-card border-0 hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {typeof value === 'number' && value > 999999 
            ? formatCurrency(value)
            : value
          }
        </div>
        {change !== undefined && (
          <div className="flex items-center mt-2 text-xs">
            {isPositive && (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            )}
            {isNegative && (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            <span className={cn(
              "font-medium",
              isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"
            )}>
              {change > 0 ? '+' : ''}{formatPercentage(change)}
            </span>
            <span className="text-muted-foreground ml-1">
              {changeLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AdvancedMetricsCardsProps {
  analytics: {
    todayRevenue: number;
    revenueGrowth: number;
    todaySales: number;
    averageOrderValue: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    inventoryValue: number;
  } | null;
  loading?: boolean;
}

const AdvancedMetricsCards = ({ analytics, loading }: AdvancedMetricsCardsProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="glass-card border-0">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Gagal memuat data metrics</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Revenue Hari Ini"
        value={analytics.todayRevenue}
        change={analytics.revenueGrowth}
        changeLabel="dari kemarin"
        icon={DollarSign}
        color="success"
      />
      
      <MetricCard
        title="Penjualan Hari Ini"
        value={analytics.todaySales}
        icon={ShoppingCart}
        color="primary"
      />
      
      <MetricCard
        title="Rata-rata Nilai Order"
        value={analytics.averageOrderValue}
        icon={BarChart3}
        color="primary"
      />
      
      <MetricCard
        title="Total Produk"
        value={analytics.totalProducts}
        icon={Package}
        color="primary"
      />
      
      <MetricCard
        title="Nilai Inventori"
        value={analytics.inventoryValue}
        icon={Package}
        color="success"
      />
      
      <MetricCard
        title="Stok Rendah"
        value={analytics.lowStockProducts}
        icon={AlertTriangle}
        color="warning"
      />
      
      <MetricCard
        title="Stok Habis"
        value={analytics.outOfStockProducts}
        icon={AlertTriangle}
        color="danger"
      />
      
      <MetricCard
        title="Tingkat Konversi"
        value="--"
        icon={TrendingUp}
        color="primary"
      />
    </div>
  );
};

export default AdvancedMetricsCards;
