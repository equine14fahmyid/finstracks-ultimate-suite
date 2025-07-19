
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ExpenseFormData, Expense } from '@/types';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:categories(nama_kategori),
          bank:banks(nama_bank, nama_pemilik)
        `)
        .order('tanggal', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('tanggal', startDate).lte('tanggal', endDate);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching expenses:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data pengeluaran",
          variant: "destructive",
        });
        return;
      }

      setExpenses(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan tidak terduga",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = async (expenseData: ExpenseFormData) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pengeluaran berhasil ditambahkan",
      });

      await fetchExpenses();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan pengeluaran",
        variant: "destructive",
      });
      return { error: true };
    }
  };

  const updateExpense = async (id: string, expenseData: ExpenseFormData) => {
    try {
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
      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui pengeluaran",
        variant: "destructive",
      });
      return { error: true };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
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
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus pengeluaran",
        variant: "destructive",
      });
      return { error: true };
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
