// src/hooks/useSales.tsx (Perbaikan Database Issue)

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
        const quantity = Number(item.quantity);
        const harga_satuan = Number(item.harga_satuan);
        
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

      const ongkir = Number(saleData.ongkir) || 0;
      const diskon = Number(saleData.diskon) || 0;
      const total = subtotal + ongkir - diskon;

      console.log('Final calculations:', { subtotal, ongkir, diskon, total });

      if (subtotal <= 0) {
        throw new Error('Subtotal harus lebih dari 0');
      }
      if (total <= 0) {
        throw new Error('Total harus lebih dari 0');
      }

      // PERBAIKAN: Struktur data yang sesuai dengan database
      const completeData = {
        tanggal: saleData.tanggal,
        no_pesanan_platform: saleData.no_pesanan_platform.trim(),
        store_id: saleData.store_id,
        customer_name: saleData.customer_name.trim(),
        customer_phone: saleData.customer_phone?.trim() || '',
        customer_address: saleData.customer_address?.trim() || '',
        ongkir: ongkir,
        diskon: diskon,
        subtotal: subtotal,
        total: total,
        no_resi: saleData.no_resi?.trim() || '',
        status: saleData.status || 'pending',
        notes: saleData.notes?.trim() || ''
      };

      console.log('Complete sale data to insert:', completeData);

      // Insert sale dengan error handling yang lebih baik
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
        quantity: Number(item.quantity),
        harga_satuan: Number(item.harga_satuan),
        subtotal: Number(item.quantity) * Number(item.harga_satuan)
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
            const requestedQuantity = Number(item.quantity);
            
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

  const updateSale = async (saleId: string, saleData: any, items: any[], existingItems?: any[]) => {
    setLoading(true);
    try {
      // Hitung subtotal dengan validasi yang sama
      let subtotal = 0;
      for (const item of items) {
        const quantity = Number(item.quantity) || 0;
        const harga_satuan = Number(item.harga_satuan) || 0;
        
        if (quantity <= 0 || harga_satuan <= 0) {
          throw new Error(`Item tidak valid: qty=${quantity}, harga=${harga_satuan}`);
        }
        
        subtotal += quantity * harga_satuan;
      }

      const ongkir = Number(saleData.ongkir) || 0;
      const diskon = Number(saleData.diskon) || 0;
      const total = subtotal + ongkir - diskon;

      if (subtotal <= 0 || total <= 0) {
        throw new Error('Subtotal dan total harus lebih dari 0');
      }

      const { data: oldSaleData, error: oldSaleError } = await supabase
        .from('sales')
        .select('status')
        .eq('id', saleId)
        .single();

      if (oldSaleError) throw oldSaleError;

      const oldStatus = oldSaleData.status;
      const newStatus = saleData.status;
      
      console.log('Update Sale - Old Status:', oldStatus, 'New Status:', newStatus);

      const completeData = { 
        ...saleData, 
        subtotal: subtotal, 
        total: total 
      };

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

          const newStock = Math.max(0, (currentStock.stok || 0) - Number(item.quantity));
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
