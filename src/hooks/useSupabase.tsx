import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useToast } from '@/hooks/use-toast';
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

  const updatePurchase = async (id: string, purchaseData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .update(purchaseData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pembelian berhasil diupdate",
      });

      fetchPurchases();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate pembelian: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pembelian berhasil dihapus",
      });

      fetchPurchases();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus pembelian: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    purchases,
    loading,
    fetchPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase,
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
        description: "Supplier berhasil ditambahkan",
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
        description: "Supplier berhasil diupdate",
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
        .insert(bankData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Bank berhasil ditambahkan",
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
        description: "Bank berhasil diupdate",
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('nama_kategori');

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

  const updateCategory = async (id: string, categoryData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kategori berhasil diupdate",
      });

      fetchCategories();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate kategori: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus kategori: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};

// Platforms Management Hook
export const usePlatforms = () => {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('is_active', true)
        .order('nama_platform');

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data platform: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlatform = async (platformData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platforms')
        .insert(platformData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Platform berhasil ditambahkan",
      });

      fetchPlatforms();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan platform: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updatePlatform = async (id: string, platformData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platforms')
        .update(platformData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Platform berhasil diupdate",
      });

      fetchPlatforms();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate platform: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deletePlatform = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('platforms')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Platform berhasil dihapus",
      });

      fetchPlatforms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus platform: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    platforms,
    loading,
    fetchPlatforms,
    createPlatform,
    updatePlatform,
    deletePlatform,
  };
};

// Stores Management Hook
export const useStores = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          platform:platforms(nama_platform)
        `)
        .eq('is_active', true)
        .order('nama_toko');

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data toko: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStore = async (storeData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .insert(storeData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Toko berhasil ditambahkan",
      });

      fetchStores();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan toko: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateStore = async (id: string, storeData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .update(storeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Toko berhasil diupdate",
      });

      fetchStores();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate toko: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteStore = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('stores')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Toko berhasil dihapus",
      });

      fetchStores();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus toko: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    stores,
    loading,
    fetchStores,
    createStore,
    updateStore,
    deleteStore,
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

  const updateExpedition = async (id: string, expeditionData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expeditions')
        .update(expeditionData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Ekspedisi berhasil diupdate",
      });

      fetchExpeditions();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate ekspedisi: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteExpedition = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('expeditions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Ekspedisi berhasil dihapus",
      });

      fetchExpeditions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus ekspedisi: ${error.message}`,
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
    createExpedition,
    updateExpedition,
    deleteExpedition,
  };
};

