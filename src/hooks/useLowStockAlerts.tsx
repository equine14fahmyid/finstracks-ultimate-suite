
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LowStockProduct {
  id: string;
  product_name: string;
  variant_name: string;
  current_stock: number;
  threshold: number;
  status: 'critical' | 'low' | 'warning';
}

export const useLowStockAlerts = (threshold: number = 5) => {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('product_variants')
        .select(`
          id,
          warna,
          size,
          stok,
          products (
            nama_produk
          )
        `)
        .lte('stok', threshold)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      const lowStockProducts: LowStockProduct[] = data?.map(variant => ({
        id: variant.id,
        product_name: variant.products?.nama_produk || 'Unknown Product',
        variant_name: `${variant.warna} - ${variant.size}`,
        current_stock: variant.stok || 0,
        threshold,
        status: variant.stok <= 0 ? 'critical' : variant.stok <= 2 ? 'low' : 'warning'
      })) || [];

      setLowStockProducts(lowStockProducts);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch low stock products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockProducts();
    
    // Set up real-time subscription for stock changes
    const subscription = supabase
      .channel('stock-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'product_variants'
      }, () => {
        fetchLowStockProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [threshold]);

  return {
    lowStockProducts,
    loading,
    error,
    refreshLowStock: fetchLowStockProducts
  };
};
