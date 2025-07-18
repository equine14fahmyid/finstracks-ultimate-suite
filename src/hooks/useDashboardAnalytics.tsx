
import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { DashboardAnalyticsData } from '../types/analytics';

export const useDashboardAnalytics = () => {
  const [data, setData] = useState<DashboardAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      // Panggil RPC Supabase
      const { data: rpcData, error } = await supabase.rpc('get_dashboard_analytics', {
        start_date: startDate,
        end_date: endDate,
      });

      // Lemparkan error jika ada
      if (error) {
        throw error;
      }

      // Perbarui data jika berhasil
      setData(rpcData);

    } catch (error: any) {
      // Tangani error
      console.error('Error fetching dashboard analytics:', error);
      toast.error('Gagal memuat data analitik dasbor.');
      setData(null);
    } finally {
      // Selalu hentikan loading
      setLoading(false);
    }
  }, []); // Dependency array kosong

  return { data, loading, fetchAnalytics };
};
