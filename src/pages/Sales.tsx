import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ShoppingCart, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSales, useStock, useExpeditions, useStores } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatShortDate } from '@/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface SaleFormData {
  tanggal: string;
  no_pesanan_platform: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  ongkir: number;
  diskon: number;
  no_resi: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  notes: string;
  items: {
    product_variant_id: string;
    quantity: number;
    harga_satuan: number;
    product_name?: string;
    variant_display?: string;
  }[];
}

const Sales = () => {
  const { hasPermission } = useAuth();
  const { sales, loading, fetchSales, createSale, updateSale, deleteSale } = useSales();
  const { stock: stockProducts, fetchStock } = useStock();
  const { expeditions, fetchExpeditions } = useExpeditions();
  const { stores, fetchStores } = useStores();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<SaleFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    no_pesanan_platform: '',
    store_id: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    ongkir: 0,
    diskon: 0,
    no_resi: '',
    status: 'pending',
    notes: '',
    items: [{ product_variant_id: '', quantity: 1, harga_satuan: 0 }]
  });

  useEffect(() => {
    fetchSales();
    fetchStock();
    fetchExpeditions();
    fetchStores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.no_pesanan_platform || !formData.customer_name || !formData.store_id || formData.items.length === 0) {
      toast({
        title: "Error",
        description: "Mohon lengkapi data penjualan",
        variant: "destructive",
      });
      return;
    }

    // Validate items
    const validItems = formData.items.filter(item => 
      item.product_variant_id && item.quantity > 0 && item.harga_satuan > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Minimal satu item produk harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Validate stock availability
    const stockValidationErrors: string[] = [];
    
    for (const item of validItems) {
      const product = stockProducts?.find(p => p.id === item.product_variant_id);
      if (!product) {
        stockValidationErrors.push(`Produk dengan ID ${item.product_variant_id} tidak ditemukan`);
        continue;
      }
      
      if ((product.stok || 0) < item.quantity) {
        stockValidationErrors.push(
          `${product.products?.nama_produk || 'Produk'} ${product.warna}-${product.size}: ` +
          `Stok tersedia ${product.stok || 0}, diminta ${item.quantity}`
        );
      }
    }
    
    if (stockValidationErrors.length > 0) {
      toast({
        title: "Validasi Stok Gagal",
        description: stockValidationErrors.join('; '),
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicate products
    const productIds = validItems.map(item => item.product_variant_id);
    const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      toast({
        title: "Produk Duplikat",
        description: "Tidak boleh memilih produk yang sama dalam satu transaksi",
        variant: "destructive",
      });
      return;
    }

    const saleData = {
      tanggal: formData.tanggal,
      no_pesanan_platform: formData.no_pesanan_platform,
      store_id: formData.store_id,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone || null,
      customer_address: formData.customer_address || null,
      ongkir: formData.ongkir,
      diskon: formData.diskon,
      no_resi: formData.no_resi || null,
      status: formData.status,
      notes: formData.notes || null,
    };

    let result;
    if (editingSale) {
      result = await updateSale(editingSale.id, saleData, validItems);
    } else {
      result = await createSale(saleData, validItems);
    }

    if (!result.error) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (sale: any) => {
    setEditingSale(sale);
    
    // Reset selected products set untuk edit mode
    const editSelectedProducts = new Set<string>();
    
    const saleItems = sale.sale_items?.map((item: any) => {
      editSelectedProducts.add(item.product_variant_id);
      return {
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan,
        product_name: item.product_variant?.product?.nama_produk,
        variant_display: `${item.product_variant?.warna} - ${item.product_variant?.size}`
      };
    }) || [{ product_variant_id: '', quantity: 1, harga_satuan: 0 }];
    
    setSelectedProducts(editSelectedProducts);
    
    setFormData({
      tanggal: sale.tanggal,
      no_pesanan_platform: sale.no_pesanan_platform,
      store_id: sale.store_id,
      customer_name: sale.customer_name,
      customer_phone: sale.customer_phone || '',
      customer_address: sale.customer_address || '',
      ongkir: sale.ongkir || 0,
      diskon: sale.diskon || 0,
      no_resi: sale.no_resi || '',
      status: sale.status,
      notes: sale.notes || '',
      items: saleItems
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteSale(id);
  };

  const resetForm = () => {
    setEditingSale(null);
    setSelectedProducts(new Set());
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      no_pesanan_platform: '',
      store_id: '',
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      ongkir: 0,
      diskon: 0,
      no_resi: '',
      status: 'pending',
      notes: '',
      items: [{ product_variant_id: '', quantity: 1, harga_satuan: 0 }]
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_variant_id: '', quantity: 1, harga_satuan: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    const itemToRemove = formData.items[index];
    
    // Remove from selected products set
    if (itemToRemove.product_variant_id) {
      setSelectedProducts(prevSelected => {
        const newSelected = new Set(prevSelected);
        newSelected.delete(itemToRemove.product_variant_id);
        return newSelected;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Handle product selection change
          if (field === 'product_variant_id') {
            // Remove old product from selected set
            if (item.product_variant_id) {
              setSelectedProducts(prevSelected => {
                const newSelected = new Set(prevSelected);
                newSelected.delete(item.product_variant_id);
                return newSelected;
              });
            }
            
            // Add new product to selected set
            if (value) {
              setSelectedProducts(prevSelected => new Set(prevSelected).add(value));
              
              // Auto-fill price when product is selected
              const product = stockProducts?.find(p => p?.id === value);
              if (product?.products) {
                updatedItem.harga_satuan = product.products.harga_jual_default || 0;
                updatedItem.product_name = product.products.nama_produk || '';
                updatedItem.variant_display = `${product.warna || ''} - ${product.size || ''}`;
              }
            }
          }
          
          // Handle quantity change with stock validation
          if (field === 'quantity') {
            const selectedProduct = stockProducts?.find(p => p.id === item.product_variant_id);
            const availableStock = selectedProduct?.stok || 0;
            
            if (value > availableStock) {
              toast({
                title: "Stok Tidak Mencukupi",
                description: `Stok tersedia: ${availableStock}, diminta: ${value}`,
                variant: "destructive"
              });
              return item; // Don't update if exceeds stock
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.harga_satuan), 0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() + formData.ongkir - formData.diskon;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Pending" },
      processing: { variant: "default", label: "Diproses" },
      shipped: { variant: "outline", label: "Dikirim" },
      delivered: { variant: "default", label: "Selesai" },
      cancelled: { variant: "destructive", label: "Dibatal" },
      returned: { variant: "destructive", label: "Retur" }
    };
    
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (value: any, sale: any) => formatShortDate(sale?.tanggal)
    },
    {
      key: 'no_pesanan_platform',
      title: 'No. Pesanan',
      render: (value: any, sale: any) => (
        <div>
          <div className="font-medium">{sale?.no_pesanan_platform || '-'}</div>
          <div className="text-sm text-muted-foreground">{sale?.customer_name || '-'}</div>
        </div>
      )
    },
    {
      key: 'store',
      title: 'Toko',
      render: (value: any, sale: any) => (
        <div>
          <div className="font-medium">{sale?.store?.nama_toko || '-'}</div>
          <div className="text-sm text-muted-foreground">{sale?.store?.platform?.nama_platform || '-'}</div>
        </div>
      )
    },
    {
      key: 'items',
      title: 'Produk',
      render: (value: any, sale: any) => (
        <div className="space-y-1">
          {sale?.sale_items?.slice(0, 2).map((item: any, index: number) => (
            <div key={index} className="text-sm">
              {item?.product_variant?.product?.nama_produk || 'Produk tidak diketahui'} 
              <span className="text-muted-foreground">
                ({item?.product_variant?.warna || '-'} - {item?.product_variant?.size || '-'})
              </span>
              <span className="ml-1">× {item?.quantity || 0}</span>
            </div>
          )) || <span className="text-muted-foreground text-sm">Tidak ada item</span>}
          {sale?.sale_items?.length > 2 && (
            <div className="text-xs text-muted-foreground">
              +{sale.sale_items.length - 2} item lainnya
            </div>
          )}
        </div>
      )
    },
    {
      key: 'total',
      title: 'Total',
      render: (value: any, sale: any) => (
        <div>
          <div className="font-medium">{formatCurrency(sale?.total)}</div>
          <div className="text-sm text-muted-foreground">
            Subtotal: {formatCurrency(sale?.subtotal)}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: any, sale: any) => getStatusBadge(sale?.status || 'pending')
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (value: any, sale: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(sale)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Penjualan</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus penjualan ini? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(sale.id)} className="bg-destructive text-destructive-foreground">
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manajemen Penjualan</h1>
          <p className="text-muted-foreground">
            Kelola transaksi penjualan dan order customer
          </p>
        </div>

        {hasPermission('sales.create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                {editingSale ? 'Edit Penjualan' : 'Tambah Penjualan'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSale ? 'Edit Penjualan' : 'Tambah Penjualan Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tanggal">Tanggal *</Label>
                    <Input
                      id="tanggal"
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="no_pesanan_platform">No. Pesanan Platform *</Label>
                    <Input
                      id="no_pesanan_platform"
                      value={formData.no_pesanan_platform}
                      onChange={(e) => setFormData(prev => ({ ...prev, no_pesanan_platform: e.target.value }))}
                      placeholder="TKP12345678"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_id">Toko *</Label>
                    <Select 
                      value={formData.store_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, store_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih toko" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores?.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store?.nama_toko || 'Toko tidak diketahui'} - {store?.platform?.nama_platform || 'Platform tidak diketahui'}
                          </SelectItem>
                        )) || <SelectItem value="" disabled>Tidak ada toko tersedia</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customer_name">Nama Customer *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">No. HP Customer</Label>
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                      placeholder="081234567890"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="customer_address">Alamat Customer</Label>
                    <Textarea
                      id="customer_address"
                      value={formData.customer_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                      placeholder="Alamat lengkap customer"
                      rows={2}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Detail Produk *</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                          <div className="md:col-span-2">
                            <Label>Produk</Label>
                            <Select 
                              value={item.product_variant_id} 
                              onValueChange={(value) => updateItem(index, 'product_variant_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih produk" />
                              </SelectTrigger>
                              <SelectContent>
                                {stockProducts?.filter(product => {
                                  const hasStock = (product?.stok || 0) > 0;
                                  const isNotSelected = !selectedProducts.has(product.id) || product.id === item.product_variant_id;
                                  return hasStock && isNotSelected;
                                }).map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div className="flex justify-between items-center w-full">
                                      <span>
                                        {product?.products?.nama_produk || 'Produk tidak diketahui'} - {product?.warna || '-'} {product?.size || '-'}
                                      </span>
                                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                        (product?.stok || 0) <= 5 ? 'bg-red-100 text-red-800' : 
                                        (product?.stok || 0) <= 10 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        Stok: {product?.stok || 0}
                                      </span>
                                    </div>
                                  </SelectItem>
                                )) || <SelectItem value="" disabled>Tidak ada produk dengan stok tersedia</SelectItem>}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col">
                            <Label>Qty</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              min="1"
                              max={(() => {
                                const selectedProduct = stockProducts?.find(p => p.id === item.product_variant_id);
                                return selectedProduct?.stok || 1;
                              })()}
                            />
                            {item.product_variant_id && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Max: {stockProducts?.find(p => p.id === item.product_variant_id)?.stok || 0} unit
                              </div>
                            )}
                          </div>
                          <div>
                            <Label>Harga Satuan</Label>
                            <Input
                              type="number"
                              value={item.harga_satuan}
                              onChange={(e) => updateItem(index, 'harga_satuan', Number(e.target.value))}
                              min="0"
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="w-full">
                              <Label>Subtotal</Label>
                              <div className="text-sm font-medium p-2 bg-muted rounded">
                                {formatCurrency(item.quantity * item.harga_satuan)}
                              </div>
                            </div>
                            {formData.items.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeItem(index)}
                                className="ml-2"
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {item.product_variant_id && (
                          <div className="mt-2 p-2 bg-muted rounded-md">
                            {(() => {
                              const product = stockProducts?.find(p => p.id === item.product_variant_id);
                              const stock = product?.stok || 0;
                              return (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">
                                    {product?.products?.nama_produk} - {product?.warna} {product?.size}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      stock <= 5 ? 'bg-red-100 text-red-800' : 
                                      stock <= 10 ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      Stok: {stock}
                                    </span>
                                    {stock <= 5 && (
                                      <span className="text-red-600 text-xs">⚠️ Stok Rendah</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ongkir">Ongkos Kirim</Label>
                    <Input
                      id="ongkir"
                      type="number"
                      value={formData.ongkir}
                      onChange={(e) => setFormData(prev => ({ ...prev, ongkir: Number(e.target.value) }))}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="diskon">Diskon</Label>
                    <Input
                      id="diskon"
                      type="number"
                      value={formData.diskon}
                      onChange={(e) => setFormData(prev => ({ ...prev, diskon: Number(e.target.value) }))}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Diproses</SelectItem>
                        <SelectItem value="shipped">Dikirim</SelectItem>
                        <SelectItem value="delivered">Selesai</SelectItem>
                        <SelectItem value="cancelled">Dibatal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ongkos Kirim:</span>
                      <span>{formatCurrency(formData.ongkir)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diskon:</span>
                      <span>-{formatCurrency(formData.diskon)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="gradient-primary">
                    {loading ? 'Menyimpan...' : editingSale ? 'Update Penjualan' : 'Simpan Penjualan'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Daftar Penjualan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sales || []}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari penjualan..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;