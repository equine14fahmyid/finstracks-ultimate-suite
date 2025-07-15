import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useStores, usePlatforms } from '@/hooks/useSupabase';
import { formatCurrency } from '@/utils/format';

const Stores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  
  const { stores, loading, fetchStores, createStore, updateStore, deleteStore } = useStores();
  const { platforms, fetchPlatforms } = usePlatforms();
  
  const form = useForm({
    defaultValues: {
      nama_toko: '',
      nama_marketing: '',
      email: '',
      no_hp: '',
      link_toko: '',
      platform_id: '',
      saldo_dashboard: 0,
    },
  });

  useEffect(() => {
    fetchStores();
    fetchPlatforms();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      if (editingStore) {
        await updateStore(editingStore.id, data);
      } else {
        await createStore(data);
      }
      setIsDialogOpen(false);
      setEditingStore(null);
      form.reset();
    } catch (error) {
      console.error('Error saving store:', error);
    }
  };

  const handleEdit = (store: any) => {
    setEditingStore(store);
    form.reset({
      nama_toko: store.nama_toko,
      nama_marketing: store.nama_marketing,
      email: store.email || '',
      no_hp: store.no_hp || '',
      link_toko: store.link_toko || '',
      platform_id: store.platform_id || '',
      saldo_dashboard: store.saldo_dashboard || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (store: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus toko ini?')) {
      await deleteStore(store.id);
    }
  };

  const filteredStores = stores.filter(store =>
    store.nama_toko.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.nama_marketing.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.platform?.nama_platform?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'nama_toko',
      title: 'Nama Toko',
      dataIndex: 'nama_toko',
    },
    {
      key: 'platform',
      title: 'Platform',
      dataIndex: 'platform',
      render: (platform: any) => platform?.nama_platform || '-',
    },
    {
      key: 'nama_marketing',
      title: 'Nama Marketing',
      dataIndex: 'nama_marketing',
    },
    {
      key: 'saldo_dashboard',
      title: 'Saldo Dashboard',
      dataIndex: 'saldo_dashboard',
      render: (value: number) => formatCurrency(value || 0),
    },
    {
      key: 'no_hp',
      title: 'No. HP',
      dataIndex: 'no_hp',
      render: (value: string) => value || '-',
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
        <h1 className="text-3xl font-bold text-foreground">Store Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Toko
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Toko</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari toko..."
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
            data={filteredStores}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStore ? 'Edit Toko' : 'Tambah Toko Baru'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nama_toko"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Toko *</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama toko" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="platform_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              {platform.nama_platform}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nama_marketing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Marketing *</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama marketing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="no_hp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. HP</FormLabel>
                      <FormControl>
                        <Input placeholder="08xxxxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link_toko"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Toko</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saldo_dashboard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Dashboard</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
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
                  {editingStore ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stores;