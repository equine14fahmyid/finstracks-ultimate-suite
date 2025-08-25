
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { SaleStatus } from '@/hooks/useSales';

export const handleSaldoUpdate = async (currentSale: any, newStatus: string) => {
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

export const handleStatusUpdate = async (
  saleId: string, 
  newStatus: string, 
  currentSale: any,
  updateSaleStatus: (id: string, status: SaleStatus) => Promise<any>,
  fetchSales: () => void,
  fetchStock: () => void
) => {
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
