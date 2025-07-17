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

  const companySettings = await getCompanySettings();

  // --- PERBAIKAN PADA QUERY PENGELUARAN ---
  // Kita akan mengambil semua kolom dari expense_categories untuk penanganan error yang lebih baik
  const [salesData, expensesData, purchasesData] = await Promise.all([
    supabase
      .from('sales')
      .select(`total, stores!inner(platforms!inner(nama_platform))`)
      .gte('tanggal', startDateStr)
      .lte('tanggal', endDateStr)
      .eq('status', 'delivered'),
    
    supabase
      .from('expenses')
      .select(`jumlah, expense_categories(*)`) // Mengambil semua kolom dari kategori
      .gte('tanggal', startDateStr)
      .lte('tanggal', endDateStr),

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

  // d. Biaya Operasional
  const total_expenses = expensesData.data?.reduce((sum, exp) => sum + (exp.jumlah || 0), 0) || 0;
  const expensesByCategoryMap = new Map<string, number>();
  expensesData.data?.forEach(exp => {
    // --- PERBAIKAN UNTUK MENGATASI ERROR TIPE DATA ---
    const categoryObj = exp.expense_categories as any;
    // Cek dengan aman apakah objek kategori ada dan properti 'name' adalah string
    const categoryName = (categoryObj && typeof categoryObj.name === 'string')
      ? categoryObj.name
      : 'Lain-lain';
      
    const currentAmount = expensesByCategoryMap.get(categoryName) || 0;
    expensesByCategoryMap.set(categoryName, currentAmount + (exp.jumlah || 0));
  });
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
