import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// --- INTERFACE & TIPE DATA ---

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

interface CompanySettings {
    modal_awal: number;
}

// --- FUNGSI UTAMA UNTUK MENGHITUNG LABA RUGI ---

export const calculateProfitLoss = async (startDate: Date, endDate: Date): Promise<ProfitLossCalculation> => {
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  // --- PERBAIKAN FINAL: Hanya mengambil kolom yang pasti ada ---
  const [
    salesData, 
    expensesResponse,
    purchasesData
    // Tidak perlu lagi mengambil categoriesData karena tidak bisa dihubungkan
  ] = await Promise.all([
    // 1. Ambil data penjualan (tidak berubah)
    supabase
      .from('sales')
      .select(`total, stores!inner(platforms!inner(nama_platform))`)
      .gte('tanggal', startDateStr)
      .lte('tanggal', endDateStr)
      .eq('status', 'delivered'),
    
    // 2. Ambil data pengeluaran (HANYA kolom 'jumlah')
    supabase
      .from('expenses')
      .select(`jumlah`) // Hanya mengambil kolom 'jumlah' yang kita tahu pasti ada
      .gte('tanggal', startDateStr)
      .lte('tanggal', endDateStr),

    // 3. Ambil data pembelian (tidak berubah)
    supabase
        .from('purchases')
        .select('total')
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr)
        .in('payment_status', ['paid', 'partial']),
  ]);

  // Penanganan error untuk setiap query
  if (salesData.error) throw new Error('Gagal mengambil data penjualan: ' + salesData.error.message);
  if (expensesResponse.error) throw new Error('Gagal mengambil data pengeluaran: ' + expensesResponse.error.message);
  if (purchasesData.error) throw new Error('Gagal mengambil data pembelian: ' + purchasesData.error.message);
  
  // --- KALKULASI ---

  // a. Pendapatan
  const total_penjualan = salesData.data?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
  const penjualanByPlatformMap = new Map<string, number>();
  salesData.data?.forEach(sale => {
    const platformName = sale.stores?.platforms?.nama_platform || 'Tidak Diketahui';
    const currentAmount = penjualanByPlatformMap.get(platformName) || 0;
    penjualanByPlatformMap.set(platformName, currentAmount + (sale.total || 0));
  });
  const penjualan_by_platform = Array.from(penjualanByPlatformMap, ([platform, amount]) => ({ platform, amount }));

  // b. HPP
  const total_hpp = purchasesData.data?.reduce((sum, p) => sum + p.total, 0) || 0;

  // c. Laba Kotor
  const gross_profit = total_penjualan - total_hpp;
  const gross_margin = total_penjualan > 0 ? (gross_profit / total_penjualan) * 100 : 0;

  // d. Biaya Operasional (Semua akan masuk ke kategori "Lain-lain")
  const total_expenses = expensesResponse.data?.reduce((sum, exp) => sum + (exp.jumlah || 0), 0) || 0;
  const expensesByCategoryMap = new Map<string, number>();
  // Karena tidak ada info kategori, semua pengeluaran digabung
  if (total_expenses > 0) {
    expensesByCategoryMap.set('Lain-lain', total_expenses);
  }
  const expenses_by_category = Array.from(expensesByCategoryMap, ([category, amount]) => ({ category, amount }));
  
  // e. Laba Bersih
  const net_profit = gross_profit - total_expenses;

  return {
    revenue: { total_penjualan, penjualan_by_platform },
    cogs: { total_hpp },
    gross_profit,
    gross_margin,
    expenses: { total_expenses, expenses_by_category },
    net_profit,
  };
};

// --- FUNGSI HELPER (TIDAK BERUBAH) ---
export const getCompanySettings = async (): Promise<CompanySettings> => {
    const { data, error } = await supabase
        .from('user_settings')
        .select('modal_awal')
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching company settings:", error);
        return { modal_awal: 0 };
    }

    return {
        modal_awal: data?.modal_awal || 0
    };
}
