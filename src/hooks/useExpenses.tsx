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
      console.log('🔄 Fetching expenses...');
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          tanggal,
          jumlah,
          keterangan,
          bank_id,
          category_id,
          created_at,
          updated_at,
          category:categories(
            id,
            nama_kategori,
            tipe_kategori
          ),
          bank:banks(
            id,
            nama_bank,
            nama_pemilik,
            no_rekening
          )
        `)
        .order('tanggal', { ascending: false });

      if (error) {
        console.error('❌ Fetch expenses error:', error);
        throw error;
      }

      console.log('✅ Expenses data fetched:', data);
      console.log(`📊 Total expenses: ${data?.length || 0}`);
      
      // Log first item for debugging
      if (data && data.length > 0) {
        console.log('🔍 First expense item:', JSON.stringify(data[0], null, 2));
      }
      
      // Process data to handle null banks properly
      const processedData = (data || []).map(expense => ({
        ...expense,
        bank: expense.bank || null // Explicitly handle null bank
      }));
      
      setExpenses(processedData);
    } catch (error: any) {
      console.error('❌ Fetch expenses error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pengeluaran: ${error.message}`,
        variant: "destructive",
      });
      setExpenses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData: any) => {
    try {
      setLoading(true);
      console.log('➕ Creating expense:', expenseData);
      
      const { data: { user } } = await supabase.auth.getUser();
      const dataWithUser = {
        ...expenseData,
        created_by: user?.id
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(dataWithUser)
        .select(`
          id,
          tanggal,
          jumlah,
          keterangan,
          bank_id,
          category_id,
          created_at,
          category:categories(
            id,
            nama_kategori,
            tipe_kategori
          ),
          bank:banks(
            id,
            nama_bank,
            nama_pemilik
          )
        `)
        .single();

      if (error) {
        console.error('❌ Create expense error:', error);
        throw error;
      }

      console.log('✅ Expense created:', data);

      toast({
        title: "Sukses",
        description: "Pengeluaran berhasil dibuat dan saldo bank terupdate otomatis",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Create expense error:', error);
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
      console.log('📝 Updating expense:', id, expenseData);
      
      const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', id)
        .select(`
          id,
          tanggal,
          jumlah,
          keterangan,
          bank_id,
          category_id,
          category:categories(
            id,
            nama_kategori,
            tipe_kategori
          ),
          bank:banks(
            id,
            nama_bank,
            nama_pemilik
          )
        `)
        .single();

      if (error) {
        console.error('❌ Update expense error:', error);
        throw error;
      }

      console.log('✅ Expense updated:', data);

      toast({
        title: "Sukses",
        description: "Pengeluaran berhasil diperbarui dan saldo bank terupdate otomatis",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Update expense error:', error);
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
      console.log('🗑️ Deleting expense:', id);
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Delete expense error:', error);
        throw error;
      }

      console.log('✅ Expense deleted');

      toast({
        title: "Sukses",
        description: "Pengeluaran berhasil dihapus dan saldo bank terupdate otomatis",
      });

    } catch (error: any) {
      console.error('❌ Delete expense error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus pengeluaran: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    console.log('🔌 Setting up expenses real-time subscription...');
    
    // Initial fetch
    fetchExpenses();

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new real-time channel
    const channel = supabase
      .channel('expenses-realtime-detailed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        (payload) => {
          console.log('📡 Expense realtime update:', payload);
          
          // Add delay to ensure database consistency
          setTimeout(() => {
            console.log('🔄 Refreshing expenses after real-time event...');
            fetchExpenses();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('📡 Expenses subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up expenses subscription...');
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