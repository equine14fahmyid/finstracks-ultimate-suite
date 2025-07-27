
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ExternalLink, RefreshCw } from 'lucide-react';
import { useLowStockAlerts } from '@/hooks/useLowStockAlerts';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export const LowStockAlertsCard = () => {
  const { lowStockProducts, loading, error, refreshLowStock } = useLowStockAlerts();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Peringatan Stok Rendah
          </CardTitle>
          <CardDescription>
            Produk yang memerlukan perhatian segera
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSpinner size="md" text="Memuat data stok..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Peringatan Stok Rendah
          </CardTitle>
          <CardDescription>
            Produk yang memerlukan perhatian segera
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorMessage 
            title="Gagal Memuat Data Stok"
            message={error}
            onRetry={refreshLowStock}
          />
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical':
        return 'Kritis';
      case 'low':
        return 'Rendah';
      case 'warning':
        return 'Peringatan';
      default:
        return 'Normal';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Peringatan Stok Rendah
            </CardTitle>
            <CardDescription>
              {lowStockProducts.length} produk memerlukan perhatian
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshLowStock}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lowStockProducts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Semua Stok Aman</p>
            <p className="text-gray-500 text-sm mt-1">
              Tidak ada produk dengan stok rendah
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lowStockProducts.map((product, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.product_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {product.variant_name}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Stok: {product.current_stock}
                    </p>
                    <p className="text-xs text-gray-500">
                      Min: {product.threshold}
                    </p>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(product.status)}
                  >
                    {getStatusText(product.status)}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.location.href = '/inventory'}
              >
                <ExternalLink className="h-4 w-4" />
                Lihat Semua Inventaris
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
