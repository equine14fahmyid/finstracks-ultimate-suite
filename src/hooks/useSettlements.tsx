import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Interface untuk data yang dikirim ke form
export interface SettlementData {
  tanggal: string;
  store_id: string;
  jumlah_dicairkan: number;
  bank_id: string;
  biaya_admin: number;
  keterangan: string;
}

export const useSettlements = () => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSettlements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select(`*, stores!inner(nama_toko, saldo_dashboard), banks!inner(nama_bank)`)
        .order('tanggal', { ascending: false });
      if (error) throw error;
      setSettlements(data || []);
    } catch (error: any) {
      console.error('Fetch settlements error:', error);
    }
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('stores').select('id, nama_toko, saldo_dashboard').eq('is_active', true);
      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      console.error('Fetch stores error:', error);
    }
  }, []);

  const fetchBanks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('banks').select('id, nama_bank').eq('is_active', true);
      if (error) throw error;
      setBanks(data || []);
    } catch (error: any) {
      console.error('Fetch banks error:', error);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSettlements(), fetchStores(), fetchBanks()]);
    setLoading(false);
  }, [fetchSettlements, fetchStores, fetchBanks]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const createSettlement = async (settlementData: SettlementData) => {
    setLoading(true);
    try {
      // Panggil Edge Function dengan format body yang sudah diperbaiki
      const { data, error } = await supabase.functions.invoke('create_settlement_and_update_balances', {
        body: settlementData, // Mengirim data langsung, tanpa bungkusan tambahan
      });

      if (error) {
        const errorMessage = (error as any).context?.msg || error.message;
        throw new Error(errorMessage);
      }

      toast({
        title: "Sukses!",
        description: "Pencairan dana berhasil diproses.",
      });

      await refreshAll();
      return { data, error: null };

    } catch (error: any) {
      console.error('Create settlement error:', error);
      toast({
        title: "Error",
        description: `Gagal memproses pencairan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteSettlement = async (id: string) => {
    toast({
      title: "Fungsi Belum Tersedia",
      description: "Menghapus pencairan perlu penanganan khusus.",
      variant: "destructive",
    });
  };

  return {
    settlements,
    stores,
    banks,
    loading,
    createSettlement,
    deleteSettlement,
  };
};
