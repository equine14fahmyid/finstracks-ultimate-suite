
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PendingSale {
  id: string;
  tanggal: string;
  no_pesanan_platform: string;
  customer_name: string;
  total: number;
  store_id: string;
  store: {
    nama_toko: string;
    saldo_dashboard?: number;
    platform: {
      nama_platform: string;
    } | null;
  } | null;
}

export interface AdjustmentItem {
  type: 'denda' | 'selisih_ongkir' | 'pinalti';
  amount: number;
  notes: string;
}

export const useAdjustments = () => {
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingSales = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          tanggal,
          no_pesanan_platform,
          customer_name,
          total,
          store_id,
          store:stores(
            nama_toko,
            saldo_dashboard,
            platform:platforms(nama_platform)
          )
        `)
        .eq('status', 'delivered')
        .is('validated_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PendingSale[];
    } catch (error) {
      console.error('Error fetching pending sales:', error);
      toast({ 
        title: "Error", 
        description: "Gagal memuat penjualan pending", 
        variant: "destructive" 
      });
      return [];
    }
  }, []);

  const fetchAdjustments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sales_adjustments')
        .select(`
          *,
          sale:sales(
            no_pesanan_platform,
            customer_name,
            store:stores(
              nama_toko,
              platform:platforms(nama_platform)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching adjustments:', error);
      toast({ 
        title: "Error", 
        description: "Gagal memuat riwayat penyesuaian", 
        variant: "destructive" 
      });
      return [];
    }
  }, []);
  
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingData, adjustmentsData] = await Promise.all([
        fetchPendingSales(),
        fetchAdjustments(),
      ]);
      setPendingSales(pendingData);
      setAdjustments(adjustmentsData);
    } catch (error) {
      console.error("Failed to refresh adjustment data", error);
      toast({
        title: "Error",
        description: "Gagal memuat data penyesuaian",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [fetchPendingSales, fetchAdjustments]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const validateSale = async (saleId: string) => {
    try {
      const saleToValidate = pendingSales.find(s => s.id === saleId);
      if (!saleToValidate || !saleToValidate.store) {
        toast({ 
          title: "Error", 
          description: "Penjualan atau data toko tidak ditemukan", 
          variant: "destructive" 
        });
        return;
      }
      
      // Use database function for validation to ensure data consistency
      const { error } = await supabase.rpc('validate_sale_with_adjustments', {
        sale_id_param: saleId,
        adjustments: []
      });

      if (error) {
        console.error('Validation error:', error);
        toast({ 
          title: "Error", 
          description: `Gagal validasi penjualan: ${error.message}`, 
          variant: "destructive" 
        });
        return;
      }

      toast({ 
        title: "Sukses", 
        description: "Penjualan berhasil divalidasi dan saldo toko telah diperbarui." 
      });
      
      await refreshData();
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat validasi penjualan",
        variant: "destructive"
      });
    }
  };

  const createAdjustment = async (saleId: string, adjustmentItems: AdjustmentItem[]) => {
    try {
      if (!adjustmentItems || adjustmentItems.length === 0) {
        toast({
          title: "Error",
          description: "Tidak ada item penyesuaian yang dibuat",
          variant: "destructive"
        });
        return;
      }

      // Convert adjustment items to proper format for database function
      const adjustmentsJson = adjustmentItems.map(item => ({
        type: item.type,
        amount: item.amount,
        notes: item.notes
      }));

      const { error } = await supabase.rpc('validate_sale_with_adjustments', {
        sale_id_param: saleId,
        adjustments: adjustmentsJson
      });

      if (error) {
        console.error('Adjustment creation error:', error);
        toast({
          title: "Error",
          description: `Gagal membuat penyesuaian: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sukses",
        description: "Penyesuaian berhasil dibuat dan penjualan telah divalidasi"
      });

      await refreshData();
    } catch (error) {
      console.error('Adjustment creation error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat membuat penyesuaian",
        variant: "destructive"
      });
    }
  };

  return { 
    pendingSales, 
    adjustments, 
    loading, 
    validateSale, 
    createAdjustment, 
    refreshData
  };
};
