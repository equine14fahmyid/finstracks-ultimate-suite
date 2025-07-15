import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, TrendingDown, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import { useStock, useProducts } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/common/EmptyState';
import { supabase } from '@/integrations/supabase/client';

const Inventory = () => {
  const navigate = useNavigate();
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

  // Function to seed sample data for testing
  const seedSampleData = async () => {
    console.log('🌱 Seeding sample data...');
    
    try {
      // Create sample products
      const products = [
        {
          nama_produk: 'Kaos Batik Tasikmalaya',
          harga_beli: 75000,
          harga_jual_default: 125000,
          satuan: 'pcs',
          deskripsi: 'Kaos batik premium khas Tasikmalaya'
        },
        {
          nama_produk: 'Tas Anyaman Pandan',
          harga_beli: 45000,
          harga_jual_default: 85000,
          satuan: 'pcs',
          deskripsi: 'Tas anyaman tradisional'
        }
      ];

      for (const productData of products) {
        const { data: product, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (!error && product) {
          // Create variants for each product
          const variants = [
            { warna: 'Biru', size: 'M', stok: 25 },
            { warna: 'Merah', size: 'L', stok: 15 },
            { warna: 'Hijau', size: 'S', stok: 30 }
          ];

          for (const variant of variants) {
            await supabase
              .from('product_variants')
              .insert({
                product_id: product.id,
                warna: variant.warna,
                size: variant.size,
                stok: variant.stok,
                sku: `${product.id.slice(0, 4)}-${variant.warna.slice(0, 2)}-${variant.size}`.toUpperCase()
              });
          }
        }
      }

      toast({
        title: "Berhasil",
        description: "Sample data berhasil ditambahkan!",
      });
      
      // Refresh data
      fetchStock();
      fetchProducts();
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan sample data",
        variant: "destructive",
      });
    }
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
        // Force refresh all data to sync
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
        // Force refresh all data to sync
        await fetchStock();
        await fetchStockMovements();
        await fetchProducts();
      } catch (error) {
        console.error('Delete variant error:', error);
        // Error handling is done in the hook
      }
    }
  };

  const stockColumns = [
    {
      key: 'product',
      title: 'Produk',
      render: (item: any) => {
        if (!item) return <div>Data tidak tersedia</div>;
        
        return (
          <div>
            <div className="font-medium">{item?.products?.nama_produk || 'Unknown Product'}</div>
            <div className="text-sm text-muted-foreground">
              {item?.warna || 'N/A'} - {item?.size || 'N/A'}
            </div>
            {item?.sku && (
              <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'stock',
      title: 'Stok',
      render: (item: any) => {
        if (!item) return <div>0</div>;
        
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
      render: (item: any) => {
        if (!item) return <div>Rp 0</div>;
        
        return (
          <div>
            <div className="font-medium">
              {formatCurrency((item?.stok || 0) * (item?.products?.harga_beli || 0))}
            </div>
            <div className="text-sm text-muted-foreground">
              @ {formatCurrency(item?.products?.harga_beli || 0)}
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item: any) => {
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
              {movement.product_variant?.product?.nama_produk || 'Produk tidak diketahui'}
            </div>
            <div className="text-sm text-muted-foreground">
              {movement.product_variant?.warna || 'N/A'} - {movement.product_variant?.size || 'N/A'}
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

  // Calculate real totals from actual database data
  const totalStockValue = stock?.reduce((total, item) => 
    total + ((item?.stok || 0) * (item?.products?.harga_beli || 0)), 0
  ) || 0;

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
          description="Mulai dengan menambahkan produk dan varian untuk mengelola stok Anda. Anda juga bisa menambahkan data sample untuk testing."
          actionLabel="+ Tambah Produk"
          onAction={() => navigate('/master-data/products')}
        />

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={seedSampleData}
            variant="outline"
            className="gradient-primary"
          >
            🌱 Tambah Data Sample (Testing)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Stok</h1>
      </div>

      {/* Summary Cards - Using real data only */}
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
            <div className="text-2xl font-bold">{totalStock}</div>
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
            <Button 
              onClick={seedSampleData}
              variant="outline"
              size="sm"
            >
              🌱 Tambah Sample Data
            </Button>
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
              Sesuaikan stok untuk {selectedVariant?.product?.nama_produk} - {selectedVariant?.warna} {selectedVariant?.size}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVariant && (
            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <Label>Produk</Label>
                <div className="p-3 bg-muted rounded-md">
                  <div className="font-medium">{selectedVariant.product?.nama_produk || 'N/A'}</div>
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
