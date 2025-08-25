
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/utils/format';

interface PlatformData {
  platform: string;
  revenue: number;
  orders: number;
  conversion: number;
}

interface PlatformComparisonChartProps {
  data: PlatformData[];
  loading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PlatformComparisonChart = ({ data, loading }: PlatformComparisonChartProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perbandingan Platform</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="platform" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              labelStyle={{ color: '#000' }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {data.map((platform, index) => (
            <div key={platform.platform} className="text-center p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">{platform.platform}</h4>
              <p className="text-xs text-muted-foreground mb-1">
                {platform.orders} pesanan
              </p>
              <p className="text-xs text-muted-foreground">
                {platform.conversion.toFixed(1)}% konversi
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformComparisonChart;
