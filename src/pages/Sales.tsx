import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart, Edit, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSales, useStock, useExpeditions, useStores } from '@/hooks/useSupabase';
import type { SaleStatus } from '@/hooks/useSales';
import { OptimizedDataTable } from '@/components/common/OptimizedDataTable';
import { formatCurrency, formatShortDate, formatDate } from '@/utils/format';
import { DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { exportDataTableAsPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';
import DateFilter from '@/components/dashboard/DateFilter';
import { SaleForm } from '@/components/sales/SaleForm';
import { handleSaldoUpdate, handleStatusUpdate } from '@/components/sales/SaleHelpers';
import type { SaleFormData } from '@/types/forms';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
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

  const handleStatusUpdateWrapper = (saleId: string, newStatus: string, currentSale: any) => {
    return handleStatusUpdate(saleId, newStatus, currentSale, updateSaleStatus, fetchSales, fetchStock);
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
