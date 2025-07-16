import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, TrendingDown, TrendingUp, Plus, Edit, Trash2, Bug } from 'lucide-react';
import { useStock, useProducts } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/common/EmptyState';

const Inventory = () => {
  const navigate = useNavigate();
  const { stock, movements, loading, fetchStock, fetchStockMovements, adjustStock, createProductVariant, updateProductVariant, deleteProductVariant } = useStock();
  const { products, fetchProducts } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
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

  // Helper function to get product name safely
  const getProductName = (item: any) => {
    // Try multiple possible paths for product name
    return item?.products?.nama_produk || 
           item?.product?.nama_produk || 
           item?.nama_produk || 
           'Produk tidak dikenal';
  };

  // Helper function to get product price safely
  const getProductPrice = (item: any) => {
    return item?.products?.harga_beli || 
           item?.product?.harga_beli || 
           item?.harga_beli || 
           0;
  };

  // Helper function to get product unit safely
  const getProductUnit = (item: any) => {
    return item?.products?.satuan || 
           item?.product?.satuan || 
           item?.satuan || 
           'pcs';
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
        variant: "destructive",
      });
      return;
    }

    try {
      await adjustStock(selectedVariant.id, adjustmentData.quantity, adjustmentData.notes || 'Penyesuaian stok manual');
      
      setDialogOpen(false);
      setSelectedVariant(null);
      setAdjustmentData({ quantity: 0, notes: '' });
      
      toast({
        title: "Sukses",
        description: "Stok berhasil disesuaikan",
      });
    } catch (error) {
      console.error('Stock adjustment error:', error);
      toast({
        title: "Error",
        description: "Gagal melakukan penyesuaian stok",
        variant: "destructive",
      });
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
        variant: "destructive",
      });
    }
  };

  const handleEditVariant = (variant: any) => {
    if (!variant) {
      toast({
        title: "Error",
        description: "Data varian tidak ditemukan",
        variant: "destructive",
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
        variant: "destructive",
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

  const stockColumns = [
    {
      key: 'product',
      title: 'Produk',
      render: (_, item: any) => {
        if (!item) return <div>Data tidak tersedia</div>;
        
        const productName = getProductName(item);
        
        return (
          <div>
            <div className="font-medium">{productName}</div>
            <div className="text-sm text-muted-foreground">
              {item?.warna || 'N/A'} - {item?.size || 'N/A'}
            </div>
            {item?.sku && (
              <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
            )}
            {showDebug && (
              <div className="text-xs text-yellow-600 mt-1">
                Debug: {JSON.stringify({
                  products: item?.products?.nama_produk || 'null',
                  product: item?.product?.nama_produk || 'null',
                  direct: item?.nama_produk || 'null'
                })}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'stok',
      title: 'Stok',
      render: (_, item: any) => {
        if (!item) return <div>0</div>;
        
        const stok = item?.stok ?? 0;
        const unit = getProductUnit(item);
        
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${stok <= 5 ? 'text-red-600' : stok <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
              {stok.toLocaleString('id-ID')}
            </span>
            <span className="text-sm text-muted-foreground">{unit}</span>
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
      render: (_, item: any) => {
        if (!item) return <div>Rp 0</div>;
        
        const stok = item?.stok || 0;
        const hargaBeli = getProductPrice(item);
        const totalValue = stok * hargaBeli;
        
        return (
          <div>
            <div className="font-medium">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-sm text-muted-foreground">
              @ {formatCurrency(hargaBeli)}
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_, item: any) => {
        if (!item) return <div>-</div>;
        
        return (
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
              onClick={() => handleDeleteVariant(item?.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ];

  const movementColumns = [
    {
      key: 'created_at',
      title: 'Tanggal',
      render: (_, movement: any) => (
        movement?.created_at ? new Date(movement.created_at).toLocaleDateString('id-ID') : '-'
      )
    },
    {
      key: 'product',
      title: 'Produk',
      render: (_, movement: any) => {
        if (!movement) return <div>Data tidak tersedia</div>;
        
        const productName = movement?.product_variant?.products?.nama_produk || 
                           movement?.product_variant?.product?.nama_produk || 
                           'Produk tidak diketahui';
        
        return (
          <div>
            <div className="font-medium">{productName}</div>
            <div className="text-sm text-muted-foreground">
              {movement?.product_variant?.warna || 'N/A'} - {movement?.product_variant?.size || 'N/A'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'movement_type',
      title: 'Jenis',
      render: (_, movement: any) => {
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
      render: (_, movement: any) => {
        if (!movement) return <span>0</span>;
        
        const quantity = movement.quantity || 0;
        
        return (
          <span className={`font-medium ${movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
            {movement.movement_type === 'in' ? '+' : '-'}{quantity.toLocaleString('id-ID')}
          </span>
        );
      }
    },
    {
      key: 'reference_type',
      title: 'Referensi',
      render: (_, movement: any) => {
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

  // Calculate real totals from actual database data
  const totalStockValue = stock?.reduce((total, item) => {
    const stok = item?.stok || 0;
    const harga = getProductPrice(item);
    return total + (stok * harga);
  }, 0) || 0;

  const lowStockItems = stock?.filter(item => (item?.stok || 0) <= 5) || [];
  const totalStock = stock?.reduce((total, item) => total + (item?.stok || 0), 0) || 0;
  const filteredMovements = movements?.filter(movement => movement != null) || [];

  if (loading) return <div className="p-6">Loading stock data...</div>;

  // Show empty state if no stock data exists
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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDebug(!showDebug)}
        >
          <Bug className="h-4 w-4 mr-2" />
          {showDebug ? 'Hide' : 'Show'} Debug
        </Button>
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
          <div className="flex gap-2">
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

      {/* Stock Movement History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pergerakan Stok</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMovements.length > 0 ? (
            <DataTable
              columns={movementColumns}
              data={filteredMovements}
              loading={loading}
              searchable={true}
              searchPlaceholder="Cari riwayat..."
             
            />
          ) : (
            <EmptyState
              icon="📊"
              title="Belum Ada Pergerakan Stok"
              description="Riwayat pergerakan stok akan muncul ketika ada transaksi penjualan, pembelian, atau penyesuaian stok."
            />
          )}
        </CardContent>
      </Card>

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