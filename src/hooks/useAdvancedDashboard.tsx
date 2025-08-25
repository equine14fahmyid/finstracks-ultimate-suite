
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';

interface DashboardData {
  // Financial metrics
  revenue: {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
  
  // Sales metrics
  sales: {
    count: number;
    averageValue: number;
    topProducts: Array<{
      name: string;
      variant: string;
      quantity: number;
      revenue: number;
    }>;
  };
  
  // Inventory metrics
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  
  // Platform performance
  platforms: Array<{
    name: string;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
  
  // Recent activities
  activities: Array<{
    type: string;
    description: string;
    amount: number;
    date: string;
  }>;
}

export const useAdvancedDashboard = (dateRange: { from: Date; to: Date }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const startDate = dateRange.from.toISOString().split('T')[0];
  const endDate = dateRange.to.toISOString().split('T')[0];

  // Use optimized queries for different data sets
  const { data: salesData } = useOptimizedQuery({
    table: 'sales',
    select: 'tanggal, total, status',
    filters: { 
      status: 'delivered',
      tanggal: `gte.${startDate}`,
    },
    cacheKey: `sales-${startDate}-${endDate}`,
    cacheTTL: 2 * 60 * 1000 // 2 minutes for sales data
  });

  const { data: inventoryData } = useOptimizedQuery({
    table: 'product_variants',
    select: `
      stok,
      warna,
      size,
      products!inner(nama_produk, harga_beli)
    `,
    cacheKey: 'inventory-overview',
    cacheTTL: 5 * 60 * 1000 // 5 minutes for inventory
  });

  const { data: platformData } = useOptimizedQuery({
    table: 'sales',
    select: `
      total,
      tanggal,
      stores!inner(
        nama_toko,
        platforms!inner(nama_platform)
      )
    `,
    filters: {
      status: 'delivered',
      tanggal: `gte.${startDate}`,
    },
    cacheKey: `platforms-${startDate}-${endDate}`,
    cacheTTL: 3 * 60 * 1000 // 3 minutes
  });

  // Process and calculate dashboard metrics
  const processedData = useMemo(() => {
    if (!salesData || !inventoryData || !platformData) return null;

    try {
      // Calculate revenue metrics
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const todayRevenue = salesData
        .filter(sale => sale.tanggal === today)
        .reduce((sum, sale) => sum + Number(sale.total), 0);
        
      const yesterdayRevenue = salesData
        .filter(sale => sale.tanggal === yesterday)
        .reduce((sum, sale) => sum + Number(sale.total), 0);

      const thisWeekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const weekRevenue = salesData
        .filter(sale => sale.tanggal >= thisWeekStart)
        .reduce((sum, sale) => sum + Number(sale.total), 0);

      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      const monthRevenue = salesData
        .filter(sale => sale.tanggal >= monthStart)
        .reduce((sum, sale) => sum + Number(sale.total), 0);

      const growth = yesterdayRevenue > 0 
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
        : 0;

      // Calculate inventory metrics
      const totalProducts = inventoryData.length;
      const lowStock = inventoryData.filter(item => item.stok <= 5 && item.stok > 0).length;
      const outOfStock = inventoryData.filter(item => item.stok === 0).length;
      const totalValue = inventoryData.reduce((sum, item) => 
        sum + (item.stok * Number(item.products.harga_beli)), 0);

      // Calculate platform performance
      const platformMap = new Map();
      platformData.forEach(sale => {
        const platform = sale.stores.platforms.nama_platform;
        if (!platformMap.has(platform)) {
          platformMap.set(platform, { revenue: 0, orders: 0 });
        }
        platformMap.get(platform).revenue += Number(sale.total);
        platformMap.get(platform).orders += 1;
      });

      const totalPlatformRevenue = Array.from(platformMap.values())
        .reduce((sum, platform) => sum + platform.revenue, 0);

      const platforms = Array.from(platformMap.entries()).map(([name, data]) => ({
        name,
        revenue: data.revenue,
        orders: data.orders,
        percentage: totalPlatformRevenue > 0 ? (data.revenue / totalPlatformRevenue) * 100 : 0
      }));

      return {
        revenue: {
          today: todayRevenue,
          yesterday: yesterdayRevenue,
          thisWeek: weekRevenue,
          thisMonth: monthRevenue,
          growth
        },
        sales: {
          count: salesData.length,
          averageValue: salesData.length > 0 ? weekRevenue / salesData.length : 0,
          topProducts: [] // Will be populated later
        },
        inventory: {
          totalProducts,
          lowStock,
          outOfStock,
          totalValue
        },
        platforms,
        activities: [] // Will be populated later
      };
    } catch (err) {
      console.error('Error processing dashboard data:', err);
      return null;
    }
  }, [salesData, inventoryData, platformData]);

  useEffect(() => {
    if (processedData) {
      setDashboardData(processedData);
      setLoading(false);
      setError(null);
    } else if (salesData !== null || inventoryData !== null || platformData !== null) {
      setLoading(false);
    }
  }, [processedData, salesData, inventoryData, platformData]);

  return {
    data: dashboardData,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // This will trigger re-fetching through the optimized queries
    }
  };
};
