
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, InputCurrency } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useCategories, useBanks } from '@/hooks/useSupabase';
import { useIncomes } from '@/hooks/useIncomes';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatShortDate } from '@/utils/format';

interface IncomeFormData {
  tanggal: string;
  category_id: string;
  jumlah: number;
  bank_id: string;
  keterangan: string;
}

const Incomes = () => {
  const { incomes, loading, fetchIncomes, createIncome, updateIncome, deleteIncome } = useIncomes();
  const { categories, fetchCategories } = useCategories();
  const { banks, fetchBanks } = useBanks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [formData, setFormData] = useState<IncomeFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    category_id: '',
    jumlah: 0,
    bank_id: '',
    keterangan: ''
  });

  // Filter categories for incomes only
  const incomeCategories = categories.filter(cat => cat.tipe_kategori === 'income');

  useEffect(() => {
    fetchIncomes();
    fetchCategories();
    fetchBanks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || formData.jumlah <= 0) {
      toast({
        title: "Error",
        description: "Mohon lengkapi data pemasukan",
        variant: "destructive",
      });
      return;
    }

    // Clean formData - replace "cash" with null for bank_id
    const cleanedFormData = {
      ...formData,
      bank_id: formData.bank_id === "cash" ? null : formData.bank_id
    };

    const result = editingIncome 
      ? await updateIncome(editingIncome.id, cleanedFormData)
      : await createIncome(cleanedFormData);

    if (!result?.error) {
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
    setEditingIncome(null);
  };

  const handleEdit = (income: any) => {
    setEditingIncome(income);
    setFormData({
      tanggal: income.tanggal,
      category_id: income.category_id || '',
      jumlah: income.jumlah,
      bank_id: income.bank_id || '',
      keterangan: income.keterangan || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pemasukan ini?')) {
      await deleteIncome(id);
    }
  };

  // Fixed columns dengan parameter yang benar
  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (value: any, income: any) => {
        console.log('Rendering tanggal:', { value, income }); // Debug log
        return formatShortDate(income?.tanggal);
      }
    },
    {
      key: 'category',
      title: 'Kategori',
      render: (value: any, income: any) => {
        console.log('Rendering category:', { value, income }); // Debug log
        return (
          <span className="font-medium">
            {income?.category?.nama_kategori || 'Tidak dikategorikan'}
          </span>
        );
      }
    },
    {
      key: 'jumlah',
      title: 'Jumlah',
      render: (value: any, income: any) => {
        console.log('Rendering jumlah:', { value, income }); // Debug log
        return (
          <span className="font-medium text-green-600">
            +{formatCurrency(income?.jumlah || 0)}
          </span>
        );
      }
    },
    {
      key: 'bank',
      title: 'Ke Bank',
      render: (value: any, income: any) => {
        console.log('Rendering bank:', { value, income }); // Debug log
        return (
          <span>{income?.bank?.nama_bank || 'Kas'}</span>
        );
      }
    },
    {
      key: 'keterangan',
      title: 'Keterangan',
      render: (value: any, income: any) => {
        console.log('Rendering keterangan:', { value, income }); // Debug log
        return (
          <span className="text-sm text-muted-foreground">
            {income?.keterangan || '-'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (value: any, income: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(income)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(income?.id)}>
            Hapus
          </Button>
        </div>
      )
    }
  ];

  const totalIncomes = incomes.reduce((total, income) => total + income.jumlah, 0);
  const thisMonthIncomes = incomes.filter(income => 
    new Date(income.tanggal).getMonth() === new Date().getMonth()
  ).reduce((total, income) => total + income.jumlah, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pemasukan</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pemasukan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingIncome ? 'Edit Pemasukan' : 'Tambah Pemasukan'}
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
                    {incomeCategories.map((category) => (
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
                <Label htmlFor="bank_id">Masuk ke</Label>
                <Select 
                  value={formData.bank_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bank_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bank/kas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Kas</SelectItem>
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
                  placeholder="Deskripsi pemasukan..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingIncome ? 'Update' : 'Simpan'}
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
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncomes)}</div>
            <p className="text-xs text-muted-foreground">Semua periode</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(thisMonthIncomes)}</div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incomes.length}</div>
            <p className="text-xs text-muted-foreground">Total pemasukan</p>
          </CardContent>
        </Card>
      </div>

      {/* Incomes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pemasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={incomes}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari pemasukan..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Incomes;
