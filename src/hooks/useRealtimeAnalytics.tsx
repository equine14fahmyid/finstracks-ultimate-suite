
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
