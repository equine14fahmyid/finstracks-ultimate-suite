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
        .select('*')
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

  const createProduct = async (productData: any) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;

      await fetchProducts();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create product error:', error);
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
      return { data, error: null };
    } catch (error: any) {
      console.error('Update product error:', error);
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
    } catch (error: any) {
      console.error('Delete product error:', error);
      throw error;
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
          product:products!inner(
            id,
            nama_produk,
            harga_beli,
            harga_jual_default,
            satuan
          )
        `)
        .eq('is_active', true)
        .eq('product.is_active', true)
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
    } catch (error: any) {
      console.error('Adjust stock error:', error);
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
      return { data, error: null };
    } catch (error: any) {
      console.error('Create variant error:', error);
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

      await fetchStock();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update variant error:', error);
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

      await fetchStock();
    } catch (error: any) {
      console.error('Delete variant error:', error);
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
