import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTopProducts = (startDate: string, endDate: string, limit: number = 5) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: products, error: productsError } = await supabase
          .from('sale_items')
          .select(`
            product_variant:product_variants (
              warna,
              size,
              product:products (
                nama_produk
              )
            ),
            quantity,
            harga_satuan,
            subtotal,
            sale:sales (
              tanggal
            )
          `)
          .gte('sale.tanggal', startDate)
          .lte('sale.tanggal', endDate);

        if (productsError) throw productsError;

        // Group by product variant and sum the revenue
        const groupedProducts = products?.reduce((acc: any, item: any) => {
          const { product_variant, quantity, subtotal } = item;
          const { product } = product_variant;
          const key = `${product.nama_produk} - ${product_variant.warna} - ${product_variant.size}`;

          if (!acc[key]) {
            acc[key] = {
              name: key,
              productName: product.nama_produk,
              variantName: `${product_variant.warna} - ${product_variant.size}`,
              quantity: 0,
              revenue: 0
            };
          }

          acc[key].quantity += quantity;
          acc[key].revenue += subtotal;
          return acc;
        }, {});

        // Convert to array and sort by revenue
        const productList = Object.values(groupedProducts).sort((a: any, b: any) => b.revenue - a.revenue);

        setData(productList.slice(0, limit));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching top products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, limit]);

  return { data, loading, error };
};

export const usePlatformPerformance = (startDate: string, endDate: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select(`
            total,
            store:stores (
              nama_toko,
              platform:platforms (
                nama_platform
              )
            )
          `)
          .gte('tanggal', startDate)
          .lte('tanggal', endDate);

        if (salesError) throw salesError;

        // Group by platform and sum the revenue
        const groupedPlatforms = sales?.reduce((acc: any, sale: any) => {
          const { store, total } = sale;
          const platformName = store?.platform?.nama_platform || 'Unknown Platform';

          if (!acc[platformName]) {
            acc[platformName] = {
              platform: platformName,
              revenue: 0,
              transaction_count: 0
            };
          }

          acc[platformName].revenue += total;
          acc[platformName].transaction_count += 1;
          return acc;
        }, {});

        // Convert to array
        const platformList = Object.values(groupedPlatforms);

        setData(platformList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching platform performance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  return { data, loading, error };
};

export const useStock = () => {
  const [stock, setStock] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products (
            nama_produk,
            satuan
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStock(data || []);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    setLoading(true);
    try {
      // This would fetch from a stock_movements table if it exists
      // For now, returning empty array as placeholder
      setMovements([]);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (variantId: string, newStock: number, notes: string) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stok: newStock })
        .eq('id', variantId);

      if (error) throw error;
      await fetchStock();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  };

  const createProductVariant = async (variantData: any) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert([variantData])
        .select();

      if (error) throw error;
      await fetchStock();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating product variant:', error);
      return { success: false, error };
    }
  };

  const updateProductVariant = async (id: string, variantData: any) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update(variantData)
        .eq('id', id);

      if (error) throw error;
      await fetchStock();
      return { success: true };
    } catch (error) {
      console.error('Error updating product variant:', error);
      return { success: false, error };
    }
  };

  const deleteProductVariant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchStock();
      return { success: true };
    } catch (error) {
      console.error('Error deleting product variant:', error);
      return { success: false, error };
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
    deleteProductVariant
  };
};

// Fix useSales hook to include missing methods
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
          store:stores (
            nama_toko,
            platform:platforms (
              nama_platform
            )
          ),
          sale_items (
            *,
            product_variant:product_variants (
              warna,
              size,
              product:products (
                nama_produk
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: any, items: any[]) => {
    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      const saleItems = items.map(item => ({
        ...item,
        sale_id: sale.id
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      await fetchSales();
      return { success: true, data: sale };
    } catch (error) {
      console.error('Error creating sale:', error);
      return { success: false, error };
    }
  };

  const updateSale = async (id: string, saleData: any) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', id);

      if (error) throw error;
      await fetchSales();
      return { success: true };
    } catch (error) {
      console.error('Error updating sale:', error);
      return { success: false, error };
    }
  };

  const updateSaleStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await fetchSales();
      return { success: true };
    } catch (error) {
      console.error('Error updating sale status:', error);
      return { success: false, error };
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSales();
      return { success: true };
    } catch (error) {
      console.error('Error deleting sale:', error);
      return { success: false, error };
    }
  };

  return {
    sales,
    loading,
    fetchSales,
    createSale,
    updateSale,
    updateSaleStatus,
    deleteSale
  };
};

// Fix usePurchases hook to include missing methods
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
          supplier:suppliers (
            nama_supplier
          ),
          purchase_items (
            *,
            product_variant:product_variants (
              warna,
              size,
              product:products (
                nama_produk
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPurchase = async (purchaseData: any, items: any[]) => {
    try {
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchaseData])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Insert purchase items
      const purchaseItems = items.map(item => ({
        ...item,
        purchase_id: purchase.id
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      await fetchPurchases();
      return { success: true, data: purchase };
    } catch (error) {
      console.error('Error creating purchase:', error);
      return { success: false, error };
    }
  };

  const updatePurchase = async (id: string, purchaseData: any) => {
    try {
      const { error } = await supabase
        .from('purchases')
        .update(purchaseData)
        .eq('id', id);

      if (error) throw error;
      await fetchPurchases();
      return { success: true };
    } catch (error) {
      console.error('Error updating purchase:', error);
      return { success: false, error };
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPurchases();
      return { success: true };
    } catch (error) {
      console.error('Error deleting purchase:', error);
      return { success: false, error };
    }
  };

  return {
    purchases,
    loading,
    fetchPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase
  };
};

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplierData: any) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select();

      if (error) throw error;
      await fetchSuppliers();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return { success: false, error };
    }
  };

  const updateSupplier = async (id: string, supplierData: any) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id);

      if (error) throw error;
      await fetchSuppliers();
      return { success: true };
    } catch (error) {
      console.error('Error updating supplier:', error);
      return { success: false, error };
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSuppliers();
      return { success: true };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return { success: false, error };
    }
  };

  return {
    suppliers,
    loading,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  };
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

   const createCustomer = async (customerData: any) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select();

      if (error) throw error;
      await fetchCustomers();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { success: false, error };
    }
  };

  const updateCustomer = async (id: string, customerData: any) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id);

      if (error) throw error;
      await fetchCustomers();
      return { success: true };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { success: false, error };
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCustomers();
      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { success: false, error };
    }
  };


  return {
    customers,
    loading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
};

export const useProduct = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

   const createProduct = async (productData: any) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;
      await fetchProducts();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, error };
    }
  };

  const updateProduct = async (id: string, productData: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
      return { success: true };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error };
    }
  };


  return {
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};
