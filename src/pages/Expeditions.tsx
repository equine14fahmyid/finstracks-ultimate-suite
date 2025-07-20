import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useExpeditions } from '@/hooks/useSupabase';

const Expeditions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpedition, setEditingExpedition] = useState<any>(null);
  
  const { expeditions, loading, fetchExpeditions, createExpedition, updateExpedition, deleteExpedition } = useExpeditions();
  
  const form = useForm({
    defaultValues: {
      nama_ekspedisi: '',
      kode_ekspedisi: '',
    },
  });

  useEffect(() => {
    fetchExpeditions();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      if (editingExpedition) {
        await updateExpedition(editingExpedition.id, data);
      } else {
        await createExpedition(data);
      }
      setIsDialogOpen(false);
      setEditingExpedition(null);
      form.reset();
    } catch (error) {
      console.error('Error saving expedition:', error);
    }
  };

  const handleEdit = (expedition: any) => {
    setEditingExpedition(expedition);
    form.reset({
      nama_ekspedisi: expedition.nama_ekspedisi,
      kode_ekspedisi: expedition.kode_ekspedisi || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (expedition: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus ekspedisi ini?')) {
      await deleteExpedition(expedition.id);
    }
  };

  const filteredExpeditions = expeditions.filter(expedition =>
    expedition.nama_ekspedisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expedition.kode_ekspedisi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'nama_ekspedisi',
      title: 'Nama Ekspedisi',
      dataIndex: 'nama_ekspedisi',
    },
    {
      key: 'kode_ekspedisi',
      title: 'Kode Ekspedisi',
      dataIndex: 'kode_ekspedisi',
      render: (value: string) => value || '-',
    },
    {
      key: 'created_at',
      title: 'Tanggal Dibuat',
      dataIndex: 'created_at',
      render: (value: string) => new Date(value).toLocaleDateString('id-ID'),
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
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Expedition Management</h1>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Tambah Ekspedisi</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Ekspedisi</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari ekspedisi..."
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
            data={filteredExpeditions}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpedition ? 'Edit Ekspedisi' : 'Tambah Ekspedisi Baru'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nama_ekspedisi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Ekspedisi *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: JNE, JNT, SiCepat" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="kode_ekspedisi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Ekspedisi</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: JNE, JNT, SCT" {...field} />
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
                  {editingExpedition ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expeditions;