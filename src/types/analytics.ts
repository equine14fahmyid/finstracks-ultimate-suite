// ============================================================================
// FINTRACKS ULTIMATE - ANALYTICS TYPES
// Dashboard, reporting, and analytics types
// ============================================================================

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardSummary {
  total_penjualan: number;
  total_pengeluaran: number;
  laba_bersih: number;
  saldo_kas_bank: number;
  periode: string;
}

export interface DashboardMetrics {
  today: {
    sales: number;
    expenses: number;
    profit: number;
    orders: number;
  };
  thisMonth: {
    sales: number;
    expenses: number;
    profit: number;
    orders: number;
  };
  thisYear: {
    sales: number;
    expenses: number;
    profit: number;
    orders: number;
  };
}

// ============================================================================
// SALES ANALYTICS
// ============================================================================

export interface SalesAnalytics {
  daily_sales: DailySales[];
  top_products: TopProduct[];
  platform_performance: PlatformPerformance[];
  monthly_trend: MonthlySales[];
}

export interface DailySales {
  date: string;
  total: number;
  transaction_count: number;
  profit: number;
}

export interface TopProduct {
  product_name: string;
  variant_display: string;
  quantity_sold: number;
  total_revenue: number;
  profit_margin: number;
}

export interface PlatformPerformance {
  platform_name: string;
  total_sales: number;
  transaction_count: number;
  commission_paid: number;
  profit_after_commission: number;
  growth_rate: number;
}

export interface MonthlySales {
  month: string;
  year: number;
  total: number;
  orders: number;
  profit: number;
}

// ============================================================================
// EXPENSE ANALYTICS
// ============================================================================

export interface ExpenseAnalytics {
  by_category: ExpenseByCategory[];
  monthly_trend: MonthlyExpense[];
  top_expenses: TopExpense[];
}

export interface ExpenseByCategory {
  category_name: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

export interface MonthlyExpense {
  month: string;
  year: number;
  total: number;
  count: number;
}

export interface TopExpense {
  category_name: string;
  amount: number;
  date: string;
  description: string;
}

// ============================================================================
// INVENTORY ANALYTICS
// ============================================================================

export interface InventoryAnalytics {
  low_stock_items: LowStockItem[];
  top_moving_products: TopMovingProduct[];
  stock_value: StockValue;
  turnover_rate: TurnoverRate[];
}

export interface LowStockItem {
  product_name: string;
  variant_display: string;
  current_stock: number;
  reorder_level: number;
  days_until_stockout: number;
}

export interface TopMovingProduct {
  product_name: string;
  variant_display: string;
  total_sold: number;
  turnover_rate: number;
  profit_contribution: number;
}

export interface StockValue {
  total_items: number;
  total_value: number;
  average_value_per_item: number;
}

export interface TurnoverRate {
  product_name: string;
  variant_display: string;
  turnover_rate: number;
  days_of_supply: number;
}

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

export interface ProfitLossReport {
  periode: string;
  revenue: {
    total_penjualan: number;
    penjualan_by_platform: Array<{
      platform: string;
      amount: number;
      percentage: number;
    }>;
  };
  cogs: {
    total_hpp: number;
    hpp_breakdown: Array<{
      product: string;
      amount: number;
      percentage: number;
    }>;
  };
  expenses: {
    total_expenses: number;
    expenses_by_category: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  net_profit: number;
  gross_margin: number;
  profit_margin: number;
}

export interface BalanceSheet {
  periode: string;
  assets: {
    current_assets: {
      kas_bank: number;
      piutang: number;
      persediaan: number;
      total: number;
    };
    fixed_assets: {
      equipment: number;
      accumulated_depreciation: number;
      total: number;
    };
    total_assets: number;
  };
  liabilities: {
    current_liabilities: {
      hutang_usaha: number;
      hutang_lainnya: number;
      total: number;
    };
    total_liabilities: number;
  };
  equity: {
    modal_awal: number;
    laba_ditahan: number;
    laba_tahun_berjalan: number;
    total: number;
  };
}

export interface CashFlowReport {
  periode: string;
  operating_activities: {
    penerimaan_dari_penjualan: number;
    pembayaran_ke_supplier: number;
    pembayaran_biaya_operasional: number;
    net_operating_cash: number;
  };
  investing_activities: {
    pembelian_aset: number;
    penjualan_aset: number;
    net_investing_cash: number;
  };
  financing_activities: {
    tambahan_modal: number;
    penarikan_modal: number;
    pinjaman: number;
    pembayaran_pinjaman: number;
    net_financing_cash: number;
  };
  net_cash_flow: number;
  beginning_cash: number;
  ending_cash: number;
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

export interface ChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ComparativeData {
  period: string;
  current: number;
  previous: number;
  growth: number;
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface FilterOptions {
  date_from?: string;
  date_to?: string;
  store_id?: string;
  platform_id?: string;
  category_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export interface PerformanceMetrics {
  kpi: {
    revenue_growth: number;
    profit_margin: number;
    inventory_turnover: number;
    customer_acquisition_cost: number;
    average_order_value: number;
  };
  trends: {
    sales_trend: 'up' | 'down' | 'stable';
    expense_trend: 'up' | 'down' | 'stable';
    profit_trend: 'up' | 'down' | 'stable';
  };
  alerts: {
    low_stock_count: number;
    overdue_payments: number;
    high_expense_categories: string[];
  };
}

// ============================================================================
// EXPORT SUMMARY TYPES
// ============================================================================

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  period: DateRange;
  include_charts?: boolean;
  include_details?: boolean;
}

export interface ExportResult {
  success: boolean;
  file_url?: string;
  file_name?: string;
  error?: string;
}

// ============================================================================
// DASHBOARD ANALYTICS DATA
// ============================================================================

export interface DashboardAnalyticsData {
  total_penjualan: number;
  total_pengeluaran: number;
  laba_bersih: number;
  saldo_kas_bank: number;
  periode: string;
}

// ============================================================================
// LOW STOCK AND TOP SELLING PRODUCT TYPES
// ============================================================================

export interface LowStockProduct {
  product_name: string;
  variant_display: string;
  current_stock: number;
  reorder_level: number;
}

export interface TopSellingProduct {
  product_name: string;
  variant_display: string;
  quantity_sold: number;
  revenue: number;
}

// ============================================================================
// RECENT ACTIVITY TYPES
// ============================================================================

export interface RecentActivityData {
  id: string;
  type: 'sale' | 'purchase';
  amount: number;
  customer_name?: string;
  supplier_name?: string;
  status: string;
  created_at: string;
}
