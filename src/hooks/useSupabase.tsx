
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Type definitions for better type safety
type Product = Database['public']['Tables']['products']['Row'];
type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
type Sale = Database['public']['Tables']['sales']['Row'];
type SaleItem = Database['public']['Tables']['sale_items']['Row'];
type Purchase = Database['public']['Tables']['purchases']['Row'];
type PurchaseItem = Database['public']['Tables']['purchase_items']['Row'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];
type Bank = Database['public']['Tables']['banks']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Platform = Database['public']['Tables']['platforms']['Row'];
type Store = Database['public']['Tables']['stores']['Row'];
type Expedition = Database['public']['Tables']['expeditions']['Row'];
type Income = Database['public']['Tables']['incomes']['Row'];
type Expense = Database['public']['Tables']['expenses']['Row'];
type Settlement = Database['public']['Tables']['settlements']['Row'];
type StockMovement = Database['public']['Tables']['stock_movements']['Row'];

// ============================================================================
// DASHBOARD ANALYTICS HOOK
// ============================================================================

export const useDashboardAnalytics = (startDate: string, endDate: string) => {
  const [data, setData] = useState<any>(null);
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (startDate && endDate) {
      fetchDashboardData();
    }
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total, tanggal')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (salesError) throw salesError;

      // Get expenses data
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('jumlah')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (expensesError) throw expensesError;

      // Get bank balances
      const { data: banksData, error: banksError } = await supabase
        .from('banks')
        .select('saldo_akhir')
        .eq('is_active', true);

      if (banksError) throw banksError;

      const totalPenjualan = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalPengeluaran = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
      const saldoKasBank = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;

      setData({
        total_penjualan: totalPenjualan,
        total_pengeluaran: totalPengeluaran,
        laba_bersih: totalPenjualan - totalPengeluaran,
        saldo_kas_bank: saldoKasBank,
      });

      // Process sales chart data
      const chartData = salesData?.reduce((acc: any[], sale) => {
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

      setSalesChart(chartData);
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

  return {
    data,
    salesChart,
    loading,
  };
};

// ============================================================================
// TOP PRODUCTS ANALYTICS HOOK
// ============================================================================

export const useTopProducts = (startDate: string, endDate: string, limit: number = 5) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (startDate && endDate) {
      fetchTopProducts();
    }
  }, [startDate, endDate, limit]);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      
      // Query untuk mendapatkan top products berdasarkan quantity dan revenue
      const { data: topProductsData, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          harga_satuan,
          subtotal,
          product_variant:product_variants (
            id,
            warna,
            size,
            product:products (
              nama_produk
            )
          ),
          sale:sales!inner (
            tanggal
          )
        `)
        .gte('sale.tanggal', startDate)
        .lte('sale.tanggal', endDate);

      if (error) throw error;

      // Aggregate data by product
      const productMap = new Map();
      
      topProductsData?.forEach(item => {
        const productName = item.product_variant?.product?.nama_produk || 'Unknown';
        const variantName = `${item.product_variant?.warna} - ${item.product_variant?.size}`;
        const key = `${productName} (${variantName})`;
        
        if (productMap.has(key)) {
          const existing = productMap.get(key);
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          productMap.set(key, {
            name: key,
            productName,
            variantName,
            quantity: item.quantity,
            revenue: item.subtotal,
          });
        }
      });

      // Convert to array and sort by revenue
      const aggregatedData = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      setData(aggregatedData);
    } catch (error: any) {
      console.error('Fetch top products error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data top produk: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
  };
};

// ============================================================================
// PLATFORM PERFORMANCE ANALYTICS HOOK
// ============================================================================

export const usePlatformPerformance = (startDate: string, endDate: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (startDate && endDate) {
      fetchPlatformPerformance();
    }
  }, [startDate, endDate]);

  const fetchPlatformPerformance = async () => {
    try {
      setLoading(true);
      
      // Query untuk mendapatkan performa platform
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          total,
          tanggal,
          store:stores!inner (
            nama_toko,
            platform:platforms!inner (
              nama_platform
            )
          )
        `)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (error) throw error;

      // Aggregate data by platform
      const platformMap = new Map();
      
      salesData?.forEach(sale => {
        const platformName = sale.store?.platform?.nama_platform || 'Unknown';
        
        if (platformMap.has(platformName)) {
          const existing = platformMap.get(platformName);
          existing.revenue += sale.total;
          existing.transaction_count += 1;
        } else {
          platformMap.set(platformName, {
            platform: platformName,
            revenue: sale.total,
            transaction_count: 1,
          });
        }
      });

      // Convert to array and sort by revenue
      const aggregatedData = Array.from(platformMap.values())
        .sort((a, b) => b.revenue - a.revenue);

      setData(aggregatedData);
    } catch (error: any) {
      console.error('Fetch platform performance error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data performa platform: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
  };
};

