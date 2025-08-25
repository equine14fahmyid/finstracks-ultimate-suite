
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

// Comprehensive Zod schema for all settings
const settingsSchema = z.object({
  // Company settings
  company_name: z.string().min(1, 'Nama perusahaan wajib diisi'),
  modal_awal: z.number().min(0, 'Modal awal tidak boleh negatif'),
  company_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  company_website: z.string().url('Format URL tidak valid').optional().or(z.literal('')),
  tax_number: z.string().optional(),
  logo_url: z.string().url('Format URL tidak valid').optional().or(z.literal('')),
  
  // User preferences
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['id', 'en']),
  timezone: z.string(),
  date_format: z.string(),
  currency: z.string(),
  
  // Notification settings
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  low_stock_alerts: z.boolean(),
  payment_reminders: z.boolean(),
  daily_reports: z.boolean(),
  weekly_reports: z.boolean(),
  monthly_reports: z.boolean(),
  
  // Security settings
  two_factor_auth: z.boolean(),
  session_timeout: z.number().min(5, 'Minimal 5 menit').max(480, 'Maksimal 8 jam'),
  password_expiry: z.number().min(30, 'Minimal 30 hari').max(365, 'Maksimal 365 hari'),
  login_attempts: z.number().min(3, 'Minimal 3 percobaan').max(10, 'Maksimal 10 percobaan'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  category: 'company' | 'user' | 'notifications' | 'security';
}

export const SettingsForm = ({ category }: SettingsFormProps) => {
  const { settings, loading, updateSettings } = useUserSettings();
  const { theme, setTheme } = useTheme();
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: '',
      modal_awal: 0,
      company_address: '',
      company_phone: '',
      company_email: '',
      company_website: '',
      tax_number: '',
      logo_url: '',
      theme: 'system',
      language: 'id',
      timezone: 'Asia/Jakarta',
      date_format: 'dd/MM/yyyy',
      currency: 'IDR',
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      low_stock_alerts: true,
      payment_reminders: true,
      daily_reports: false,
      weekly_reports: true,
      monthly_reports: true,
      two_factor_auth: false,
      session_timeout: 30,
      password_expiry: 90,
      login_attempts: 5,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name || 'EQUINE Fashion',
        modal_awal: settings.modal_awal || 0,
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_website: settings.company_website || '',
        tax_number: settings.tax_number || '',
        logo_url: settings.logo_url || '',
        theme: (settings.theme as 'light' | 'dark' | 'system') || 'system',
        language: (settings.language as 'id' | 'en') || 'id',
        timezone: settings.timezone || 'Asia/Jakarta',
        date_format: settings.date_format || 'dd/MM/yyyy',
        currency: settings.currency || 'IDR',
        email_notifications: settings.email_notifications ?? true,
        push_notifications: settings.push_notifications ?? true,
        sms_notifications: settings.sms_notifications ?? false,
        low_stock_alerts: settings.low_stock_alerts ?? true,
        payment_reminders: settings.payment_reminders ?? true,
        daily_reports: settings.daily_reports ?? false,
        weekly_reports: settings.weekly_reports ?? true,
        monthly_reports: settings.monthly_reports ?? true,
        two_factor_auth: settings.two_factor_auth ?? false,
        session_timeout: settings.session_timeout || 30,
        password_expiry: settings.password_expiry || 90,
        login_attempts: settings.login_attempts || 5,
      });
    }
  }, [settings, form]);

  const handleSubmit = async (data: SettingsFormValues) => {
    try {
      await updateSettings(data);
      
      // Apply theme change immediately
      if (data.theme !== theme) {
        setTheme(data.theme);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (loading && !settings) {
    return <div className="p-4">Memuat pengaturan...</div>;
  }

  const renderCompanySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Perusahaan *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="modal_awal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modal Awal</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="tax_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>NPWP</FormLabel>
            <FormControl>
              <Input placeholder="00.000.000.0-000.000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="company_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alamat</FormLabel>
            <FormControl>
              <Textarea placeholder="Alamat lengkap perusahaan" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="company_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>No. Telepon</FormLabel>
              <FormControl>
                <Input placeholder="021-xxxxxxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="info@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company_website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="logo_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL Logo</FormLabel>
            <FormControl>
              <Input placeholder="https://..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="theme"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tema Aplikasi</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tema" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="light">Terang</SelectItem>
                <SelectItem value="dark">Gelap</SelectItem>
                <SelectItem value="system">Ikuti Sistem</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>Pilih tema tampilan aplikasi</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="language"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bahasa</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bahasa" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zona Waktu</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="date_format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Format Tanggal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="currency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mata Uang</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="email_notifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Notifikasi Email</FormLabel>
                <FormDescription>Terima notifikasi penting melalui email</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="push_notifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Push Notifications</FormLabel>
                <FormDescription>Terima notifikasi push di browser</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="sms_notifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>SMS Notifications</FormLabel>
                <FormDescription>Terima notifikasi melalui SMS</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="low_stock_alerts"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Peringatan Stok Rendah</FormLabel>
                <FormDescription>Dapatkan notifikasi jika stok produk menipis</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="payment_reminders"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Pengingat Pembayaran</FormLabel>
                <FormDescription>Dapatkan pengingat untuk pembayaran yang belum lunas</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium">Laporan Otomatis</h4>
        
        <FormField
          control={form.control}
          name="daily_reports"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Laporan Harian</FormLabel>
                <FormDescription>Terima laporan harian via email</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="weekly_reports"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Laporan Mingguan</FormLabel>
                <FormDescription>Terima laporan mingguan via email</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="monthly_reports"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Laporan Bulanan</FormLabel>
                <FormDescription>Terima laporan bulanan via email</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="two_factor_auth"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Autentikasi Dua Faktor (2FA)</FormLabel>
              <FormDescription>Tambahkan lapisan keamanan ekstra pada akun Anda</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="session_timeout"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Batas Waktu Sesi (menit)</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            </FormControl>
            <FormDescription>Logout otomatis setelah tidak ada aktivitas selama waktu yang ditentukan</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="password_expiry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Masa Berlaku Password (hari)</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            </FormControl>
            <FormDescription>Password akan kadaluarsa setelah periode ini</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="login_attempts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maksimal Percobaan Login</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            </FormControl>
            <FormDescription>Akun akan dikunci setelah melebihi batas ini</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderContent = () => {
    switch (category) {
      case 'company':
        return renderCompanySettings();
      case 'user':
        return renderUserSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {renderContent()}
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
