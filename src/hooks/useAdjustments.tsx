import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdjustmentItem {
  type: 'denda' | 'selisih_ongkir' | 'pinalti';
  amount: number;
  notes: string;
}

export interface PendingSale {
  id: string;
  tanggal: string;
  no_pesanan_platform: string;
  customer_name: string;
  total: number;
  store: {
    nama_toko: string;
    platform: {
      nama_platform: string;
    } | null;
  } | null;
  validated_at: string | null;
  needs_adjustment: boolean | null;
  adjustment_notes: string | null;
}

export interface SalesAdjustment {
  id: string;
  sale_id: string;
  adjustment_type: 'denda' | 'selisih_ongkir' | 'pinalti';
  amount: number;
  notes: string | null;
  created_at: string;
  sale: {
    id: string;
    tanggal: string;
    no_pesanan_platform: string;
    customer_name: string;
    total: number;
    store: {
      nama_toko: string;
      platform: {
        nama_platform: string;
      } | null;
    } | null;
  } | null;
}

export const useAdjustments = () => {
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [adjustments, setAdjustments] = useState<SalesAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          tanggal,
          no_pesanan_platform,
          customer_name,
          total,
          validated_at,
          needs_adjustment,
          adjustment_notes,
          store:stores (
            nama_toko,
            platform:platforms (nama_platform)
          )
        `)
        .eq('status', 'delivered')
        .is('validated_at', null)
        .order('tanggal', { ascending: false });

      if (error) throw error;
      setPendingSales(data as PendingSale[] || []);
    } catch (error) {
      console.error('Error fetching pending sales:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penjualan pending",
        variant: "destructive",
      });
    }
  };

  const fetchAdjustments = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_adjustments')
        .select(`
          id,
          sale_id,
          adjustment_type,
          amount,
          notes,
          created_at,
          sale:sales (
            id,
            tanggal,
            no_pesanan_platform,
            customer_name,
            total,
            store:stores (
              nama_toko,
              platform:platforms (nama_platform)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdjustments(data as SalesAdjustment[] || []);
    } catch (error) {
      console.error('Error fetching adjustments:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penyesuaian",
        variant: "destructive",
      });
    }
  };

  const validateSale = async (saleId: string) => {
    try {
      const { error } = await supabase.rpc('validate_sale_with_adjustments', {
        sale_id_param: saleId,
        adjustments: []
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Penjualan berhasil divalidasi",
      });

      await fetchPendingSales();
    } catch (error) {
      console.error('Error validating sale:', error);
      toast({
        title: "Error",
        description: "Gagal memvalidasi penjualan",
        variant: "destructive",
      });
    }
  };

  const createAdjustment = async (saleId: string, adjustmentItems: AdjustmentItem[]) => {
    try {
      const adjustments = adjustmentItems.map(item => ({
        type: item.type,
        amount: item.amount,
        notes: item.notes
      }));

      const { error } = await supabase.rpc('validate_sale_with_adjustments', {
        sale_id_param: saleId,
        adjustments: adjustments
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Penyesuaian berhasil dibuat",
      });

      await Promise.all([fetchPendingSales(), fetchAdjustments()]);
    } catch (error) {
      console.error('Error creating adjustment:', error);
      toast({
        title: "Error",
        description: "Gagal membuat penyesuaian",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPendingSales(), fetchAdjustments()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    pendingSales,
    adjustments,
    loading,
    validateSale,
    createAdjustment,
    refetch: () => Promise.all([fetchPendingSales(), fetchAdjustments()]),
  };
};