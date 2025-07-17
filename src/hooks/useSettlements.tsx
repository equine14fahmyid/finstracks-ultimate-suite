import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
      // Memanggil Edge Function dengan format body yang benar
      const { data, error } = await supabase.functions.invoke('create_settlement_and_update_balances', {
        body: settlementData, // Mengirim data langsung, tidak dibungkus objek lain
      });

      if (error) {
        const errorMessage = (error as any).context?.msg || error.message;
        throw new Error(errorMessage);
      }

      toast({
        title: "Sukses",
        description: "Pencairan dana berhasil diproses.",
      });

      await fetchSettlements();
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

  const updateSettlement = async (id: string, settlementData: any) => {
    // Logika untuk update bisa ditambahkan di sini jika perlu
  };

  const deleteSettlement = async (id: string) => {
    // Logika untuk delete yang aman bisa ditambahkan di sini jika perlu
  };

  return {
    settlements,
    loading,
    fetchSettlements,
    createSettlement,
    updateSettlement,
    deleteSettlement,
  };
};
