import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, DollarSign, Calendar, TrendingUp, Download, Edit, Trash2 } from 'lucide-react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface IncomeFormData {
  tanggal: string;
  category_id: string;
  jumlah: number;
  bank_id: string;
  keterangan: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const Incomes = () => {
  const { incomes, loading, fetchIncomes, createIncome, updateIncome, deleteIncome } = useIncomes();
  const { categories, fetchCategories } = useCategories();
  const { banks, fetchBanks } = useBanks();
  
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

  const incomeCategories = categories.filter(cat => cat.tipe_kategori === 'income');

  // Gunakan useCallback agar fungsi tidak dibuat ulang di setiap render
  const memoizedFetchIncomes = useCallback(fetchIncomes, []);

  useEffect(() => {
    const startDate = dateRange.from?.toISOString().split('T')[0];
    const endDate = dateRange.to?.toISOString().split('T')[0];
    memoizedFetchIncomes(startDate, endDate);
  }, [dateRange, memoizedFetchIncomes]);

  useEffect(() => {
    fetchCategories();
    fetchBanks();
    
    // Listener untuk event realtime dari hook
    const handleRefetch = () => {
        const startDate = dateRange.from?.toISOString().split('T')[0];
        const endDate = dateRange.to?.toISOString().split('T')[0];
        fetchIncomes(startDate, endDate);
    };
    document.addEventListener('refetch-incomes', handleRefetch);
    return () => {
        document.removeEventListener('refetch-incomes', handleRefetch);
    };

  }, [fetchCategories, fetchBanks, dateRange, fetchIncomes]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || formData.jumlah <= 0) {
      toast({ title: "Error", description: "Mohon lengkapi data pemasukan", variant: "destructive" });
      return;
    }
    const cleanedFormData = { ...formData, bank_id: formData.bank_id === "cash" ? null : formData.bank_id };
    const result = editingIncome ? await updateIncome(editingIncome.id, cleanedFormData) : await createIncome(cleanedFormData);
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
      bank_id: income.bank_id || 'cash', // Default ke 'cash' jika null
      keterangan: income.keterangan || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteIncome(id);
  };
  
  const handleExportPDF = () => {
    toast({ title: "Mengekspor PDF...", description: "Harap tunggu sebentar." });
    const preparedData = incomes.map(income => ({
      tanggal: formatShortDate(income.tanggal),
      kategori: income.category?.nama_kategori || 'N/A',
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
        { title: 'Ke Bank/Kas', dataKey: 'bank' },
        { title: 'Keterangan', dataKey: 'keterangan' },
      ],
      title: `Laporan Pemasukan (${formatDate(dateRange.from)} - ${formatDate(dateRange.to)})`,
      filename: `Laporan-Pemasukan-${new Date().toISOString().split('T')[0]}.pdf`,
      companyInfo: { name: 'FINTracks Ultimate Suite', address: 'Tasikmalaya, Indonesia' }
    });
  };

  const handleExportCSV = () => {
    toast({ title: "Mengekspor CSV...", description: "Harap tunggu sebentar." });
    const preparedData = incomes.map(income => ({
      Tanggal: formatShortDate(income.tanggal),
      Kategori: income.category?.nama_kategori || 'N/A',
      Jumlah: income.jumlah,
      'Ke Bank/Kas': income.bank?.nama_bank || 'Kas',
      Keterangan: income.keterangan || '-',
    }));
    exportToCSV({
      data: preparedData,
      filename: `Laporan-Pemasukan-${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

  const columns = [
    { key: 'tanggal', title: 'Tanggal', render: (_: any, income: any) => formatShortDate(income?.tanggal) },
    { key: 'category', title: 'Kategori', render: (_: any, income: any) => <span className="font-medium">{income?.category?.nama_kategori || 'Tidak dikategorikan'}</span> },
    { key: 'jumlah', title: 'Jumlah', render: (_: any, income: any) => <span className="font-medium text-green-600">+{formatCurrency(income?.jumlah || 0)}</span> },
    { key: 'bank', title: 'Ke Bank', render: (_: any, income: any) => <span>{income?.bank?.nama_bank || 'Kas'}</span> },
    { key: 'keterangan', title: 'Keterangan', render: (_: any, income: any) => <span className="text-sm text-muted-foreground">{income?.keterangan || '-'}</span> },
    { key: 'actions', title: 'Aksi', render: (_: any, income: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(income)}><Edit className="h-4 w-4" /></Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Pemasukan</AlertDialogTitle>
                <AlertDialogDescription>Apakah Anda yakin? Tindakan ini akan mengembalikan saldo bank/kas.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(income.id)}>Hapus</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
    )}
  ];

  const totalIncomes = incomes.reduce((total, income) => total + (income?.jumlah || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Pemasukan</h1>
          <p className="text-muted-foreground">Catat semua pemasukan di luar penjualan utama.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary"><Plus className="h-4 w-4 mr-2" />Tambah Pemasukan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingIncome ? 'Edit Pemasukan' : 'Tambah Pemasukan'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tanggal">Tanggal *</Label>
                <Input id="tanggal" type="date" value={formData.tanggal} onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="category_id">Kategori *</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map((category) => (<SelectItem key={category.id} value={category.id}>{category.nama_kategori}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jumlah">Jumlah *</Label>
                <Input id="jumlah" type="number" value={formData.jumlah || ''} onChange={(e) => setFormData(prev => ({ ...prev, jumlah: parseFloat(e.target.value) || 0 }))} placeholder="0" min="0" required />
              </div>
              <div>
                <Label htmlFor="bank_id">Masuk ke</Label>
                <Select value={formData.bank_id} onValueChange={(value) => setFormData(prev => ({ ...prev, bank_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih bank/kas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Kas</SelectItem>
                    {banks.map((bank) => (<SelectItem key={bank.id} value={bank.id}>{bank.nama_bank} - {bank.nama_pemilik}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea id="keterangan" value={formData.keterangan} onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))} placeholder="Deskripsi pemasukan..." rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button type="submit">{editingIncome ? 'Update' : 'Simpan'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card border-0">
        <CardHeader className="pb-3 md:pb-6"><CardTitle className="text-base md:text-lg">Filter Periode</CardTitle></CardHeader>
        <CardContent><DateFilter value={dateRange} onChange={setDateRange} className="w-full md:max-w-md" /></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pemasukan ({formatCurrency(totalIncomes)})</CardTitle>
          <p className="text-sm text-muted-foreground">Menampilkan data untuk periode yang dipilih.</p>
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
                <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Incomes;
