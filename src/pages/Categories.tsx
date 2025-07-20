import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { useCategories } from '@/hooks/useSupabase';

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('all');
  
  const { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories();
  
  const form = useForm({
    defaultValues: {
      nama_kategori: '',
      tipe_kategori: 'expense' as 'income' | 'expense',
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    form.reset({
      nama_kategori: category.nama_kategori,
      tipe_kategori: category.tipe_kategori,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (category: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      await deleteCategory(category.id);
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.nama_kategori.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || category.tipe_kategori === filterType;
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      key: 'nama_kategori',
      title: 'Nama Kategori',
      dataIndex: 'nama_kategori',
    },
    {
      key: 'tipe_kategori',
      title: 'Tipe',
      dataIndex: 'tipe_kategori',
      render: (value: string) => (
        <Badge variant={value === 'income' ? 'default' : 'secondary'}>
          {value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
        </Badge>
      ),
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Category Management</h1>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Tambah Kategori</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredCategories}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nama_kategori"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kategori *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Gaji Karyawan, Biaya Listrik" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tipe_kategori"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Kategori *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Pemasukan</SelectItem>
                        <SelectItem value="expense">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingCategory ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;