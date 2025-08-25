
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface AdvancedAnalytics {
  // Revenue Analytics
  todayRevenue: number;
  yesterdayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  revenueGrowth: number;
  
  // Sales Analytics
  todaySales: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  
  // Inventory Analytics
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryValue: number;
  
  // Platform Performance
  platformPerformance: Array<{
    platform: string;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
  
  // Top Products
  topProducts: Array<{
    product_name: string;
    variant_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  
  // Recent Activities
  recentActivities: Array<{
    type: 'sale' | 'purchase' | 'expense' | 'income';
    description: string;
    amount: number;
    date: string;
  }>;
}

export const useAdvancedAnalytics = (dateRange: { start: Date; end: Date }) => {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAdvancedAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];
      
      // Today's metrics
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Fetch today's revenue
      const { data: todayRevenue } = await supabase
        .from('sales')
        .select('total')
        .eq('tanggal', today)
        .eq('status', 'delivered');

      // Fetch yesterday's revenue  
      const { data: yesterdayRevenue } = await supabase
        .from('sales')
        .select('total')
        .eq('tanggal', yesterday)
        .eq('status', 'delivered');

      // Fetch week revenue
      const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const { data: weekRevenue } = await supabase
        .from('sales')
        .select('total')
        .gte('tanggal', weekStart)
        .eq('status', 'delivered');

      // Fetch month revenue
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const { data: monthRevenue } = await supabase
        .from('sales')
        .select('total')
        .gte('tanggal', monthStart)
        .eq('status', 'delivered');

      // Fetch total sales count for today
      const { count: todaySales } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('tanggal', today);

      // Fetch inventory analytics
      const { data: inventoryData } = await supabase
        .from('product_variants')
        .select(`
          stok,
          products!inner(harga_beli)
        `);

      // Fetch platform performance
      const { data: platformData } = await supabase
        .from('sales')
        .select(`
          total,
          stores!inner(
            nama_toko,
            platforms!inner(nama_platform)
          )
        `)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .eq('status', 'delivered');

      // Fetch top products
      const { data: topProductsData } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          harga_satuan,
          sales!inner(tanggal, status),
          product_variants!inner(
            warna,
            size,
            products!inner(nama_produk)
          )
        `)
        .gte('sales.tanggal', startDate)
        .lte('sales.tanggal', endDate)
        .eq('sales.status', 'delivered');

      // Process calculations
      const todayRev = todayRevenue?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const yesterdayRev = yesterdayRevenue?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const weekRev = weekRevenue?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const monthRev = monthRevenue?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      
      const revenueGrowth = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : 0;

      // Inventory calculations
      const totalProducts = inventoryData?.length || 0;
      const lowStockProducts = inventoryData?.filter(item => item.stok <= 5 && item.stok > 0).length || 0;
      const outOfStockProducts = inventoryData?.filter(item => item.stok === 0).length || 0;
      const inventoryValue = inventoryData?.reduce((sum, item) => 
        sum + (item.stok * Number(item.products.harga_beli)), 0) || 0;

      // Platform performance calculations
      const platformMap = new Map();
      platformData?.forEach(sale => {
        const platform = sale.stores.platforms.nama_platform;
        if (!platformMap.has(platform)) {
          platformMap.set(platform, { revenue: 0, orders: 0 });
        }
        platformMap.get(platform).revenue += Number(sale.total);
        platformMap.get(platform).orders += 1;
      });

      const totalPlatformRevenue = Array.from(platformMap.values())
        .reduce((sum, platform) => sum + platform.revenue, 0);

      const platformPerformance = Array.from(platformMap.entries()).map(([platform, data]) => ({
        platform,
        revenue: data.revenue,
        orders: data.orders,
        percentage: totalPlatformRevenue > 0 ? (data.revenue / totalPlatformRevenue) * 100 : 0
      }));

      // Top products calculations
      const productMap = new Map();
      topProductsData?.forEach(item => {
        const key = `${item.product_variants.products.nama_produk}-${item.product_variants.warna}-${item.product_variants.size}`;
        if (!productMap.has(key)) {
          productMap.set(key, {
            product_name: item.product_variants.products.nama_produk,
            variant_name: `${item.product_variants.warna}, ${item.product_variants.size}`,
            quantity_sold: 0,
            revenue: 0
          });
        }
        productMap.get(key).quantity_sold += item.quantity;
        productMap.get(key).revenue += item.quantity * Number(item.harga_satuan);
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setAnalytics({
        todayRevenue: todayRev,
        yesterdayRevenue: yesterdayRev,
        weekRevenue: weekRev,
        monthRevenue: monthRev,
        revenueGrowth,
        todaySales: todaySales || 0,
        totalCustomers: 0, // Will be implemented later
        averageOrderValue: todaySales > 0 ? todayRev / todaySales : 0,
        conversionRate: 0, // Will be implemented later
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        inventoryValue,
        platformPerformance,
        topProducts,
        recentActivities: [] // Will be implemented later
      });

    } catch (error: any) {
      console.error('Error fetching advanced analytics:', error);
      setError('Gagal memuat data analytics');
      toast({
        title: 'Error',
        description: 'Gagal memuat data analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [user, dateRange]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAdvancedAnalytics
  };
};
