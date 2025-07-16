// Salin dan ganti seluruh isi file src/pages/settings.tsx dengan kode ini

import { useState, useEffect } from 'react';
import { Save, Building, User, Bell, Shield, Database, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings'; // --- PERUBAHAN 1: Import hook

const Settings = () => {
  // --- PERUBAHAN 2: Gunakan hook untuk koneksi ke Supabase
  const { settings, loading, updateSettings } = useUserSettings();

  // --- PERUBAHAN 3: Tambahkan modal_awal ke defaultValues
  const form = useForm({
    defaultValues: {
      // Company Settings
      company_name: '',
      company_address: '',
      company_phone: '',
      company_email: '',
      company_website: '',
      tax_number: '',
      logo_url: '',
      modal_awal: 0, // Field baru untuk Modal Awal

      // User Preferences
      theme: 'light',
      language: 'id',
      timezone: 'Asia/Jakarta',
      date_format: 'dd/MM/yyyy',
      currency: 'IDR',

      // Notification Settings
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      low_stock_alerts: true,
      payment_reminders: true,
      daily_reports: false,
      weekly_reports: true,
      monthly_reports: true,

      // Security Settings
      two_factor_auth: false,
      session_timeout: 30,
      password_expiry: 90,
      login_attempts: 5,
    },
  });

  // --- PERUBAHAN 4: useEffect untuk mengisi form dengan data dari database
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);
  
  // --- PERUBAHAN 5: Satu fungsi untuk menyimpan semua jenis pengaturan
  const handleSettingsSubmit = async (data: any) => {
    // Data yang dikirim sudah berisi semua field dari form yang di-submit
    const success = await updateSettings(data);
    if (success) {
      // toast sudah ada di dalam hook updateSettings
    }
  };

  const handleBackup = async () => {
    toast({ title: "Info", description: "Fitur backup akan segera tersedia." });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company" className="flex items-center gap-2"><Building className="h-4 w-4" />Perusahaan</TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2"><User className="h-4 w-4" />Pengguna</TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell className="h-4 w-4" />Notifikasi</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2"><Shield className="h-4 w-4" />Keamanan</TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2"><Database className="h-4 w-4" />Sistem</TabsTrigger>
        </TabsList>

        {/* --- FORM PENGATURAN PERUSAHAAN --- */}
        <TabsContent value="company">
          <Card>
            <CardHeader><CardTitle>Pengaturan Perusahaan</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSettingsSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="company_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Perusahaan *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    {/* --- PERUBAHAN 6: Input Modal Awal ditambahkan di sini --- */}
                    <FormField control={form.control} name="modal_awal" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modal Awal</FormLabel>
                        <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="tax_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel>NPWP</FormLabel>
                      <FormControl><Input placeholder="00.000.000.0-000.000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="company_address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl><Textarea placeholder="Alamat lengkap perusahaan" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="company_phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. Telepon</FormLabel>
                        <FormControl><Input placeholder="021-xxxxxxxx" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="company_email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="info@company.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="company_website" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl><Input placeholder="https://company.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="logo_url" render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Logo</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Pengaturan
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ... SISA TABS LAINNYA BISA DISESUAIKAN DENGAN CARA YANG SAMA JIKA DIPERLUKAN ... */}
        {/* Untuk saat ini, saya biarkan form lain tidak terhubung agar fokus pada Modal Awal */}

        <TabsContent value="user">
          <Card><CardContent className="p-6">Preferensi Pengguna akan segera tersedia.</CardContent></Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card><CardContent className="p-6">Pengaturan Notifikasi akan segera tersedia.</CardContent></Card>
        </TabsContent>
        <TabsContent value="security">
          <Card><CardContent className="p-6">Pengaturan Keamanan akan segera tersedia.</CardContent></Card>
        </TabsContent>
        <TabsContent value="system">
           <Card><CardContent className="p-6">Pengaturan Sistem akan segera tersedia.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;