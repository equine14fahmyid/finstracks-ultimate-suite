import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Interface untuk Settlement
export interface Settlement {
  id: string;
  tanggal: string;
  store_id: string;
  jumlah_dicairkan: number;
  bank_id: string;
  biaya_admin: number;
  keterangan: string;
  created_at: string;
  stores: {
    nama_toko: string;
    saldo_dashboard: number;
  };
  banks: {
    nama_bank: string;
  };
}

// Interface untuk Store
export interface Store {
  id: string;
  nama_toko: string;
  saldo_dashboard: number;
}

// Interface untuk Bank
export interface Bank {
  id: string;
  nama_bank: string;
}

// Interface untuk Settlement Data
export interface SettlementData {
  tanggal: string;
  store_id: string;
  jumlah_dicairkan: number;
  bank_id: string;
  biaya_admin: number;
  keterangan: string;
}

export const useSettlements = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch settlements dari database
  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          *,
          stores!inner(nama_toko, saldo_dashboard),
          banks!inner(nama_bank)
        `)
        .order('tanggal', { ascending: false });
      
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
  }, []);

  // Fetch stores dari database
  const fetchStores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, nama_toko, saldo_dashboard')
        .eq('is_active', true)
        .order('nama_toko');
      
      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      console.error('Fetch stores error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data toko: ${error.message}`,
        variant: "destructive",
      });
    }
  }, []);

  // Fetch banks dari database
  const fetchBanks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('id, nama_bank')
        .eq('is_active', true)
        .order('nama_bank');
      
      if (error) throw error;
      setBanks(data || []);
    } catch (error: any) {
      console.error('Fetch banks error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data bank: ${error.message}`,
        variant: "destructive",
      });
    }
  }, []);

  // Load semua data saat component mount
  useEffect(() => {
    fetchSettlements();
    fetchStores();
    fetchBanks();
  }, [fetchSettlements, fetchStores, fetchBanks]);

  // Fungsi untuk membuat pencairan dana
  const createSettlement = async (settlementData: SettlementData) => {
    setLoading(true);
    try {
      // 1. Validasi saldo toko
      const selectedStore = stores.find(s => s.id === settlementData.store_id);
      if (!selectedStore) {
        throw new Error("Toko tidak ditemukan");
      }
      
      if (settlementData.jumlah_dicairkan > selectedStore.saldo_dashboard) {
        throw new Error("Jumlah pencairan melebihi saldo toko yang tersedia");
      }

      // 2. Panggil Edge Function untuk memproses pencairan
      const { data, error } = await supabase.functions.invoke('create_settlement_and_update_balances', {
        body: {
          settlementData: {
            tanggal: settlementData.tanggal,
            store_id: settlementData.store_id,
            bank_id: settlementData.bank_id,
            jumlah_dicairkan: settlementData.jumlah_dicairkan,
            biaya_admin: settlementData.biaya_admin || 0,
            keterangan: settlementData.keterangan || ''
          }
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Gagal memproses pencairan dana');
      }

      // 3. Berhasil - refresh data dan tampilkan notifikasi
      toast({
        title: "Sukses!",
        description: "Pencairan dana berhasil diproses. Saldo toko dan bank telah diperbarui.",
      });

      // Refresh semua data
      await Promise.all([
        fetchSettlements(),
        fetchStores(),
        fetchBanks()
      ]);

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

  // Fungsi untuk menghapus pencairan (jika diperlukan)
  const deleteSettlement = async (id: string) => {
    toast({
      title: "Fungsi Belum Tersedia",
      description: "Menghapus pencairan perlu penanganan khusus untuk mengembalikan saldo.",
      variant: "destructive",
    });
  };

  return {
    settlements,
    stores,
    banks,
    loading,
    fetchSettlements,
    fetchStores,
    fetchBanks,
    createSettlement,
    deleteSettlement,
  };
};