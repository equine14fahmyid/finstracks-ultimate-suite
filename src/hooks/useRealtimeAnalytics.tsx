
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeAnalytics = (startDate: string, endDate: string) => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          store:stores (
            nama_toko,
            platform:platforms (
              nama_platform
            )
          )
        `)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .eq('status', 'delivered');

      if (salesError) throw salesError;

      setSalesData(sales || []);
      
      // Calculate totals
      const revenue = sales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
      const orders = sales?.length || 0;
      
      setTotalRevenue(revenue);
      setTotalOrders(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching realtime analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const refreshData = async () => {
    await fetchData();
  };

  return {
    salesData,
    totalRevenue,
    totalOrders,
    loading,
    error,
    refreshData
  };
};

export const useInteractiveAnalytics = (startDate: string, endDate: string) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProductDrillDown = async (productName: string) => {
    setLoading(true);
    setSelectedProduct(productName);
    try {
      // Mock drill-down data for product
      const mockData = [
        { date: '2024-01-01', quantity_sold: 5, revenue: 250000 },
        { date: '2024-01-02', quantity_sold: 3, revenue: 150000 },
        { date: '2024-01-03', quantity_sold: 7, revenue: 350000 },
      ];
      setDrillDownData(mockData);
    } catch (error) {
      console.error('Error fetching product drill-down:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformDrillDown = async (platformName: string) => {
    setLoading(true);
    setSelectedPlatform(platformName);
    try {
      // Mock drill-down data for platform
      const mockData = [
        { date: '2024-01-01', transaction_count: 15, revenue: 750000 },
        { date: '2024-01-02', transaction_count: 12, revenue: 600000 },
        { date: '2024-01-03', transaction_count: 18, revenue: 900000 },
      ];
      setDrillDownData(mockData);
    } catch (error) {
      console.error('Error fetching platform drill-down:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearDrillDown = () => {
    setSelectedProduct(null);
    setSelectedPlatform(null);
    setDrillDownData([]);
  };

  const realtimeData = useRealtimeAnalytics(startDate, endDate);

  return {
    ...realtimeData,
    selectedProduct,
    selectedPlatform,
    drillDownData,
    loading: loading || realtimeData.loading,
    fetchProductDrillDown,
    fetchPlatformDrillDown,
    clearDrillDown
  };
};
