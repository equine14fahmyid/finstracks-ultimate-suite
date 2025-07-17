
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  total_penjualan: number;
  total_pengeluaran: number;
  laba_bersih: number;
  saldo_kas_bank: number;
}

interface SalesData {
  date: string;
  total: number;
  transaction_count: number;
}

interface ProductDrillDown {
  date: string;
  quantity_sold: number;
  revenue: number;
}

interface PlatformDrillDown {
  date: string;
  transaction_count: number;
  revenue: number;
}

export const useRealtimeDashboard = (startDate: string, endDate: string) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [salesChart, setSalesChart] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch real sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total, tanggal')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .eq('status', 'delivered');

      if (salesError) throw salesError;

      // Fetch real expenses data
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('jumlah, tanggal')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (expensesError) throw expensesError;

      // Fetch real bank balances
      const { data: banksData, error: banksError } = await supabase
        .from('banks')
        .select('saldo_akhir')
        .eq('is_active', true);

      if (banksError) throw banksError;

      // Calculate totals from real data
      const totalPenjualan = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalPengeluaran = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
      const labaBersih = totalPenjualan - totalPengeluaran;
      const saldoKasBank = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;

      setData({
        total_penjualan: totalPenjualan,
        total_pengeluaran: totalPengeluaran,
        laba_bersih: labaBersih,
        saldo_kas_bank: saldoKasBank
      });

      // Generate sales chart data from real sales
      const salesByDate = salesData?.reduce((acc: Record<string, { total: number; count: number }>, sale) => {
        const date = sale.tanggal;
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0 };
        }
        acc[date].total += sale.total || 0;
        acc[date].count += 1;
        return acc;
      }, {}) || {};

      const chartData = Object.entries(salesByDate).map(([date, data]) => ({
        date,
        total: data.total,
        transaction_count: data.count
      }));

      setSalesChart(chartData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty data if error occurs
      setData({
        total_penjualan: 0,
        total_pengeluaran: 0,
        laba_bersih: 0,
        saldo_kas_bank: 0
      });
      setSalesChart([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refresh = useCallback(() => {
    return fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    salesChart,
    loading,
    lastUpdate,
    refresh
  };
};

export const useInteractiveAnalytics = (startDate: string, endDate: string) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<ProductDrillDown[] | PlatformDrillDown[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProductDrillDown = useCallback(async (productId: string) => {
    try {
      setLoading(true);
      setSelectedProduct(productId);
      
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          harga_satuan,
          sale:sales(tanggal, status)
        `)
        .eq('product_variant_id', productId)
        .gte('sale.tanggal', startDate)
        .lte('sale.tanggal', endDate)
        .eq('sale.status', 'delivered');

      if (error) throw error;

      const drillDown = data?.reduce((acc: Record<string, { quantity: number; revenue: number }>, item) => {
        const date = item.sale?.tanggal;
        if (!date) return acc;
        
        if (!acc[date]) {
          acc[date] = { quantity: 0, revenue: 0 };
        }
        acc[date].quantity += item.quantity || 0;
        acc[date].revenue += (item.quantity || 0) * (item.harga_satuan || 0);
        return acc;
      }, {}) || {};

      const chartData = Object.entries(drillDown).map(([date, data]) => ({
        date,
        quantity_sold: data.quantity,
        revenue: data.revenue
      }));

      setDrillDownData(chartData);
    } catch (error) {
      console.error('Error fetching product drill down:', error);
      setDrillDownData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchPlatformDrillDown = useCallback(async (platformId: string) => {
    try {
      setLoading(true);
      setSelectedPlatform(platformId);
      
      const { data, error } = await supabase
        .from('sales')
        .select('tanggal, total, store:stores!inner(platform_id)')
        .eq('store.platform_id', platformId)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .eq('status', 'delivered');

      if (error) throw error;

      const drillDown = data?.reduce((acc: Record<string, { count: number; revenue: number }>, sale) => {
        const date = sale.tanggal;
        if (!acc[date]) {
          acc[date] = { count: 0, revenue: 0 };
        }
        acc[date].count += 1;
        acc[date].revenue += sale.total || 0;
        return acc;
      }, {}) || {};

      const chartData = Object.entries(drillDown).map(([date, data]) => ({
        date,
        transaction_count: data.count,
        revenue: data.revenue
      }));

      setDrillDownData(chartData);
    } catch (error) {
      console.error('Error fetching platform drill down:', error);
      setDrillDownData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const clearDrillDown = useCallback(() => {
    setSelectedProduct(null);
    setSelectedPlatform(null);
    setDrillDownData([]);
  }, []);

  return {
    selectedProduct,
    selectedPlatform,
    drillDownData,
    loading,
    fetchProductDrillDown,
    fetchPlatformDrillDown,
    clearDrillDown
  };
};
// Di dalam fetchDashboardData function, setelah fetch sales dan expenses:

// Fetch real incomes data
const { data: incomesData, error: incomesError } = await supabase
  .from('incomes')
  .select('jumlah, tanggal')
  .gte('tanggal', startDate)
  .lte('tanggal', endDate);

if (incomesError) throw incomesError;

// Update calculation:
const totalPenjualan = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
const totalPemasukan = incomesData?.reduce((sum, income) => sum + (income.jumlah || 0), 0) || 0;
const totalPengeluaran = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
const totalTransaksi = totalPenjualan + totalPemasukan;
const labaBersih = totalTransaksi - totalPengeluaran;

setData({
  total_penjualan: totalTransaksi,
  total_pengeluaran: totalPengeluaran,
  laba_bersih: labaBersih,
  saldo_kas_bank: saldoKasBank
});
