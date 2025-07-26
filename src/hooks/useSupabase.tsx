
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TopProductData {
  product_name: string;
  variant_display: string;
  quantity_sold: number;
  total_revenue: number;
}

interface PlatformPerformanceData {
  platform_name: string;
  total_sales: number;
  transaction_count: number;
}

export const useTopProducts = (startDate: string, endDate: string, limit: number = 5) => {
  const [data, setData] = useState<TopProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: salesData, error: salesError } = await supabase
          .from('sale_items')
          .select(`
            quantity,
            harga_satuan,
            subtotal,
            product_variant:product_variants!inner(
              warna,
              size,
              product:products!inner(nama_produk)
            ),
            sale:sales!inner(
              tanggal,
              status
            )
          `)
          .gte('sale.tanggal', startDate)
          .lte('sale.tanggal', endDate)
          .eq('sale.status', 'delivered');

        if (salesError) throw salesError;

        // Group by product and calculate totals
        const productMap = new Map<string, {
          product_name: string;
          variant_display: string;
          quantity_sold: number;
          total_revenue: number;
        }>();

        salesData?.forEach(item => {
          const productName = item.product_variant?.product?.nama_produk || 'Unknown';
          const variantDisplay = `${item.product_variant?.warna || 'Unknown'}, ${item.product_variant?.size || 'Unknown'}`;
          const key = `${productName}-${variantDisplay}`;

          if (productMap.has(key)) {
            const existing = productMap.get(key)!;
            existing.quantity_sold += item.quantity || 0;
            existing.total_revenue += item.subtotal || 0;
          } else {
            productMap.set(key, {
              product_name: productName,
              variant_display: variantDisplay,
              quantity_sold: item.quantity || 0,
              total_revenue: item.subtotal || 0
            });
          }
        });

        // Convert to array and sort by revenue
        const topProducts = Array.from(productMap.values())
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, limit);

        setData(topProducts);
      } catch (error) {
        console.error('Error fetching top products:', error);
        setError('Gagal memuat data produk terlaris');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchTopProducts();
    }
  }, [startDate, endDate, limit]);

  return { data, loading, error };
};

export const usePlatformPerformance = (startDate: string, endDate: string) => {
  const [data, setData] = useState<PlatformPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatformPerformance = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            total,
            tanggal,
            status,
            store:stores!inner(
              platform:platforms!inner(nama_platform)
            )
          `)
          .gte('tanggal', startDate)
          .lte('tanggal', endDate)
          .eq('status', 'delivered');

        if (salesError) throw salesError;

        // Group by platform and calculate totals
        const platformMap = new Map<string, {
          platform_name: string;
          total_sales: number;
          transaction_count: number;
        }>();

        salesData?.forEach(sale => {
          const platformName = sale.store?.platform?.nama_platform || 'Unknown';

          if (platformMap.has(platformName)) {
            const existing = platformMap.get(platformName)!;
            existing.total_sales += sale.total || 0;
            existing.transaction_count += 1;
          } else {
            platformMap.set(platformName, {
              platform_name: platformName,
              total_sales: sale.total || 0,
              transaction_count: 1
            });
          }
        });

        // Convert to array and sort by total sales
        const platformPerformance = Array.from(platformMap.values())
          .sort((a, b) => b.total_sales - a.total_sales);

        setData(platformPerformance);
      } catch (error) {
        console.error('Error fetching platform performance:', error);
        setError('Gagal memuat data performa platform');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchPlatformPerformance();
    }
  }, [startDate, endDate]);

  return { data, loading, error };
};

// Products hook
export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*)
        `)
        .eq('is_active', true);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data produk",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: any, variants: any[]) => {
    setLoading(true);
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (productError) throw productError;

      if (variants.length > 0) {
        const variantData = variants.map(variant => ({
          ...variant,
          product_id: product.id
        }));

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantData);

        if (variantError) throw variantError;
      }

      toast({
        title: "Sukses",
        description: "Produk berhasil dibuat",
      });

      fetchProducts();
      return { success: true };
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Gagal membuat produk",
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, productData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Produk berhasil diperbarui",
      });

      fetchProducts();
      return { success: true };
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui produk",
        variant: "destructive",
      });
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Produk berhasil dihapus",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus produk",
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

// Categories hook
export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Gagal memuat kategori",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert([categoryData]);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Kategori berhasil dibuat",
      });

      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Gagal membuat kategori",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, categoryData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Kategori berhasil diperbarui",
      });

      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui kategori",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Kategori berhasil dihapus",
      });

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus kategori",
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

