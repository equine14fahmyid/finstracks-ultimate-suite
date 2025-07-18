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

      // Stock management akan dihandle oleh handleStatusUpdate di Sales.tsx
      // Tidak ada pemotongan stok otomatis saat create sale

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

  const updateSale = async (saleId: string, saleData: any, items: any[], existingItems?: any[]) => {
    setLoading(true);
    try {
      const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.harga_satuan)), 0);
      const total = subtotal + (Number(saleData.ongkir) || 0) - (Number(saleData.diskon) || 0);

      const completeData = {
        ...saleData,
        subtotal,
        total
      };

      // Update sale data
      const { error: saleError } = await supabase
        .from('sales')
        .update(completeData)
        .eq('id', saleId);

      if (saleError) throw saleError;

      // Hapus sale items lama
      const { error: deleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);

      if (deleteError) throw deleteError;

      // Hapus stock movements lama
      const { error: deleteMoveError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('reference_id', saleId)
        .eq('reference_type', 'sale');

      if (deleteMoveError) {
        console.error('Delete movement error:', deleteMoveError);
      }

      // Insert sale items baru
      const newSaleItems = items.map(item => ({
        sale_id: saleId,
        product_variant_id: item.product_variant_id,
        quantity: Number(item.quantity),
        harga_satuan: Number(item.harga_satuan),
        subtotal: Number(item.quantity) * Number(item.harga_satuan)
      }));

      const { error: newItemsError } = await supabase
        .from('sale_items')
        .insert(newSaleItems);

      if (newItemsError) throw newItemsError;

      // Stock management akan dihandle oleh handleStatusUpdate di Sales.tsx
      // Tidak ada pemotongan stok otomatis saat update sale

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