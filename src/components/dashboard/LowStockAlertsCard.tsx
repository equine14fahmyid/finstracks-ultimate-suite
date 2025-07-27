
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { useLowStockAlerts } from '@/hooks/useLowStockAlerts';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

const LowStockAlertsCard = () => {
  const { lowStockProducts, loading, error, refreshLowStock } = useLowStockAlerts(5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500 text-white';
      case 'low': return 'bg-orange-500 text-white';
      case 'warning': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Kritis';
      case 'low': return 'Rendah';
      case 'warning': return 'Peringatan';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Peringatan Stok Rendah
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Peringatan Stok Rendah
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshLowStock} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Peringatan Stok Rendah
          </div>
          <Button onClick={refreshLowStock} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada produk dengan stok rendah</p>
              <p className="text-sm">Semua produk memiliki stok yang cukup</p>
            </div>
          ) : (
            lowStockProducts.map((product) => (
              <div 
                key={product.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  product.status === 'critical' ? 'bg-red-50 border-red-200' :
                  product.status === 'low' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                )}
              >
                <div className="flex-1">
                  <p className="font-medium">{product.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Varian: {product.variant_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stok tersisa: {product.current_stock} unit
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={getStatusColor(product.status)}>
                    {getStatusText(product.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {product.current_stock} pcs
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LowStockAlertsCard;
