
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type PurchaseStatus = 'pending' | 'received' | 'paid' | 'cancelled';

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPurchases = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(id, nama_supplier),
          purchase_items(
            id, 
            quantity, 
            harga_beli_satuan, 
            subtotal,
            product_variant:product_variants(
              id, 
              warna, 
              size, 
              sku,
              product:products(id, nama_produk, satuan)
            )
          )
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
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pembelian",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPurchase = async (purchaseData: any, items: any[]) => {
    setLoading(true);
    try {
      const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.harga_beli_satuan)), 0);
      const total = subtotal;

      const completeData = {
        ...purchaseData,
        subtotal,
        total
      };

      console.log('Creating purchase with data:', completeData);

      const { data: purchaseResult, error: purchaseError } = await supabase
        .from('purchases')
        .insert([completeData])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      const purchaseItems = items.map(item => ({
        purchase_id: purchaseResult.id,
        product_variant_id: item.product_variant_id,
        quantity: Number(item.quantity),
        harga_beli_satuan: Number(item.harga_beli_satuan),
        subtotal: Number(item.quantity) * Number(item.harga_beli_satuan)
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      // Update stock and create movements if status is 'received'
      if (purchaseData.payment_status === 'received') {
        await updateStockForPurchase(purchaseResult.id, items, 'received');
      }

      toast({
        title: "Sukses",
        description: "Pembelian berhasil ditambahkan",
      });

      await fetchPurchases();
      return { success: true, data: purchaseResult, error: null };
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan pembelian: " + (error as Error).message,
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  const updatePurchase = async (purchaseId: string, purchaseData: any, items: any[], existingItems?: any[]) => {
    setLoading(true);
    try {
      const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.harga_beli_satuan)), 0);
      const total = subtotal;

      // Get old purchase data for status comparison
      const { data: oldPurchaseData, error: oldPurchaseError } = await supabase
        .from('purchases')
        .select('payment_status')
        .eq('id', purchaseId)
        .single();

      if (oldPurchaseError) throw oldPurchaseError;

      const oldStatus = oldPurchaseData.payment_status;
      const newStatus = purchaseData.payment_status;
      
      console.log('Update Purchase - Old Status:', oldStatus, 'New Status:', newStatus);

      const completeData = { ...purchaseData, subtotal, total };

      const { error: purchaseError } = await supabase
        .from('purchases')
        .update(completeData)
        .eq('id', purchaseId);

      if (purchaseError) throw purchaseError;

      // Handle stock reversal if changing from 'received' to other status
      if (existingItems && existingItems.length > 0 && oldStatus === 'received' && newStatus !== 'received') {
        console.log('Reversing stock from old items...');
        await reverseStockForPurchase(purchaseId, existingItems);
      }

      // Delete old purchase items
      const { error: deleteError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', purchaseId);

      if (deleteError) throw deleteError;

      // Insert new purchase items
      const newPurchaseItems = items.map(item => ({
        purchase_id: purchaseId,
        product_variant_id: item.product_variant_id,
        quantity: Number(item.quantity),
        harga_beli_satuan: Number(item.harga_beli_satuan),
        subtotal: Number(item.quantity) * Number(item.harga_beli_satuan)
      }));

      const { error: newItemsError } = await supabase
        .from('purchase_items')
        .insert(newPurchaseItems);

      if (newItemsError) throw newItemsError;

      // Add stock if status is 'received'
      if (newStatus === 'received') {
        console.log('Adding stock for new items...');
        await updateStockForPurchase(purchaseId, items, 'received');
      }

      toast({
        title: "Sukses",
        description: "Pembelian berhasil diperbarui"
      });

      await fetchPurchases();
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating purchase:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui pembelian: " + (error as Error).message,
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  const updateStockForPurchase = async (purchaseId: string, items: any[], status: string) => {
    try {
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

        // Add stock
        const newStock = (currentStock.stok || 0) + Number(item.quantity);
        console.log(`Adding stock for ${item.product_variant_id}: ${currentStock.stok} + ${item.quantity} = ${newStock}`);

        const { error: stockError } = await supabase
          .from('product_variants')
          .update({ stok: newStock })
          .eq('id', item.product_variant_id);

        if (stockError) console.error('Stock update error:', stockError);

        // Create stock movement record
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert([{
            product_variant_id: item.product_variant_id,
            movement_type: 'in',
            quantity: Number(item.quantity),
            reference_type: 'purchase',
            reference_id: purchaseId,
            notes: `Pembelian barang masuk (${status})`
          }]);

        if (movementError) console.error('Movement error:', movementError);
      }
    } catch (error) {
      console.error('Error updating stock for purchase:', error);
    }
  };

  const reverseStockForPurchase = async (purchaseId: string, items: any[]) => {
    try {
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

        // Reverse stock (subtract what was added)
        const newStock = Math.max((currentStock.stok || 0) - Number(item.quantity), 0);
        console.log(`Reversing stock for ${item.product_variant_id}: ${currentStock.stok} - ${item.quantity} = ${newStock}`);

        const { error: stockError } = await supabase
          .from('product_variants')
          .update({ stok: newStock })
          .eq('id', item.product_variant_id);

        if (stockError) console.error('Stock reverse error:', stockError);

        // Create reverse stock movement record
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert([{
            product_variant_id: item.product_variant_id,
            movement_type: 'out',
            quantity: Number(item.quantity),
            reference_type: 'purchase',
            reference_id: purchaseId,
            notes: `Pembatalan/Edit pembelian - stock dikembalikan`
          }]);

        if (movementError) console.error('Reverse movement error:', movementError);
      }
    } catch (error) {
      console.error('Error reversing stock for purchase:', error);
    }
  };

  const createPurchaseReturn = async (originalPurchaseId: string, returnData: any, returnItems: any[]) => {
    setLoading(true);
    try {
      const subtotal = returnItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.harga_beli_satuan)), 0);

      const returnPurchaseData = {
        ...returnData,
        subtotal,
        total: subtotal,
        payment_status: 'returned',
        notes: `Return dari pembelian: ${originalPurchaseId}. ${returnData.notes || ''}`
      };

      // Create return purchase record
      const { data: returnPurchase, error: returnError } = await supabase
        .from('purchases')
        .insert([returnPurchaseData])
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return purchase items
      const returnPurchaseItems = returnItems.map(item => ({
        purchase_id: returnPurchase.id,
        product_variant_id: item.product_variant_id,
        quantity: Number(item.quantity),
        harga_beli_satuan: Number(item.harga_beli_satuan),
        subtotal: Number(item.quantity) * Number(item.harga_beli_satuan)
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(returnPurchaseItems);

      if (itemsError) throw itemsError;

      // Reverse stock for returned items
      await reverseStockForPurchase(returnPurchase.id, returnItems);

      toast({
        title: "Sukses",
        description: "Return pembelian berhasil dicatat"
      });

      await fetchPurchases();
      return { success: true, data: returnPurchase, error: null };
    } catch (error) {
      console.error('Error creating purchase return:', error);
      toast({
        title: "Error",
        description: "Gagal mencatat return pembelian: " + (error as Error).message,
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    setLoading(true);
    try {
      // Get purchase data first to check if we need to reverse stock
      const { data: purchaseData, error: fetchError } = await supabase
        .from('purchases')
        .select(`*, purchase_items(product_variant_id, quantity)`)
        .eq('id', purchaseId)
        .single();

      if (fetchError) throw fetchError;

      // If purchase was received, reverse the stock
      if (purchaseData?.purchase_items && purchaseData.payment_status === 'received') {
        await reverseStockForPurchase(purchaseId, purchaseData.purchase_items);
      }

      // Delete stock movements
      await supabase
        .from('stock_movements')
        .delete()
        .eq('reference_id', purchaseId)
        .eq('reference_type', 'purchase');

      // Delete purchase items
      await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', purchaseId);

      // Delete purchase
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pembelian berhasil dihapus"
      });

      await fetchPurchases();
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus pembelian: " + (error as Error).message,
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  return {
    purchases,
    loading,
    fetchPurchases,
    createPurchase,
    updatePurchase,
    createPurchaseReturn,
    deletePurchase
  };
};
