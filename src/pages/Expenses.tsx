import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar
import { Expense, Category, Bank, ExpenseFormData } from '@/types'; // Pastikan path ini benar
import { toast } from '@/hooks/use-toast';

// Hook terpadu untuk mengelola semua data dan logika di halaman Pengeluaran
export const useExpensePage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil semua data yang dibutuhkan halaman ini secara bersamaan (paralel)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expensesRes, categoriesRes, banksRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*, category:categories(*), bank:banks(*)') // Ambil data relasi
          .order('tanggal', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('tipe_kategori', 'expense') // Hanya ambil kategori untuk pengeluaran
          .order('nama_kategori', { ascending: true }),
        supabase
          .from('banks')
          .select('*')
          .order('nama_bank', { ascending: true }),
      ]);

      // Cek error untuk setiap request
      if (expensesRes.error) throw expensesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (banksRes.error) throw banksRes.error;

      // Set state jika berhasil
      setExpenses(expensesRes.data || []);
      setCategories(categoriesRes.data || []);
      setBanks(banksRes.data || []);

    } catch (err: any) {
      const errorMessage = "Gagal memuat data dari database.";
      console.error(errorMessage, err);
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Panggil fetchData() saat komponen pertama kali dimuat
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fungsi untuk membuat data baru
  const createExpense = async (formData: ExpenseFormData) => {
    try {
      const { error } = await supabase.from('expenses').insert([formData]);
      if (error) throw error;
      toast({ title: "Sukses", description: "Pengeluaran baru berhasil ditambahkan." });
      await fetchData(); // Ambil data terbaru setelah berhasil
    } catch (err: any) {
      const errorMessage = "Gagal menambahkan pengeluaran.";
      console.error(errorMessage, err);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      throw err; // Lemparkan error agar komponen bisa menangani
    }
  };

  // Fungsi untuk update data
  const updateExpense = async (id: string, formData: ExpenseFormData) => {
    try {
      const { error } = await supabase.from('expenses').update(formData).eq('id', id);
      if (error) throw error;
      toast({ title: "Sukses", description: "Data pengeluaran berhasil diperbarui." });
      await fetchData(); // Ambil data terbaru
    } catch (err: any) {
      const errorMessage = "Gagal memperbarui pengeluaran.";
      console.error(errorMessage, err);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      throw err;
    }
  };

  // Fungsi untuk menghapus data
  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sukses", description: "Pengeluaran berhasil dihapus." });
      await fetchData(); // Ambil data terbaru
    } catch (err: any) {
      const errorMessage = "Gagal menghapus pengeluaran.";
      console.error(errorMessage, err);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      throw err;
    }
  };

  // Kembalikan semua state dan fungsi yang dibutuhkan oleh UI
  return { expenses, categories, banks, loading, error, createExpense, updateExpense, deleteExpense };
};
```

### 2. Komponen Halaman Pengeluaran (Diperbarui)

Ganti seluruh isi file `expenses.tsx` Anda dengan kode di bawah ini. Kemungkinan besar path file ini adalah `src/app/dashboard/pengeluaran/page.tsx` atau yang serupa.


```typescript
'use client'; // Diperlukan untuk komponen yang menggunakan hooks dan interaktivitas

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, DollarSign, Calendar, TrendingDown } from 'lucide-react';
import { useExpensePage } from '@/hooks/useExpensePage'; // Ganti dengan hook baru yang terpadu
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatShortDate } from '@/utils/format';
import { ExpenseFormData, Expense } from '@/types';

