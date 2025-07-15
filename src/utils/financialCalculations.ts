import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface ProfitLossCalculation {
  revenue: {
    total_penjualan: number;
    penjualan_by_platform: Array<{
      platform: string;
      amount: number;
    }>;
  };
  cogs: {
    total_hpp: number;
  };
  expenses: {
    total_expenses: number;
    expenses_by_category: Array<{
      category: string;
      amount: number;
    }>;
  };
  gross_profit: number;
  net_profit: number;
  gross_margin: number;
}

export interface CompanySettings {
  modal_awal: number;
  company_name: string;
}

/**
 * Calculate profit/loss for a specific period
 */
export const calculateProfitLoss = async (
  startDate: Date, 
  endDate: Date
): Promise<ProfitLossCalculation> => {
  // Fetch sales data
  const { data: salesData } = await supabase
    .from('sales')
    .select(`
      total,
      subtotal,
      store_id,
      stores!inner(
        nama_toko,
        platforms!inner(nama_platform)
      )
    `)
    .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
    .lte('tanggal', format(endDate, 'yyyy-MM-dd'))
    .eq('stores.is_active', true);

  // Fetch purchase data for COGS
  const { data: purchaseData } = await supabase
    .from('purchases')
    .select('total')
    .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
    .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

  // Fetch expenses data
  const { data: expensesData } = await supabase
    .from('expenses')
    .select(`
      jumlah,
      categories(nama_kategori)
    `)
    .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
    .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

  // Calculate revenue
  const totalPenjualan = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
  
  // Group sales by platform
  const platformSales = salesData?.reduce((acc: any, sale) => {
    const platformName = sale.stores?.platforms?.nama_platform || 'Unknown';
    acc[platformName] = (acc[platformName] || 0) + (sale.total || 0);
    return acc;
  }, {}) || {};

  const penjualanByPlatform = Object.entries(platformSales).map(([platform, amount]) => ({
    platform,
    amount: amount as number
  }));

  // Calculate COGS
  const totalHpp = purchaseData?.reduce((sum, purchase) => sum + (purchase.total || 0), 0) || 0;

  // Calculate expenses
  const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
  
  // Group expenses by category
  const categoryExpenses = expensesData?.reduce((acc: any, expense) => {
    const categoryName = expense.categories?.nama_kategori || 'Lainnya';
    acc[categoryName] = (acc[categoryName] || 0) + (expense.jumlah || 0);
    return acc;
  }, {}) || {};

  const expensesByCategory = Object.entries(categoryExpenses).map(([category, amount]) => ({
    category,
    amount: amount as number
  }));

  const grossProfit = totalPenjualan - totalHpp;
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalPenjualan > 0 ? (grossProfit / totalPenjualan) * 100 : 0;

  return {
    revenue: {
      total_penjualan: totalPenjualan,
      penjualan_by_platform: penjualanByPlatform
    },
    cogs: {
      total_hpp: totalHpp
    },
    expenses: {
      total_expenses: totalExpenses,
      expenses_by_category: expensesByCategory
    },
    gross_profit: grossProfit,
    net_profit: netProfit,
    gross_margin: grossMargin
  };
};

/**
 * Calculate accumulated retained earnings (laba ditahan) from beginning until end date
 */
export const calculateRetainedEarnings = async (endDate: Date): Promise<number> => {
  // Get all profit/loss from beginning of time until end date
  const { data: salesData } = await supabase
    .from('sales')
    .select('total')
    .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

  const { data: purchaseData } = await supabase
    .from('purchases')
    .select('total')
    .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

  const { data: expensesData } = await supabase
    .from('expenses')
    .select('jumlah')
    .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

  const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
  const totalCogs = purchaseData?.reduce((sum, purchase) => sum + (purchase.total || 0), 0) || 0;
  const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;

  const accumulatedNetProfit = totalRevenue - totalCogs - totalExpenses;
  return accumulatedNetProfit;
};

/**
 * Get company settings including initial capital
 */
export const getCompanySettings = async (): Promise<CompanySettings> => {
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('company_name')
    .single();

  // For now, we'll use a default initial capital
  // In the future, this should be configurable in user_settings
  const modalAwal = 50000000; // Default 50 million IDR

  return {
    modal_awal: modalAwal,
    company_name: userSettings?.company_name || 'EQUINE Fashion'
  };
};

/**
 * Calculate hutang usaha (accounts payable) from unpaid purchases
 */
export const calculateAccountsPayable = async (endDate: Date): Promise<number> => {
  const { data: unpaidPurchases } = await supabase
    .from('purchases')
    .select('total')
    .eq('payment_status', 'pending')
    .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

  return unpaidPurchases?.reduce((sum, purchase) => sum + (purchase.total || 0), 0) || 0;
};