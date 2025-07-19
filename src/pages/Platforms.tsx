import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { usePlatforms } from '@/hooks/useSupabase';
import { formatCurrency } from '@/utils/format';

const Platforms = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<any>(null);
  
  const { platforms, loading, fetchPlatforms, createPlatform, updatePlatform, deletePlatform } = usePlatforms();
  
  const form = useForm({
    defaultValues: {
      nama_platform: '',
      metode_pencairan: '',
      komisi_default_persen: 0,
    },
  });

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      if (editingPlatform) {
        await updatePlatform(editingPlatform.id, data);
      } else {
        await createPlatform(data);
      }
      setIsDialogOpen(false);
      setEditingPlatform(null);
      form.reset();
    } catch (error) {
      console.error('Error saving platform:', error);
    }
  };

  const handleEdit = (platform: any) => {
    setEditingPlatform(platform);
    form.reset({
      nama_platform: platform.nama_platform,
      metode_pencairan: platform.metode_pencairan || '',
      komisi_default_persen: platform.komisi_default_persen || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (platform: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus platform ini?')) {
      await deletePlatform(platform.id);
    }
  };

  const filteredPlatforms = platforms.filter(platform =>
    platform.nama_platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    platform.metode_pencairan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'nama_platform',
      title: 'Nama Platform',
      dataIndex: 'nama_platform',
    },
    {
      key: 'metode_pencairan',
      title: 'Metode Pencairan',
      dataIndex: 'metode_pencairan',
      render: (value: string) => value || '-',
    },
    {
      key: 'komisi_default_persen',
      title: 'Komisi Default (%)',
      dataIndex: 'komisi_default_persen',
      render: (value: number) => `${value}%`,
    },
    {
      key: 'actions',
      title: 'Aksi',
      dataIndex: 'id',
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(record)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(record)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Platform Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Platform
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Platform</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari platform..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredPlatforms}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlatform ? 'Edit Platform' : 'Tambah Platform Baru'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nama_platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Platform *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Shopee, Tokopedia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="metode_pencairan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metode Pencairan</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Bank Transfer, OVO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="komisi_default_persen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Komisi Default (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingPlatform ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Platforms;