// Banks hook
export const useBanks = () => {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setBanks(data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data bank",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBank = async (bankData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('banks')
        .insert([bankData]);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Bank berhasil dibuat",
      });

      fetchBanks();
    } catch (error) {
      console.error('Error creating bank:', error);
      toast({
        title: "Error",
        description: "Gagal membuat bank",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBank = async (id: string, bankData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('banks')
        .update(bankData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Bank berhasil diperbarui",
      });

      fetchBanks();
    } catch (error) {
      console.error('Error updating bank:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui bank",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBank = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('banks')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Bank berhasil dihapus",
      });

      fetchBanks();
    } catch (error) {
      console.error('Error deleting bank:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus bank",
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

// Expeditions hook
export const useExpeditions = () => {
  const [expeditions, setExpeditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExpeditions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expeditions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setExpeditions(data || []);
    } catch (error) {
      console.error('Error fetching expeditions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data ekspedisi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpedition = async (expeditionData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('expeditions')
        .insert([expeditionData]);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Ekspedisi berhasil dibuat",
      });

      fetchExpeditions();
    } catch (error) {
      console.error('Error creating expedition:', error);
      toast({
        title: "Error",
        description: "Gagal membuat ekspedisi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpedition = async (id: string, expeditionData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('expeditions')
        .update(expeditionData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Ekspedisi berhasil diperbarui",
      });

      fetchExpeditions();
    } catch (error) {
      console.error('Error updating expedition:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui ekspedisi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteExpedition = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('expeditions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Ekspedisi berhasil dihapus",
      });

      fetchExpeditions();
    } catch (error) {
      console.error('Error deleting expedition:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus ekspedisi",
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

// Platforms hook
export const usePlatforms = () => {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data platform",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlatform = async (platformData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('platforms')
        .insert([platformData]);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Platform berhasil dibuat",
      });

      fetchPlatforms();
    } catch (error) {
      console.error('Error creating platform:', error);
      toast({
        title: "Error",
        description: "Gagal membuat platform",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlatform = async (id: string, platformData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('platforms')
        .update(platformData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Platform berhasil diperbarui",
      });

      fetchPlatforms();
    } catch (error) {
      console.error('Error updating platform:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui platform",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePlatform = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('platforms')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Platform berhasil dihapus",
      });

      fetchPlatforms();
    } catch (error) {
      console.error('Error deleting platform:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus platform",
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

// Stores hook
export const useStores = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          platform:platforms(nama_platform)
        `)
        .eq('is_active', true);

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data toko",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStore = async (storeData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .insert([storeData]);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Toko berhasil dibuat",
      });

      fetchStores();
    } catch (error) {
      console.error('Error creating store:', error);
      toast({
        title: "Error",
        description: "Gagal membuat toko",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStore = async (id: string, storeData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update(storeData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Toko berhasil diperbarui",
      });

      fetchStores();
    } catch (error) {
      console.error('Error updating store:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui toko",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteStore = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Toko berhasil dihapus",
      });

      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus toko",
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

// Suppliers hook
export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data supplier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplierData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .insert([supplierData]);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Supplier berhasil dibuat",
      });

      fetchSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "Error",
        description: "Gagal membuat supplier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSupplier = async (id: string, supplierData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Supplier berhasil diperbarui",
      });

      fetchSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui supplier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Supplier berhasil dihapus",
      });

      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus supplier",
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

// Stock hook
export const useStock = () => {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          products (*)
        `)
        .eq('is_active', true);

      if (error) throw error;
      setStock(data || []);
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data stok",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (variantId: string, newStock: number, notes: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stok: newStock })
        .eq('id', variantId);

      if (error) throw error;

      // Create stock movement record
      await supabase
        .from('stock_movements')
        .insert([{
          product_variant_id: variantId,
          movement_type: 'adjustment',
          quantity: newStock,
          notes: notes,
          reference_type: 'manual'
        }]);

      toast({
        title: "Sukses",
        description: "Stok berhasil disesuaikan",
      });

      fetchStock();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast({
        title: "Error",
        description: "Gagal menyesuaikan stok",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    stock,
    loading,
    fetchStock,
    adjustStock,
  };
};

// Sales hook
export const useSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          store:stores(nama_toko, platform:platforms(nama_platform)),
          sale_items(*, product_variant:product_variants(*, product:products(*)))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penjualan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: any, items: any[]) => {
    setLoading(true);
    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      const itemsWithSaleId = items.map(item => ({
        ...item,
        sale_id: sale.id
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsWithSaleId);

      if (itemsError) throw itemsError;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil dibuat",
      });

      fetchSales();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: "Gagal membuat penjualan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSale = async (id: string, saleData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil diperbarui",
      });

      fetchSales();
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui penjualan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil dihapus",
      });

      fetchSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus penjualan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    sales,
    loading,
    fetchSales,
    createSale,
    updateSale,
    deleteSale,
  };
};

// Purchases hook
export const usePurchases = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(*),
          bank:banks(*),
          purchase_items(*, product_variant:product_variants(*, product:products(*)))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pembelian",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPurchase = async (purchaseData: any, items: any[]) => {
    setLoading(true);
    try {
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchaseData])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      const itemsWithPurchaseId = items.map(item => ({
        ...item,
        purchase_id: purchase.id
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsWithPurchaseId);

      if (itemsError) throw itemsError;

      toast({
        title: "Sukses",
        description: "Pembelian berhasil dibuat",
      });

      fetchPurchases();
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast({
        title: "Error",
        description: "Gagal membuat pembelian",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePurchase = async (id: string, purchaseData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .update(purchaseData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pembelian berhasil diperbarui",
      });

      fetchPurchases();
    } catch (error) {
      console.error('Error updating purchase:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui pembelian",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePurchase = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pembelian berhasil dihapus",
      });

      fetchPurchases();
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus pembelian",
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

// User Profiles hook
export const useUserProfiles = () => {
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setUserProfiles(data || []);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (profileData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert([profileData]);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Profil pengguna berhasil dibuat",
      });

      fetchUserProfiles();
    } catch (error) {
      console.error('Error creating user profile:', error);
      toast({
        title: "Error",
        description: "Gagal membuat profil pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (id: string, profileData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Profil pengguna berhasil diperbarui",
      });

      fetchUserProfiles();
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui profil pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUserProfile = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Profil pengguna berhasil dihapus",
      });

      fetchUserProfiles();
    } catch (error) {
      console.error('Error deleting user profile:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus profil pengguna",
        variant: "destructive",
      });
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
