import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, InputCurrency } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ShoppingBag, Edit, Trash2, Download, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStock, useSuppliers, useBanks, usePurchases } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatShortDate, formatDate } from '@/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { exportDataTableAsPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';
import DateFilter from '@/components/dashboard/DateFilter';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface PurchaseFormData {
  tanggal: string;
  supplier_id: string;
  no_invoice_supplier: string;
  payment_method: 'cash' | 'transfer' | 'credit';
  payment_status: string;
  bank_id: string;
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
  const { banks, fetchBanks } = useBanks();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [formData, setFormData] = useState<PurchaseFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    supplier_id: '',
    no_invoice_supplier: '',
    payment_method: 'cash',
    payment_status: 'pending',
    bank_id: '',
    notes: '',
    items: [{ product_variant_id: '', quantity: 1, harga_beli_satuan: 0 }]
  });

  useEffect(() => {
    fetchPurchases();
  }, [dateRange]);

  useEffect(() => {
    fetchStock();
    fetchSuppliers();
    fetchBanks();
  }, []);

  const handleExportPDF = () => {
    toast({ title: "Mengekspor PDF...", description: "Harap tunggu sebentar." });
    
    const preparedData = purchases.map(purchase => ({
      tanggal: formatShortDate(purchase?.tanggal),
      supplier: purchase?.supplier?.nama_supplier || '-',
      invoice: purchase?.no_invoice_supplier || '-',
      bank: purchase?.bank?.nama_bank || 'N/A',
      total: formatCurrency(purchase?.total || 0),
      status: purchase?.payment_status === 'paid' ? 'Lunas' : 'Pending',
    }));

    exportDataTableAsPDF({
      data: preparedData,
      columns: [
        { title: 'Tanggal', dataKey: 'tanggal' },
        { title: 'Supplier', dataKey: 'supplier' },
        { title: 'Invoice', dataKey: 'invoice' },
        { title: 'Bank', dataKey: 'bank' },
        { title: 'Total', dataKey: 'total' },
        { title: 'Status', dataKey: 'status' },
      ],
      title: `Laporan Pembelian (${formatDate(dateRange.from)} - ${formatDate(dateRange.to)})`,
      filename: `Laporan-Pembelian-${new Date().toISOString().split('T')[0]}.pdf`,
      companyInfo: {
        name: 'FINTracks Ultimate Suite',
        address: 'Tasikmalaya, Indonesia'
      }
    });
  };

  const handleExportCSV = () => {
    toast({ title: "Mengekspor CSV...", description: "Harap tunggu sebentar." });

    const preparedData = purchases.map(purchase => ({
      Tanggal: formatShortDate(purchase?.tanggal),
      Supplier: purchase?.supplier?.nama_supplier || '-',
      'No Invoice': purchase?.no_invoice_supplier || '-',
      'Bank/Metode': purchase?.bank?.nama_bank || purchase?.payment_method || 'N/A',
      'Nama Pemilik': purchase?.bank?.nama_pemilik || '-',
      'Total Pembelian': purchase?.total || 0,
      'Status Pembayaran': purchase?.payment_status === 'paid' ? 'Lunas' : 'Pending',
      Catatan: purchase?.notes || '-'
    }));
    
    exportToCSV({
      data: preparedData,
      filename: `Laporan-Pembelian-${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

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

    if (formData.payment_method !== 'credit' && !formData.bank_id) {
      toast({
        title: "Error",
        description: "Bank account wajib dipilih untuk metode pembayaran ini",
        variant: "destructive",
      });
      return;
    }

    if (formData.payment_status === 'paid' && formData.payment_method !== 'credit') {
      const selectedBank = banks?.find(b => b.id === formData.bank_id);
      const totalAmount = calculateSubtotal();
      
      if (selectedBank && (selectedBank.saldo_akhir || 0) < totalAmount) {
        toast({
          title: "Saldo Tidak Mencukupi",
          description: `Saldo bank: ${formatCurrency(selectedBank.saldo_akhir || 0)}, Total: ${formatCurrency(totalAmount)}`,
          variant: "destructive",
        });
        return;
      }
    }

    const validItems = formData.items.filter(item => 
      item.product_variant_id && item.quantity > 0 && item.harga_beli_satuan >= 0
    );

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Minimal satu item produk harus diisi",
        variant: "destructive",
      });
      return;
    }

    const purchaseData = {
      tanggal: formData.tanggal,
      supplier_id: formData.supplier_id,
      no_invoice_supplier: formData.no_invoice_supplier || null,
      payment_method: formData.payment_method,
      payment_status: formData.payment_status,
      bank_id: formData.bank_id || null,
      notes: formData.notes || null,
    };

    let result;
    if (editingPurchase) {
      result = await updatePurchase(editingPurchase.id, purchaseData, validItems, editingPurchase.purchase_items);
    } else {
      result = await createPurchase(purchaseData, validItems);
    }

    if (result && !result.error) {
      setDialogOpen(false);
      resetForm();
      await fetchStock();
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
      bank_id: purchase.bank_id || '',
      notes: purchase.notes || '',
      items: purchase.purchase_items && purchase.purchase_items.length > 0 
        ? purchase.purchase_items.map((item: any) => ({
            product_variant_id: item.product_variant_id || '',
            quantity: item.quantity || 1,
            harga_beli_satuan: item.harga_beli_satuan || 0,
            product_name: item.product_variant?.products?.nama_produk || '',
            variant_display: `${item.product_variant?.warna || ''} - ${item.product_variant?.size || ''}`
          }))
        : [{ product_variant_id: '', quantity: 1, harga_beli_satuan: 0 }]
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deletePurchase(id);
    if (result.success) {
      await fetchStock();
    }
  };

  const resetForm = () => {
    setEditingPurchase(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      supplier_id: '',
      no_invoice_supplier: '',
      payment_method: 'cash',
      payment_status: 'pending',
      bank_id: '',
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
          
          if (field === 'product_variant_id' && value) {
            const product = stockProducts?.find(p => p?.id === value);
            if (product) {
              updatedItem.harga_beli_satuan = product?.products?.harga_beli || 0;
              updatedItem.product_name = product?.products?.nama_produk || '';
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
      render: (_: any, purchase: any) => formatShortDate(purchase?.tanggal)
    },
    {
      key: 'supplier',
      title: 'Supplier',
      render: (_: any, purchase: any) => (
        <div>
          <div className="font-medium">{purchase?.supplier?.nama_supplier || '-'}</div>
          <div className="text-sm text-muted-foreground">{purchase?.no_invoice_supplier || 'Tanpa invoice'}</div>
        </div>
      )
    },
    {
      key: 'bank',
      title: 'Bank',
      render: (_: any, purchase: any) => (
        <div>
          <div className="font-medium">{purchase?.bank?.nama_bank || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{purchase?.bank?.nama_pemilik || ''}</div>
        </div>
      )
    },
    {
      key: 'items',
      title: 'Produk',
      render: (_: any, purchase: any) => (
        <div className="space-y-1">
          {purchase?.purchase_items?.slice(0, 2).map((item: any, index: number) => (
            <div key={index} className="text-sm">
              {item?.product_variant?.products?.nama_produk || 'Produk tidak diketahui'} 
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
      render: (_: any, purchase: any) => (
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
      render: (_: any, purchase: any) => (
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
      render: (_: any, purchase: any) => (
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
                  Apakah Anda yakin ingin menghapus pembelian ini? Tindakan ini tidak dapat dibatalkan dan akan mengurangi stok produk.
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

  const totalPurchases = purchases.reduce((total, purchase) => total + (purchase?.total || 0), 0);
  const thisMonthPurchases = purchases.filter(purchase => 
    purchase?.tanggal && new Date(purchase.tanggal).getMonth() === new Date().getMonth()
  ).reduce((total, purchase) => total + (purchase?.total || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex flex-col gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Manajemen Pembelian</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Kelola transaksi pembelian dari supplier
          </p>
        </div>

        {hasPermission('purchases.create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary w-full sm:w-auto" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian'}</span>
                <span className="sm:hidden">{editingPurchase ? 'Edit' : 'Tambah'}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="tanggal" className="text-sm md:text-base">Tanggal *</Label>
                    <Input
                      id="tanggal"
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                      required
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier_id" className="text-sm md:text-base">Supplier *</Label>
                    <Select 
                      value={formData.supplier_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                    >
                      <SelectTrigger className="text-sm md:text-base">
                        <SelectValue placeholder="Pilih supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id} className="text-sm md:text-base">
                            {supplier?.nama_supplier || 'Supplier tidak diketahui'}
                          </SelectItem>
                        )) || <SelectItem value="" disabled>Tidak ada supplier tersedia</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="no_invoice_supplier" className="text-sm md:text-base">No. Invoice Supplier</Label>
                    <Input
                      id="no_invoice_supplier"
                      value={formData.no_invoice_supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, no_invoice_supplier: e.target.value }))}
                      placeholder="INV-001"
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method" className="text-sm md:text-base">Metode Pembayaran</Label>
                    <Select 
                      value={formData.payment_method} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, payment_method: value, bank_id: value === 'credit' ? '' : prev.bank_id }))}
                    >
                      <SelectTrigger className="text-sm md:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash" className="text-sm md:text-base">Tunai</SelectItem>
                        <SelectItem value="transfer" className="text-sm md:text-base">Transfer</SelectItem>
                        <SelectItem value="credit" className="text-sm md:text-base">Kredit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.payment_method !== 'credit' && (
                    <div>
                      <Label htmlFor="bank_id" className="text-sm md:text-base">Bank Account *</Label>
                      <Select 
                        value={formData.bank_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, bank_id: value }))}
                        required
                      >
                        <SelectTrigger className="text-sm md:text-base">
                          <SelectValue placeholder="Pilih bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks?.filter(bank => bank.is_active).map((bank) => (
                            <SelectItem key={bank.id} value={bank.id} className="text-sm md:text-base">
                              <div className="block">
                                <div>{bank.nama_bank} - {bank.nama_pemilik}</div>
                                <div className="text-xs text-muted-foreground">Saldo: {formatCurrency(bank.saldo_akhir || 0)}</div>
                              </div>
                            </SelectItem>
                          )) || <SelectItem value="" disabled>Tidak ada bank tersedia</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="payment_status" className="text-sm md:text-base">Status Pembayaran</Label>
                    <Select 
                      value={formData.payment_status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}
                    >
                      <SelectTrigger className="text-sm md:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending" className="text-sm md:text-base">Pending</SelectItem>
                        <SelectItem value="paid" className="text-sm md:text-base">Lunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes" className="text-sm md:text-base">Keterangan</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Catatan pembelian"
                      rows={2}
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>

                {formData.payment_method !== 'credit' && formData.bank_id && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Informasi Bank</h4>
                    {(() => {
                      const bank = banks?.find(b => b.id === formData.bank_id);
                      const total = calculateSubtotal();
                      const remaining = (bank?.saldo_akhir || 0) - total;
                      
                      return (
                        <div className="space-y-1 text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span>Bank:</span>
                            <span className="font-medium">{bank?.nama_bank} - {bank?.nama_pemilik}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span>Saldo Saat Ini:</span>
                            <span className="font-medium">{formatCurrency(bank?.saldo_akhir || 0)}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span>Total Pembelian:</span>
                            <span className="font-medium">{formatCurrency(total)}</span>
                          </div>
                          <hr className="border-blue-200" />
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span>Sisa Saldo:</span>
                            <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(remaining)}
                            </span>
                          </div>
                          {remaining < 0 && (
                            <div className="bg-red-100 border border-red-200 rounded p-2 mt-2">
                              <span className="text-red-700 text-xs font-medium">
                                ⚠️ Peringatan: Saldo bank tidak mencukupi untuk transaksi ini!
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <Label className="text-sm md:text-base">Detail Produk *</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addItem} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 p-3 border rounded-lg">
                        <div className="sm:col-span-2 lg:col-span-2">
                          <Label className="text-sm">Produk</Label>
                          <Select 
                            value={item.product_variant_id} 
                            onValueChange={(value) => updateItem(index, 'product_variant_id', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Pilih produk" />
                            </SelectTrigger>
                            <SelectContent>
                              {stockProducts?.map((product) => (
                                <SelectItem key={product.id} value={product.id} className="text-sm">
                                  {product?.products?.nama_produk || 'Produk tidak diketahui'} - {product?.warna || '-'} {product?.size || '-'}
                                </SelectItem>
                              )) || <SelectItem value="" disabled>Tidak ada produk tersedia</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Qty</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            min="1"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Harga Beli Satuan</Label>
                          <InputCurrency
                            value={item.harga_beli_satuan}
                            onValueChange={(value) => updateItem(index, 'harga_beli_satuan', value)}
                            placeholder="Rp 0"
                            className="text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="w-full">
                            <Label className="text-sm">Subtotal</Label>
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
                              className="ml-2 shrink-0"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-bold text-base md:text-lg">Total:</span>
                      <span className="text-primary font-bold text-base md:text-lg">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      * Stok produk akan otomatis bertambah setelah pembelian disimpan
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="gradient-primary w-full sm:w-auto">
                    {loading ? 'Menyimpan...' : editingPurchase ? 'Update Pembelian' : 'Simpan Pembelian'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="glass-card border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
            📅 Filter Periode Pembelian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateFilter
            value={dateRange}
            onChange={setDateRange}
            className="w-full md:max-w-md"
          />
          <div className="mt-3 text-sm text-muted-foreground">
            Menampilkan data dari {formatDate(dateRange.from)} sampai {formatDate(dateRange.to)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-600">{formatCurrency(totalPurchases)}</div>
            <p className="text-xs text-muted-foreground">Periode terpilih</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-600">{formatCurrency(thisMonthPurchases)}</div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-muted-foreground">Total pembelian</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
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
            actions={
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Purchases;
