
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

interface Product {
  id: string;
  created_at: string;
  nama_produk: string;
  deskripsi: string;
  harga_beli: number;
  harga_jual_default: number;
  satuan: string;
  is_active: boolean;
}

interface ProductVariant {
  id: string;
  created_at: string;
  product_id: string;
  warna: string;
  size: string;
  stok: number;
  sku: string;
  is_active: boolean;
}

interface StockMovement {
  id: string;
  created_at: string;
  product_variant_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_type: string;
  reference_id: string;
  notes: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(
            id,
            warna,
            size,
            stok,
            sku
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Products fetch error:', error);
        throw error;
      }
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data produk",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: any, variants: any[] = []) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

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

      // Force refresh to sync all data
      await fetchProducts();
      
      toast({
        title: "Berhasil",
        description: "Produk berhasil ditambahkan",
      });
      return { data: product, error: null };
    } catch (error: any) {
      console.error('Create product error:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan produk",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateProduct = async (id: string, productData: any) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select();

      if (error) throw error;

      await fetchProducts();
      toast({
        title: "Berhasil",
        description: "Produk berhasil diupdate",
      });
      return { data, error: null };
    } catch (error: any) {
      console.error('Update product error:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate produk",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchProducts();
      toast({
        title: "Berhasil",
        description: "Produk berhasil dihapus",
      });
    } catch (error: any) {
      console.error('Delete product error:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus produk",
        variant: "destructive",
      });
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

export const useStock = () => {
  const [stock, setStock] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStock = async () => {
    try {
      setLoading(true);
      
      const { data: variants, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          warna,
          size,
          stok,
          sku,
          product_id,
          created_at,
          products!inner(
            id,
            nama_produk,
            harga_beli,
            harga_jual_default,
            satuan
          )
        `)
        .eq('is_active', true)
        .eq('products.is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Stock fetch error:', error);
        throw error;
      }
      
      setStock(variants || []);
    } catch (error: any) {
      console.error('Fetch stock error:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data stok",
        variant: "destructive",
      });
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    try {
      const { data: movements, error } = await supabase
        .from('stock_movements')
        .select(`
          id,
          movement_type,
          quantity,
          reference_type,
          notes,
          created_at,
          product_variant:product_variants(
            id,
            warna,
            size,
            product:products(nama_produk)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMovements(movements || []);
    } catch (error: any) {
      console.error('Fetch movements error:', error);
      toast({
        title: "Error",
        description: "Gagal memuat riwayat pergerakan stok",
        variant: "destructive",
      });
      setMovements([]);
    }
  };

  const adjustStock = async (variantId: string, newStock: number, notes: string = '') => {
    try {
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
          movement_type: 'adjustment',
          quantity: newStock,
          reference_type: 'adjustment',
          notes: notes
        });

      if (movementError) throw movementError;

      // Refresh data
      await fetchStock();
      await fetchStockMovements();
      
      toast({
        title: "Berhasil",
        description: "Stok berhasil disesuaikan",
      });
    } catch (error: any) {
      console.error('Adjust stock error:', error);
      toast({
        title: "Error",
        description: "Gagal menyesuaikan stok",
        variant: "destructive",
      });
    }
  };

  const createProductVariant = async (variantData: any) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert([variantData])
        .select();

      if (error) throw error;

      // Force refresh to sync all data
      await fetchStock();
      
      toast({
        title: "Berhasil",
        description: "Varian produk berhasil ditambahkan",
      });
      return { data, error: null };
    } catch (error: any) {
      console.error('Create variant error:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan varian produk",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateProductVariant = async (id: string, variantData: any) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .update(variantData)
        .eq('id', id)
        .select();

      if (error) throw error;

      // Force refresh to sync all data
      await fetchStock();
      
      toast({
        title: "Berhasil",
        description: "Varian produk berhasil diperbarui",
      });
      return { data, error: null };
    } catch (error: any) {
      console.error('Update variant error:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui varian produk",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteProductVariant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      // Force refresh to sync all data
      await fetchStock();
      
      toast({
        title: "Berhasil",
        description: "Varian produk berhasil dihapus",
      });
    } catch (error: any) {
      console.error('Delete variant error:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus varian produk",
        variant: "destructive",
      });
      throw error;
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

// Banks hooks
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanks(data || []);
    } catch (error: any) {
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
    try {
      const { data, error } = await supabase
        .from('banks')
        .insert([bankData])
        .select();

      if (error) throw error;

      await fetchBanks();
      toast({
        title: "Berhasil",
        description: "Bank berhasil ditambahkan",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan bank",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateBank = async (id: string, bankData: any) => {
    try {
      const { error } = await supabase
        .from('banks')
        .update(bankData)
        .eq('id', id);

      if (error) throw error;

      await fetchBanks();
      toast({
        title: "Berhasil",
        description: "Bank berhasil diupdate",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate bank",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteBank = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banks')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchBanks();
      toast({
        title: "Berhasil",
        description: "Bank berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus bank",
        variant: "destructive",
      });
    }
  };

  return {
    banks,
    loading,
    fetchBanks,
    createBank,
    updateBank,
    deleteBank
  };
};

// Categories hooks
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data kategori",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: any) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select();

      if (error) throw error;

      await fetchCategories();
      toast({
        title: "Berhasil",
        description: "Kategori berhasil ditambahkan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan kategori",
        variant: "destructive",
      });
    }
  };

  const updateCategory = async (id: string, categoryData: any) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id);

      if (error) throw error;

      await fetchCategories();
      toast({
        title: "Berhasil",
        description: "Kategori berhasil diupdate",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate kategori",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchCategories();
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus kategori",
        variant: "destructive",
      });
    }
  };

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};

// Expeditions hooks
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpeditions(data || []);
    } catch (error: any) {
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
    try {
      const { data, error } = await supabase
        .from('expeditions')
        .insert([expeditionData])
        .select();

      if (error) throw error;

      await fetchExpeditions();
      toast({
        title: "Berhasil",
        description: "Ekspedisi berhasil ditambahkan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan ekspedisi",
        variant: "destructive",
      });
    }
  };

  const updateExpedition = async (id: string, expeditionData: any) => {
    try {
      const { error } = await supabase
        .from('expeditions')
        .update(expeditionData)
        .eq('id', id);

      if (error) throw error;

      await fetchExpeditions();
      toast({
        title: "Berhasil",
        description: "Ekspedisi berhasil diupdate",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate ekspedisi",
        variant: "destructive",
      });
    }
  };

  const deleteExpedition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expeditions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchExpeditions();
      toast({
        title: "Berhasil",
        description: "Ekspedisi berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus ekspedisi",
        variant: "destructive",
      });
    }
  };

  return {
    expeditions,
    loading,
    fetchExpeditions,
    createExpedition,
    updateExpedition,
    deleteExpedition
  };
};