// ============================================================================
// PRODUCTS MANAGEMENT HOOK
// ============================================================================

export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Fetch products error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: any, variants: any[] = []) => {
    try {
      setLoading(true);
      
      // Create the product first
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) throw productError;

      // Create variants if provided
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

      await fetchProducts();
      return { data: product, error: null };
    } catch (error: any) {
      console.error('Create product error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat produk: ${error.message}`,
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
        title: "Sukses",
        description: "Produk berhasil diperbarui",
      });

      await fetchProducts();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update product error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui produk: ${error.message}`,
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
        title: "Sukses",
        description: "Produk berhasil dihapus",
      });

      await fetchProducts();
    } catch (error: any) {
      console.error('Delete product error:', error);
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

// ============================================================================
// SALES MANAGEMENT HOOK
// ============================================================================

export const useSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          store:stores (
            *,
            platform:platforms (*)
          ),
          expedition:expeditions (*),
          sale_items (
            *,
            product_variant:product_variants (
              *,
              product:products (*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      console.error('Fetch sales error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data penjualan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: any, items: any[]) => {
    try {
      setLoading(true);
      
      // Calculate subtotal and total
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_satuan), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      // Create the sale first
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          ...saleData,
          subtotal,
          total
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan,
        subtotal: item.quantity * item.harga_satuan
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil dibuat",
      });

      await fetchSales();
      return { data: sale, error: null };
    } catch (error: any) {
      console.error('Create sale error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat penjualan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateSale = async (id: string, saleData: any, items: any[]) => {
    try {
      setLoading(true);
      
      // Calculate subtotal and total
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_satuan), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      // Update the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .update({
          ...saleData,
          subtotal,
          total
        })
        .eq('id', id)
        .select()
        .single();

      if (saleError) throw saleError;

      // Delete existing sale items
      const { error: deleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (deleteError) throw deleteError;

      // Create new sale items
      const saleItems = items.map(item => ({
        sale_id: id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan,
        subtotal: item.quantity * item.harga_satuan
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil diperbarui",
      });

      await fetchSales();
      return { data: sale, error: null };
    } catch (error: any) {
      console.error('Update sale error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui penjualan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (id: string) => {
    try {
      setLoading(true);

      // Check if sale has adjustments
      const { data: adjustments, error: adjustmentError } = await supabase
        .from('sales_adjustments')
        .select('id')
        .eq('sale_id', id);

      if (adjustmentError) throw adjustmentError;

      if (adjustments && adjustments.length > 0) {
        toast({
          title: "Error",
          description: "Tidak dapat menghapus penjualan yang sudah memiliki penyesuaian",
          variant: "destructive",
        });
        return { data: null, error: 'Has adjustments' };
      }

      // Delete sale items first
      const { error: deleteItemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (deleteItemsError) throw deleteItemsError;

      // Delete the sale
      const { error: deleteSaleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (deleteSaleError) throw deleteSaleError;

      toast({
        title: "Sukses",
        description: "Penjualan berhasil dihapus",
      });

      await fetchSales();
      return { data: true, error: null };
    } catch (error: any) {
      console.error('Delete sale error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus penjualan: ${error.message}`,
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
    updateSale,
    deleteSale,
  };
};

// ============================================================================
// STOCK MANAGEMENT HOOK
// ============================================================================

