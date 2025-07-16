import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// --- PERBAIKAN 1: Menyesuaikan tipe data dengan skema database ---
interface UserSettings {
  id: string; // Wajib ada untuk proses update
  modal_awal: number | null; // Bisa jadi null jika belum di-set
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

  const fetchSettings = async () => {
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

      if (error && error.code !== 'PGRST116') { // Abaikan error "no rows found"
        throw error;
      }

      if (data) {
        // --- PERBAIKAN 2: Type assertion yang lebih aman ---
        setSettings(data as UserSettings);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast({ title: "Error", description: "Gagal memuat pengaturan.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || !settings?.id) {
        toast({ title: "Error", description: "User atau pengaturan tidak ditemukan.", variant: "destructive" });
        return false;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_settings')
        .update(newSettings)
        .eq('id', settings.id); // Update berdasarkan ID baris

      if (error) throw error;

      // Refresh data dari server untuk memastikan konsistensi
      await fetchSettings();
      
      toast({
        title: "Berhasil",
        description: "Pengaturan berhasil disimpan",
      });

      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
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
  }, [user]);

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings,
  };
};
