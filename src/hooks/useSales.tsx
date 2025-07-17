import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  const createSale = async (saleData: any, items: any[]) => {
    setLoading(true);
    try {
      // Calculate subtotal and total
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_satuan), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      const completeData = {
        ...saleData,
        subtotal,
        total
      };

      // PERBAIKAN: Gunakan function untuk mencegah duplikasi stock movement
      const { data, error } = await supabase.rpc('create_sale_with_stock_check', {
        sale_data: completeData,
        sale_items: items
      });

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil ditambahkan",
      });

      await fetchSales();
      return { success: true, data };
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

  const updateSale = async (saleId: string, saleData: any, items: any[], existingItems?: any[]) => {
    setLoading(true);
    try {
      // Calculate subtotal and total
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_satuan), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      const completeData = {
        ...saleData,
        subtotal,
        total
      };

      // PERBAIKAN: Gunakan function untuk update dengan pengecekan stock movement
      const { error } = await supabase.rpc('update_sale_with_stock_check', {
        sale_id: saleId,
        sale_data: completeData,
        sale_items: items,
        existing_items: existingItems || []
      });

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil diperbarui",
      });

      await fetchSales();
      return { success: true };
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: "Error", 
        description: "Gagal memperbarui penjualan: " + (error as Error).message,
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  // FITUR BARU: Update status saja tanpa mengubah item
  const updateSaleStatus = async (saleId: string, newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('update_sale_status_only', {
        sale_id: saleId,
        new_status: newStatus
      });

      if (error) throw error;

      await fetchSales();
      return { success: true };
    } catch (error) {
      console.error('Error updating sale status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status penjualan: " + (error as Error).message,
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (saleId: string) => {
    setLoading(true);
    try {
      // Get sale data first to revert stock
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

      // Revert stock movements
      if (saleData?.sale_items) {
        for (const item of saleData.sale_items) {
          // Add back stock
          await supabase
            .from('product_variants')
            .update({ 
              stok: supabase.rpc('increment_stock', { 
                variant_id: item.product_variant_id, 
                amount: item.quantity 
              })
            })
            .eq('id', item.product_variant_id);
        }
      }

      // Delete stock movements
      await supabase
        .from('stock_movements')
        .delete()
        .eq('reference_id', saleId)
        .eq('reference_type', 'sale');

      // Delete sale items
      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);

      // Delete sale
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
    updateSaleStatus, // FITUR BARU
    deleteSale
  };
};