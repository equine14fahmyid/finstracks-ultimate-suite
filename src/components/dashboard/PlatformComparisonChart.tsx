
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/utils/format';
import { Building2 } from 'lucide-react';

interface PlatformData {
  platform: string;
  revenue: number;
  orders: number;
  percentage: number;
}

interface PlatformComparisonChartProps {
  data: PlatformData[];
  loading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(220, 80%, 60%)',
  'hsl(280, 80%, 60%)',
  'hsl(350, 80%, 60%)',
  'hsl(40, 80%, 60%)',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card p-3 border-0 shadow-lg">
        <p className="text-sm font-medium">{data.platform}</p>
        <div className="space-y-1 mt-2">
          <p className="text-sm text-primary">
            Revenue: {formatCurrency(data.revenue)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.orders} pesanan ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const PlatformComparisonChart = ({ data, loading }: PlatformComparisonChartProps) => {
  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Perbandingan Platform
          </CardTitle>
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Perbandingan Platform</CardTitle>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Distribusi revenue berdasarkan platform
        </p>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Tidak ada data platform</p>
              <p className="text-sm text-muted-foreground">pada periode yang dipilih</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="revenue"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2">
              {data.map((platform, index) => (
                <div key={platform.platform} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{platform.platform}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(platform.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{platform.orders} pesanan</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformComparisonChart;