// Platforms hooks
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error: any) {
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
    try {
      const { data, error } = await supabase
        .from('platforms')
        .insert([platformData])
        .select();

      if (error) throw error;

      await fetchPlatforms();
      toast({
        title: "Berhasil",
        description: "Platform berhasil ditambahkan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan platform",
        variant: "destructive",
      });
    }
  };

  const updatePlatform = async (id: string, platformData: any) => {
    try {
      const { error } = await supabase
        .from('platforms')
        .update(platformData)
        .eq('id', id);

      if (error) throw error;

      await fetchPlatforms();
      toast({
        title: "Berhasil",
        description: "Platform berhasil diupdate",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate platform",
        variant: "destructive",
      });
    }
  };

  const deletePlatform = async (id: string) => {
    try {
      const { error } = await supabase
        .from('platforms')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchPlatforms();
      toast({
        title: "Berhasil",
        description: "Platform berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus platform",
        variant: "destructive",
      });
    }
  };

  return {
    platforms,
    loading,
    fetchPlatforms,
    createPlatform,
    updatePlatform,
    deletePlatform
  };
};

// Stores hooks
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
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
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert([storeData])
        .select();

      if (error) throw error;

      await fetchStores();
      toast({
        title: "Berhasil",
        description: "Toko berhasil ditambahkan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan toko",
        variant: "destructive",
      });
    }
  };

  const updateStore = async (id: string, storeData: any) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update(storeData)
        .eq('id', id);

      if (error) throw error;

      await fetchStores();
      toast({
        title: "Berhasil",
        description: "Toko berhasil diupdate",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate toko",
        variant: "destructive",
      });
    }
  };

  const deleteStore = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchStores();
      toast({
        title: "Berhasil",
        description: "Toko berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus toko",
        variant: "destructive",
      });
    }
  };

  return {
    stores,
    loading,
    fetchStores,
    createStore,
    updateStore,
    deleteStore
  };
};

// Suppliers hooks
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
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
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select();

      if (error) throw error;

      await fetchSuppliers();
      toast({
        title: "Berhasil",
        description: "Supplier berhasil ditambahkan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan supplier",
        variant: "destructive",
      });
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
      toast({
        title: "Berhasil",
        description: "Supplier berhasil diupdate",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate supplier",
        variant: "destructive",
      });
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchSuppliers();
      toast({
        title: "Berhasil",
        description: "Supplier berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus supplier",
        variant: "destructive",
      });
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

