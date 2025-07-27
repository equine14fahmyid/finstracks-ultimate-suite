
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMetrics {
  total_penjualan: number;
  total_pengeluaran: number;
  total_cogs: number;
  laba_bersih: number;
  saldo_kas_bank: number;
}

export const useDashboardMetrics = (startDate: string, endDate: string) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch total penjualan (revenue)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .eq('status', 'delivered');

      if (salesError) throw salesError;

      const total_penjualan = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0;

      // 2. Fetch total pengeluaran (expenses)
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('jumlah')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (expensesError) throw expensesError;

      const total_pengeluaran = expensesData?.reduce((sum, expense) => sum + expense.jumlah, 0) || 0;

      // 3. Fetch total COGS (Cost of Goods Sold) from purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('total')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .in('payment_status', ['paid', 'partial']);

      if (purchasesError) throw purchasesError;

      const total_cogs = purchasesData?.reduce((sum, purchase) => sum + purchase.total, 0) || 0;

      // 4. Fetch total saldo kas & bank
      const { data: banksData, error: banksError } = await supabase
        .from('banks')
        .select('saldo_akhir')
        .eq('is_active', true);

      if (banksError) throw banksError;

      const saldo_kas_bank = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;

      // 5. Calculate laba bersih (net profit)
      const laba_bersih = total_penjualan - total_pengeluaran - total_cogs;

      setMetrics({
        total_penjualan,
        total_pengeluaran,
        total_cogs,
        laba_bersih,
        saldo_kas_bank
      });
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate]);

  return {
    metrics,
    loading,
    error,
    refreshMetrics: fetchMetrics
  };
};
