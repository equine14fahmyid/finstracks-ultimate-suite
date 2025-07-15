import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, TrendingDown, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog';
import { useStock, useProducts } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/format';

const Inventory = () => {
  const { stock, movements, loading, fetchStock, fetchStockMovements, adjustStock, createProductVariant, updateProductVariant, deleteProductVariant } = useStock();
  const { products, fetchProducts } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
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
    
    if (!selectedVariant || adjustmentData.quantity <= 0) {
      toast({
        title: "Error",
        description: "Mohon isi data penyesuaian stok dengan benar",
        variant: "destructive",
      });
      return;
    }

    try {
      await adjustStock(selectedVariant.id, adjustmentData.quantity, adjustmentData.notes);
      
      setDialogOpen(false);
      setSelectedVariant(null);
      setAdjustmentData({ quantity: 0, notes: '' });
    } catch (error) {
      console.error('Stock adjustment error:', error);
    }
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!variantFormData.product_id || !variantFormData.warna || !variantFormData.size) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }

    let result;
    if (isEditMode && selectedVariant) {
      result = await updateProductVariant(selectedVariant.id, variantFormData);
    } else {
      result = await createProductVariant(variantFormData);
    }
    
    if (!result?.error) {
      setVariantDialogOpen(false);
      resetVariantForm();
    }
  };

  const handleEditVariant = (variant: any) => {
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
    if (confirm('Apakah Anda yakin ingin menghapus varian produk ini?')) {
      await deleteProductVariant(id);
    }
  };

  const stockColumns = [
    {
      key: 'product',
      title: 'Produk',
      render: (item: any) => (
        <div>
          <div className="font-medium">{item?.products?.nama_produk || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">
            {item?.warna || 'N/A'} - {item?.size || 'N/A'}
          </div>
          {item?.sku && (
            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
          )}
        </div>
      )
    },
    {
      key: 'stock',
      title: 'Stok',
      render: (item: any) => {
        const stok = item?.stok ?? 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${stok <= 5 ? 'text-red-600' : stok <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
              {stok}
            </span>
            <span className="text-sm text-muted-foreground">{item?.products?.satuan || 'pcs'}</span>
            {stok <= 5 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Stok Rendah
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'value',
      title: 'Nilai Stok',
      render: (item: any) => (
        <div>
          <div className="font-medium">
            {formatCurrency((item?.stok || 0) * (item?.products?.harga_beli || 0))}
          </div>
          <div className="text-sm text-muted-foreground">
            @ {formatCurrency(item?.products?.harga_beli || 0)}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => {
              setSelectedVariant(item);
              setAdjustmentData({ quantity: item?.stok || 0, notes: '' });
              setDialogOpen(true);
            }}
          >
            <Package className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => handleEditVariant(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            onClick={() => handleDeleteVariant(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const movementColumns = [
    {
      key: 'date',
      title: 'Tanggal',
      render: (movement: any) => (
        movement?.created_at ? new Date(movement.created_at).toLocaleDateString('id-ID') : '-'
      )
    },
    {
      key: 'product',
      title: 'Produk',
      render: (movement: any) => {
        if (!movement) return <div>Data tidak tersedia</div>;
        
        return (
          <div>
            <div className="font-medium">
              {movement.product_variants?.products?.nama_produk || 'Produk tidak diketahui'}
            </div>
            <div className="text-sm text-muted-foreground">
              {movement.product_variants?.warna || 'N/A'} - {movement.product_variants?.size || 'N/A'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'type',
      title: 'Jenis',
      render: (movement: any) => {
        if (!movement) return <Badge variant="secondary">N/A</Badge>;
        
        return (
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
        );
      }
    },
    {
      key: 'quantity',
      title: 'Jumlah',
      render: (movement: any) => {
        if (!movement) return <span>0</span>;
        
        return (
          <span className={`font-medium ${movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
            {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity || 0}
          </span>
        );
      }
    },
    {
      key: 'reference',
      title: 'Referensi',
      render: (movement: any) => {
        if (!movement) return <div className="text-sm">N/A</div>;
        
        return (
          <div className="text-sm">
            <div className="capitalize">{movement.reference_type || 'Manual'}</div>
            {movement.notes && (
              <div className="text-muted-foreground">{movement.notes}</div>
            )}
          </div>
        );
      }
    }
  ];

  const totalStockValue = stock?.reduce((total, item) => 
    total + ((item?.stok || 0) * (item?.products?.harga_beli || 0)), 0
  ) || 0;

  const lowStockItems = stock?.filter(item => (item?.stok || 0) <= 5) || [];

  // Add safe access for summary calculations
  const totalStock = stock?.reduce((total, item) => total + (item?.stok || 0), 0) || 0;

  // Filter out any null/undefined movements to prevent errors
  const filteredMovements = movements?.filter(movement => movement != null) || [];

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
            <div className="text-2xl font-bold">
              {totalStock}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Level Stok Saat Ini</CardTitle>
          <Dialog open={variantDialogOpen} onOpenChange={(open) => {
            setVariantDialogOpen(open);
            if (!open) resetVariantForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item Stok
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
                      onValueChange={(value) => setVariantFormData(prev => ({
                        ...prev,
                        product_id: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product: any) => (
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
                        onChange={(e) => setVariantFormData(prev => ({
                          ...prev,
                          warna: e.target.value
                        }))}
                        placeholder="Merah, Biru, dll"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="size">Size *</Label>
                      <Input
                        id="size"
                        value={variantFormData.size}
                        onChange={(e) => setVariantFormData(prev => ({
                          ...prev,
                          size: e.target.value
                        }))}
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
                        onChange={(e) => setVariantFormData(prev => ({
                          ...prev,
                          stok: parseInt(e.target.value) || 0
                        }))}
                        min="0"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={variantFormData.sku}
                        onChange={(e) => setVariantFormData(prev => ({
                          ...prev,
                          sku: e.target.value
                        }))}
                        placeholder="Kode produk"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setVariantDialogOpen(false);
                      resetVariantForm();
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    {isEditMode ? 'Perbarui' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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

      {/* Stock Movement History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pergerakan Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={movementColumns}
            data={filteredMovements}
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
                  <div className="text-sm">Stok saat ini: {selectedVariant?.stok || 0}</div>
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