// Incomes Management Hook
export const useIncomes = () => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIncomes = async (filters?: Record<string, any>) => {
    try {
      setLoading(true);
      let query = supabase
        .from('incomes')
        .select(`
          *,
          category:categories(nama_kategori),
          bank:banks(nama_bank)
        `)
        .order('tanggal', { ascending: false });

      if (filters?.date_from) {
        query = query.gte('tanggal', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('tanggal', filters.date_to);
      }
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIncomes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data pemasukan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createIncome = async (incomeData: any) => {
    try {
      setLoading(true);
      const completeData = {
        ...incomeData,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      const { data, error } = await supabase
        .from('incomes')
        .insert(completeData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pemasukan berhasil dicatat",
      });

      fetchIncomes();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan pemasukan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateIncome = async (id: string, incomeData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('incomes')
        .update(incomeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pemasukan berhasil diupdate",
      });

      fetchIncomes();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate pemasukan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pemasukan berhasil dihapus",
      });

      fetchIncomes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus pemasukan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    incomes,
    loading,
    fetchIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
  };
};

// Expenses Management Hook
export const useExpenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async (filters?: Record<string, any>) => {
    try {
      setLoading(true);
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:categories(nama_kategori),
          bank:banks(nama_bank)
        `)
        .order('tanggal', { ascending: false });

      if (filters?.date_from) {
        query = query.gte('tanggal', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('tanggal', filters.date_to);
      }
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data pengeluaran: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData: any) => {
    try {
      setLoading(true);
      const completeData = {
        ...expenseData,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(completeData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengeluaran berhasil dicatat",
      });

      fetchExpenses();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan pengeluaran: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id: string, expenseData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengeluaran berhasil diupdate",
      });

      fetchExpenses();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate pengeluaran: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengeluaran berhasil dihapus",
      });

      fetchExpenses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus pengeluaran: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    expenses,
    loading,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};

// Settlements Management Hook
export const useSettlements = () => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSettlements = async (filters?: Record<string, any>) => {
    try {
      setLoading(true);
      let query = supabase
        .from('settlements')
        .select(`
          *,
          store:stores(nama_toko, platform:platforms(nama_platform)),
          bank:banks(nama_bank)
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

      const { data, error } = await query;

      if (error) throw error;
      setSettlements(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data pencairan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSettlement = async (settlementData: any) => {
    try {
      setLoading(true);
      const completeData = {
        ...settlementData,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      const { data, error } = await supabase
        .from('settlements')
        .insert(completeData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pencairan berhasil dicatat",
      });

      fetchSettlements();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan pencairan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateSettlement = async (id: string, settlementData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settlements')
        .update(settlementData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pencairan berhasil diupdate",
      });

      fetchSettlements();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengupdate pencairan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteSettlement = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('settlements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pencairan berhasil dihapus",
      });

      fetchSettlements();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus pencairan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    settlements,
    loading,
    fetchSettlements,
    createSettlement,
    updateSettlement,
    deleteSettlement,
  };
};

// Stock Management Hook
export const useStock = () => {
  const [stock, setStock] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products(nama_produk, satuan)
        `)
        .eq('is_active', true)
        .order('stok');

      if (error) throw error;
      setStock(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data stok: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async (filters?: Record<string, any>) => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product_variant:product_variants(
            warna,
            size,
            product:products(nama_produk)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.product_variant_id) {
        query = query.eq('product_variant_id', filters.product_variant_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMovements(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data pergerakan stok: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (productVariantId: string, quantity: number, notes: string) => {
    try {
      setLoading(true);

      // Update stock
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stok: quantity })
        .eq('id', productVariantId);

      if (updateError) throw updateError;

      // Record movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_variant_id: productVariantId,
          movement_type: 'adjustment',
          quantity: quantity,
          reference_type: 'adjustment',
          notes: notes,
        });

      if (movementError) throw movementError;

      toast({
        title: "Berhasil",
        description: "Stok berhasil disesuaikan",
      });

      fetchStock();
      fetchStockMovements();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyesuaikan stok: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    stock,
    movements,
    loading,
    fetchStock,
    fetchStockMovements,
    adjustStock,
  };
};

// Reports Hook
export const useReports = () => {
  const [loading, setLoading] = useState(false);

  const generateProfitLossReport = async (dateFrom: string, dateTo: string) => {
    try {
      setLoading(true);

      // Fetch sales revenue
      const { data: salesData } = await supabase
        .from('sales')
        .select('total')
        .gte('tanggal', dateFrom)
        .lte('tanggal', dateTo)
        .eq('status', 'delivered');

      // Fetch expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select(`
          jumlah,
          category:categories(nama_kategori)
        `)
        .gte('tanggal', dateFrom)
        .lte('tanggal', dateTo);

      const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;

      return {
        periode: `${dateFrom} s/d ${dateTo}`,
        revenue: {
          total_penjualan: totalRevenue,
        },
        expenses: {
          total_expenses: totalExpenses,
          expenses_by_category: expensesData?.reduce((acc, expense) => {
            const categoryName = expense.category?.nama_kategori || 'Uncategorized';
            if (!acc[categoryName]) {
              acc[categoryName] = 0;
            }
            acc[categoryName] += expense.jumlah || 0;
            return acc;
          }, {} as Record<string, number>) || {},
        },
        net_profit: totalRevenue - totalExpenses,
        gross_margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal membuat laporan laba rugi: ${error.message}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateBalanceSheet = async (asOfDate: string) => {
    try {
      setLoading(true);

      // Fetch bank balances (current assets)
      const { data: banksData } = await supabase
        .from('banks')
        .select('saldo_akhir')
        .eq('is_active', true);

      // Fetch inventory value (current assets)
      const { data: stockData } = await supabase
        .from('product_variants')
        .select(`
          stok,
          product:products(harga_beli)
        `)
        .eq('is_active', true);

      const kasBank = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;
      const persediaan = stockData?.reduce((sum, variant) => {
        return sum + ((variant.stok || 0) * (variant.product?.harga_beli || 0));
      }, 0) || 0;

      return {
        periode: asOfDate,
        assets: {
          current_assets: {
            kas_bank: kasBank,
            piutang: 0, // TODO: Implement receivables
            persediaan: persediaan,
            total: kasBank + persediaan,
          },
          fixed_assets: {
            equipment: 0, // TODO: Implement from assets table
            accumulated_depreciation: 0,
            total: 0,
          },
          total_assets: kasBank + persediaan,
        },
        liabilities: {
          current_liabilities: {
            hutang_usaha: 0, // TODO: Implement payables
            total: 0,
          },
          total_liabilities: 0,
        },
        equity: {
          modal_awal: 0, // TODO: Implement capital tracking
          laba_ditahan: kasBank + persediaan, // Simplified calculation
          total: kasBank + persediaan,
        },
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal membuat neraca: ${error.message}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    generateProfitLossReport,
    generateBalanceSheet,
  };
};

// User Profiles Management Hook
export const useUserProfiles = () => {
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memuat data pengguna: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pengguna berhasil dibuat",
      });

      await fetchUserProfiles();
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal membuat pengguna: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (id: string, userData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pengguna berhasil diperbarui",
      });

      await fetchUserProfiles();
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memperbarui pengguna: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteUserProfile = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pengguna berhasil dihapus",
      });

      await fetchUserProfiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus pengguna: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    userProfiles,
    loading,
    fetchUserProfiles,
    createUserProfile,
    updateUserProfile,
    deleteUserProfile,
  };
};
