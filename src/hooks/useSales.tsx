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

  // PERBAIKAN: Update status dengan error handling yang lebih baik
  const updateSaleStatus = async (saleId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update({ status: newStatus })
        .eq('id', saleId)
        .select()
        .single();

      if (error) throw error;

      // Refresh data setelah update
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
      // Calculate subtotal and total
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_satuan), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      const completeData = {
        ...saleData,
        subtotal,
        total
      };

      // Insert sale first
      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert([completeData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      const saleItems = items.map(item => ({
        sale_id: saleResult.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update stock and create movements
      for (const item of items) {
        // Get current stock first
        const { data: currentStock, error: stockFetchError } = await supabase
          .from('product_variants')
          .select('stok')
          .eq('id', item.product_variant_id)
          .single();

        if (stockFetchError) {
          console.error('Error fetching current stock:', stockFetchError);
          continue;
        }

        // Calculate new stock
        const newStock = (currentStock.stok || 0) - item.quantity;

        // Update stock
        const { error: stockError } = await supabase
          .from('product_variants')
          .update({ stok: newStock })
          .eq('id', item.product_variant_id);

        if (stockError) {
          console.error('Stock update error:', stockError);
        }

        // Create stock movement
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert([{
            product_variant_id: item.product_variant_id,
            movement_type: 'out',
            quantity: item.quantity,
            reference_type: 'sale',
            reference_id: saleResult.id,
            notes: `Penjualan: ${saleData.no_pesanan_platform}`
          }]);

        if (movementError) {
          console.error('Movement error:', movementError);
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

      // Update sale
      const { error: saleError } = await supabase
        .from('sales')
        .update(completeData)
        .eq('id', saleId);

      if (saleError) throw saleError;

      // Delete existing sale items
      const { error: deleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);

      if (deleteError) throw deleteError;

      // Revert existing stock if provided
      if (existingItems && existingItems.length > 0) {
        for (const item of existingItems) {
          // Get current stock
          const { data: currentStock, error: stockFetchError } = await supabase
            .from('product_variants')
            .select('stok')
            .eq('id', item.product_variant_id)
            .single();

          if (stockFetchError) {
            console.error('Error fetching current stock:', stockFetchError);
            continue;
          }

          // Add back stock
          const newStock = (currentStock.stok || 0) + item.quantity;
          
          const { error: revertError } = await supabase
            .from('product_variants')
            .update({ stok: newStock })
            .eq('id', item.product_variant_id);

          if (revertError) {
            console.error('Stock revert error:', revertError);
          }
        }
      }

      // Delete existing stock movements
      const { error: deleteMoveError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('reference_id', saleId)
        .eq('reference_type', 'sale');

      if (deleteMoveError) {
        console.error('Delete movement error:', deleteMoveError);
      }

      // Insert new sale items
      const newSaleItems = items.map(item => ({
        sale_id: saleId,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan
      }));

      const { error: newItemsError } = await supabase
        .from('sale_items')
        .insert(newSaleItems);

      if (newItemsError) throw newItemsError;

      // Update stock and create new movements
      for (const item of items) {
        // Get current stock
        const { data: currentStock, error: stockFetchError } = await supabase
          .from('product_variants')
          .select('stok')
          .eq('id', item.product_variant_id)
          .single();

        if (stockFetchError) {
          console.error('Error fetching current stock:', stockFetchError);
          continue;
        }

        // Calculate new stock
        const newStock = (currentStock.stok || 0) - item.quantity;

        // Update stock
        const { error: stockError } = await supabase
          .from('product_variants')
          .update({ stok: newStock })
          .eq('id', item.product_variant_id);

        if (stockError) {
          console.error('Stock update error:', stockError);
        }

        // Create stock movement
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert([{
            product_variant_id: item.product_variant_id,
            movement_type: 'out',
            quantity: item.quantity,
            reference_type: 'sale',
            reference_id: saleId,
            notes: `Update penjualan: ${saleData.no_pesanan_platform}`
          }]);

        if (movementError) {
          console.error('Movement error:', movementError);
        }
      }

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
          // Get current stock
          const { data: currentStock, error: stockFetchError } = await supabase
            .from('product_variants')
            .select('stok')
            .eq('id', item.product_variant_id)
            .single();

          if (stockFetchError) {
            console.error('Error fetching current stock:', stockFetchError);
            continue;
          }

          // Add back stock
          const newStock = (currentStock.stok || 0) + item.quantity;
          
          const { error: stockError } = await supabase
            .from('product_variants')
            .update({ stok: newStock })
            .eq('id', item.product_variant_id);

          if (stockError) {
            console.error('Stock revert error:', stockError);
          }
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
    updateSaleStatus,
    deleteSale
  };
};