const ExpensesPage = () => {
  // Gunakan satu hook terpadu untuk semua data dan fungsi. Jadi lebih rapi!
  const { expenses, categories, banks, loading, createExpense, updateExpense, deleteExpense } = useExpensePage();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    category_id: '',
    jumlah: 0,
    bank_id: '',
    keterangan: ''
  });
  
  // State untuk dialog konfirmasi hapus
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || formData.jumlah <= 0) {
      toast({ title: "Data tidak lengkap", description: "Mohon pilih kategori dan isi jumlah pengeluaran.", variant: "destructive" });
      return;
    }

    // Mengosongkan bank_id jika user memilih "Kas"
    const cleanedFormData = {
      ...formData,
      bank_id: formData.bank_id === "cash" || formData.bank_id === '' ? null : formData.bank_id
    };

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, cleanedFormData);
      } else {
        await createExpense(cleanedFormData);
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error sudah di-handle oleh hook, tidak perlu toast lagi di sini
      console.error("Operasi gagal:", error);
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
      bank_id: expense.bank_id || 'cash', // Default ke 'cash' jika null
      keterangan: expense.keterangan || ''
    });
    setDialogOpen(true);
  };

  // Membuka dialog konfirmasi sebelum menghapus
  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setIsConfirmingDelete(true);
  };

  // Aksi yang dijalankan setelah user konfirmasi hapus
  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await deleteExpense(expenseToDelete);
      } catch (error) {
        console.error("Gagal menghapus:", error);
      } finally {
        setExpenseToDelete(null);
        setIsConfirmingDelete(false);
      }
    }
  };

  // Definisi kolom untuk tabel data
  const columns = [
    { key: 'tanggal', title: 'Tanggal', render: (row: Expense) => formatShortDate(row.tanggal) },
    { key: 'category', title: 'Kategori', render: (row: Expense) => <span className="font-medium">{row.category?.nama_kategori || 'N/A'}</span> },
    { key: 'jumlah', title: 'Jumlah', render: (row: Expense) => <span className="font-medium text-red-600">-{formatCurrency(row.jumlah)}</span> },
    { key: 'bank', title: 'Dari Bank', render: (row: Expense) => <span>{row.bank?.nama_bank || 'Kas'}</span> },
    { key: 'keterangan', title: 'Keterangan', render: (row: Expense) => <span className="text-sm text-muted-foreground">{row.keterangan || '-'}</span> },
    { key: 'actions', title: 'Aksi', render: (row: Expense) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(row.id)}>Hapus</Button>
        </div>
      )
    }
  ];

  // Kalkulasi untuk kartu ringkasan
  const totalExpenses = expenses.reduce((sum, item) => sum + item.jumlah, 0);
  const thisMonthExpenses = expenses
    .filter(item => new Date(item.tanggal).getMonth() === new Date().getMonth() && new Date(item.tanggal).getFullYear() === new Date().getFullYear())
    .reduce((sum, item) => sum + item.jumlah, 0);

  return (
    <>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header Halaman */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold">Pengeluaran</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Tambah Pengeluaran</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{editingExpense ? 'Edit' : 'Tambah'} Pengeluaran</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="tanggal">Tanggal *</Label>
                  <Input id="tanggal" type="date" value={formData.tanggal} onChange={(e) => setFormData(p => ({ ...p, tanggal: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="category_id">Kategori *</Label>
                  <Select value={formData.category_id} onValueChange={(v) => setFormData(p => ({ ...p, category_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.nama_kategori}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="jumlah">Jumlah *</Label>
                  <Input id="jumlah" type="number" value={formData.jumlah || ''} onChange={(e) => setFormData(p => ({ ...p, jumlah: parseFloat(e.target.value) || 0 }))} placeholder="0" required />
                </div>
                <div>
                  <Label htmlFor="bank_id">Dibayar dari</Label>
                  <Select value={formData.bank_id} onValueChange={(v) => setFormData(p => ({ ...p, bank_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Pilih bank/kas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Kas</SelectItem>
                      {banks.map((bank) => <SelectItem key={bank.id} value={bank.id}>{bank.nama_bank}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Textarea id="keterangan" value={formData.keterangan} onChange={(e) => setFormData(p => ({ ...p, keterangan: e.target.value }))} placeholder="Deskripsi pengeluaran..." />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={loading}>{editingExpense ? 'Update' : 'Simpan'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kartu Ringkasan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div><p className="text-xs text-muted-foreground">Semua periode</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bulan Ini</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(thisMonthExpenses)}</div><p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Transaksi</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{expenses.length}</div><p className="text-xs text-muted-foreground">Total pengeluaran</p></CardContent></Card>
        </div>

        {/* Tabel Data Pengeluaran */}
        <Card>
          <CardHeader><CardTitle>Daftar Pengeluaran</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={columns} data={expenses} loading={loading} searchable={true} searchPlaceholder="Cari pengeluaran..." />
          </CardContent>
        </Card>
      </div>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan. Ini akan menghapus data pengeluaran secara permanen dari server.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ExpensesPage;
```

Setelah Anda mengganti kedua file tersebut, halaman Anda seharusnya sudah berfungsi dengan baik. Jika masih ada kendala, jangan ragu untuk bertanya lagi. Kita pasti bisa selesaikan i