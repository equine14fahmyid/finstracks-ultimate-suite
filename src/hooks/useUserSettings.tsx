import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// Interface untuk mendefinisikan struktur data UserSettings
// Tidak ada perubahan di sini, sudah sesuai.
interface UserSettings {
  id: string;
  modal_awal: number | null;
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  tax_number: string | null;
  logo_url: string | null;
  theme: 'light' | 'dark' | 'auto';
  language: 'id' | 'en';
  timezone: string;
  date_format: string;
  currency: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  low_stock_alerts: boolean;
  payment_reminders: boolean;
  daily_reports: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
  two_factor_auth: boolean;
  session_timeout: number | null;
  password_expiry: number | null;
  login_attempts: number | null;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengambil data settings dari database
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Abaikan error jika tidak ada baris data ditemukan (untuk user baru)
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data);

    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast({ title: "Error", description: "Gagal memuat pengaturan.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // --- KODE YANG DIPERBAIKI ADA DI SINI ---
  // Fungsi ini sekarang bisa menangani UPDATE (jika data sudah ada) dan INSERT (jika data belum ada)
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    // 1. Validasi user tetap dibutuhkan
    if (!user) {
        toast({ title: "Error", description: "User tidak terautentikasi.", variant: "destructive" });
        return false;
    }
  
    try {
      setLoading(true);
      let error;
  
      // 2. Logika UPSERT: Jika ID settings ada, lakukan UPDATE. Jika tidak, lakukan INSERT.
      if (settings?.id) {
        // --- LOGIKA UPDATE ---
        // Memperbarui baris data yang sudah ada berdasarkan ID-nya.
        const { error: updateError } = await supabase
          .from('user_settings')
          .update(newSettings)
          .eq('id', settings.id); 
        error = updateError;
  
      } else {
        // --- LOGIKA INSERT ---
        // Membuat baris data baru, dan wajib menyertakan user_id untuk relasi.
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({ ...newSettings, user_id: user.id });
        error = insertError;
      }
  
      if (error) throw error;
  
      // 3. Ambil ulang data dari server untuk memastikan UI sinkron
      await fetchSettings();
      
      toast({
        title: "Berhasil",
        description: "Pengaturan berhasil disimpan",
      });
  
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan: " + (error as Error).message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(user) {
      fetchSettings();
    }
  }, [user, fetchSettings]);

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings,
  };
};
