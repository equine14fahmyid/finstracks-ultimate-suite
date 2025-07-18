import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type SaleStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";

export const useSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          store:stores(
            id,
            nama_toko,
            platform:platforms(nama_platform)
          ),
          sale_items(
            id,
            quantity,
            harga_satuan,
            product_variant:product_variants(
              id,
              warna,
              size,
              product:products(
                id,
                nama_produk
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

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
      const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.harga_satuan)), 0);
      const total = subtotal + (Number(saleData.ongkir) || 0) - (Number(saleData.diskon) || 0);

      const completeData = {
        ...saleData,
        subtotal,
        total
      };

      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert([completeData])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = items.map(item => ({
        sale_id: saleResult.id,
        product_variant_id: item.product_variant_id,
        quantity: Number(item.quantity),
        harga_satuan: Number(item.harga_satuan),
        subtotal: Number(item.quantity) * Number(item.harga_satuan)
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // HANYA KURANGI STOK JIKA STATUS SHIPPED/DELIVERED
      if (saleData.status === 'shipped' || saleData.status === 'delivered') {
        for (const item of items) {
          const { data: currentStock, error: stockFetchError } = await supabase
            .from('product_variants')
            .select('stok')
            .eq('id', item.product_variant_id)
            .single();

          if (stockFetchError) {
            console.error('Error fetching current stock:', stockFetchError);
            continue;
          }

          const newStock = (currentStock.stok || 0) - Number(item.quantity);

          const { error: stockError } = await supabase
            .from('product_variants')
            .update({ stok: newStock })
            .eq('id', item.product_variant_id);

          if (stockError) {
            console.error('Stock update error:', stockError);
          }

          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert([{
              product_variant_id: item.product_variant_id,
              movement_type: 'out',
              quantity: Number(item.quantity),
              reference_type: 'sale',
              reference_id: saleResult.id,
              notes: `Penjualan: ${saleData.no_pesanan_platform}`
            }]);

          if (movementError) {
            console.error('Movement error:', movementError);
          }
        }
      }

      toast({
        title: "Sukses",
        description: "Penjualan berhasil ditambahkan",
      });

      await fetchSales();
      return { success: true, data: saleResult };
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan penjualan: " + (error as Error).message,
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  // Salin dan tempel kode ini untuk menggantikan fungsi updateSale yang lama

const updateSale = async (saleId: string, saleData: any, items: any[], existingItems: any[] = []) => {
  setLoading(true);
  try {
    const { data: oldSaleData, error: oldSaleError } = await supabase
      .from('sales')
      .select('status')
      .eq('id', saleId)
      .single();

    if (oldSaleError) throw oldSaleError;

    const oldStatus = oldSaleData.status;
    const newStatus = saleData.status;

    // 1. Hitung semua perubahan stok yang diperlukan dalam satu 'peta'
    const stockChanges = new Map<string, number>();

    // Peta untuk kuantitas lama (existingItems)
    const oldQuantities = new Map<string, number>();
    if (oldStatus === 'shipped' || oldStatus === 'delivered') {
      existingItems.forEach(item => {
        oldQuantities.set(item.product_variant_id, item.quantity);
      });
    }

    // Peta untuk kuantitas baru (items)
    const newQuantities = new Map<string, number>();
    if (newStatus === 'shipped' || newStatus === 'delivered') {
      items.forEach(item => {
        newQuantities.set(item.product_variant_id, item.quantity);
      });
    }

    // Gabungkan semua ID produk yang terlibat
    const allVariantIds = new Set([...oldQuantities.keys(), ...newQuantities.keys()]);

    // Hitung selisih untuk setiap produk
    allVariantIds.forEach(variantId => {
      const oldQty = oldQuantities.get(variantId) || 0;
      const newQty = newQuantities.get(variantId) || 0;
      const change = newQty - oldQty;
      stockChanges.set(variantId, change);
    });

    // 2. Lakukan semua operasi database dalam satu transaksi
    const { error: transactionError } = await supabase.rpc('update_sale_with_stock_check', {
      sale_id: saleId,
      sale_data: {
        ...saleData,
        subtotal: items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.harga_satuan)), 0),
        total: items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.harga_satuan)), 0) + (Number(saleData.ongkir) || 0) - (Number(saleData.diskon) || 0)
      },
      sale_items: items.map(item => ({
        product_variant_id: item.product_variant_id,
        quantity: Number(item.quantity),
        harga_satuan: Number(item.harga_satuan),
      })),
      // Kirim perubahan stok sebagai JSON
      stock_changes: Array.from(stockChanges.entries()).map(([variantId, change]) => ({ variant_id: variantId, change }))
    });

    if (transactionError) {
      // Jika terjadi error dari fungsi database, tampilkan pesannya
      throw new Error(`Database error: ${transactionError.message}`);
    }

    toast({
      title: "Sukses",
      description: "Penjualan berhasil diperbarui dan stok telah disesuaikan dengan benar.",
    });

    await fetchSales(); // Refresh data di halaman
    return { success: true };

  } catch (error) {
    console.error('Error updating sale:', error);
    toast({
      title: "Error",
      description: "Gagal memperbarui penjualan: " + (error as Error).message,
      variant: "destructive",
    });
    return { error: true, message: (error as Error).message };
  } finally {
    setLoading(false);
  }
};
  const deleteSale = async (saleId: string) => {
    setLoading(true);
    try {
      const { data: saleData, error: fetchError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            product_variant_id,
            quantity
          )
        `)
        .eq('id', saleId)
        .single();

      if (fetchError) throw fetchError;

      // Kembalikan stok jika status yang dihapus adalah shipped/delivered
      if (saleData?.sale_items && (saleData.status === 'shipped' || saleData.status === 'delivered')) {
        for (const item of saleData.sale_items) {
          const { data: currentStock, error: stockFetchError } = await supabase
            .from('product_variants')
            .select('stok')
            .eq('id', item.product_variant_id)
            .single();

          if (stockFetchError) {
            console.error('Error fetching current stock:', stockFetchError);
            continue;
          }

          const newStock = (currentStock.stok || 0) + Number(item.quantity);
          
          const { error: stockError } = await supabase
            .from('product_variants')
            .update({ stok: newStock })
            .eq('id', item.product_variant_id);

          if (stockError) {
            console.error('Stock revert error:', stockError);
          }
        }
      }

      await supabase
        .from('stock_movements')
        .delete()
        .eq('reference_id', saleId)
        .eq('reference_type', 'sale');

      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);

      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil dihapus",
      });

      await fetchSales();
      return { success: true };
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

  return {
    sales,
    loading,
    fetchSales,
    createSale,
    updateSale,
    updateSaleStatus,
    deleteSale
  };
};