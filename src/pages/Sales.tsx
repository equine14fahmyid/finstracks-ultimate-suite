// src/pages/Sales.tsx (Kode Lengkap dengan Perbaikan Final untuk Responsivitas)

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ShoppingCart, Edit, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSales, useStock, useExpeditions, useStores } from '@/hooks/useSupabase';
import type { SaleStatus } from '@/hooks/useSales';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatShortDate, formatDate } from '@/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { exportDataTableAsPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';
import DateFilter from '@/components/dashboard/DateFilter';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

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
    id?: string;
    product_variant_id: string;
    quantity: number;
    harga_satuan: number;
    product_name?: string;
    variant_display?: string;
  }[];
}

const Sales = () => {
  const { hasPermission } = useAuth();
  const { sales, loading, fetchSales, createSale, updateSale, deleteSale, updateSaleStatus } = useSales();
  const { stock: stockProducts, fetchStock } = useStock();
  const { expeditions, fetchExpeditions } = useExpeditions();
  const { stores, fetchStores } = useStores();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
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
    const startDate = dateRange.from?.toISOString().split('T')[0];
    const endDate = dateRange.to?.toISOString().split('T')[0];
    fetchSales(startDate, endDate);
  }, [dateRange]);

  useEffect(() => {
    fetchStock();
    fetchExpeditions();
    fetchStores();
  }, []);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      processing: "Diproses",
      shipped: "Dikirim",
      delivered: "Selesai",
      cancelled: "Dibatalkan",
      returned: "Retur"
    };
    return labels[status] || status;
  };

  const handleExportPDF = () => {
      toast({ title: "Mengekspor PDF...", description: "Harap tunggu sebentar." });
      
      const preparedData = sales.map(sale => ({
        tanggal: formatShortDate(sale.tanggal),
        no_pesanan: sale.no_pesanan_platform,
        customer: sale.customer_name,
        toko: sale.store?.nama_toko || '-',
        total: formatCurrency(sale.total),
        status: getStatusLabel(sale.status),
      }));

      exportDataTableAsPDF({
        data: preparedData,
        columns: [
          { title: 'Tanggal', dataKey: 'tanggal' },
          { title: 'No. Pesanan', dataKey: 'no_pesanan' },
          { title: 'Customer', dataKey: 'customer' },
          { title: 'Toko', dataKey: 'toko' },
          { title: 'Total', dataKey: 'total' },
          { title: 'Status', dataKey: 'status' },
        ],
        title: `Laporan Penjualan (${formatDate(dateRange.from)} - ${formatDate(dateRange.to)})`,
        filename: `Laporan-Penjualan-${new Date().toISOString().split('T')[0]}.pdf`,
        companyInfo: {
          name: 'FINTracks Ultimate Suite',
          address: 'Tasikmalaya, Indonesia'
        }
      });
  };

  const handleExportCSV = () => {
      toast({ title: "Mengekspor CSV...", description: "Harap tunggu sebentar." });

      const preparedData = sales.map(sale => ({
        Tanggal: formatShortDate(sale.tanggal),
        'No Pesanan': sale.no_pesanan_platform,
        Customer: sale.customer_name,
        Toko: sale.store?.nama_toko || '-',
        Platform: sale.store?.platform?.nama_platform || '-',
        Subtotal: sale.subtotal,
        Ongkir: sale.ongkir,
        Diskon: sale.diskon,
        Total: sale.total,
        Status: getStatusLabel(sale.status),
        'No Resi': sale.no_resi,
        Catatan: sale.notes
      }));
      
      exportToCSV({
        data: preparedData,
        filename: `Laporan-Penjualan-${new Date().toISOString().split('T')[0]}.csv`,
      });
  };

  const handleSaldoUpdate = async (currentSale: any, newStatus: string) => {
    try {
      let saldoChange = 0;

      if (newStatus === 'delivered' && currentSale.status !== 'delivered') {
        saldoChange = currentSale.total;
      }
      else if (currentSale.status === 'delivered' && newStatus !== 'delivered') {
        saldoChange = -currentSale.total;
      }

      if (saldoChange !== 0) {
        const { data: currentStore, error: fetchError } = await supabase
          .from('stores')
          .select('saldo_dashboard')
          .eq('id', currentSale.store_id)
          .single();

        if (fetchError) {
          console.error('Error fetching store:', fetchError);
          return;
        }

        const newSaldo = (currentStore.saldo_dashboard || 0) + saldoChange;

        const { error } = await supabase
          .from('stores')
          .update({ saldo_dashboard: newSaldo })
          .eq('id', currentSale.store_id);

        if (error) {
          console.error('Error updating store saldo:', error);
        } else {
          console.log('Store saldo updated:', { storeId: currentSale.store_id, change: saldoChange, newSaldo });
        }
      }
    } catch (error) {
      console.error('Error in handleSaldoUpdate:', error);
    }
  };

  const handleStatusUpdate = async (saleId: string, newStatus: string, currentSale: any) => {
    try {
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          product_variant:product_variants(
            id, 
            stok,
            products(nama_produk)
          )
        `)
        .eq('sale_id', saleId);
      
      if (itemsError) {
        throw new Error('Gagal mengambil data item penjualan');
      }
      
      const oldStatus = currentSale.status;
      
      for (const item of saleItems || []) {
        const { data: currentStock, error: stockFetchError } = await supabase
          .from('product_variants')
          .select('stok')
          .eq('id', item.product_variant_id)
          .single();
        
        if (stockFetchError) {
          console.error('Error fetching stock:', stockFetchError);
          continue;
        }
        
        let stockChange = 0;
        let movementType: 'in' | 'out' | null = null;
        let notes = '';
        
        if (oldStatus !== 'shipped' && oldStatus !== 'delivered' &&
          (newStatus === 'shipped' || newStatus === 'delivered')) {
          stockChange = -item.quantity;
          movementType = 'out';
          notes = `Pengurangan stok - status berubah ke ${getStatusLabel(newStatus)}`;
          
          if ((currentStock.stok || 0) < item.quantity) {
            throw new Error(`Stok tidak mencukupi untuk ${item.product_variant?.products?.nama_produk || 'produk'}. Tersedia: ${currentStock.stok || 0}, dibutuhkan: ${item.quantity}`);
          }
        }
        else if ((oldStatus === 'shipped' || oldStatus === 'delivered') &&
          (newStatus === 'cancelled' || newStatus === 'returned')) {
          stockChange = item.quantity;
          movementType = 'in';
          notes = `Pengembalian stok - status berubah ke ${getStatusLabel(newStatus)}`;
        }
        else if ((oldStatus === 'cancelled' || oldStatus === 'returned') &&
          (newStatus === 'shipped' || newStatus === 'delivered')) {
          stockChange = -item.quantity;
          movementType = 'out';
          notes = `Pengurangan stok - status berubah ke ${getStatusLabel(newStatus)}`;
          
          if ((currentStock.stok || 0) < item.quantity) {
            throw new Error(`Stok tidak mencukupi untuk ${item.product_variant?.products?.nama_produk || 'produk'}. Tersedia: ${currentStock.stok || 0}, dibutuhkan: ${item.quantity}`);
          }
        }
        
        if (stockChange !== 0 && movementType) {
          const newStockLevel = (currentStock.stok || 0) + stockChange;
          
          const { error: stockUpdateError } = await supabase
            .from('product_variants')
            .update({ stok: newStockLevel })
            .eq('id', item.product_variant_id);
          
          if (stockUpdateError) {
            console.error('Error updating stock:', stockUpdateError);
            continue;
          }
          
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert([{
              product_variant_id: item.product_variant_id,
              movement_type: movementType,
              quantity: Math.abs(stockChange),
              reference_type: 'sale_status_change',
              reference_id: saleId,
              notes: notes
            }]);
          
          if (movementError) {
            console.error('Error inserting movement:', movementError);
          }
        }
      }
      
      const result = await updateSaleStatus(saleId, newStatus as SaleStatus);
      
      if (result.success) {
        toast({
          title: "Sukses",
          description: `Status pesanan berhasil diubah ke ${getStatusLabel(newStatus)}`,
        });
        await handleSaldoUpdate(currentSale, newStatus);
        await fetchSales();
        await fetchStock();
      } else {
        throw new Error(result.message || 'Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error in handleStatusUpdate:', error);
      toast({
        title: "Error",
        description: `Gagal mengubah status pesanan: ${(error as any)?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

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
    
    for (const item of validItems) {
      const product = stockProducts?.find(p => p?.id === item.product_variant_id);
      if (!product) {
        toast({
          title: "Error",
          description: "Produk tidak ditemukan",
          variant: "destructive",
        });
        return;
      }
      
      const availableStock = product.stok || 0;
      let adjustedStock = availableStock;
      
      if (editingSale) {
        const existingItem = editingSale.sale_items?.find((existing: any) =>
          existing.product_variant_id === item.product_variant_id
        );
        if (existingItem) {
          adjustedStock += existingItem.quantity;
        }
      }
      
      if (item.quantity > adjustedStock) {
        toast({
          title: "Stok Tidak Mencukupi",
          description: `${product?.products?.nama_produk} (${product?.warna}-${product?.size}) - Stok tersedia: ${adjustedStock}, diminta: ${item.quantity}`,
          variant: "destructive",
        });
        return;
      }
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
      result = await updateSale(editingSale.id, saleData, validItems, editingSale.sale_items);
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

    const existingItems = sale.sale_items?.map((item: any) => ({
      id: item.id,
      product_variant_id: item.product_variant_id,
      quantity: item.quantity,
      harga_satuan: item.harga_satuan,
      product_name: item.product_variant?.product?.nama_produk || 'Produk tidak dikenal',
      variant_display: `${item.product_variant?.warna || 'N/A'} - ${item.product_variant?.size || 'N/A'}`
    })) || [{ product_variant_id: '', quantity: 1, harga_satuan: 0 }];

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
      items: existingItems
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteSale(id);
  };

  const resetForm = () => {
    setEditingSale(null);
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

          if (field === 'product_variant_id' && value && !item.product_name) {
            const product = stockProducts?.find(p => p?.id === value);
            if (product?.products) {
              updatedItem.harga_satuan = product.products.harga_jual_default || 0;
              updatedItem.product_name = product.products.nama_produk || '';
              updatedItem.variant_display = `${product.warna || ''} - ${product.size || ''}`;
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
      render: (value: any, sale: any) => (
        <div className="space-y-2">
          <Select
            value={sale?.status || 'pending'}
            onValueChange={(newStatus) => handleStatusUpdate(sale.id, newStatus, sale)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                <Badge variant="secondary">Pending</Badge>
              </SelectItem>
              <SelectItem value="processing">
                <Badge variant="default">Diproses</Badge>
              </SelectItem>
              <SelectItem value="shipped">
                <Badge variant="outline">Dikirim</Badge>
              </SelectItem>
              <SelectItem value="delivered">
                <Badge variant="default" className="bg-green-500">Selesai</Badge>
              </SelectItem>
              <SelectItem value="cancelled">
                <Badge variant="destructive">Dibatal</Badge>
              </SelectItem>
              <SelectItem value="returned">
                <Badge variant="destructive">Retur</Badge>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
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
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex flex-col gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Manajemen Penjualan</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Kelola transaksi penjualan dan order customer
          </p>
        </div>
        
        {hasPermission('sales.create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary w-full sm:w-auto" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{editingSale ? 'Edit Penjualan' : 'Tambah Penjualan'}</span>
                <span className="sm:hidden">{editingSale ? 'Edit' : 'Tambah'}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSale ? 'Edit Penjualan' : 'Tambah Penjualan Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form di dalam Dialog perlu dibuat responsif juga */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tanggal">Tanggal *</Label>
                    <Input id="tanggal" type="date" value={formData.tanggal} onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))} required />
                  </div>
                  <div>
                    <Label htmlFor="no_pesanan_platform">No. Pesanan Platform *</Label>
                    <Input id="no_pesanan_platform" value={formData.no_pesanan_platform} onChange={(e) => setFormData(prev => ({ ...prev, no_pesanan_platform: e.target.value }))} placeholder="TKP12345678" required />
                  </div>
                  <div>
                    <Label htmlFor="store_id">Toko *</Label>
                    <Select value={formData.store_id} onValueChange={(value) => setFormData(prev => ({ ...prev, store_id: value }))}>
                      <SelectTrigger><SelectValue placeholder="Pilih toko" /></SelectTrigger>
                      <SelectContent>
                        {stores?.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store?.nama_toko || 'Toko'} - {store?.platform?.nama_platform || 'Platform'}
                          </SelectItem>
                        )) || <SelectItem value="" disabled>Tidak ada toko</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customer_name">Nama Customer *</Label>
                    <Input id="customer_name" value={formData.customer_name} onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} placeholder="John Doe" required />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">No. HP Customer</Label>
                    <Input id="customer_phone" value={formData.customer_phone} onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))} placeholder="081234567890" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="customer_address">Alamat Customer</Label>
                    <Textarea id="customer_address" value={formData.customer_address} onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))} placeholder="Alamat lengkap customer" rows={2}/>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Detail Produk *</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Tambah Item</Button>
                  </div>
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border rounded-lg">
                        <div className="md:col-span-2">
                          <Label>Produk</Label>
                          <Select value={item.product_variant_id} onValueChange={(value) => updateItem(index, 'product_variant_id', value)}>
                            <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                            <SelectContent>
                              {stockProducts?.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product?.products?.nama_produk} - {product?.warna} {product?.size} (Stok: {product?.stok})
                                </SelectItem>
                              )) || <SelectItem value="" disabled>Tidak ada produk</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Qty</Label>
                          <Input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} min="1"/>
                        </div>
                        <div>
                          <Label>Harga Satuan</Label>
                          <Input type="number" value={item.harga_satuan} onChange={(e) => updateItem(index, 'harga_satuan', Number(e.target.value))} min="0" />
                        </div>
                        <div className="flex items-end">
                          <div className="w-full">
                            <Label>Subtotal</Label>
                            <div className="text-sm font-medium p-2 bg-muted rounded">{formatCurrency(item.quantity * item.harga_satuan)}</div>
                          </div>
                          {formData.items.length > 1 && (
                            <Button type="button" size="sm" variant="outline" onClick={() => removeItem(index)} className="ml-2">×</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ongkir">Ongkos Kirim</Label>
                    <Input id="ongkir" type="number" value={formData.ongkir} onChange={(e) => setFormData(prev => ({ ...prev, ongkir: Number(e.target.value) }))} min="0" />
                  </div>
                  <div>
                    <Label htmlFor="diskon">Diskon</Label>
                    <Input id="diskon" type="number" value={formData.diskon} onChange={(e) => setFormData(prev => ({ ...prev, diskon: Number(e.target.value) }))} min="0" />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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

                <div>
                  <Label htmlFor="no_resi">No. Resi</Label>
                  <Input id="no_resi" value={formData.no_resi} onChange={(e) => setFormData(prev => ({ ...prev, no_resi: e.target.value }))} placeholder="JNE123456789" />
                </div>
                <div>
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Catatan tambahan..." rows={3} />
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(calculateSubtotal())}</span></div>
                    <div className="flex justify-between"><span>Ongkos Kirim:</span><span>{formatCurrency(formData.ongkir)}</span></div>
                    <div className="flex justify-between"><span>Diskon:</span><span>-{formatCurrency(formData.diskon)}</span></div>
                    <div className="flex justify-between font-bold text-lg"><span>Total:</span><span className="text-primary">{formatCurrency(calculateTotal())}</span></div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="gradient-primary">{loading ? 'Menyimpan...' : editingSale ? 'Update Penjualan' : 'Simpan Penjualan'}</Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="glass-card border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
            📅 Filter Periode Penjualan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateFilter value={dateRange} onChange={setDateRange} className="w-full md:max-w-md" />
          <div className="mt-3 text-sm text-muted-foreground">
            Menampilkan data dari {formatDate(dateRange.from)} sampai {formatDate(dateRange.to)}
          </div>
        </CardContent>
      </Card>

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
            searchPlaceholder="Cari no. pesanan, nama customer..."
            actions={
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;