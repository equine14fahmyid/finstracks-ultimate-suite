import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart, Edit, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStock, useExpeditions, useStores } from '@/hooks/useSupabase';
import type { SaleStatus } from '@/hooks/useSales';
import { OptimizedDataTable } from '@/components/common/OptimizedDataTable';
import { formatCurrency, formatShortDate, formatDate } from '@/utils/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { exportDataTableAsPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';
import DateFilter from '@/components/dashboard/DateFilter';
import { SaleForm } from '@/components/sales/SaleForm';
import { handleSaldoUpdate, handleStatusUpdate } from '@/components/sales/SaleHelpers';
import type { SaleFormData } from '@/types/forms';
import { supabase } from '@/integrations/supabase/client';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const Sales = () => {
  const { hasPermission } = useAuth();
  // Gunakan hook useSupabase yang benar
  const { stock: stockProducts, fetchStock } = useStock();
  const { expeditions, fetchExpeditions } = useExpeditions();
  const { stores, fetchStores } = useStores();
  
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
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

  const fetchSales = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select(`
          *,
          store:stores(id, nama_toko, platform:platforms(nama_platform)),
          sale_items(id, quantity, harga_satuan, product_variant:product_variants(id, warna, size, product:products(id, nama_produk)))
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('tanggal', startDate);
      }
      if (endDate) {
        query = query.lte('tanggal', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penjualan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSaleStatus = async (saleId: string, newStatus: SaleStatus) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update({ status: newStatus })
        .eq('id', saleId)
        .select()
        .single();

      if (error) throw error;

      await fetchSales();
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating sale status:', error);
      return { 
        error: true, 
        message: (error as any)?.message || 'Gagal mengubah status pesanan'
      };
    }
  };

  const createSale = async (saleData: any, items: any[]) => {
    setLoading(true);
    try {
      console.log('=== CREATE SALE FUNCTION START ===');
      console.log('Received saleData:', saleData);
      console.log('Received items:', items);

      // Validasi items
      if (!items || items.length === 0) {
        throw new Error('Items tidak boleh kosong');
      }

      // Hitung subtotal dengan validasi ketat
      let subtotal = 0;
      for (const item of items) {
        const quantity = parseFloat(item.quantity) || 0;
        const harga_satuan = parseFloat(item.harga_satuan) || 0;
        
        console.log(`Processing item: quantity=${quantity}, harga_satuan=${harga_satuan}`);
        
        if (!quantity || quantity <= 0) {
          throw new Error('Quantity harus lebih dari 0');
        }
        if (!harga_satuan || harga_satuan <= 0) {
          throw new Error('Harga satuan harus lebih dari 0');
        }
        if (!item.product_variant_id) {
          throw new Error('Produk harus dipilih');
        }
        
        subtotal += quantity * harga_satuan;
      }

      console.log('Calculated subtotal:', subtotal);

      // Validasi data sale
      if (!saleData.tanggal) {
        throw new Error('Tanggal harus diisi');
      }
      if (!saleData.no_pesanan_platform?.trim()) {
        throw new Error('No. Pesanan Platform harus diisi');
      }
      if (!saleData.store_id) {
        throw new Error('Toko harus dipilih');
      }
      if (!saleData.customer_name?.trim()) {
        throw new Error('Nama Customer harus diisi');
      }

      // Pastikan konversi ke number yang benar
      const ongkir = parseFloat(saleData.ongkir) || 0;
      const diskon = parseFloat(saleData.diskon) || 0;
      const total = subtotal + ongkir - diskon;

      console.log('Final calculations:', { subtotal, ongkir, diskon, total });

      // Validasi nilai harus positif
      if (subtotal <= 0) {
        throw new Error('Subtotal harus lebih dari 0');
      }
      if (total <= 0) {
        throw new Error('Total harus lebih dari 0');
      }

      // PERBAIKAN UTAMA: Pastikan semua field numerik sudah dalam format yang benar
      const completeData = {
        tanggal: saleData.tanggal,
        no_pesanan_platform: saleData.no_pesanan_platform.trim(),
        store_id: saleData.store_id,
        customer_name: saleData.customer_name.trim(),
        customer_phone: saleData.customer_phone?.trim() || null,
        customer_address: saleData.customer_address?.trim() || null,
        ongkir: parseFloat(ongkir.toString()),
        diskon: parseFloat(diskon.toString()),
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        no_resi: saleData.no_resi?.trim() || null,
        status: saleData.status || 'pending',
        notes: saleData.notes?.trim() || null
      };

      console.log('Complete sale data to insert:', completeData);
      console.log('Data types check:', {
        subtotal: typeof completeData.subtotal,
        subtotal_value: completeData.subtotal,
        total: typeof completeData.total,
        total_value: completeData.total,
        ongkir: typeof completeData.ongkir,
        diskon: typeof completeData.diskon
      });

      // Insert sale tanpa parameter columns
      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert([completeData])
        .select()
        .single();

      if (saleError) {
        console.error('Sale insert error:', saleError);
        throw new Error(`Database error: ${saleError.message}`);
      }

      console.log('Sale inserted successfully:', saleResult);

      // Insert sale items
      const saleItems = items.map(item => ({
        sale_id: saleResult.id,
        product_variant_id: item.product_variant_id,
        quantity: parseInt(item.quantity.toString()) || 0,
        harga_satuan: parseFloat(item.harga_satuan.toString()) || 0,
        subtotal: parseFloat((parseFloat(item.quantity) * parseFloat(item.harga_satuan)).toFixed(2))
      }));

      console.log('Sale items to insert:', saleItems);

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('Sale items insert error:', itemsError);
        // Rollback - hapus sale yang sudah dibuat
        await supabase.from('sales').delete().eq('id', saleResult.id);
        throw new Error(`Database error saat menyimpan item: ${itemsError.message}`);
      }

      console.log('Sale items inserted successfully');

      // Handle stock untuk status shipped/delivered
      if (saleData.status === 'shipped' || saleData.status === 'delivered') {
        console.log('Processing stock movements for shipped/delivered sale...');
        
        for (const item of items) {
          try {
            // Check current stock
            const { data: currentStock, error: stockFetchError } = await supabase
              .from('product_variants')
              .select('stok')
              .eq('id', item.product_variant_id)
              .single();

            if (stockFetchError) {
              console.error('Error fetching current stock:', stockFetchError);
              continue;
            }

            const currentStockValue = currentStock.stok || 0;
            const requestedQuantity = parseFloat(item.quantity) || 0;
            
            if (currentStockValue < requestedQuantity) {
              console.warn(`Stock warning: Available ${currentStockValue}, requested ${requestedQuantity}`);
            }

            const newStock = Math.max(0, currentStockValue - requestedQuantity);

            // Update stock
            const { error: stockError } = await supabase
              .from('product_variants')
              .update({ stok: newStock })
              .eq('id', item.product_variant_id);

            if (stockError) {
              console.error('Stock update error:', stockError);
              continue;
            }

            // Create stock movement record
            const { error: movementError } = await supabase
              .from('stock_movements')
              .insert([{
                product_variant_id: item.product_variant_id,
                movement_type: 'out',
                quantity: requestedQuantity,
                reference_type: 'sale',
                reference_id: saleResult.id,
                notes: `Penjualan: ${saleData.no_pesanan_platform} - ${saleData.customer_name} (${saleData.status})`
              }]);

            if (movementError) {
              console.error('Movement error:', movementError);
            }
          } catch (stockError) {
            console.error('Stock processing error:', stockError);
          }
        }
      }

      console.log('=== CREATE SALE FUNCTION SUCCESS ===');

      toast({
        title: "Sukses",
        description: "Penjualan berhasil ditambahkan",
      });

      await fetchSales();
      return { success: true, data: saleResult };

    } catch (error) {
      console.error('=== CREATE SALE FUNCTION ERROR ===', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (saleId: string) => {
    setLoading(true);
    try {
      const { data: saleData, error: fetchError } = await supabase
        .from('sales')
        .select(`*, sale_items(product_variant_id, quantity)`)
        .eq('id', saleId)
        .single();

      if (fetchError) throw fetchError;

      if (saleData?.sale_items && (saleData.status === 'shipped' || saleData.status === 'delivered')) {
        for (const item of saleData.sale_items) {
          const { data: currentStock, error: stockFetchError } = await supabase
            .from('product_variants')
            .select('stok')
            .eq('id', item.product_variant_id)
            .single();

          if (stockFetchError) { console.error('Error fetching current stock:', stockFetchError); continue; }

          const newStock = (currentStock.stok || 0) + Number(item.quantity);
          
          const { error: stockError } = await supabase
            .from('product_variants')
            .update({ stok: newStock })
            .eq('id', item.product_variant_id);

          if (stockError) console.error('Stock revert error:', stockError);
        }
      }

      await supabase.from('stock_movements').delete().eq('reference_id', saleId).eq('reference_type', 'sale');
      await supabase.from('sale_items').delete().eq('sale_id', saleId);
      const { error } = await supabase.from('sales').delete().eq('id', saleId);
      if (error) throw error;

      toast({ title: "Sukses", description: "Penjualan berhasil dihapus" });
      await fetchSales();
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus penjualan: " + (error as Error).message,
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

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

  const handleStatusUpdateWrapper = (saleId: string, newStatus: string, currentSale: any) => {
    return handleStatusUpdate(saleId, newStatus, currentSale, updateSaleStatus, fetchSales, fetchStock);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION START ===');
    console.log('Form data received:', formData);
    
    try {
      // Validasi field wajib
      if (!formData.tanggal?.trim()) {
        toast({
          title: "Error",
          description: "Tanggal wajib diisi",
          variant: "destructive",
        });
        return;
      }

      if (!formData.no_pesanan_platform?.trim()) {
        toast({
          title: "Error",
          description: "No. Pesanan Platform wajib diisi",
          variant: "destructive",
        });
        return;
      }

      if (!formData.store_id?.trim()) {
        toast({
          title: "Error",
          description: "Toko wajib dipilih",
          variant: "destructive",
        });
        return;
      }

      if (!formData.customer_name?.trim()) {
        toast({
          title: "Error",
          description: "Nama Customer wajib diisi",
          variant: "destructive",
        });
        return;
      }
      
      // Validasi items - filter dan validasi lebih ketat
      const validItems = formData.items.filter(item => {
        return item.product_variant_id && 
               item.product_variant_id.trim() !== '' &&
               item.quantity > 0 && 
               item.harga_satuan > 0;
      });
      
      console.log('Valid items found:', validItems.length, validItems);
      
      if (validItems.length === 0) {
        toast({
          title: "Error",
          description: "Minimal satu item produk harus diisi dengan lengkap",
          variant: "destructive",
        });
        return;
      }

      // Validasi stok untuk status shipped/delivered
      if (formData.status === 'shipped' || formData.status === 'delivered') {
        for (const item of validItems) {
          const product = stockProducts?.find(p => p?.id === item.product_variant_id);
          if (!product) {
            toast({
              title: "Error",
              description: "Produk tidak ditemukan dalam database",
              variant: "destructive",
            });
            return;
          }
          
          const availableStock = product.stok || 0;
          if (item.quantity > availableStock) {
            toast({
              title: "Stok Tidak Mencukupi",
              description: `${product?.product?.nama_produk} (${product?.warna}-${product?.size}) - Stok tersedia: ${availableStock}, diminta: ${item.quantity}`,
              variant: "destructive",
            });
            return;
          }
        }
      }
      
      // Prepare data
      const saleData = {
        tanggal: formData.tanggal,
        no_pesanan_platform: formData.no_pesanan_platform.trim(),
        store_id: formData.store_id,
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone?.trim() || null,
        customer_address: formData.customer_address?.trim() || null,
        ongkir: Number(formData.ongkir) || 0,
        diskon: Number(formData.diskon) || 0,
        no_resi: formData.no_resi?.trim() || null,
        status: formData.status,
        notes: formData.notes?.trim() || null,
      };
      
      const cleanedValidItems = validItems.map(item => ({
        product_variant_id: item.product_variant_id,
        quantity: Number(item.quantity),
        harga_satuan: Number(item.harga_satuan)
      }));
      
      console.log('Final prepared sale data:', saleData);
      console.log('Final cleaned valid items:', cleanedValidItems);
      
      let result;
      if (editingSale) {
        console.log('Updating existing sale:', editingSale.id);
        // result = await updateSale(editingSale.id, saleData, cleanedValidItems, editingSale.sale_items);
      } else {
        console.log('Creating new sale...');
        result = await createSale(saleData, cleanedValidItems);
      }
      
      console.log('Operation result:', result);
      
      if (result && result.success) {
        console.log('Success! Closing dialog...');
        setDialogOpen(false);
        resetForm();
        toast({
          title: "Sukses",
          description: editingSale ? "Penjualan berhasil diperbarui" : "Penjualan berhasil ditambahkan",
        });
        // Refresh data
        await fetchSales();
        await fetchStock();
      } else {
        console.log('Error in operation:', result);
        // Error sudah ditangani di dalam createSale function
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: `Terjadi kesalahan: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
    
    console.log('=== FORM SUBMISSION END ===');
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
            onValueChange={(newStatus) => handleStatusUpdateWrapper(sale.id, newStatus, sale)}
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
          <Button 
            className="gradient-primary w-full sm:w-auto" 
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Tambah Penjualan</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        )}

        <SaleForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          loading={loading}
          isEditing={!!editingSale}
          stores={stores || []}
          stockProducts={stockProducts || []}
          onReset={resetForm}
        />
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
          <OptimizedDataTable
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