export const useStock = () => {
  const [stock, setStock] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStock = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          products!inner (
            id,
            nama_produk,
            satuan,
            harga_beli,
            harga_jual_default
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Stock data fetched:', data);
      setStock(data || []);
    } catch (error: any) {
      console.error('Fetch stock error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data stok: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product_variants!inner (
            id,
            warna,
            size,
            sku,
            products!inner (
              id,
              nama_produk,
              satuan
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      console.log('Stock movements data fetched:', data);
      setMovements(data || []);
    } catch (error: any) {
      console.error('Fetch stock movements error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat riwayat stok: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (variantId: string, newStock: number, notes: string) => {
    try {
      setLoading(true);
      
      // Get current stock
      const { data: currentVariant, error: fetchError } = await supabase
        .from('product_variants')
        .select('stok')
        .eq('id', variantId)
        .single();

      if (fetchError) throw fetchError;

      const currentStock = currentVariant?.stok || 0;
      const difference = newStock - currentStock;

      // Update stock
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stok: newStock })
        .eq('id', variantId);

      if (updateError) throw updateError;

      // Record movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_variant_id: variantId,
          movement_type: difference > 0 ? 'in' : 'out',
          quantity: Math.abs(difference),
          reference_type: 'adjustment',
          notes: notes
        });

      if (movementError) throw movementError;

      toast({
        title: "Sukses",
        description: "Stok berhasil disesuaikan",
      });

      await fetchStock();
      await fetchStockMovements();
    } catch (error: any) {
      console.error('Adjust stock error:', error);
      toast({
        title: "Error",
        description: `Gagal menyesuaikan stok: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProductVariant = async (variantData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_variants')
        .insert(variantData)
        .select(`
          *,
          product:products (*)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Varian produk berhasil dibuat",
      });

      await fetchStock();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create product variant error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat varian produk: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateProductVariant = async (id: string, variantData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_variants')
        .update(variantData)
        .eq('id', id)
        .select(`
          *,
          product:products (*)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Varian produk berhasil diperbarui",
      });

      await fetchStock();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update product variant error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui varian produk: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteProductVariant = async (id: string) => {
    try {
      setLoading(true);
      
      // Check if variant has stock movements
      const { data: movements, error: movementError } = await supabase
        .from('stock_movements')
        .select('id')
        .eq('product_variant_id', id)
        .limit(1);

      if (movementError) throw movementError;

      if (movements && movements.length > 0) {
        toast({
          title: "Tidak dapat menghapus",
          description: "Varian produk ini memiliki riwayat pergerakan stok",
          variant: "destructive",
        });
        return { data: null, error: new Error("Has stock movements") };
      }

      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Varian produk berhasil dihapus",
      });

      await fetchStock();
      return { data: true, error: null };
    } catch (error: any) {
      console.error('Delete product variant error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus varian produk: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
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
    createProductVariant,
    updateProductVariant,
    deleteProductVariant,
  };
};

// ============================================================================
// SUPPLIERS MANAGEMENT HOOK
// ============================================================================

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Fetch suppliers error:', error);
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
        title: "Sukses",
        description: "Supplier berhasil dibuat",
      });

      await fetchSuppliers();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create supplier error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat supplier: ${error.message}`,
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
        title: "Sukses",
        description: "Supplier berhasil diperbarui",
      });

      await fetchSuppliers();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update supplier error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui supplier: ${error.message}`,
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
        title: "Sukses",
        description: "Supplier berhasil dihapus",
      });

      await fetchSuppliers();
    } catch (error: any) {
      console.error('Delete supplier error:', error);
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

// ============================================================================
// OTHER HOOKS WITH SAFE DATA HANDLING
// ============================================================================

export const useBanks = () => {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanks(data || []);
    } catch (error: any) {
      console.error('Fetch banks error:', error);
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
        title: "Sukses",
        description: "Bank berhasil dibuat",
      });

      await fetchBanks();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create bank error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat bank: ${error.message}`,
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
        title: "Sukses",
        description: "Bank berhasil diperbarui",
      });

      await fetchBanks();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update bank error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui bank: ${error.message}`,
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
        title: "Sukses",
        description: "Bank berhasil dihapus",
      });

      await fetchBanks();
    } catch (error: any) {
      console.error('Delete bank error:', error);
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

export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Fetch categories error:', error);
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
        title: "Sukses",
        description: "Kategori berhasil dibuat",
      });

      await fetchCategories();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create category error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat kategori: ${error.message}`,
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
        title: "Sukses",
        description: "Kategori berhasil diperbarui",
      });

      await fetchCategories();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update category error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui kategori: ${error.message}`,
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
        title: "Sukses",
        description: "Kategori berhasil dihapus",
      });

      await fetchCategories();
    } catch (error: any) {
      console.error('Delete category error:', error);
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

export const usePlatforms = () => {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error: any) {
      console.error('Fetch platforms error:', error);
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
        title: "Sukses",
        description: "Platform berhasil dibuat",
      });

      await fetchPlatforms();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create platform error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat platform: ${error.message}`,
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
        title: "Sukses",
        description: "Platform berhasil diperbarui",
      });

      await fetchPlatforms();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update platform error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui platform: ${error.message}`,
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
        title: "Sukses",
        description: "Platform berhasil dihapus",
      });

      await fetchPlatforms();
    } catch (error: any) {
      console.error('Delete platform error:', error);
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

export const useStores = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          platform:platforms (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      console.error('Fetch stores error:', error);
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
        title: "Sukses",
        description: "Toko berhasil dibuat",
      });

      await fetchStores();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create store error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat toko: ${error.message}`,
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
        title: "Sukses",
        description: "Toko berhasil diperbarui",
      });

      await fetchStores();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update store error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui toko: ${error.message}`,
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
        title: "Sukses",
        description: "Toko berhasil dihapus",
      });

      await fetchStores();
    } catch (error: any) {
      console.error('Delete store error:', error);
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

export const useExpeditions = () => {
  const [expeditions, setExpeditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchExpeditions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expeditions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpeditions(data || []);
    } catch (error: any) {
      console.error('Fetch expeditions error:', error);
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
        title: "Sukses",
        description: "Ekspedisi berhasil dibuat",
      });

      await fetchExpeditions();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create expedition error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat ekspedisi: ${error.message}`,
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
        title: "Sukses",
        description: "Ekspedisi berhasil diperbarui",
      });

      await fetchExpeditions();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update expedition error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui ekspedisi: ${error.message}`,
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
        title: "Sukses",
        description: "Ekspedisi berhasil dihapus",
      });

      await fetchExpeditions();
    } catch (error: any) {
      console.error('Delete expedition error:', error);
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

export const useIncomes = () => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('incomes')
        .select(`
          *,
          category:categories (*),
          bank:banks (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncomes(data || []);
    } catch (error: any) {
      console.error('Fetch incomes error:', error);
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
      const { data, error } = await supabase
        .from('incomes')
        .insert(incomeData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pemasukan berhasil dibuat",
      });

      await fetchIncomes();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create income error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat pemasukan: ${error.message}`,
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
        title: "Sukses",
        description: "Pemasukan berhasil diperbarui",
      });

      await fetchIncomes();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update income error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui pemasukan: ${error.message}`,
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
        title: "Sukses",
        description: "Pemasukan berhasil dihapus",
      });

      await fetchIncomes();
    } catch (error: any) {
      console.error('Delete income error:', error);
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

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories (*),
          bank:banks (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Fetch expenses error:', error);
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
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pengeluaran berhasil dibuat",
      });

      await fetchExpenses();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create expense error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat pengeluaran: ${error.message}`,
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
        title: "Sukses",
        description: "Pengeluaran berhasil diperbarui",
      });

      await fetchExpenses();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update expense error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui pengeluaran: ${error.message}`,
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
        title: "Sukses",
        description: "Pengeluaran berhasil dihapus",
      });

      await fetchExpenses();
    } catch (error: any) {
      console.error('Delete expense error:', error);
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

export const useSettlements = () => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          *,
          store:stores (
            *,
            platform:platforms (*)
          ),
          bank:banks (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSettlements(data || []);
    } catch (error: any) {
      console.error('Fetch settlements error:', error);
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
      const { data, error } = await supabase
        .from('settlements')
        .insert(settlementData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pencairan berhasil dibuat",
      });

      await fetchSettlements();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create settlement error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat pencairan: ${error.message}`,
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
        title: "Sukses",
        description: "Pencairan berhasil diperbarui",
      });

      await fetchSettlements();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update settlement error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui pencairan: ${error.message}`,
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
        title: "Sukses",
        description: "Pencairan berhasil dihapus",
      });

      await fetchSettlements();
    } catch (error: any) {
      console.error('Delete settlement error:', error);
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

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers (*),
          purchase_items (
            *,
            product_variant:product_variants (
              *,
              product:products (*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error: any) {
      console.error('Fetch purchases error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pembelian: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPurchase = async (purchaseData: any, items: any[]) => {
    try {
      setLoading(true);
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_beli_satuan), 0);
      
      // Create the purchase first
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          ...purchaseData,
          subtotal,
          total: subtotal
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items
      const purchaseItems = items.map(item => ({
        purchase_id: purchase.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_beli_satuan: item.harga_beli_satuan,
        subtotal: item.quantity * item.harga_beli_satuan
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Sukses",
        description: "Pembelian berhasil dibuat",
      });

      await fetchPurchases();
      return { data: purchase, error: null };
    } catch (error: any) {
      console.error('Create purchase error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat pembelian: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updatePurchase = async (id: string, purchaseData: any, items: any[] = []) => {
    try {
      setLoading(true);
      
      // Calculate totals if items are provided
      let updateData = { ...purchaseData };
      if (items && items.length > 0) {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_beli_satuan), 0);
        updateData = {
          ...purchaseData,
          subtotal,
          total: subtotal
        };

        // Delete existing purchase items
        const { error: deleteError } = await supabase
          .from('purchase_items')
          .delete()
          .eq('purchase_id', id);

        if (deleteError) throw deleteError;
      }

      // Update the purchase
      const { data, error } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Insert new purchase items if provided
      if (items && items.length > 0) {
        const purchaseItems = items.map(item => ({
          purchase_id: id,
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
          harga_beli_satuan: item.harga_beli_satuan,
          subtotal: item.quantity * item.harga_beli_satuan
        }));

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(purchaseItems);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Sukses",
        description: "Pembelian berhasil diperbarui",
      });

      await fetchPurchases();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update purchase error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui pembelian: ${error.message}`,
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
      
      // Delete purchase items first
      const { error: deleteItemsError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', id);

      if (deleteItemsError) throw deleteItemsError;

      // Delete the purchase
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pembelian berhasil dihapus",
      });

      await fetchPurchases();
    } catch (error: any) {
      console.error('Delete purchase error:', error);
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

export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateProfitLoss = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      
      // Get sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total, subtotal')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (salesError) throw salesError;

      // Get expenses data
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('jumlah')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (expensesError) throw expensesError;

      const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;

      return {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit,
        period: `${startDate} - ${endDate}`
      };
    } catch (error: any) {
      console.error('Generate profit loss error:', error);
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

  const generateBalanceSheet = async (date: string) => {
    try {
      setLoading(true);
      
      // Get bank balances
      const { data: banksData, error: banksError } = await supabase
        .from('banks')
        .select('saldo_akhir')
        .eq('is_active', true);

      if (banksError) throw banksError;

      // Get total stock value (simplified)
      const { data: stockData, error: stockError } = await supabase
        .from('product_variants')
        .select(`
          stok,
          product:products (harga_beli)
        `)
        .eq('is_active', true);

      if (stockError) throw stockError;

      const totalCash = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;
      const totalInventory = stockData?.reduce((sum, item) => sum + ((item.stok || 0) * (item.product?.harga_beli || 0)), 0) || 0;

      return {
        assets: {
          cash: totalCash,
          inventory: totalInventory,
          total: totalCash + totalInventory
        },
        date
      };
    } catch (error: any) {
      console.error('Generate balance sheet error:', error);
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
    generateProfitLoss,
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
      console.error('Fetch user profiles error:', error);
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
      return { data, error: null };
    } catch (error: any) {
      console.error('Create user profile error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat pengguna: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
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
      return { data, error: null };
    } catch (error: any) {
      console.error('Update user profile error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui pengguna: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
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
      console.error('Delete user profile error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus pengguna: ${error.message}`,
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
