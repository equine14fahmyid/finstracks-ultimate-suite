// src/hooks/useSales.tsx (Kode Lengkap Baru)

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type SaleStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";

export const useSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

      // Menambahkan filter tanggal jika ada
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

      // Create stock movements and update stock only for shipped/delivered sales
      if (saleData.status === 'shipped' || saleData.status === 'delivered') {
        for (const item of items) {
          // Update stock
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

          if (stockError) console.error('Stock update error:', stockError);

          // Create stock movement record with enhanced details
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert([{
              product_variant_id: item.product_variant_id,
              movement_type: 'out',
              quantity: Number(item.quantity),
              reference_type: 'sale',
              reference_id: saleResult.id,
              notes: `Penjualan: ${saleData.no_pesanan_platform} - ${saleData.customer_name} (${saleData.status})`
            }]);

          if (movementError) console.error('Movement error:', movementError);
        }
      }

      toast({
        title: "Sukses",
        description: "Penjualan berhasil ditambahkan",
      });

      await fetchSales();
      return { success: true, data: saleResult, error: null };
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

      const { data: oldSaleData, error: oldSaleError } = await supabase
        .from('sales')
        .select('status')
        .eq('id', saleId)
        .single();

      if (oldSaleError) throw oldSaleError;

      const oldStatus = oldSaleData.status;
      const newStatus = saleData.status;
      
      console.log('Update Sale - Old Status:', oldStatus, 'New Status:', newStatus);

      const completeData = { ...saleData, subtotal, total };

      const { error: saleError } = await supabase.from('sales').update(completeData).eq('id', saleId);
      if (saleError) throw saleError;

      // Restore stock from old items if they were shipped/delivered
      if (existingItems && existingItems.length > 0 && (oldStatus === 'shipped' || oldStatus === 'delivered')) {
        console.log('Restoring stock from old items...');
        for (const existingItem of existingItems) {
          const { data: currentStock, error: stockFetchError } = await supabase
            .from('product_variants')
            .select('stok')
            .eq('id', existingItem.product_variant_id)
            .single();

          if (stockFetchError) { console.error('Error fetching current stock:', stockFetchError); continue; }

          const restoredStock = (currentStock.stok || 0) + Number(existingItem.quantity);
          console.log(`Restoring stock for ${existingItem.product_variant_id}: ${currentStock.stok} + ${existingItem.quantity} = ${restoredStock}`);
          
          const { error: restoreError } = await supabase
            .from('product_variants')
            .update({ stok: restoredStock })
            .eq('id', existingItem.product_variant_id);

          if (restoreError) console.error('Stock restore error:', restoreError);

          // Create reverse stock movement record
          const { error: reverseMovementError } = await supabase
            .from('stock_movements')
            .insert([{
              product_variant_id: existingItem.product_variant_id,
              movement_type: 'in',
              quantity: Number(existingItem.quantity),
              reference_type: 'sale',
              reference_id: saleId,
              notes: `Pembatalan/Edit penjualan: ${saleData.no_pesanan_platform} (status berubah dari ${oldStatus} ke ${newStatus})`
            }]);

          if (reverseMovementError) console.error('Reverse movement error:', reverseMovementError);
        }
      }

      // Delete old sale items and movements
      const { error: deleteError } = await supabase.from('sale_items').delete().eq('sale_id', saleId);
      if (deleteError) throw deleteError;

      // Insert new sale items
      const newSaleItems = items.map(item => ({
        sale_id: saleId,
        product_variant_id: item.product_variant_id,
        quantity: Number(item.quantity),
        harga_satuan: Number(item.harga_satuan),
        subtotal: Number(item.quantity) * Number(item.harga_satuan)
      }));

      const { error: newItemsError } = await supabase.from('sale_items').insert(newSaleItems);
      if (newItemsError) throw newItemsError;

      // Create new stock movements for shipped/delivered items
      if (newStatus === 'shipped' || newStatus === 'delivered') {
        console.log('Deducting stock for new items...');
        for (const item of items) {
          const { data: currentStock, error: stockFetchError } = await supabase
            .from('product_variants')
            .select('stok')
            .eq('id', item.product_variant_id)
            .single();

          if (stockFetchError) { console.error('Error fetching current stock:', stockFetchError); continue; }

          const newStock = (currentStock.stok || 0) - Number(item.quantity);
          console.log(`Deducting stock for ${item.product_variant_id}: ${currentStock.stok} - ${item.quantity} = ${newStock}`);

          const { error: stockError } = await supabase.from('product_variants').update({ stok: newStock }).eq('id', item.product_variant_id);
          if (stockError) console.error('Stock update error:', stockError);

          // Create new stock movement record
          const { error: movementError } = await supabase.from('stock_movements').insert([{
            product_variant_id: item.product_variant_id,
            movement_type: 'out',
            quantity: Number(item.quantity),
            reference_type: 'sale',
            reference_id: saleId,
            notes: `Update penjualan: ${saleData.no_pesanan_platform} - ${saleData.customer_name} (${newStatus})`
          }]);
          if (movementError) console.error('Movement error:', movementError);
        }
      }

      toast({ title: "Sukses", description: "Penjualan berhasil diperbarui" });
      await fetchSales();
      return { success: true, error: null };
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
