import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Type definitions for better type safety
type Tables = Database['public']['Tables'];
type Sale = Tables['sales']['Row'];
type SaleItem = Tables['sale_items']['Row'];
type Purchase = Tables['purchases']['Row'];
type PurchaseItem = Tables['purchase_items']['Row'];
type Product = Tables['products']['Row'];
type ProductVariant = Tables['product_variants']['Row'];
type Supplier = Tables['suppliers']['Row'];
type Bank = Tables['banks']['Row'];
type Category = Tables['categories']['Row'];
type Expedition = Tables['expeditions']['Row'];

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

        // Fetch sales data with delivered status only
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

        // Process chart data - group by date
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

// Products Management Hook
export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*)
        `)
        .eq('is_active', true)
        .order('nama_produk');

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

  const createProduct = async (productData: any, variants: any[]) => {
    try {
      setLoading(true);

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) throw productError;

      // Create variants
      if (variants.length > 0) {
        const variantsWithProductId = variants.map(variant => ({
          ...variant,
          product_id: product.id,
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsWithProductId);

        if (variantsError) throw variantsError;
      }

      toast({
        title: "Berhasil",
        description: "Produk berhasil ditambahkan",
      });

      fetchProducts();
      return { data: product, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan produk: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, productData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Produk berhasil diupdate",
      });

      fetchProducts();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate produk: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Produk berhasil dihapus",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus produk: ${error.message}`,
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
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

// Sales Management Hook
export const useSales = () => {
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

      // Calculate totals
      const subtotal = saleItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      const completeData = {
        ...saleData,
        subtotal,
        total,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      // Create sale transaction
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(completeData)
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items with calculated subtotals
      const itemsWithSaleId = saleItems.map(item => ({
        sale_id: sale.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan,
        subtotal: item.quantity * item.harga_satuan,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsWithSaleId);

      if (itemsError) throw itemsError;

      toast({
        title: "Berhasil",
        description: "Penjualan berhasil dicatat",
      });

      fetchSales();
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

// Purchases Management Hook
export const usePurchases = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPurchases = async (filters?: Record<string, any>) => {
    try {
      setLoading(true);
      let query = supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(nama_supplier),
          purchase_items(
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
      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPurchases(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data pembelian: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPurchase = async (purchaseData: any, purchaseItems: any[]) => {
    try {
      setLoading(true);

      // Calculate totals
      const subtotal = purchaseItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const total = subtotal;

      const completeData = {
        ...purchaseData,
        subtotal,
        total,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      // Create purchase transaction
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert(completeData)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items with calculated subtotals
      const itemsWithPurchaseId = purchaseItems.map(item => ({
        purchase_id: purchase.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_beli_satuan: item.harga_beli_satuan,
        subtotal: item.quantity * item.harga_beli_satuan,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsWithPurchaseId);

      if (itemsError) throw itemsError;

      toast({
        title: "Berhasil",
        description: "Pembelian berhasil dicatat",
      });

      fetchPurchases();
      return { data: purchase, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan pembelian: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    purchases,
    loading,
    fetchPurchases,
    createPurchase,
  };
};

// Suppliers Management Hook
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

      fetchSuppliers();
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

  const updateSupplier = async (id: string, supplierData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data supplier berhasil diupdate",
      });

      fetchSuppliers();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate supplier: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Supplier berhasil dihapus",
      });

      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus supplier: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    suppliers,
    loading,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
};

// Banks Management Hook
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

  const createBank = async (bankData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banks')
        .insert({
          ...bankData,
          saldo_akhir: bankData.saldo_awal || 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data bank berhasil disimpan",
      });

      fetchBanks();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan bank: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateBank = async (id: string, bankData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banks')
        .update(bankData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data bank berhasil diupdate",
      });

      fetchBanks();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate bank: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteBank = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('banks')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Bank berhasil dihapus",
      });

      fetchBanks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus bank: ${error.message}`,
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
    createBank,
    updateBank,
    deleteBank,
  };
};

// Categories Management Hook
export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async (type?: 'income' | 'expense') => {
    try {
      setLoading(true);
      let query = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('nama_kategori');

      if (type) {
        query = query.eq('tipe_kategori', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data kategori: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kategori berhasil ditambahkan",
      });

      fetchCategories();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan kategori: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
  };
};

// Expeditions Management Hook
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

  const createExpedition = async (expeditionData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expeditions')
        .insert(expeditionData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Ekspedisi berhasil ditambahkan",
      });

      fetchExpeditions();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan ekspedisi: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    expeditions,
    loading,
    fetchExpeditions,
    createExpedition,
  };
};

// Stock Management Hook with real-time updates
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