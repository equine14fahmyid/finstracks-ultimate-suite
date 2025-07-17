import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories (*),
          bank:banks (*)
        `)
        .order('tanggal', { ascending: false });

      if (error) throw error;
      
      const processedData = (data || []).map(expense => ({
        ...expense,
        bank: expense.bank || null
      }));
      
      setExpenses(processedData);
    } catch (error: any) {
      console.error('Fetch expenses error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pengeluaran: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData: any) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const dataWithUser = {
        ...expenseData,
        created_by: user?.id
      };

      const { data, error } = await supabase
        .from('expenses')
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
        description: "Pengeluaran berhasil dibuat dan saldo bank terupdate otomatis",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Create expense error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat pengeluaran: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id: string, expenseData: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
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
        description: "Pengeluaran berhasil diperbarui dan saldo bank terupdate otomatis",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Update expense error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui pengeluaran: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pengeluaran berhasil dihapus dan saldo bank terupdate otomatis",
      });

    } catch (error: any) {
      console.error('Delete expense error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus pengeluaran: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('expenses-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        (payload) => {
          console.log('Expense realtime update:', payload);
          fetchExpenses();
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
    expenses,
    loading,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};