import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatDate } from '@/utils/format';
import { Store, X, Calendar, User, Package, Hash } from 'lucide-react';

interface PlatformData {
  platform: string;
  revenue: number;
  transaction_count: number;
}

interface DrillDownSale {
  total: number;
  tanggal: string;
  customer_name: string;
  no_pesanan_platform: string;
  status: string;
  store: {
    nama_toko: string;
    platform: {
      nama_platform: string;
    };
  };
  sale_items: Array<{
    quantity: number;
    harga_satuan: number;
    product_variant: {
      warna: string;
      size: string;
      product: {
        nama_produk: string;
      };
    };
  }>;
}

interface InteractivePlatformChartProps {
  data: PlatformData[];
  loading?: boolean;
  onPlatformClick?: (platformName: string) => void;
  drillDownData?: DrillDownSale[];
  drillDownLoading?: boolean;
  selectedPlatform?: string | null;
  onCloseDrillDown?: () => void;
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

const InteractivePlatformChart = ({ 
  data, 
  loading, 
  onPlatformClick,
  drillDownData = [],
  drillDownLoading = false,
  selectedPlatform,
  onCloseDrillDown
}: InteractivePlatformChartProps) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const totalRevenue = payload[0]?.payload?.payload?.reduce((sum: number, item: any) => sum + item.revenue, 0) || 1;
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
              {((data?.revenue / totalRevenue) * 100).toFixed(1)}% dari total
            </p>
            <p className="text-xs text-warning mt-2">
              Klik untuk detail
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

  const handleSliceClick = (data: PlatformData) => {
    if (onPlatformClick) {
      onPlatformClick(data.platform);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Performa Platform (Interactive)</CardTitle>
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
    <>
      <Card className="glass-card border-0 hover-lift">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Performa Platform (Interactive)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Distribusi penjualan per platform - Klik untuk detail
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
                    onMouseEnter={(data) => setHoveredSlice(data.platform)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={handleSliceClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={hoveredSlice === entry.platform ? 'hsl(var(--primary))' : COLORS[index % COLORS.length]} 
                      />
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

      {/* Drill Down Dialog */}
      <Dialog open={!!selectedPlatform} onOpenChange={onCloseDrillDown}>
        <DialogContent className="max-w-5xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Detail Transaksi: {selectedPlatform}
              </span>
              <Button variant="ghost" size="icon" onClick={onCloseDrillDown}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            {drillDownLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : drillDownData.length === 0 ? (
              <div className="text-center p-8">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Tidak ada detail transaksi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drillDownData.map((sale, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">{formatDate(sale.tanggal)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{sale.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            <span className="text-sm">{sale.no_pesanan_platform}</span>
                          </div>
                          <Badge variant={sale.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">
                            {sale.status}
                          </Badge>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(sale.total)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {sale.sale_items.length} item
                          </p>
                        </div>
                      </div>
                      
                      {/* Sale Items */}
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">Items:</p>
                        <div className="grid gap-2">
                          {sale.sale_items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {item.product_variant.product.nama_produk} 
                                  ({item.product_variant.warna} - {item.product_variant.size})
                                </span>
                              </div>
                              <div className="text-sm">
                                {item.quantity} × {formatCurrency(item.harga_satuan)} = {formatCurrency(item.quantity * item.harga_satuan)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InteractivePlatformChart;