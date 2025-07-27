
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardMetrics {
  totalSales: number;
  totalExpenses: number;
  totalCOGS: number;
  netProfit: number;
  totalCashBank: number;
  salesCount: number;
  loading: boolean;
  error: string | null;
}

export const useDashboardMetrics = (startDate: string, endDate: string) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalExpenses: 0,
    totalCOGS: 0,
    netProfit: 0,
    totalCashBank: 0,
    salesCount: 0,
    loading: true,
    error: null
  });

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }));

      // Fetch total sales with proper error handling
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total')
        .eq('status', 'delivered')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        throw new Error('Failed to fetch sales data');
      }

      // Fetch total expenses with proper error handling
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('jumlah')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        throw new Error('Failed to fetch expenses data');
      }

      // Fetch COGS from purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('total')
        .eq('payment_status', 'paid')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
        // Don't throw error, set COGS to 0 if not available
      }

      // Fetch total cash and bank balance
      const { data: banksData, error: banksError } = await supabase
        .from('banks')
        .select('saldo_akhir')
        .eq('is_active', true);

      if (banksError) {
        console.error('Error fetching banks:', banksError);
        // Don't throw error, set cash balance to 0 if not available
      }

      const totalSales = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
      const totalCOGS = purchasesData?.reduce((sum, purchase) => sum + (purchase.total || 0), 0) || 0;
      const totalCashBank = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;
      const salesCount = salesData?.length || 0;
      const netProfit = totalSales - totalExpenses - totalCOGS;

      setMetrics({
        totalSales,
        totalExpenses,
        totalCOGS,
        netProfit,
        totalCashBank,
        salesCount,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate, user]);

  return {
    ...metrics,
    refreshMetrics: fetchMetrics
  };
};