// User Profiles hooks
export const useUserProfiles = () => {
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userData: any) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([userData])
        .select();

      if (error) throw error;

      await fetchUserProfiles();
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil ditambahkan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan pengguna",
        variant: "destructive",
      });
    }
  };

  const updateUserProfile = async (id: string, userData: any) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(userData)
        .eq('id', id);

      if (error) throw error;

      await fetchUserProfiles();
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil diupdate",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate pengguna",
        variant: "destructive",
      });
    }
  };

  const deleteUserProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchUserProfiles();
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna",
        variant: "destructive",
      });
    }
  };

  return {
    userProfiles,
    loading,
    fetchUserProfiles,
    createUserProfile,
    updateUserProfile,
    deleteUserProfile
  };
};

// Sales hooks  
export const useSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          store:stores(nama_toko, platform:platforms(nama_platform)),
          expedition:expeditions(nama_ekspedisi),
          sale_items(
            id,
            quantity,
            harga_satuan,
            subtotal,
            product_variant:product_variants(
              id,
              warna,
              size,
              product:products(nama_produk)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
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
    try {
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_satuan), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      const { data: sale, error } = await supabase
        .from('sales')
        .insert([{
          ...saleData,
          subtotal,
          total
        }])
        .select()
        .single();

      if (error) throw error;

      // Create sale items
      const itemsData = items.map(item => ({
        sale_id: sale.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan,
        subtotal: item.quantity * item.harga_satuan
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      await fetchSales();
      toast({
        title: "Berhasil",
        description: "Penjualan berhasil ditambahkan",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan penjualan",
        variant: "destructive",
      });
      return { error };
    }
  };

  const updateSale = async (id: string, saleData: any, items: any[]) => {
    try {
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_satuan), 0);
      const total = subtotal + (saleData.ongkir || 0) - (saleData.diskon || 0);

      const { error } = await supabase
        .from('sales')
        .update({
          ...saleData,
          subtotal,
          total
        })
        .eq('id', id);

      if (error) throw error;

      // Delete existing items
      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      // Create new items
      const itemsData = items.map(item => ({
        sale_id: id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_satuan: item.harga_satuan,
        subtotal: item.quantity * item.harga_satuan
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      await fetchSales();
      toast({
        title: "Berhasil",
        description: "Penjualan berhasil diupdate",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate penjualan",
        variant: "destructive",
      });
      return { error };
    }
  };

  const deleteSale = async (id: string) => {
    try {
      // Delete sale items first
      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      // Delete sale
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSales();
      toast({
        title: "Berhasil",
        description: "Penjualan berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus penjualan",
        variant: "destructive",
      });
    }
  };

  return {
    sales,
    loading,
    fetchSales,
    createSale,
    updateSale,
    deleteSale
  };
};

// Purchases hooks
export const usePurchases = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(nama_supplier),
          purchase_items(
            id,
            quantity,
            harga_beli_satuan,
            subtotal,
            product_variant:product_variants(
              id,
              warna,
              size,
              products:products(nama_produk)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error: any) {
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
    try {
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.harga_beli_satuan), 0);
      const total = subtotal; // For now, purchases don't have additional fees

      const { data: purchase, error } = await supabase
        .from('purchases')
        .insert([{
          ...purchaseData,
          subtotal,
          total
        }])
        .select()
        .single();

      if (error) throw error;

      // Create purchase items
      const itemsData = items.map(item => ({
        purchase_id: purchase.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_beli_satuan: item.harga_beli_satuan,
        subtotal: item.quantity * item.harga_beli_satuan
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      await fetchPurchases();
      toast({
        title: "Berhasil",
        description: "Pembelian berhasil ditambahkan",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan pembelian",
        variant: "destructive",
      });
      return { error };
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
      toast({
        title: "Berhasil",
        description: "Pembelian berhasil diupdate",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate pembelian",
        variant: "destructive",
      });
      return { error };
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      // Delete purchase items first
      await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', id);

      // Delete purchase
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchPurchases();
      toast({
        title: "Berhasil",
        description: "Pembelian berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus pembelian",
        variant: "destructive",
      });
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

// Add placeholder functions for missing dashboard hooks
export const useTopProducts = (startDate: string, endDate: string, limit: number = 5) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Placeholder - will be implemented later
  return { data, loading };
};

export const usePlatformPerformance = (startDate: string, endDate: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Placeholder - will be implemented later
  return { data, loading };
};
