import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, InputCurrency } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, DollarSign, Calendar, TrendingDown, Download } from 'lucide-react';
import { useCategories, useBanks } from '@/hooks/useSupabase';
import { useExpenses } from '@/hooks/useExpenses';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatShortDate, formatDate } from '@/utils/format';
import { exportDataTableAsPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';
import DateFilter from '@/components/dashboard/DateFilter';
import { ExpenseFormData, Expense } from '@/types';

// Interface untuk rentang tanggal
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const Expenses = () => {
  const { expenses, loading, fetchExpenses, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { categories, fetchCategories } = useCategories();
  const { banks, fetchBanks } = useBanks();
  
  // State untuk filter tanggal
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    category_id: '',
    jumlah: 0,
    bank_id: '',
    keterangan: ''
  });

  const expenseCategories = categories.filter(cat => cat.tipe_kategori === 'expense');

  // useEffect untuk fetch data berdasarkan filter tanggal
  useEffect(() => {
    const startDate = dateRange.from?.toISOString().split('T')[0];
    const endDate = dateRange.to?.toISOString().split('T')[0];
    fetchExpenses(startDate, endDate);
  }, [dateRange]);

  useEffect(() => {
    fetchCategories();
    fetchBanks();
  }, []);

  // Fungsi export PDF
  const handleExportPDF = () => {
    toast({ title: "Mengekspor PDF...", description: "Harap tunggu sebentar." });
    
    const preparedData = expenses.map(expense => ({
      tanggal: formatShortDate(expense.tanggal),
      kategori: expense.category?.nama_kategori || '-',
      jumlah: formatCurrency(expense.jumlah || 0),
      bank: expense.bank?.nama_bank || 'Kas',
      keterangan: expense.keterangan || '-',
    }));

    exportDataTableAsPDF({
      data: preparedData,
      columns: [
        { title: 'Tanggal', dataKey: 'tanggal' },
        { title: 'Kategori', dataKey: 'kategori' },
        { title: 'Jumlah', dataKey: 'jumlah' },
        { title: 'Bank', dataKey: 'bank' },
        { title: 'Keterangan', dataKey: 'keterangan' },
      ],
      title: `Laporan Pengeluaran (${formatDate(dateRange.from)} - ${formatDate(dateRange.to)})`,
      filename: `Laporan-Pengeluaran-${new Date().toISOString().split('T')[0]}.pdf`,
      companyInfo: {
        name: 'FINTracks Ultimate Suite',
        address: 'Tasikmalaya, Indonesia'
      }
    });
  };

  // Fungsi export CSV
  const handleExportCSV = () => {
    toast({ title: "Mengekspor CSV...", description: "Harap tunggu sebentar." });

    const preparedData = expenses.map(expense => ({
      Tanggal: formatShortDate(expense.tanggal),
      Kategori: expense.category?.nama_kategori || '-',
      Jumlah: expense.jumlah || 0,
      'Dibayar dari': expense.bank?.nama_bank || 'Kas',
      'Nama Pemilik': expense.bank?.nama_pemilik || '-',
      Keterangan: expense.keterangan || '-'
    }));
    
    exportToCSV({
      data: preparedData,
      filename: `Laporan-Pengeluaran-${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

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

    const cleanedFormData = {
      ...formData,
      bank_id: formData.bank_id === "cash" ? null : formData.bank_id
    };

    const result = editingExpense 
      ? await updateExpense(editingExpense.id, cleanedFormData)
      : await createExpense(cleanedFormData);

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
    setEditingExpense(null);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      tanggal: expense.tanggal,
      category_id: expense.category_id || '',
      jumlah: expense.jumlah,
      bank_id: expense.bank_id || 'cash',
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
      render: (_: any, expense: Expense) => formatShortDate(expense.tanggal)
    },
    {
      key: 'category',
      title: 'Kategori',
      render: (_: any, expense: Expense) => (
        <span className="font-medium">
          {expense.category?.nama_kategori || 'Tidak dikategorikan'}
        </span>
      )
    },
    {
      key: 'jumlah',
      title: 'Jumlah',
      render: (_: any, expense: Expense) => (
        <span className="font-medium text-red-600">
          -{formatCurrency(expense.jumlah || 0)}
        </span>
      )
    },
    {
      key: 'bank',
      title: 'Dari Bank',
      render: (_: any, expense: Expense) => (
        <span>{expense.bank?.nama_bank || 'Kas'}</span>
      )
    },
    {
      key: 'keterangan',
      title: 'Keterangan',
      render: (_: any, expense: Expense) => (
        <span className="text-sm text-muted-foreground">
          {expense.keterangan || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_: any, expense: Expense) => (
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

  const totalExpenses = expenses.reduce((total, expense) => total + (expense?.jumlah || 0), 0);
  const thisMonthExpenses = expenses.filter(expense => 
    expense?.tanggal && new Date(expense.tanggal).getMonth() === new Date().getMonth()
  ).reduce((total, expense) => total + (expense?.jumlah || 0), 0);

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Pengeluaran</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Kelola transaksi pengeluaran dan biaya operasional
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            {/* Tambahkan kelas agar tombol memenuhi lebar di mobile */}
            <Button className="gradient-primary w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Tambah Pengeluaran</span>
              <span className="sm:hidden">Tambah</span>
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
                <InputCurrency
                  id="jumlah"
                  value={formData.jumlah}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, jumlah: value }))}
                  placeholder="Rp 0"
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
                  placeholder="Deskripsi pengeluaran..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Menyimpan...' : (editingExpense ? 'Update' : 'Simpan')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tanggal */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
            📅 Filter Periode Pengeluaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateFilter
            value={dateRange}
            onChange={setDateRange}
            className="w-full md:max-w-md"
          />
          <div className="mt-3 text-sm text-muted-foreground">
            Menampilkan data dari {formatDate(dateRange.from)} sampai {formatDate(dateRange.to)}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Periode terpilih</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
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

        <Card className="glass-card border-0">
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
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Daftar Pengeluaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={expenses}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari pengeluaran..."
            actions={
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
