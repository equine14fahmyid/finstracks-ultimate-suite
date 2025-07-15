import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatShortDate } from '@/utils/format';
import { TrendingUp } from 'lucide-react';

interface SalesData {
  date: string;
  total: number;
  transaction_count: number;
}

interface SalesChartProps {
  data: SalesData[];
  loading?: boolean;
}

const SalesChart = ({ data, loading }: SalesChartProps) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border-0 shadow-lg">
          <p className="text-sm font-medium">{formatShortDate(label)}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-primary">
              Penjualan: {formatCurrency(payload[0].value)}
            </p>
            <p className="text-xs text-muted-foreground">
              {payload[0].payload.transaction_count} transaksi
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Trend Penjualan Harian</CardTitle>
          <TrendingUp className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat data chart...</p>
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
          <CardTitle className="text-lg font-semibold">Trend Penjualan Harian</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Grafik penjualan dalam periode yang dipilih
          </p>
        </div>
        <div className="p-2 bg-primary/10 rounded-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Tidak ada data penjualan</p>
              <p className="text-sm text-muted-foreground">pada periode yang dipilih</p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatShortDate(value)}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  className="text-xs fill-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesChart;