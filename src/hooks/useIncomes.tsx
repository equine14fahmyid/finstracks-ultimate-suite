
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface IncomeFormData {
  tanggal: string;
  category_id: string;
  jumlah: number;
  bank_id: string | null;
  keterangan: string;
}

export interface Income {
  id: string;
  tanggal: string;
  jumlah: number;
  keterangan?: string;
  category?: {
    nama_kategori: string;
  };
  bank?: {
    nama_bank: string;
    nama_pemilik: string;
  };
  category_id?: string;
  bank_id?: string;
}

export const useIncomes = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIncomes = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('incomes')
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
        console.error('Error fetching incomes:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data pemasukan",
          variant: "destructive",
        });
        return;
      }

      setIncomes(data || []);
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

  const createIncome = async (incomeData: IncomeFormData) => {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .insert([incomeData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pemasukan berhasil ditambahkan",
      });

      await fetchIncomes();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating income:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan pemasukan",
        variant: "destructive",
      });
      return { error: true };
    }
  };

  const updateIncome = async (id: string, incomeData: IncomeFormData) => {
    try {
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
      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating income:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui pemasukan",
        variant: "destructive",
      });
      return { error: true };
    }
  };

  const deleteIncome = async (id: string) => {
    try {
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
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting income:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus pemasukan",
        variant: "destructive",
      });
      return { error: true };
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
