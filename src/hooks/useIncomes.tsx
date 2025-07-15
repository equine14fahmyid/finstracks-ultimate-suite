import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useIncomes = () => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      const { data, error } = await supabase
        .from('incomes')
        .insert(incomeData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pemasukan berhasil dibuat",
      });

      await fetchIncomes();
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
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pemasukan berhasil diperbarui",
      });

      await fetchIncomes();
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
        description: "Pemasukan berhasil dihapus",
      });

      await fetchIncomes();
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

  return {
    incomes,
    loading,
    fetchIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
  };
};