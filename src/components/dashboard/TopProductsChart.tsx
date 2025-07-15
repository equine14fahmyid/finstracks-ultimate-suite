import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/format';
import { Trophy } from 'lucide-react';

interface TopProductData {
  name: string;
  productName: string;
  variantName: string;
  quantity: number;
  revenue: number;
}

interface TopProductsChartProps {
  data: TopProductData[];
  loading?: boolean;
}

const TopProductsChart = ({ data, loading }: TopProductsChartProps) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="glass-card p-3 border-0 shadow-lg">
          <p className="text-sm font-medium">{data?.productName}</p>
          <p className="text-xs text-muted-foreground mb-2">{data?.variantName}</p>
          <div className="space-y-1">
            <p className="text-sm text-primary">
              Revenue: {formatCurrency(payload[0]?.value)}
            </p>
            <p className="text-xs text-muted-foreground">
              Qty: {data?.quantity} unit
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
          <CardTitle className="text-lg font-semibold">Top Produk</CardTitle>
          <Trophy className="h-5 w-5 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat data produk...</p>
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
          <CardTitle className="text-lg font-semibold">Top Produk</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Produk terlaris berdasarkan revenue
          </p>
        </div>
        <div className="p-2 bg-warning/10 rounded-lg">
          <Trophy className="h-5 w-5 text-warning" />
        </div>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Tidak ada data produk</p>
              <p className="text-sm text-muted-foreground">pada periode yang dipilih</p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="productName"
                  className="text-xs fill-muted-foreground"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  className="text-xs fill-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--warning))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProductsChart;