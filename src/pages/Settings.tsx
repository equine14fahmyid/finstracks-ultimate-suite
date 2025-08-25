
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building, User, Bell, Shield, Database, Download, Upload } from 'lucide-react';
import { SettingsForm } from '@/components/forms/SettingsForm';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const handleBackup = () => {
    toast({ 
      title: "Info", 
      description: "Fitur backup akan segera tersedia." 
    });
  };

  const handleRestore = () => {
    toast({ 
      title: "Info", 
      description: "Fitur restore akan segera tersedia." 
    });
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pengaturan</h1>
      </div>

      <Tabs defaultValue="company" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
          <TabsTrigger value="company" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Building className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Perusahaan</span>
            <span className="sm:hidden">Co.</span>
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <User className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Pengguna</span>
            <span className="sm:hidden">User</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Bell className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Notifikasi</span>
            <span className="sm:hidden">Bell</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Shield className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Keamanan</span>
            <span className="sm:hidden">Sec</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm col-span-2 md:col-span-1">
            <Database className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Sistem</span>
            <span className="sm:hidden">Sys</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Perusahaan</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsForm category="company" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>Preferensi Pengguna</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsForm category="user" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsForm category="notifications" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Keamanan</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsForm category="security" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base md:text-lg font-medium">Backup & Restore</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={handleBackup} type="button" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Backup Data</span>
                    <span className="sm:hidden">Backup</span>
                  </Button>
                  <Button variant="outline" onClick={handleRestore} type="button" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Restore Data</span>
                    <span className="sm:hidden">Restore</span>
                  </Button>
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
