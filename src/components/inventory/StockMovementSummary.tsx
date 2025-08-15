
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Package, Activity } from 'lucide-react';
import { useStock } from '@/hooks/useSupabase';

interface StockMovementSummaryProps {
  productVariantId?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

export const StockMovementSummary = ({ 
  productVariantId, 
  period = 'month' 
}: StockMovementSummaryProps) => {
  const { movements } = useStock();
  const [summary, setSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    totalAdjustments: 0,
    netMovement: 0,
    transactionCount: 0,
    lastMovement: null as any
  });

  useEffect(() => {
    if (!movements) return;

    let filtered = movements;
    
    // Filter by product variant if specified
    if (productVariantId) {
      filtered = filtered.filter(m => m.product_variant_id === productVariantId);
    }

    // Filter by period
    const now = new Date();
    const periodStart = new Date();
    
    switch (period) {
      case 'day':
        periodStart.setDate(now.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    filtered = filtered.filter(m => new Date(m.created_at) >= periodStart);

    const totalIn = filtered
      .filter(m => m.movement_type === 'in')
      .reduce((sum, m) => sum + (m.quantity || 0), 0);

    const totalOut = filtered
      .filter(m => m.movement_type === 'out')
      .reduce((sum, m) => sum + (m.quantity || 0), 0);

    const totalAdjustments = filtered
      .filter(m => m.movement_type === 'adjustment')
      .reduce((sum, m) => sum + Math.abs(m.quantity || 0), 0);

    const lastMovement = filtered
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    setSummary({
      totalIn,
      totalOut,
      totalAdjustments,
      netMovement: totalIn - totalOut,
      transactionCount: filtered.length,
      lastMovement
    });
  }, [movements, productVariantId, period]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return '24 jam terakhir';
      case 'week': return '7 hari terakhir';
      case 'month': return '30 hari terakhir';
      case 'year': return '1 tahun terakhir';
      default: return period;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Stok Masuk</p>
              <p className="text-2xl font-bold text-green-600">
                +{summary.totalIn.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {getPeriodLabel()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Stok Keluar</p>
              <p className="text-2xl font-bold text-red-600">
                -{summary.totalOut.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {getPeriodLabel()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pergerakan Bersih</p>
              <p className={`text-2xl font-bold ${summary.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.netMovement >= 0 ? '+' : ''}{summary.netMovement.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {getPeriodLabel()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.transactionCount.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Activity className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {summary.lastMovement ? 
              `Terakhir: ${new Date(summary.lastMovement.created_at).toLocaleDateString('id-ID')}` : 
              'Belum ada pergerakan'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
