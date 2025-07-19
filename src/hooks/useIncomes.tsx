import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useIncomes = () => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fungsi fetchIncomes sekarang menerima startDate dan endDate
  const fetchIncomes = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('incomes')
        .select(`
          id, tanggal, jumlah, keterangan, bank_id, category_id, created_at, updated_at,
          category:categories(id, nama_kategori, tipe_kategori),
          bank:banks(id, nama_bank, nama_pemilik, no_rekening)
        `)
        .order('tanggal', { ascending: false });

      // Menambahkan filter tanggal jika ada
      if (startDate) {
        query = query.gte('tanggal', startDate);
      }
      if (endDate) {
        query = query.lte('tanggal', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setIncomes(data || []);
    } catch (error: any) {
      console.error('Fetch incomes error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pemasukan: ${error.message}`,
        variant: "destructive",
      });
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createIncome = async (incomeData: any) => {
    // ... (Fungsi ini tidak berubah)
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const dataWithUser = { ...incomeData, created_by: user?.id };
      const { data, error } = await supabase.from('incomes').insert(dataWithUser).select(`*, category:categories(*), bank:banks(*)`).single();
      if (error) throw error;
      toast({ title: "Sukses", description: "Pemasukan berhasil dibuat dan saldo bank terupdate otomatis" });
      return { data, error: null };
    } catch (error: any) {
      toast({ title: "Error", description: `Gagal membuat pemasukan: ${error.message}`, variant: "destructive" });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateIncome = async (id: string, incomeData: any) => {
    // ... (Fungsi ini tidak berubah)
    try {
      setLoading(true);
      const { data, error } = await supabase.from('incomes').update(incomeData).eq('id', id).select(`*, category:categories(*), bank:banks(*)`).single();
      if (error) throw error;
      toast({ title: "Sukses", description: "Pemasukan berhasil diperbarui dan saldo bank terupdate otomatis" });
      return { data, error: null };
    } catch (error: any) {
      toast({ title: "Error", description: `Gagal memperbarui pemasukan: ${error.message}`, variant: "destructive" });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteIncome = async (id: string) => {
    // ... (Fungsi ini tidak berubah)
    try {
      setLoading(true);
      const { error } = await supabase.from('incomes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sukses", description: "Pemasukan berhasil dihapus dan saldo bank terupdate otomatis" });
    } catch (error: any) {
      toast({ title: "Error", description: `Gagal menghapus pemasukan: ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    // Initial fetch without date range to setup listener correctly
    fetchIncomes();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('incomes-realtime-detailed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomes' }, 
        (payload) => {
          console.log('📡 Income realtime update:', payload);
          setTimeout(() => {
            // Re-fetch with current date range from UI (this requires passing date range state or refetching from UI)
            // For simplicity, we just trigger a general refetch. The component will pass the dates.
            // This can be improved with a state management library.
            document.dispatchEvent(new CustomEvent('refetch-incomes'));
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('📡 Incomes subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchIncomes]);

  return { incomes, loading, fetchIncomes, createIncome, updateIncome, deleteIncome };
};
