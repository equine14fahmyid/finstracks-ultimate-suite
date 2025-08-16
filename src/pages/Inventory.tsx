
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, TrendingDown, TrendingUp, Plus, Edit, Trash2, Bug, RefreshCw } from 'lucide-react';
import { useStock, useProducts } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/common/EmptyState';
import { StockMovementTracker } from '@/components/inventory/StockMovementTracker';
import { StockMovementSummary } from '@/components/inventory/StockMovementSummary';
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog';

const Inventory = () => {
  const navigate = useNavigate();
  const {
    stock,
    movements,
    loading,
    fetchStock,
    fetchStockMovements,
    adjustStock,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant
  } = useStock();
  const {
    products,
    fetchProducts
  } = useProducts();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    notes: ''
  });
  const [variantFormData, setVariantFormData] = useState({
    product_id: '',
    warna: '',
    size: '',
    stok: 0,
    sku: ''
  });

  useEffect(() => {
    fetchStock();
    fetchStockMovements();
    fetchProducts();
  }, []);

  // Auto refresh setiap 30 detik untuk real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!dialogOpen && !variantDialogOpen) {
        fetchStock();
        fetchStockMovements();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dialogOpen, variantDialogOpen]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchStock(), fetchStockMovements(), fetchProducts()]);
      toast({
        title: "Data Diperbarui",
        description: "Data inventory telah diperbarui"
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to get product name safely
  const getProductName = (item: any) => {
    return item?.products?.nama_produk || item?.product?.nama_produk || item?.nama_produk || 'Produk tidak dikenal';
  };

  // Helper function to get product price safely
  const getProductPrice = (item: any) => {
    return item?.products?.harga_beli || item?.product?.harga_beli || item?.harga_beli || 0;
  };

  // Helper function to get product unit safely
  const getProductUnit = (item: any) => {
    return item?.products?.satuan || item?.product?.satuan || item?.satuan || 'pcs';
  };

  const resetVariantForm = () => {
    setVariantFormData({
      product_id: '',
      warna: '',
      size: '',
      stok: 0,
      sku: ''
    });
    setIsEditMode(false);
    setSelectedVariant(null);
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || adjustmentData.quantity < 0) {
      toast({
        title: "Error",
        description: "Mohon isi data penyesuaian stok dengan benar. Stok tidak boleh negatif.",
        variant: "destructive"
      });
      return;
    }

    try {
      await adjustStock(selectedVariant.id, adjustmentData.quantity, adjustmentData.notes || 'Penyesuaian stok manual');
      setDialogOpen(false);
      setSelectedVariant(null);
      setAdjustmentData({
        quantity: 0,
        notes: ''
      });
      toast({
        title: "Sukses",
        description: "Stok berhasil disesuaikan"
      });

      // Refresh data setelah adjustment
      await fetchStock();
      await fetchStockMovements();
    } catch (error) {
      console.error('Stock adjustment error:', error);
      toast({
        title: "Error",
        description: "Gagal melakukan penyesuaian stok",
        variant: "destructive"
      });
    }
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantFormData.product_id || !variantFormData.warna || !variantFormData.size) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive"
      });
      return;
    }

    if (variantFormData.stok < 0) {
      toast({
        title: "Error",
        description: "Stok awal tidak boleh negatif",
        variant: "destructive"
      });
      return;
    }

    try {
      let result;
      if (isEditMode && selectedVariant) {
        result = await updateProductVariant(selectedVariant.id, variantFormData);
      } else {
        result = await createProductVariant(variantFormData);
      }
      if (!result?.error) {
        setVariantDialogOpen(false);
        resetVariantForm();
        await fetchStock();
        await fetchStockMovements();
        await fetchProducts();
      }
    } catch (error) {
      console.error('Variant submit error:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan varian produk",
        variant: "destructive"
      });
    }
  };

  const handleEditVariant = (variant: any) => {
    if (!variant) {
      toast({
        title: "Error",
        description: "Data varian tidak ditemukan",
        variant: "destructive"
      });
      return;
    }
    setVariantFormData({
      product_id: variant.product_id || '',
      warna: variant.warna || '',
      size: variant.size || '',
      stok: variant.stok || 0,
      sku: variant.sku || ''
    });
    setSelectedVariant(variant);
    setIsEditMode(true);
    setVariantDialogOpen(true);
  };

  const handleDeleteVariant = async (id: string) => {
    if (!id) {
      toast({
        title: "Error",
        description: "ID varian tidak valid",
        variant: "destructive"
      });
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus varian produk ini?')) {
      try {
        await deleteProductVariant(id);
        await fetchStock();
        await fetchStockMovements();
        await fetchProducts();
      } catch (error) {
        console.error('Delete variant error:', error);
      }
    }
  };

  // Check stock status with color coding
  const getStockStatus = (stok: number) => {
    if (stok <= 0) return {
      status: 'habis',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    };
    if (stok <= 5) return {
      status: 'rendah',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    };
    if (stok <= 10) return {
      status: 'sedang',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    };
    return {
      status: 'aman',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    };
  };

  // Stock table columns
  const stockColumns = [{
    key: 'product',
    title: 'Produk',
    render: (value: any, item: any) => {
      if (!item) return <div>Data tidak tersedia</div>;
      const productName = getProductName(item);
      const stockStatus = getStockStatus(item.stok || 0);
      return (
        <div>
          <div className="font-medium">{productName}</div>
          <div className="text-sm text-muted-foreground">
            {item.warna || 'N/A'} - {item.size || 'N/A'}
          </div>
          {item.sku && <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>}
          <Badge variant="outline" className={`text-xs mt-1 ${stockStatus.color} ${stockStatus.bgColor}`}>
            Status: {stockStatus.status.toUpperCase()}
          </Badge>
        </div>
      );
    }
  }, {
    key: 'stok',
    title: 'Stok',
    render: (value: any, item: any) => {
      if (!item) return <div>0</div>;
      const stok = item.stok ?? 0;
      const unit = getProductUnit(item);
      const stockStatus = getStockStatus(stok);
      return (
        <div className="flex items-center gap-2">
          <span className={`font-medium text-lg ${stockStatus.color}`}>
            {stok.toLocaleString('id-ID')}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
          {stok <= 5 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stok <= 0 ? 'HABIS' : 'RENDAH'}
            </Badge>
          )}
        </div>
      );
    }
  }, {
    key: 'value',
    title: 'Nilai Stok',
    render: (value: any, item: any) => {
      if (!item) return <div>Rp 0</div>;
      const stok = item.stok || 0;
      const hargaBeli = getProductPrice(item);
      const totalValue = stok * hargaBeli;
      return (
        <div>
          <div className="font-medium">{formatCurrency(totalValue)}</div>
          <div className="text-sm text-muted-foreground">@ {formatCurrency(hargaBeli)}</div>
        </div>
      );
    }
  }, {
    key: 'last_movement',
    title: 'Pergerakan Terakhir',
    render: (value: any, item: any) => {
      if (!item) return <div>-</div>;

      const lastMovement = movements?.find(movement => movement?.product_variant_id === item.id);
      if (!lastMovement) {
        return <div className="text-sm text-muted-foreground">Belum ada pergerakan</div>;
      }
      const date = new Date(lastMovement.created_at).toLocaleDateString('id-ID');
      const isIncoming = lastMovement.movement_type === 'in';
      return (
        <div className="text-sm">
          <div className={`flex items-center gap-1 ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
            {isIncoming ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isIncoming ? '+' : '-'}{lastMovement.quantity}</span>
          </div>
          <div className="text-muted-foreground text-xs">{date}</div>
          <div className="text-muted-foreground text-xs">{lastMovement.reference_type || 'Manual'}</div>
        </div>
      );
    }
  }, {
    key: 'actions',
    title: 'Aksi',
    render: (value: any, item: any) => {
      if (!item) return <div>-</div>;
      return (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => {
              setSelectedVariant(item);
              setAdjustmentData({
                quantity: item.stok || 0,
                notes: ''
              });
              setDialogOpen(true);
            }} 
            title="Sesuaikan Stok"
          >
            <Package className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => handleEditVariant(item)} 
            title="Edit Varian"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700" 
            onClick={() => handleDeleteVariant(item.id)} 
            title="Hapus Varian"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }
  }];

  // Calculate totals
  const totalStockValue = stock?.reduce((total, item) => {
    const stok = item?.stok || 0;
    const harga = getProductPrice(item);
    return total + stok * harga;
  }, 0) || 0;
  const lowStockItems = stock?.filter(item => (item?.stok || 0) <= 5) || [];
  const outOfStockItems = stock?.filter(item => (item?.stok || 0) <= 0) || [];
  const totalStock = stock?.reduce((total, item) => total + (item?.stok || 0), 0) || 0;

  if (loading && !stock?.length) return <div className="p-6">Loading stock data...</div>;
  
  if (!stock?.length) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manajemen Stok</h1>
        </div>

        <EmptyState 
          icon="📦" 
          title="Belum Ada Data Stok" 
          description="Mulai dengan menambahkan produk dan varian untuk mengelola stok Anda. Buka menu Master Data > Produk untuk menambahkan produk baru." 
          actionLabel="+ Tambah Produk" 
          onAction={() => navigate('/master-data/products')} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Stok</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memperbarui...' : 'Perbarui'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
            <Bug className="h-4 w-4 mr-2" />
            {showDebug ? 'Hide' : 'Show'} Debug
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-2">
              <div><strong>Stock Items:</strong> {stock?.length || 0}</div>
              <div><strong>Products:</strong> {products?.length || 0}</div>
              <div><strong>Stock Movements:</strong> {movements?.length || 0}</div>
              <div><strong>Last Refresh:</strong> {new Date().toLocaleTimeString('id-ID')}</div>
              {stock?.length > 0 && (
                <div>
                  <strong>First Stock Item Structure:</strong>
                  <pre className="bg-yellow-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(stock[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Varian produk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toLocaleString('id-ID')}</div>
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
            <CardTitle className="text-sm font-medium">Alert Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg font-bold text-red-600">{outOfStockItems.length}</div>
              <p className="text-xs text-red-600">Stok habis</p>
              <div className="text-lg font-bold text-yellow-600">{lowStockItems.length - outOfStockItems.length}</div>
              <p className="text-xs text-yellow-600">Stok rendah</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Summary */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Ringkasan Pergerakan Stok</h2>
        <StockMovementSummary period="month" />
      </div>

      {/* Stock Level Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Level Stok Saat Ini</CardTitle>
          <div className="flex gap-2">
            <Dialog open={variantDialogOpen} onOpenChange={(open) => {
              setVariantDialogOpen(open);
              if (!open) resetVariantForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-amber-500 hover:bg-amber-400">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Varian
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <form onSubmit={handleVariantSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? 'Edit Varian Produk' : 'Tambah Varian Produk Baru'}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditMode ? 'Perbarui informasi varian produk' : 'Lengkapi informasi varian produk yang akan ditambahkan'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="product_id">Produk *</Label>
                      <Select 
                        value={variantFormData.product_id} 
                        onValueChange={(value) => setVariantFormData(prev => ({ ...prev, product_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih produk" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.filter(product => product?.id && product?.nama_produk).map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.nama_produk}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="warna">Warna *</Label>
                        <Input 
                          id="warna" 
                          value={variantFormData.warna} 
                          onChange={(e) => setVariantFormData(prev => ({ ...prev, warna: e.target.value }))} 
                          placeholder="Merah, Biru, dll" 
                          required 
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="size">Size *</Label>
                        <Input 
                          id="size" 
                          value={variantFormData.size} 
                          onChange={(e) => setVariantFormData(prev => ({ ...prev, size: e.target.value }))} 
                          placeholder="S, M, L, XL, dll" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="stok">Stok Awal</Label>
                        <Input 
                          id="stok" 
                          type="number" 
                          value={variantFormData.stok} 
                          onChange={(e) => setVariantFormData(prev => ({ ...prev, stok: parseInt(e.target.value) || 0 }))} 
                          min="0" 
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input 
                          id="sku" 
                          value={variantFormData.sku} 
                          onChange={(e) => setVariantFormData(prev => ({ ...prev, sku: e.target.value }))} 
                          placeholder="Kode produk" 
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setVariantDialogOpen(false);
                      resetVariantForm();
                    }}>
                      Batal
                    </Button>
                    <Button type="submit">
                      {isEditMode ? 'Perbarui' : 'Simpan'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={stockColumns} 
            data={stock || []} 
            loading={loading} 
            searchable={true} 
            searchPlaceholder="Cari produk..." 
          />
        </CardContent>
      </Card>

      {/* Stock Movement Tracker */}
      <StockMovementTracker showFilters={true} />

      {/* Stock Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Penyesuaian Stok</DialogTitle>
            <DialogDescription>
              Sesuaikan stok untuk {getProductName(selectedVariant)} - {selectedVariant?.warna} {selectedVariant?.size}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVariant && (
            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <Label>Produk</Label>
                <div className="p-3 bg-muted rounded-md">
                  <div className="font-medium">{getProductName(selectedVariant)}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedVariant.warna} - {selectedVariant.size}
                  </div>
                  <div className="text-sm">Stok saat ini: {(selectedVariant?.stok || 0).toLocaleString('id-ID')}</div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="quantity">Stok Baru *</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  value={adjustmentData.quantity} 
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value >= 0) {
                      setAdjustmentData(prev => ({ ...prev, quantity: value }));
                    }
                  }} 
                  min="0" 
                  required 
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {adjustmentData.quantity > (selectedVariant?.stok || 0) ? 
                    `Akan menambah ${adjustmentData.quantity - (selectedVariant?.stok || 0)} unit` : 
                    adjustmentData.quantity < (selectedVariant?.stok || 0) ? 
                    `Akan mengurangi ${(selectedVariant?.stok || 0) - adjustmentData.quantity} unit` : 
                    'Tidak ada perubahan'
                  }
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Input 
                  id="notes" 
                  value={adjustmentData.notes} 
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))} 
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
