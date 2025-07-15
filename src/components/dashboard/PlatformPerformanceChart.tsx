import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/utils/format';
import { Store } from 'lucide-react';

interface PlatformData {
  platform: string;
  revenue: number;
  transaction_count: number;
}

interface PlatformPerformanceChartProps {
  data: PlatformData[];
  loading?: boolean;
}

// Colors for different platforms
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--error))',
  'hsl(var(--info))',
];

const PlatformPerformanceChart = ({ data, loading }: PlatformPerformanceChartProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="glass-card p-3 border-0 shadow-lg">
          <p className="text-sm font-medium">{data?.platform}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-primary">
              Revenue: {formatCurrency(data?.revenue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data?.transaction_count} transaksi
            </p>
            <p className="text-xs text-muted-foreground">
              {((data?.revenue / data.reduce((sum: number, item: any) => sum + item.revenue, 0)) * 100).toFixed(1)}% dari total
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Performa Platform</CardTitle>
          <Store className="h-5 w-5 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat data platform...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0 hover-lift">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Performa Platform</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Distribusi penjualan per platform
          </p>
        </div>
        <div className="p-2 bg-secondary/10 rounded-lg">
          <Store className="h-5 w-5 text-secondary" />
        </div>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Tidak ada data platform</p>
              <p className="text-sm text-muted-foreground">pada periode yang dipilih</p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-muted-foreground">
                      {value} - {formatCurrency(entry.payload?.revenue)}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformPerformanceChart;