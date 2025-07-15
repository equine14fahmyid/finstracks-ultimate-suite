
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ShoppingBag, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePurchases, useStock, useSuppliers } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatShortDate } from '@/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PurchaseFormData {
  tanggal: string;
  supplier_id: string;
  no_invoice_supplier: string;
  payment_method: 'cash' | 'transfer' | 'credit';
  payment_status: string;
  notes: string;
  items: {
    product_variant_id: string;
    quantity: number;
    harga_beli_satuan: number;
    product_name?: string;
    variant_display?: string;
  }[];
}

const Purchases = () => {
  const { hasPermission } = useAuth();
  const { purchases, loading, fetchPurchases, createPurchase, updatePurchase, deletePurchase } = usePurchases();
  const { stock: stockProducts, fetchStock } = useStock();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [formData, setFormData] = useState<PurchaseFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    supplier_id: '',
    no_invoice_supplier: '',
    payment_method: 'cash',
    payment_status: 'pending',
    notes: '',
    items: [{ product_variant_id: '', quantity: 1, harga_beli_satuan: 0 }]
  });

  useEffect(() => {
    fetchPurchases();
    fetchStock();
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || formData.items.length === 0) {
      toast({
        title: "Error",
        description: "Mohon lengkapi data pembelian",
        variant: "destructive",
      });
      return;
    }

    // Validate items
    const validItems = formData.items.filter(item => 
      item.product_variant_id && item.quantity > 0 && item.harga_beli_satuan > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Minimal satu item produk harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Clean purchase data - remove items field and any other non-schema fields
    const purchaseData = {
      tanggal: formData.tanggal,
      supplier_id: formData.supplier_id,
      no_invoice_supplier: formData.no_invoice_supplier || null,
      payment_method: formData.payment_method,
      payment_status: formData.payment_status,
      notes: formData.notes || null,
    };

    let result;
    if (editingPurchase) {
      result = await updatePurchase(editingPurchase.id, purchaseData);
    } else {
      result = await createPurchase(purchaseData, validItems);
    }

    if (!result.error) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (purchase: any) => {
    setEditingPurchase(purchase);
    setFormData({
      tanggal: purchase.tanggal,
      supplier_id: purchase.supplier_id,
      no_invoice_supplier: purchase.no_invoice_supplier || '',
      payment_method: purchase.payment_method,
      payment_status: purchase.payment_status,
      notes: purchase.notes || '',
      items: purchase.purchase_items?.map((item: any) => ({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_beli_satuan: item.harga_beli_satuan,
        product_name: item.product_variant?.product?.nama_produk,
        variant_display: `${item.product_variant?.warna} - ${item.product_variant?.size}`
      })) || [{ product_variant_id: '', quantity: 1, harga_beli_satuan: 0 }]
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deletePurchase(id);
  };

  const resetForm = () => {
    setEditingPurchase(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      supplier_id: '',
      no_invoice_supplier: '',
      payment_method: 'cash',
      payment_status: 'pending',
      notes: '',
      items: [{ product_variant_id: '', quantity: 1, harga_beli_satuan: 0 }]
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_variant_id: '', quantity: 1, harga_beli_satuan: 0 }]
    }));
  };

  const removeItem = (index: number) => {
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
          
          // Auto-fill info when product is selected
          if (field === 'product_variant_id' && value) {
            const product = stockProducts?.find(p => p?.id === value);
            if (product) {
              updatedItem.harga_beli_satuan = product?.product?.harga_beli || 0;
              updatedItem.product_name = product?.product?.nama_produk || '';
              updatedItem.variant_display = `${product?.warna || ''} - ${product?.size || ''}`;
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
      sum + (item.quantity * item.harga_beli_satuan), 0
    );
  };

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (value: any, purchase: any) => formatShortDate(purchase?.tanggal)
    },
    {
      key: 'supplier',
      title: 'Supplier',
      render: (value: any, purchase: any) => (
        <div>
          <div className="font-medium">{purchase?.supplier?.nama_supplier || '-'}</div>
          <div className="text-sm text-muted-foreground">{purchase?.no_invoice_supplier || 'Tanpa invoice'}</div>
        </div>
      )
    },
    {
      key: 'items',
      title: 'Produk',
      render: (value: any, purchase: any) => (
        <div className="space-y-1">
          {purchase?.purchase_items?.slice(0, 2).map((item: any, index: number) => (
            <div key={index} className="text-sm">
              {item?.product_variant?.product?.nama_produk || 'Produk tidak diketahui'} 
              <span className="text-muted-foreground">
                ({item?.product_variant?.warna || '-'} - {item?.product_variant?.size || '-'})
              </span>
              <span className="ml-1">× {item?.quantity || 0}</span>
            </div>
          )) || <span className="text-muted-foreground text-sm">Tidak ada item</span>}
          {purchase?.purchase_items?.length > 2 && (
            <div className="text-xs text-muted-foreground">
              +{purchase.purchase_items.length - 2} item lainnya
            </div>
          )}
        </div>
      )
    },
    {
      key: 'total',
      title: 'Total',
      render: (value: any, purchase: any) => (
        <div>
          <div className="font-medium">{formatCurrency(purchase?.total || 0)}</div>
          <div className="text-sm text-muted-foreground">
            Subtotal: {formatCurrency(purchase?.subtotal || 0)}
          </div>
        </div>
      )
    },
    {
      key: 'payment_status',
      title: 'Status Pembayaran',
      render: (value: any, purchase: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          purchase?.payment_status === 'paid' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {purchase?.payment_status === 'paid' ? 'Lunas' : 'Pending'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (value: any, purchase: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(purchase)}>
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
                <AlertDialogTitle>Hapus Pembelian</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus pembelian ini? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(purchase.id)} className="bg-destructive text-destructive-foreground">
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manajemen Pembelian</h1>
          <p className="text-muted-foreground">
            Kelola transaksi pembelian dari supplier
          </p>
        </div>

        {hasPermission('purchases.create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                {editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
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
                    <Label htmlFor="supplier_id">Supplier *</Label>
                    <Select 
                      value={formData.supplier_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier?.nama_supplier || 'Supplier tidak diketahui'}
                          </SelectItem>
                        )) || <SelectItem value="" disabled>Tidak ada supplier tersedia</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="no_invoice_supplier">No. Invoice Supplier</Label>
                    <Input
                      id="no_invoice_supplier"
                      value={formData.no_invoice_supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, no_invoice_supplier: e.target.value }))}
                      placeholder="INV-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Metode Pembayaran</Label>
                    <Select 
                      value={formData.payment_method} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Tunai</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="credit">Kredit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_status">Status Pembayaran</Label>
                    <Select 
                      value={formData.payment_status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Lunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Keterangan</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Catatan pembelian"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Product Items */}
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
                      <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border rounded-lg">
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
                              {stockProducts?.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product?.product?.nama_produk || 'Produk tidak diketahui'} - {product?.warna || '-'} {product?.size || '-'}
                                </SelectItem>
                              )) || <SelectItem value="" disabled>Tidak ada produk tersedia</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Qty</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label>Harga Beli Satuan</Label>
                          <Input
                            type="number"
                            value={item.harga_beli_satuan}
                            onChange={(e) => updateItem(index, 'harga_beli_satuan', Number(e.target.value))}
                            min="0"
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="w-full">
                            <Label>Subtotal</Label>
                            <div className="text-sm font-medium p-2 bg-muted rounded">
                              {formatCurrency(item.quantity * item.harga_beli_satuan)}
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
                    ))}
                  </div>
                </div>

                {/* Total Summary */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="gradient-primary">
                    {loading ? 'Menyimpan...' : editingPurchase ? 'Update Pembelian' : 'Simpan Pembelian'}
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

      {/* Purchases Table */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Daftar Pembelian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={purchases || []}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari pembelian..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Purchases;
