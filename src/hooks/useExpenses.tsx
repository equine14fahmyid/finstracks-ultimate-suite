import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      setExpenses(data || []);
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
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pengeluaran berhasil dibuat",
      });

      await fetchExpenses();
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
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pengeluaran berhasil diperbarui",
      });

      await fetchExpenses();
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
        description: "Pengeluaran berhasil dihapus",
      });

      await fetchExpenses();
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

  return {
    expenses,
    loading,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};