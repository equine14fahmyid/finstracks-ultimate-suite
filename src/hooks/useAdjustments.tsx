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
    platform: {
      nama_platform: string;
    } | null;
  } | null;
}

export interface AdjustmentItem {
  // FIX 1: Mengganti nama properti agar cocok dengan form
  type: 'denda' | 'selisih_ongkir' | 'pinalti';
  amount: number;
  notes: string;
}

export const useAdjustments = () => {
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingSales = useCallback(async () => {
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
          platform:platforms(nama_platform)
        )
      `)
      .eq('status', 'delivered')
      .is('validated_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending sales:', error);
      toast({ title: "Error", description: "Gagal memuat penjualan pending", variant: "destructive" });
      return [];
    }
    return data as PendingSale[];
  }, []);

  const fetchAdjustments = useCallback(async () => {
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

    if (error) {
      console.error('Error fetching adjustments:', error);
      toast({ title: "Error", description: "Gagal memuat riwayat penyesuaian", variant: "destructive" });
      return [];
    }
    return data;
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
    } finally {
      setLoading(false);
    }
  }, [fetchPendingSales, fetchAdjustments]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const validateSale = async (saleId: string) => {
    const saleToValidate = pendingSales.find(s => s.id === saleId);
    if (!saleToValidate) {
      toast({ title: "Error", description: "Penjualan tidak ditemukan", variant: "destructive" });
      return;
    }

    // FIX 2: Menambahkan 'as any' untuk melewati pemeriksaan tipe yang usang
    const { error: storeUpdateError } = await supabase.rpc('update_store_balance' as any, {
        store_id_param: saleToValidate.store_id,
        amount_param: saleToValidate.total
    });

    if (storeUpdateError) {
      toast({ title: "Error", description: `Gagal update saldo toko: ${storeUpdateError.message}`, variant: "destructive" });
      return;
    }

    const { error: saleUpdateError } = await supabase
      .from('sales')
      .update({ validated_at: new Date().toISOString() })
      .eq('id', saleId);

    if (saleUpdateError) {
      toast({ title: "Error", description: `Gagal validasi penjualan: ${saleUpdateError.message}`, variant: "destructive" });
      return;
    }

    toast({ title: "Sukses", description: "Penjualan berhasil divalidasi. Saldo toko telah diperbarui." });
    await refreshData();
  };

  const createAdjustment = async (saleId: string, adjustmentItems: AdjustmentItem[]) => {
      // Logika untuk membuat penyesuaian bisa ditambahkan di sini nanti
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
