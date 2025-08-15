
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type MovementType = 'in' | 'out' | 'adjustment';
export type ReferenceType = 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer' | 'manual';

interface CreateMovementParams {
  productVariantId: string;
  movementType: MovementType;
  quantity: number;
  referenceType?: ReferenceType;
  referenceId?: string;
  notes?: string;
}

export const useStockMovements = () => {
  const [loading, setLoading] = useState(false);

  const createStockMovement = async (params: CreateMovementParams) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert([{
          product_variant_id: params.productVariantId,
          movement_type: params.movementType,
          quantity: params.quantity,
          reference_type: params.referenceType || 'manual',
          reference_id: params.referenceId,
          notes: params.notes
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating stock movement:', error);
      toast({
        title: "Error",
        description: "Gagal mencatat pergerakan stok",
        variant: "destructive",
      });
      return { error: true, message: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const createBulkStockMovements = async (movements: CreateMovementParams[]) => {
    setLoading(true);
    try {
      const movementRecords = movements.map(movement => ({
        product_variant_id: movement.productVariantId,
        movement_type: movement.movementType,
        quantity: movement.quantity,
        reference_type: movement.referenceType || 'manual',
        reference_id: movement.referenceId,
        notes: movement.notes
      }));

      const { data, error } = await supabase
        .from('stock_movements')
        .insert(movementRecords)
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating bulk stock movements:', error);
      toast({
        title: "Error",
        description: "Gagal mencatat pergerakan stok massal",
        variant: "destructive",
      });
      return { error: true, message: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const getMovementHistory = async (productVariantId: string, limit?: number) => {
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product_variant:product_variants(
            id,
            warna,
            size,
            sku,
            product:products(nama_produk, satuan)
          )
        `)
        .eq('product_variant_id', productVariantId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching movement history:', error);
      return { error: true, message: (error as Error).message };
    }
  };

  const getMovementSummary = async (productVariantId: string, period: 'day' | 'week' | 'month' = 'month') => {
    try {
      const now = new Date();
      const periodStart = new Date();
      
      switch (period) {
        case 'day':
          periodStart.setDate(now.getDate() - 1);
          break;
        case 'week':
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          periodStart.setMonth(now.getMonth() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('stock_movements')
        .select('movement_type, quantity, created_at')
        .eq('product_variant_id', productVariantId)
        .gte('created_at', periodStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const summary = {
        totalIn: data?.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + m.quantity, 0) || 0,
        totalOut: data?.filter(m => m.movement_type === 'out').reduce((sum, m) => sum + m.quantity, 0) || 0,
        totalAdjustments: data?.filter(m => m.movement_type === 'adjustment').reduce((sum, m) => sum + Math.abs(m.quantity), 0) || 0,
        transactionCount: data?.length || 0,
        lastMovement: data?.[0] || null
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error('Error fetching movement summary:', error);
      return { error: true, message: (error as Error).message };
    }
  };

  return {
    loading,
    createStockMovement,
    createBulkStockMovements,
    getMovementHistory,
    getMovementSummary
  };
};
