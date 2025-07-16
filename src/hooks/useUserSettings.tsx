import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface UserSettings {
  modal_awal: number; // <-- TAMBAHKAN BARIS INI
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  tax_number: string;
  logo_url: string;
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
  session_timeout: number;
  password_expiry: number;
  login_attempts: number;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (data) {
        setSettings(data as UserSettings);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return false;

    try {
      setLoading(true);

      // Ambil ID dari settings yang ada, karena upsert butuh user_id
      // dan kita juga perlu memastikan ada baris untuk diupdate
      const currentSettingsId = settings?.id; 

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          ...newSettings,
          user_id: user.id,
          id: currentSettingsId, // Pastikan ID disertakan untuk update
        });

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
        description: "Gagal menyimpan pengaturan",
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
