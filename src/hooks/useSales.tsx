
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          store:stores (
            *,
            platform:platforms (*)
          ),
          expedition:expeditions (*),
          sale_items (
            *,
            product_variant:product_variants (
              *,
              product:products (*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      console.error('Fetch sales error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data penjualan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: any, items: any[]) => {
    try {
      setLoading(true);
      
      // Calculate subtotal and total
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_satuan), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      // Create the sale first
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          ...saleData,
          subtotal,
          total
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan,
        subtotal: item.quantity * item.harga_satuan
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil dibuat",
      });

      await fetchSales();
      return { data: sale, error: null };
    } catch (error: any) {
      console.error('Create sale error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat penjualan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateSale = async (id: string, saleData: any, items: any[]) => {
    try {
      setLoading(true);
      
      // Calculate subtotal and total
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_satuan), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      // Update the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .update({
          ...saleData,
          subtotal,
          total
        })
        .eq('id', id)
        .select()
        .single();

      if (saleError) throw saleError;

      // Delete existing sale items
      const { error: deleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (deleteError) throw deleteError;

      // Create new sale items
      const saleItems = items.map(item => ({
        sale_id: id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan,
        subtotal: item.quantity * item.harga_satuan
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil diperbarui",
      });

      await fetchSales();
      return { data: sale, error: null };
    } catch (error: any) {
      console.error('Update sale error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui penjualan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (id: string) => {
    try {
      setLoading(true);

      // Check if sale has adjustments
      const { data: adjustments, error: adjustmentError } = await supabase
        .from('sales_adjustments')
        .select('id')
        .eq('sale_id', id);

      if (adjustmentError) throw adjustmentError;

      if (adjustments && adjustments.length > 0) {
        toast({
          title: "Error",
          description: "Tidak dapat menghapus penjualan yang sudah memiliki penyesuaian",
          variant: "destructive",
        });
        return { data: null, error: 'Has adjustments' };
      }

      // Delete sale items first
      const { error: deleteItemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (deleteItemsError) throw deleteItemsError;

      // Delete the sale
      const { error: deleteSaleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (deleteSaleError) throw deleteSaleError;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil dihapus",
      });

      await fetchSales();
      return { data: true, error: null };
    } catch (error: any) {
      console.error('Delete sale error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus penjualan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
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
    deleteSale,
  };
};
