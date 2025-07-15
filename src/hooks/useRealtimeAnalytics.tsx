import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// REAL-TIME DASHBOARD HOOK
// ============================================================================

export const useRealtimeDashboard = (startDate: string, endDate: string) => {
  const [data, setData] = useState<any>(null);
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    if (startDate && endDate) {
      fetchDashboardData();
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup subscriptions
      supabase.removeAllChannels();
    };
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Parallel fetch for better performance
      const [salesResult, expensesResult, banksResult] = await Promise.all([
        supabase
          .from('sales')
          .select('total, tanggal')
          .gte('tanggal', startDate)
          .lte('tanggal', endDate),
        
        supabase
          .from('expenses')
          .select('jumlah')
          .gte('tanggal', startDate)
          .lte('tanggal', endDate),
        
        supabase
          .from('banks')
          .select('saldo_akhir')
          .eq('is_active', true)
      ]);

      // Check for errors
      if (salesResult.error) throw salesResult.error;
      if (expensesResult.error) throw expensesResult.error;
      if (banksResult.error) throw banksResult.error;

      const totalPenjualan = salesResult.data?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalPengeluaran = expensesResult.data?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
      const saldoKasBank = banksResult.data?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;

      setData({
        total_penjualan: totalPenjualan,
        total_pengeluaran: totalPengeluaran,
        laba_bersih: totalPenjualan - totalPengeluaran,
        saldo_kas_bank: saldoKasBank,
      });

      // Process sales chart data
      const chartData = salesResult.data?.reduce((acc: any[], sale) => {
        const date = sale.tanggal;
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.total += sale.total || 0;
          existing.transaction_count += 1;
        } else {
          acc.push({
            date,
            total: sale.total || 0,
            transaction_count: 1,
          });
        }
        return acc;
      }, []) || [];

      setSalesChart(chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Fetch dashboard data error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data dashboard: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to sales changes
    const salesChannel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          console.log('Sales realtime update:', payload);
          fetchDashboardData(); // Refresh data on any sales change
          toast({
            title: "Update Real-time",
            description: "Data penjualan telah diperbarui",
          });
        }
      )
      .subscribe();

    // Subscribe to expenses changes
    const expensesChannel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        (payload) => {
          console.log('Expenses realtime update:', payload);
          fetchDashboardData(); // Refresh data on any expenses change
          toast({
            title: "Update Real-time",
            description: "Data pengeluaran telah diperbarui",
          });
        }
      )
      .subscribe();

    // Subscribe to banks changes
    const banksChannel = supabase
      .channel('banks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banks'
        },
        (payload) => {
          console.log('Banks realtime update:', payload);
          fetchDashboardData(); // Refresh data on any banks change
          toast({
            title: "Update Real-time",
            description: "Data bank telah diperbarui",
          });
        }
      )
      .subscribe();
  };

  return {
    data,
    salesChart,
    loading,
    lastUpdate,
    refresh: fetchDashboardData,
  };
};

// ============================================================================
// INTERACTIVE ANALYTICS HOOK
// ============================================================================

export const useInteractiveAnalytics = (startDate: string, endDate: string) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProductDrillDown = async (productName: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          harga_satuan,
          subtotal,
          product_variant:product_variants (
            warna,
            size,
            product:products (
              nama_produk
            )
          ),
          sale:sales!inner (
            tanggal,
            customer_name,
            store:stores (
              nama_toko,
              platform:platforms (
                nama_platform
              )
            )
          )
        `)
        .eq('product_variant.product.nama_produk', productName)
        .gte('sale.tanggal', startDate)
        .lte('sale.tanggal', endDate)
        .order('sale.tanggal', { ascending: false });

      if (error) throw error;

      setDrillDownData(data || []);
      setSelectedProduct(productName);
    } catch (error: any) {
      console.error('Fetch product drill down error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat detail produk: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformDrillDown = async (platformName: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          total,
          tanggal,
          customer_name,
          no_pesanan_platform,
          status,
          store:stores!inner (
            nama_toko,
            platform:platforms!inner (
              nama_platform
            )
          ),
          sale_items (
            quantity,
            harga_satuan,
            product_variant:product_variants (
              warna,
              size,
              product:products (
                nama_produk
              )
            )
          )
        `)
        .eq('store.platform.nama_platform', platformName)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .order('tanggal', { ascending: false });

      if (error) throw error;

      setDrillDownData(data || []);
      setSelectedPlatform(platformName);
    } catch (error: any) {
      console.error('Fetch platform drill down error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat detail platform: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearDrillDown = () => {
    setSelectedProduct(null);
    setSelectedPlatform(null);
    setDrillDownData([]);
  };

  return {
    selectedProduct,
    selectedPlatform,
    drillDownData,
    loading,
    fetchProductDrillDown,
    fetchPlatformDrillDown,
    clearDrillDown,
  };
};