import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Building, User, Bell, Shield, Database, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings'; // 1. Menggunakan hook untuk koneksi ke database

// Tipe data untuk form, harus cocok dengan interface di useUserSettings
type SettingsFormValues = {
  company_name: string;
  modal_awal: number;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  tax_number: string;
  logo_url: string;
  // Tambahkan properti lain jika ingin mengelolanya di sini
};

const Settings = () => {
  // 2. Mengambil data dan fungsi dari hook
  const { settings, loading, updateSettings } = useUserSettings();

  // 3. Menggunakan satu form untuk semua pengaturan
  const form = useForm<SettingsFormValues>();

  // 4. Mengisi form dengan data dari database saat komponen dimuat
  useEffect(() => {
    if (settings) {
      // form.reset akan mengisi semua field yang cocok namanya
      form.reset({
        company_name: settings.company_name || '',
        modal_awal: settings.modal_awal || 0,
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_website: settings.company_website || '',
        tax_number: settings.tax_number || '',
        logo_url: settings.logo_url || '',
      });
    }
  }, [settings, form]);

  // 5. Satu fungsi untuk menyimpan semua perubahan
  const handleSettingsSubmit = async (data: SettingsFormValues) => {
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

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company" className="flex items-center gap-2"><Building className="h-4 w-4" />Perusahaan</TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2"><User className="h-4 w-4" />Pengguna</TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell className="h-4 w-4" />Notifikasi</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2"><Shield className="h-4 w-4" />Keamanan</TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2"><Database className="h-4 w-4" />Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Perusahaan</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p>Memuat pengaturan...</p>}
              {!loading && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSettingsSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Perusahaan *</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* 6. Input untuk Modal Awal */}
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
                                // Mengubah nilai string dari input menjadi angka
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
                          <FormControl><Input placeholder="00.000.000.0-000.000" {...field} /></FormControl>
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
                          <FormControl><Textarea placeholder="Alamat lengkap perusahaan" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={form.control} name="company_phone" render={({ field }) => (
                        <FormItem><FormLabel>No. Telepon</FormLabel><FormControl><Input placeholder="021-xxxxxxxx" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="company_email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="info@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="company_website" render={({ field }) => (
                        <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://company.com" {...field} /></FormControl><FormMessage /></FormMessage>
                      )} />
                    </div>

                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Logo</FormLabel>
                          <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={loading}>
                      <Save className="mr-2 h-4 w-4" />
                      {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder untuk Tab lainnya */}
        <TabsContent value="user"><Card><CardContent className="p-6">Pengaturan preferensi pengguna akan segera tersedia.</CardContent></Card></TabsContent>
        <TabsContent value="notifications"><Card><CardContent className="p-6">Pengaturan notifikasi akan segera tersedia.</CardContent></Card></TabsContent>
        <TabsContent value="security"><Card><CardContent className="p-6">Pengaturan keamanan akan segera tersedia.</CardContent></Card></TabsContent>
        <TabsContent value="system">
          <Card>
            <CardHeader><CardTitle>Pengaturan Sistem</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Backup & Restore</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleBackup} disabled={loading}><Download className="mr-2 h-4 w-4" />Backup Data</Button>
                  <Button variant="outline" disabled={true}><Upload className="mr-2 h-4 w-4" />Restore Data</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
