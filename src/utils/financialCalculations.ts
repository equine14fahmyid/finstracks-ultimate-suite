import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// --- INTERFACE & TIPE DATA ---

// Interface untuk hasil kalkulasi Laba Rugi
export interface ProfitLossCalculation {
  revenue: {
    total_penjualan: number;
    penjualan_by_platform: Array<{ platform: string; amount: number }>;
  };
  cogs: {
    total_hpp: number;
  };
  gross_profit: number;
  gross_margin: number;
  expenses: {
    total_expenses: number;
    expenses_by_category: Array<{ category: string; amount: number }>;
  };
  net_profit: number;
}

// Interface untuk pengaturan perusahaan yang akan kita ambil
interface CompanySettings {
    modal_awal: number;
    // Tambahkan pengaturan lain jika dibutuhkan di masa depan
}


// --- FUNGSI UTAMA UNTUK MENGHITUNG LABA RUGI ---

/**
 * Menghitung Laporan Laba Rugi berdasarkan rentang tanggal.
 * @param startDate - Tanggal mulai periode
 * @param endDate - Tanggal akhir periode
 * @returns Object ProfitLossCalculation yang berisi semua detail laba rugi.
 */
export const calculateProfitLoss = async (startDate: Date, endDate: Date): Promise<ProfitLossCalculation> => {
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  // --- 1. MENGAMBIL DATA PENGATURAN PERUSAHAAN (MODAL, DLL) ---
  // Ini adalah bagian yang diperbaiki. Tidak ada lagi hardcode.
  const companySettings = await getCompanySettings();

  // --- 2. MENGAMBIL DATA TRANSAKSIONAL ---
  const [salesData, expensesData, purchasesData] = await Promise.all([
    // Ambil data penjualan
    supabase
      .from('sales')
      .select(`
        total,
        stores!inner(platforms!inner(nama_platform))
      `)
      .gte('tanggal', startDateStr)
      .lte('tanggal', endDateStr)
      .eq('status', 'delivered'),
    
    // Ambil data pengeluaran
    supabase
      .from('expenses')
      .select(`
        jumlah,
        expense_categories(name)
      `)
      .gte('tanggal', startDateStr)
      .lte('tanggal', endDateStr),

    // Ambil data pembelian (untuk HPP, jika menggunakan metode sederhana)
    supabase
        .from('purchases')
        .select('total')
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr)
        .in('payment_status', ['paid', 'partial'])
  ]);

  if (salesData.error) throw new Error('Gagal mengambil data penjualan: ' + salesData.error.message);
  if (expensesData.error) throw new Error('Gagal mengambil data pengeluaran: ' + expensesData.error.message);
  if (purchasesData.error) throw new Error('Gagal mengambil data pembelian: ' + purchasesData.error.message);

  // --- 3. KALKULASI ---

  // a. Pendapatan (Revenue)
  const total_penjualan = salesData.data?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
  const penjualanByPlatformMap = new Map<string, number>();
  salesData.data?.forEach(sale => {
    const platformName = sale.stores?.platforms?.nama_platform || 'Tidak Diketahui';
    const currentAmount = penjualanByPlatformMap.get(platformName) || 0;
    penjualanByPlatformMap.set(platformName, currentAmount + (sale.total || 0));
  });
  const penjualan_by_platform = Array.from(penjualanByPlatformMap, ([platform, amount]) => ({ platform, amount }));

  // b. Harga Pokok Penjualan (COGS)
  // NOTE: Ini adalah metode HPP sederhana berdasarkan total pembelian.
  // Untuk HPP yang lebih akurat, diperlukan perhitungan stok awal dan akhir.
  const total_hpp = purchasesData.data?.reduce((sum, p) => sum + p.total, 0) || 0;

  // c. Laba Kotor
  const gross_profit = total_penjualan - total_hpp;
  const gross_margin = total_penjualan > 0 ? (gross_profit / total_penjualan) * 100 : 0;

  // d. Biaya Operasional (Expenses)
  const total_expenses = expensesData.data?.reduce((sum, exp) => sum + (exp.jumlah || 0), 0) || 0;
  const expensesByCategoryMap = new Map<string, number>();
  expensesData.data?.forEach(exp => {
    const categoryName = exp.expense_categories?.name || 'Lainnya';
    const currentAmount = expensesByCategoryMap.get(categoryName) || 0;
    expensesByCategoryMap.set(categoryName, currentAmount + (exp.jumlah || 0));
  });
  const expenses_by_category = Array.from(expensesByCategoryMap, ([category, amount]) => ({ category, amount }));
  
  // e. Laba Bersih
  const net_profit = gross_profit - total_expenses;

  // --- 4. MENGEMBALIKAN HASIL ---
  return {
    revenue: { total_penjualan, penjualan_by_platform },
    cogs: { total_hpp },
    gross_profit,
    gross_margin,
    expenses: { total_expenses, expenses_by_category },
    net_profit,
  };
};


// --- FUNGSI HELPER UNTUK MENGAMBIL PENGATURAN PERUSAHAAN ---

/**
 * Mengambil pengaturan penting perusahaan dari tabel 'user_settings'.
 * Fungsi ini memastikan tidak ada nilai hardcoded.
 * @returns Object CompanySettings yang berisi modal awal.
 */
export const getCompanySettings = async (): Promise<CompanySettings> => {
    // Mengambil data dari user_settings. Diasumsikan hanya ada satu baris per user/perusahaan.
    const { data, error } = await supabase
        .from('user_settings')
        .select('modal_awal')
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // Abaikan jika tidak ada baris, tapi catat error lain
        console.error("Error fetching company settings:", error);
        // Jika gagal, kembalikan nilai default yang aman untuk mencegah aplikasi crash.
        return { modal_awal: 0 };
    }

    // Jika tidak ada data (misal user baru), kembalikan nilai default.
    // Jika ada data, gunakan nilai dari database.
    return {
        modal_awal: data?.modal_awal || 0
    };
}
