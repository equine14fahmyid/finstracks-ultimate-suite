import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ID Kategori "Pencairan Saldo Toko" yang sudah kita buat sebelumnya
const INCOME_CATEGORY_ID_FOR_SETTLEMENT = '47877c5f-fa72-4ed4-9354-f56d52b8880e';

export const useSettlements = () => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          *,
          store:stores(*),
          bank:banks(*)
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

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const createSettlement = async (settlementData: any) => {
    setLoading(true);
    try {
      // 1. Mengambil ID pengguna yang sedang login
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sesi pengguna tidak ditemukan. Silakan login kembali.");
      }

      // 2. Menyiapkan semua parameter untuk fungsi database
      const params = {
        p_store_id: settlementData.store_id,
        p_bank_id: settlementData.bank_id,
        p_amount: settlementData.jumlah_dicairkan,
        p_admin_fee: settlementData.biaya_admin || 0,
        p_notes: settlementData.keterangan,
        p_income_category_id: INCOME_CATEGORY_ID_FOR_SETTLEMENT,
        p_settlement_date: settlementData.tanggal,
        p_user_id: user.id
      };

      // 3. Memanggil fungsi database (RPC Call) dengan 'as any' untuk melewati pemeriksaan tipe
      const { error } = await supabase.rpc('process_settlement' as any, params);

      if (error) {
        // Menangani error dari database dengan lebih baik
        throw new Error(error.message);
      }

      toast({
        title: "Sukses!",
        description: "Pencairan dana berhasil diproses.",
      });

      await fetchSettlements();
      return { data: {}, error: null };

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
    // Implementasi delete yang aman perlu dibuat di sini jika diperlukan
    // Misalnya, membuat fungsi RPC lain untuk mengembalikan saldo
    toast({
        title: "Fungsi Belum Tersedia",
        description: "Menghapus pencairan perlu penanganan khusus untuk mengembalikan saldo.",
        variant: "destructive",
    });
  };

  return {
    settlements,
    loading,
    fetchSettlements,
    createSettlement,
    deleteSettlement,
  };
};
