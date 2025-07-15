import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Dashboard Analytics Hook
export const useDashboardAnalytics = (dateFrom: string, dateTo: string) => {
  const [data, setData] = useState({
    total_penjualan: 0,
    total_pengeluaran: 0,
    laba_bersih: 0,
    saldo_kas_bank: 0,
  });
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch sales data
        const { data: salesData } = await supabase
          .from('sales')
          .select('total, tanggal')
          .gte('tanggal', dateFrom)
          .lte('tanggal', dateTo)
          .eq('status', 'delivered');

        // Fetch expenses data
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('jumlah')
          .gte('tanggal', dateFrom)
          .lte('tanggal', dateTo);

        // Fetch bank balances
        const { data: banksData } = await supabase
          .from('banks')
          .select('saldo_akhir')
          .eq('is_active', true);

        // Calculate dashboard data
        const totalPenjualan = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
        const totalPengeluaran = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
        const saldoKasBank = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;

        setData({
          total_penjualan: totalPenjualan,
          total_pengeluaran: totalPengeluaran,
          laba_bersih: totalPenjualan - totalPengeluaran,
          saldo_kas_bank: saldoKasBank,
        });

        // Process chart data
        const salesByDate = salesData?.reduce((acc, sale) => {
          const date = sale.tanggal;
          if (!acc[date]) {
            acc[date] = { total: 0, count: 0 };
          }
          acc[date].total += sale.total || 0;
          acc[date].count += 1;
          return acc;
        }, {} as Record<string, { total: number; count: number }>);

        const chartData = Object.entries(salesByDate || {})
          .map(([date, data]) => ({
            date,
            total: data.total,
            transaction_count: data.count
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setSalesChart(chartData);

      } catch (error: any) {
        console.error('Error fetching analytics:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data analytics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (dateFrom && dateTo) {
      fetchAnalytics();
    }
  }, [dateFrom, dateTo]);

  return {
    data,
    salesChart,
    loading,
  };
};

// Sales Management Hook
export const useSalesManagement = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSales = async (filters?: Record<string, any>) => {
    try {
      setLoading(true);
      let query = supabase
        .from('sales')
        .select(`
          *,
          store:stores(nama_toko, platform:platforms(nama_platform)),
          expedition:expeditions(nama_ekspedisi),
          sale_items(
            *,
            product_variant:product_variants(
              warna,
              size,
              product:products(nama_produk)
            )
          )
        `)
        .order('tanggal', { ascending: false });

      if (filters?.date_from) {
        query = query.gte('tanggal', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('tanggal', filters.date_to);
      }
      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data penjualan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: any, saleItems: any[]) => {
    try {
      setLoading(true);

      // Create sale transaction
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const itemsWithSaleId = saleItems.map(item => ({
        ...item,
        sale_id: sale.id,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsWithSaleId);

      if (itemsError) throw itemsError;

      toast({
        title: "Berhasil",
        description: "Penjualan berhasil dicatat",
      });

      return { data: sale, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan penjualan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    sales,
    loading,
    fetchSales,
    createSale,
  };
};

// Stock Management Hook
export const useStockManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products(nama_produk, satuan, harga_beli, harga_jual_default)
        `)
        .eq('is_active', true)
        .order('stok', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (variantId: string, newStock: number, notes?: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('product_variants')
        .update({ stok: newStock })
        .eq('id', variantId);

      if (error) throw error;

      // Record stock movement
      await supabase
        .from('stock_movements')
        .insert({
          product_variant_id: variantId,
          movement_type: 'adjustment',
          quantity: newStock,
          reference_type: 'adjustment',
          notes: notes || 'Manual stock adjustment',
        });

      toast({
        title: "Berhasil",
        description: "Stok berhasil diupdate",
      });

      fetchProducts(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate stok: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    fetchProducts,
    updateStock,
  };
};

// Master Data Hooks
export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('nama_supplier');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data supplier: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplierData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data supplier berhasil disimpan",
      });

      fetchSuppliers(); // Refresh data
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan supplier: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    suppliers,
    loading,
    fetchSuppliers,
    createSupplier,
  };
};

export const useBanks = () => {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('is_active', true)
        .order('nama_bank');

      if (error) throw error;
      setBanks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data bank: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    banks,
    loading,
    fetchBanks,
  };
};

export const useExpeditions = () => {
  const [expeditions, setExpeditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExpeditions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expeditions')
        .select('*')
        .eq('is_active', true)
        .order('nama_ekspedisi');

      if (error) throw error;
      setExpeditions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data ekspedisi: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    expeditions,
    loading,
    fetchExpeditions,
  };
};