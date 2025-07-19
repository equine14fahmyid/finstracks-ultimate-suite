import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, InputCurrency } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, DollarSign, Calendar, TrendingUp, Download } from 'lucide-react';
import { useCategories, useBanks } from '@/hooks/useSupabase';
import { useIncomes } from '@/hooks/useIncomes';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatShortDate, formatDate } from '@/utils/format';
import { exportDataTableAsPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';
import DateFilter from '@/components/dashboard/DateFilter';

// Interface untuk rentang tanggal
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

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
  
  // State untuk filter tanggal
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

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

  // useEffect untuk fetch data berdasarkan filter tanggal
  useEffect(() => {
    const startDate = dateRange.from?.toISOString().split('T')[0];
    const endDate = dateRange.to?.toISOString().split('T')[0];
    fetchIncomes(startDate, endDate);
  }, [dateRange]);

  useEffect(() => {
    fetchCategories();
    fetchBanks();
  }, []);

  // Fungsi export PDF
  const handleExportPDF = () => {
    toast({ title: "Mengekspor PDF...", description: "Harap tunggu sebentar." });
    
    const preparedData = incomes.map(income => ({
      tanggal: formatShortDate(income.tanggal),
      kategori: income.category?.nama_kategori || '-',
      jumlah: formatCurrency(income.jumlah),
      bank: income.bank?.nama_bank || 'Kas',
      keterangan: income.keterangan || '-',
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
      title: `Laporan Pemasukan (${formatDate(dateRange.from)} - ${formatDate(dateRange.to)})`,
      filename: `Laporan-Pemasukan-${new Date().toISOString().split('T')[0]}.pdf`,
      companyInfo: {
        name: 'FINTracks Ultimate Suite',
        address: 'Tasikmalaya, Indonesia'
      }
    });
  };

  // Fungsi export CSV
  const handleExportCSV = () => {
    toast({ title: "Mengekspor CSV...", description: "Harap tunggu sebentar." });

    const preparedData = incomes.map(income => ({
      Tanggal: formatShortDate(income.tanggal),
      Kategori: income.category?.nama_kategori || '-',
      Jumlah: income.jumlah,
      'Masuk ke': income.bank?.nama_bank || 'Kas',
      'Nama Pemilik': income.bank?.nama_pemilik || '-',
      Keterangan: income.keterangan || '-'
    }));
    
    exportToCSV({
      data: preparedData,
      filename: `Laporan-Pemasukan-${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

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

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (value: any, income: any) => formatShortDate(income?.tanggal)
    },
    {
      key: 'category',
      title: 'Kategori',
      render: (value: any, income: any) => (
        <span className="font-medium">
          {income?.category?.nama_kategori || 'Tidak dikategorikan'}
        </span>
      )
    },
    {
      key: 'jumlah',
      title: 'Jumlah',
      render: (value: any, income: any) => (
        <span className="font-medium text-green-600">
          +{formatCurrency(income?.jumlah || 0)}
        </span>
      )
    },
    {
      key: 'bank',
      title: 'Ke Bank',
      render: (value: any, income: any) => (
        <span>{income?.bank?.nama_bank || 'Kas'}</span>
      )
    },
    {
      key: 'keterangan',
      title: 'Keterangan',
      render: (value: any, income: any) => (
        <span className="text-sm text-muted-foreground">
          {income?.keterangan || '-'}
        </span>
      )
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

  // Calculate filtered totals
  const totalIncomes = incomes.reduce((total, income) => total + income.jumlah, 0);
  const thisMonthIncomes = incomes.filter(income => 
    new Date(income.tanggal).getMonth() === new Date().getMonth()
  ).reduce((total, income) => total + income.jumlah, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Pemasukan</h1>
          <p className="text-muted-foreground">
            Kelola transaksi pemasukan dan pendapatan
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
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
                <InputCurrency
                  id="jumlah"
                  value={formData.jumlah}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    jumlah: value
                  }))}
                  placeholder="Rp 0"
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

      {/* Filter Tanggal */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
            📅 Filter Periode Pemasukan
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncomes)}</div>
            <p className="text-xs text-muted-foreground">Periode terpilih</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
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

        <Card className="glass-card border-0">
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
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Daftar Pemasukan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={incomes}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari pemasukan..."
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Incomes;
