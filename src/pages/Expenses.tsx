import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini sesuai dengan lokasi client supabase Anda
import { Expense, ExpenseFormData } from '@/types'; // Pastikan path ini sesuai dengan definisi tipe Anda
import { toast } from '@/hooks/use-toast';

// Ini adalah "custom hook", sebuah fungsi khusus di React untuk mengelola logika yang bisa dipakai ulang.
// Hook ini bertanggung jawab untuk semua hal yang berkaitan dengan data pengeluaran (expenses).
export const useExpenses = () => {
  // State untuk menyimpan daftar pengeluaran yang didapat dari database
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // State untuk menandakan apakah sedang dalam proses mengambil data (untuk menampilkan loading spinner)
  const [loading, setLoading] = useState(true);
  // State untuk menyimpan pesan error jika terjadi kesalahan
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil (fetch) data pengeluaran dari Supabase
  // useCallback digunakan untuk optimisasi, agar fungsi ini tidak dibuat ulang di setiap render, kecuali dependensinya berubah.
  const fetchExpenses = useCallback(async () => {
    setLoading(true); // Mulai loading
    setError(null);

    try {
      // Inilah bagian yang diperbaiki!
      // Kita memberitahu Supabase untuk mengambil:
      // 1. `*`: Semua kolom dari tabel `expenses`.
      // 2. `category:categories(*)`: Data dari tabel `categories` yang berelasi, dan menamainya `category`.
      // 3. `bank:banks(*)`: Data dari tabel `banks` yang berelasi, dan menamainya `bank`.
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*),
          bank:banks(*)
        `)
        .order('tanggal', { ascending: false }); // Mengurutkan data berdasarkan tanggal terbaru

      if (fetchError) {
        throw fetchError; // Jika ada error saat fetch, lemparkan error
      }

      // Jika berhasil, simpan data ke state `expenses`
      setExpenses(data || []);

    } catch (err: any) {
      const errorMessage = "Gagal memuat data pengeluaran.";
      console.error(errorMessage, err);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Selesai loading, baik berhasil maupun gagal
    }
  }, []); // Array dependensi kosong, berarti fungsi ini hanya dibuat sekali

  // Fungsi untuk membuat data pengeluaran baru
  const createExpense = async (formData: ExpenseFormData) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([formData])
        .select();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Pengeluaran baru berhasil ditambahkan.",
      });
      fetchExpenses(); // Ambil ulang data terbaru setelah berhasil menambahkan
      return { data, error: null };

    } catch (err: any) {
      const errorMessage = "Gagal menambahkan pengeluaran.";
      console.error(errorMessage, err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: err };
    }
  };

  // Fungsi untuk memperbarui data pengeluaran yang sudah ada
  const updateExpense = async (id: string, formData: ExpenseFormData) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(formData)
        .eq('id', id)
        .select();

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Data pengeluaran berhasil diperbarui.",
      });
      fetchExpenses(); // Ambil ulang data terbaru setelah berhasil update
      return { data, error: null };

    } catch (err: any) {
      const errorMessage = "Gagal memperbarui pengeluaran.";
      console.error(errorMessage, err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: err };
    }
  };

  // Fungsi untuk menghapus data pengeluaran
  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sukses",
        description: "Pengeluaran berhasil dihapus.",
      });
      fetchExpenses(); // Ambil ulang data terbaru setelah berhasil menghapus

    } catch (err: any) {
      const errorMessage = "Gagal menghapus pengeluaran.";
      console.error(errorMessage, err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Mengembalikan semua state dan fungsi agar bisa digunakan di komponen lain (seperti expenses.tsx)
  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
