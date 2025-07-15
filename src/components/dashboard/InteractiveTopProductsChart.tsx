import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, formatDate } from '@/utils/format';
import { Trophy, X, Eye, Calendar, User, Package } from 'lucide-react';

interface TopProductData {
  name: string;
  productName: string;
  variantName: string;
  quantity: number;
  revenue: number;
}

interface DrillDownItem {
  quantity: number;
  harga_satuan: number;
  subtotal: number;
  product_variant: {
    warna: string;
    size: string;
    product: {
      nama_produk: string;
    };
  };
  sale: {
    tanggal: string;
    customer_name: string;
    store: {
      nama_toko: string;
      platform: {
        nama_platform: string;
      };
    };
  };
}

interface InteractiveTopProductsChartProps {
  data: TopProductData[];
  loading?: boolean;
  onProductClick?: (productName: string) => void;
  drillDownData?: DrillDownItem[];
  drillDownLoading?: boolean;
  selectedProduct?: string | null;
  onCloseDrillDown?: () => void;
}

const COLORS = [
  'hsl(var(--warning))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--success))',
  'hsl(var(--error))',
];

const InteractiveTopProductsChart = ({ 
  data, 
  loading, 
  onProductClick,
  drillDownData = [],
  drillDownLoading = false,
  selectedProduct,
  onCloseDrillDown
}: InteractiveTopProductsChartProps) => {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

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
            <p className="text-xs text-warning mt-2">
              Klik untuk detail
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: TopProductData) => {
    if (onProductClick) {
      onProductClick(data.productName);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Top Produk (Interactive)</CardTitle>
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
    <>
      <Card className="glass-card border-0 hover-lift">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Top Produk (Interactive)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Produk terlaris berdasarkan revenue - Klik untuk detail
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
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={(data) => setHoveredBar(data.productName)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={hoveredBar === entry.productName ? 'hsl(var(--primary))' : COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drill Down Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={onCloseDrillDown}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detail Penjualan: {selectedProduct}
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
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Tidak ada detail penjualan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drillDownData.map((item, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4" />
                            {formatDate(item.sale.tanggal)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {item.sale.customer_name}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.sale.store.platform.nama_platform} - {item.sale.store.nama_toko}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            {item.product_variant.product.nama_produk}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.product_variant.warna} - {item.product_variant.size}
                          </p>
                          <p className="text-sm">
                            Qty: <span className="font-medium">{item.quantity}</span> × {formatCurrency(item.harga_satuan)}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(item.subtotal)}
                          </p>
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

export default InteractiveTopProductsChart;