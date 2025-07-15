
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { useStock } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/format';

const Inventory = () => {
  const { stock, movements, loading, fetchStock, fetchStockMovements, adjustStock } = useStock();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    notes: ''
  });

  useEffect(() => {
    fetchStock();
    fetchStockMovements();
  }, []);

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVariant || adjustmentData.quantity <= 0) {
      toast({
        title: "Error",
        description: "Mohon isi data penyesuaian stok dengan benar",
        variant: "destructive",
      });
      return;
    }

    await adjustStock(selectedVariant.id, adjustmentData.quantity, adjustmentData.notes);
    
    setDialogOpen(false);
    setSelectedVariant(null);
    setAdjustmentData({ quantity: 0, notes: '' });
  };

  const stockColumns = [
    {
      key: 'product',
      title: 'Produk',
      render: (item: any) => (
        <div>
          <div className="font-medium">{item.product?.nama_produk}</div>
          <div className="text-sm text-muted-foreground">
            {item.warna} - {item.size}
          </div>
          {item.sku && (
            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
          )}
        </div>
      )
    },
    {
      key: 'stock',
      title: 'Stok',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${item.stok <= 5 ? 'text-red-600' : item.stok <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
            {item.stok}
          </span>
          <span className="text-sm text-muted-foreground">{item.product?.satuan}</span>
          {item.stok <= 5 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Stok Rendah
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'value',
      title: 'Nilai Stok',
      render: (item: any) => (
        <div>
          <div className="font-medium">
            {formatCurrency((item.stok || 0) * (item.product?.harga_beli || 0))}
          </div>
          <div className="text-sm text-muted-foreground">
            @ {formatCurrency(item.product?.harga_beli || 0)}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item: any) => (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            setSelectedVariant(item);
            setAdjustmentData({ quantity: item.stok || 0, notes: '' });
            setDialogOpen(true);
          }}
        >
          Sesuaikan Stok
        </Button>
      )
    }
  ];

  const movementColumns = [
    {
      key: 'date',
      title: 'Tanggal',
      render: (movement: any) => (
        new Date(movement.created_at).toLocaleDateString('id-ID')
      )
    },
    {
      key: 'product',
      title: 'Produk',
      render: (movement: any) => (
        <div>
          <div className="font-medium">{movement.product_variant?.product?.nama_produk}</div>
          <div className="text-sm text-muted-foreground">
            {movement.product_variant?.warna} - {movement.product_variant?.size}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Jenis',
      render: (movement: any) => (
        <Badge variant={movement.movement_type === 'in' ? 'default' : 'secondary'}>
          {movement.movement_type === 'in' ? (
            <>
              <TrendingUp className="h-3 w-3 mr-1" />
              Masuk
            </>
          ) : (
            <>
              <TrendingDown className="h-3 w-3 mr-1" />
              Keluar
            </>
          )}
        </Badge>
      )
    },
    {
      key: 'quantity',
      title: 'Jumlah',
      render: (movement: any) => (
        <span className={`font-medium ${movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
          {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
        </span>
      )
    },
    {
      key: 'reference',
      title: 'Referensi',
      render: (movement: any) => (
        <div className="text-sm">
          <div className="capitalize">{movement.reference_type}</div>
          {movement.notes && (
            <div className="text-muted-foreground">{movement.notes}</div>
          )}
        </div>
      )
    }
  ];

  const totalStockValue = stock.reduce((total, item) => 
    total + ((item.stok || 0) * (item.product?.harga_beli || 0)), 0
  );

  const lowStockItems = stock.filter(item => (item.stok || 0) <= 5);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Stok</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.length}</div>
            <p className="text-xs text-muted-foreground">Varian produk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stock.reduce((total, item) => total + (item.stok || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Unit tersedia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
            <p className="text-xs text-muted-foreground">Total investasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Perlu restock</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Level Table */}
      <Card>
        <CardHeader>
          <CardTitle>Level Stok Saat Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={stockColumns}
            data={stock}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari produk..."
          />
        </CardContent>
      </Card>

      {/* Stock Movement History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pergerakan Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={movementColumns}
            data={movements}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari riwayat..."
          />
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Penyesuaian Stok</DialogTitle>
          </DialogHeader>
          
          {selectedVariant && (
            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <Label>Produk</Label>
                <div className="p-3 bg-muted rounded-md">
                  <div className="font-medium">{selectedVariant.product?.nama_produk}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedVariant.warna} - {selectedVariant.size}
                  </div>
                  <div className="text-sm">Stok saat ini: {selectedVariant.stok}</div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="quantity">Stok Baru *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 0 
                  }))}
                  min="0"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Input
                  id="notes"
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Alasan penyesuaian stok..."
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Sesuaikan Stok
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
