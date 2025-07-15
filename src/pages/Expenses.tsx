
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, DollarSign, Calendar, TrendingDown } from 'lucide-react';
import { useExpenses, useCategories, useBanks } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatShortDate } from '@/utils/format';

interface ExpenseFormData {
  tanggal: string;
  category_id: string;
  jumlah: number;
  bank_id: string;
  keterangan: string;
}

const Expenses = () => {
  const { expenses, loading, fetchExpenses, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { categories, fetchCategories } = useCategories();
  const { banks, fetchBanks } = useBanks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    category_id: '',
    jumlah: 0,
    bank_id: '',
    keterangan: ''
  });

  // Filter categories for expenses only
  const expenseCategories = categories.filter(cat => cat.tipe_kategori === 'expense');

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchBanks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || formData.jumlah <= 0) {
      toast({
        title: "Error",
        description: "Mohon lengkapi data pengeluaran",
        variant: "destructive",
      });
      return;
    }

    const success = editingExpense 
      ? await updateExpense(editingExpense.id, formData)
      : await createExpense(formData);

    if (success) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      category_id: '',
      jumlah: 0,
      bank_id: '',
      keterangan: ''
    });
    setEditingExpense(null);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      tanggal: expense.tanggal,
      category_id: expense.category_id || '',
      jumlah: expense.jumlah,
      bank_id: expense.bank_id || '',
      keterangan: expense.keterangan || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
      await deleteExpense(id);
    }
  };

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (expense: any) => formatShortDate(expense.tanggal)
    },
    {
      key: 'category',
      title: 'Kategori',
      render: (expense: any) => (
        <span className="font-medium">{expense.category?.nama_kategori || 'Tidak dikategorikan'}</span>
      )
    },
    {
      key: 'jumlah',
      title: 'Jumlah',
      render: (expense: any) => (
        <span className="font-medium text-red-600">-{formatCurrency(expense.jumlah)}</span>
      )
    },
    {
      key: 'bank',
      title: 'Dari Bank',
      render: (expense: any) => (
        <span>{expense.bank?.nama_bank || 'Kas'}</span>
      )
    },
    {
      key: 'keterangan',
      title: 'Keterangan',
      render: (expense: any) => (
        <span className="text-sm text-muted-foreground">
          {expense.keterangan || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (expense: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(expense)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(expense.id)}>
            Hapus
          </Button>
        </div>
      )
    }
  ];

  const totalExpenses = expenses.reduce((total, expense) => total + expense.jumlah, 0);
  const thisMonthExpenses = expenses.filter(expense => 
    new Date(expense.tanggal).getMonth() === new Date().getMonth()
  ).reduce((total, expense) => total + expense.jumlah, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pengeluaran</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tanggal">Tanggal *</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category_id">Kategori *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nama_kategori}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jumlah">Jumlah *</Label>
                <Input
                  id="jumlah"
                  type="number"
                  value={formData.jumlah || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    jumlah: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bank_id">Dibayar dari</Label>
                <Select 
                  value={formData.bank_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bank_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bank/kas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Kas</SelectItem>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.nama_bank} - {bank.nama_pemilik}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Deskripsi pengeluaran..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingExpense ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Semua periode</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(thisMonthExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">Total pengeluaran</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={expenses}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari pengeluaran..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
