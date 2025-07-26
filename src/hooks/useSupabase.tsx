import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TopProductData {
  product_name: string;
  variant_display: string;
  quantity_sold: number;
  total_revenue: number;
}

interface PlatformPerformanceData {
  platform_name: string;
  total_sales: number;
  transaction_count: number;
}

export const useTopProducts = (startDate: string, endDate: string, limit: number = 5) => {
  const [data, setData] = useState<TopProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: salesData, error: salesError } = await supabase
          .from('sale_items')
          .select(`
            quantity,
            harga_satuan,
            subtotal,
            product_variant:product_variants!inner(
              warna,
              size,
              product:products!inner(nama_produk)
            ),
            sale:sales!inner(
              tanggal,
              status
            )
          `)
          .gte('sale.tanggal', startDate)
          .lte('sale.tanggal', endDate)
          .eq('sale.status', 'delivered');

        if (salesError) throw salesError;

        // Group by product and calculate totals
        const productMap = new Map<string, {
          product_name: string;
          variant_display: string;
          quantity_sold: number;
          total_revenue: number;
        }>();

        salesData?.forEach(item => {
          const productName = item.product_variant?.product?.nama_produk || 'Unknown';
          const variantDisplay = `${item.product_variant?.warna || 'Unknown'}, ${item.product_variant?.size || 'Unknown'}`;
          const key = `${productName}-${variantDisplay}`;

          if (productMap.has(key)) {
            const existing = productMap.get(key)!;
            existing.quantity_sold += item.quantity || 0;
            existing.total_revenue += item.subtotal || 0;
          } else {
            productMap.set(key, {
              product_name: productName,
              variant_display: variantDisplay,
              quantity_sold: item.quantity || 0,
              total_revenue: item.subtotal || 0
            });
          }
        });

        // Convert to array and sort by revenue
        const topProducts = Array.from(productMap.values())
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, limit);

        setData(topProducts);
      } catch (error) {
        console.error('Error fetching top products:', error);
        setError('Gagal memuat data produk terlaris');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchTopProducts();
    }
  }, [startDate, endDate, limit]);

  return { data, loading, error };
};

export const usePlatformPerformance = (startDate: string, endDate: string) => {
  const [data, setData] = useState<PlatformPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatformPerformance = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            total,
            tanggal,
            status,
            store:stores!inner(
              platform:platforms!inner(nama_platform)
            )
          `)
          .gte('tanggal', startDate)
          .lte('tanggal', endDate)
          .eq('status', 'delivered');

        if (salesError) throw salesError;

        // Group by platform and calculate totals
        const platformMap = new Map<string, {
          platform_name: string;
          total_sales: number;
          transaction_count: number;
        }>();

        salesData?.forEach(sale => {
          const platformName = sale.store?.platform?.nama_platform || 'Unknown';

          if (platformMap.has(platformName)) {
            const existing = platformMap.get(platformName)!;
            existing.total_sales += sale.total || 0;
            existing.transaction_count += 1;
          } else {
            platformMap.set(platformName, {
              platform_name: platformName,
              total_sales: sale.total || 0,
              transaction_count: 1
            });
          }
        });

        // Convert to array and sort by total sales
        const platformPerformance = Array.from(platformMap.values())
          .sort((a, b) => b.total_sales - a.total_sales);

        setData(platformPerformance);
      } catch (error) {
        console.error('Error fetching platform performance:', error);
        setError('Gagal memuat data performa platform');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchPlatformPerformance();
    }
  }, [startDate, endDate]);

  return { data, loading, error };
};
