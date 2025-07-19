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
      console.log('🔄 Fetching incomes...');
      
      const { data, error } = await supabase
        .from('incomes')
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
        console.error('❌ Fetch incomes error:', error);
        throw error;
      }

      console.log('✅ Incomes data fetched:', data);
      console.log(`📊 Total incomes: ${data?.length || 0}`);
      
      // Log first item for debugging
      if (data && data.length > 0) {
        console.log('🔍 First income item:', JSON.stringify(data[0], null, 2));
      }
      
      setIncomes(data || []);
    } catch (error: any) {
      console.error('❌ Fetch incomes error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pemasukan: ${error.message}`,
        variant: "destructive",
      });
      setIncomes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const createIncome = async (incomeData: any) => {
    try {
      setLoading(true);
      console.log('➕ Creating income:', incomeData);
      
      const { data: { user } } = await supabase.auth.getUser();
      const dataWithUser = {
        ...incomeData,
        created_by: user?.id
      };

      const { data, error } = await supabase
        .from('incomes')
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
        console.error('❌ Create income error:', error);
        throw error;
      }

      console.log('✅ Income created:', data);
      
      toast({
        title: "Sukses",
        description: "Pemasukan berhasil dibuat dan saldo bank terupdate otomatis",
      });

      // Don't call fetchIncomes here, let real-time handle it
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Create income error:', error);
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
      console.log('📝 Updating income:', id, incomeData);
      
      const { data, error } = await supabase
        .from('incomes')
        .update(incomeData)
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
        console.error('❌ Update income error:', error);
        throw error;
      }

      console.log('✅ Income updated:', data);

      toast({
        title: "Sukses",
        description: "Pemasukan berhasil diperbarui dan saldo bank terupdate otomatis",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Update income error:', error);
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
      console.log('🗑️ Deleting income:', id);
      
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Delete income error:', error);
        throw error;
      }

      console.log('✅ Income deleted');

      toast({
        title: "Sukses",
        description: "Pemasukan berhasil dihapus dan saldo bank terupdate otomatis",
      });

    } catch (error: any) {
      console.error('❌ Delete income error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus pemasukan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    console.log('🔌 Setting up incomes real-time subscription...');
    
    // Initial fetch
    fetchIncomes();

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new real-time channel
    const channel = supabase
      .channel('incomes-realtime-detailed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incomes'
        },
        (payload) => {
          console.log('📡 Income realtime update:', payload);
          
          // Add delay to ensure database consistency
          setTimeout(() => {
            console.log('🔄 Refreshing incomes after real-time event...');
            fetchIncomes();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('📡 Incomes subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up incomes subscription...');
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