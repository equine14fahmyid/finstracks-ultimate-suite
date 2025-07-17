import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Building, User, Bell, Shield, Database, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings';
// --- [BARU] Import komponen yang kita perlukan untuk form baru ---
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 1. Perluas tipe data form untuk mencakup SEMUA kolom dari useSettings.tsx
type SettingsFormValues = {
  // Perusahaan
  company_name: string;
  modal_awal: number;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  tax_number: string;
  logo_url: string;
  // Pengguna (Preferensi)
  theme: 'light' | 'dark' | 'auto';
  language: 'id' | 'en';
  timezone: string;
  date_format: string;
  currency: string;
  // Notifikasi
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  low_stock_alerts: boolean;
  payment_reminders: boolean;
  daily_reports: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
  // Keamanan
  two_factor_auth: boolean;
  session_timeout: number;
  password_expiry: number;
  login_attempts: number;
};

const Settings = () => {
  const { settings, loading, updateSettings } = useUserSettings();
  const form = useForm<SettingsFormValues>();

  // 2. Lengkapi useEffect untuk mengisi SEMUA field form dari data settings
  useEffect(() => {
    if (settings) {
      form.reset({
        // Perusahaan
        company_name: settings.company_name || '',
        modal_awal: settings.modal_awal || 0,
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_website: settings.company_website || '',
        tax_number: settings.tax_number || '',
        logo_url: settings.logo_url || '',
        // Pengguna
        theme: settings.theme || 'auto',
        language: settings.language || 'id',
        timezone: settings.timezone || 'Asia/Jakarta',
        date_format: settings.date_format || 'dd/MM/yyyy',
        currency: settings.currency || 'IDR',
        // Notifikasi
        email_notifications: settings.email_notifications ?? true,
        push_notifications: settings.push_notifications ?? true,
        sms_notifications: settings.sms_notifications ?? false,
        low_stock_alerts: settings.low_stock_alerts ?? true,
        payment_reminders: settings.payment_reminders ?? true,
        daily_reports: settings.daily_reports ?? false,
        weekly_reports: settings.weekly_reports ?? true,
        monthly_reports: settings.monthly_reports ?? true,
        // Keamanan
        two_factor_auth: settings.two_factor_auth ?? false,
        session_timeout: settings.session_timeout || 30, // Default 30 menit
        password_expiry: settings.password_expiry || 90, // Default 90 hari
        login_attempts: settings.login_attempts || 5,   // Default 5 kali
      });
    }
  }, [settings, form]);

  const handleSettingsSubmit = async (data: SettingsFormValues) => {
    // Fungsi ini tidak perlu diubah, sudah bisa menangani semua data baru
    await updateSettings(data);
  };

  const handleBackup = () => {
    toast({ title: "Info", description: "Fitur ini akan segera tersedia." });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <Form {...form}>
        {/* PENTING: Bungkus semua Tabs dengan satu <form> */}
        <form onSubmit={form.handleSubmit(handleSettingsSubmit)} className="space-y-6">
          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="company" className="flex items-center gap-2"><Building className="h-4 w-4" />Perusahaan</TabsTrigger>
              <TabsTrigger value="user" className="flex items-center gap-2"><User className="h-4 w-4" />Pengguna</TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell className="h-4 w-4" />Notifikasi</TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2"><Shield className="h-4 w-4" />Keamanan</TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2"><Database className="h-4 w-4" />Sistem</TabsTrigger>
            </TabsList>

            {/* Konten Tab Perusahaan (Tidak ada perubahan signifikan) */}
            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Perusahaan</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <p>Memuat pengaturan...</p> : (
                    <div className="space-y-4">
                      {/* ... (kode form perusahaan yang sudah ada tidak saya tampilkan ulang agar ringkas) ... */}
                      {/* Letakkan kode form Perusahaan Anda yang sudah ada di sini */}
                      <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="company_name" render={({ field }) => (<FormItem><FormLabel>Nama Perusahaan *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="modal_awal" render={({ field }) => (<FormItem><FormLabel>Modal Awal</FormLabel><FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="tax_number" render={({ field }) => (<FormItem><FormLabel>NPWP</FormLabel><FormControl><Input placeholder="00.000.000.0-000.000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="company_address" render={({ field }) => (<FormItem><FormLabel>Alamat</FormLabel><FormControl><Textarea placeholder="Alamat lengkap perusahaan" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="grid grid-cols-3 gap-4">
                          <FormField control={form.control} name="company_phone" render={({ field }) => (<FormItem><FormLabel>No. Telepon</FormLabel><FormControl><Input placeholder="021-xxxxxxxx" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="company_email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="info@company.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="company_website" render={({ field }) => (<FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://company.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="logo_url" render={({ field }) => (<FormItem><FormLabel>URL Logo</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. [BARU] Konten Tab Pengguna */}
            <TabsContent value="user">
                <Card>
                    <CardHeader><CardTitle>Preferensi Pengguna</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="language" render={({ field }) => (
                            <FormItem><FormLabel>Bahasa</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih bahasa" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="id">Indonesia</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="timezone" render={({ field }) => (<FormItem><FormLabel>Zona Waktu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        {/* Tambahkan field lain seperti Tema, Format Tanggal, Mata Uang dengan pola yang sama */}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 4. [BARU] Konten Tab Notifikasi */}
            <TabsContent value="notifications">
                <Card>
                    <CardHeader><CardTitle>Pengaturan Notifikasi</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="email_notifications" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5"><FormLabel>Notifikasi Email</FormLabel><FormDescription>Terima notifikasi penting melalui email.</FormDescription></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="low_stock_alerts" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5"><FormLabel>Peringatan Stok Rendah</FormLabel><FormDescription>Dapatkan notifikasi jika stok produk menipis.</FormDescription></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        {/* Tambahkan Switch lain untuk notifikasi lainnya dengan pola yang sama */}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 5. [BARU] Konten Tab Keamanan */}
            <TabsContent value="security">
                <Card>
                    <CardHeader><CardTitle>Pengaturan Keamanan</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="two_factor_auth" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5"><FormLabel>Autentikasi Dua Faktor (2FA)</FormLabel><FormDescription>Tambahkan lapisan keamanan ekstra pada akun Anda.</FormDescription></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="session_timeout" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Batas Waktu Sesi (menit)</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                                <FormDescription>Logout otomatis setelah tidak ada aktivitas selama waktu yang ditentukan.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Konten Tab Sistem (Tetap sama) */}
            <TabsContent value="system">
              <Card>
                <CardHeader><CardTitle>Pengaturan Sistem</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Backup & Restore</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={handleBackup} disabled={loading} type="button"><Download className="mr-2 h-4 w-4" />Backup Data</Button>
                      <Button variant="outline" disabled={true} type="button"><Upload className="mr-2 h-4 w-4" />Restore Data</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Tombol Simpan ini sekarang akan menyimpan data dari TAB APAPUN yang aktif */}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Settings;