import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSettlements = () => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          *,
          store:stores (
            *,
            platform:platforms (*)
          ),
          bank:banks (*)
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
  };

  const createSettlement = async (settlementData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settlements')
        .insert(settlementData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pencairan berhasil dibuat",
      });

      await fetchSettlements();
      return { data, error: null };
    } catch (error: any) {
      console.error('Create settlement error:', error);
      toast({
        title: "Error",
        description: `Gagal membuat pencairan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateSettlement = async (id: string, settlementData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settlements')
        .update(settlementData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pencairan berhasil diperbarui",
      });

      await fetchSettlements();
      return { data, error: null };
    } catch (error: any) {
      console.error('Update settlement error:', error);
      toast({
        title: "Error",
        description: `Gagal memperbarui pencairan: ${error.message}`,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteSettlement = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('settlements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pencairan berhasil dihapus",
      });

      await fetchSettlements();
    } catch (error: any) {
      console.error('Delete settlement error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus pencairan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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