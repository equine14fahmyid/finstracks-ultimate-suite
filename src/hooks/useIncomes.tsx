import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useIncomes = () => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('incomes')
        .select(`
          *,
          category:categories (*),
          bank:banks (*)
        `)
        .order('tanggal', { ascending: false });

      if (error) throw error;
      setIncomes(data || []);
    } catch (error: any) {
      console.error('Fetch incomes error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pemasukan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createIncome = async (incomeData: any) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const dataWithUser = {
        ...incomeData,
        created_by: user?.id
      };

      const { data, error } = await supabase
        .from('incomes')
        .insert(dataWithUser)
        .select(`
          *,
          category:categories (*),
          bank:banks (*)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pemasukan berhasil dibuat dan saldo bank terupdate otomatis",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Create income error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat pemasukan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateIncome = async (id: string, incomeData: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('incomes')
        .update(incomeData)
        .eq('id', id)
        .select(`
          *,
          category:categories (*),
          bank:banks (*)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pemasukan berhasil diperbarui dan saldo bank terupdate otomatis",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Update income error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui pemasukan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pemasukan berhasil dihapus dan saldo bank terupdate otomatis",
      });

    } catch (error: any) {
      console.error('Delete income error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus pemasukan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('incomes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incomes'
        },
        (payload) => {
          console.log('Income realtime update:', payload);
          fetchIncomes();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    incomes,
    loading,
    fetchIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
  };
};