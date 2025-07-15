// ============================================================================
// FINTRACKS ULTIMATE - CENTRAL TYPE EXPORTS
// Main export file for all TypeScript definitions
// ============================================================================

// Database Types
export * from './database';

// Form Types
export * from './forms';

// Analytics Types
export * from './analytics';

// API Types
export * from './api';

// ============================================================================
// SUPABASE INTEGRATION TYPES
// ============================================================================

import type {
  UserProfile,
  Supplier,
  Bank,
  Product,
  ProductVariant,
  Platform,
  Store,
  Expedition,
  Asset,
  Category,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  Expense,
  Income,
  Settlement,
  StockMovement,
  SalesAdjustment,
  StockAlert,
  Notification,
  UserSettings,
} from './database';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      suppliers: {
        Row: Supplier;
        Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>;
      };
      banks: {
        Row: Bank;
        Insert: Omit<Bank, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Bank, 'id' | 'created_at' | 'updated_at'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>>;
      };
      platforms: {
        Row: Platform;
        Insert: Omit<Platform, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Platform, 'id' | 'created_at' | 'updated_at'>>;
      };
      stores: {
        Row: Store;
        Insert: Omit<Store, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Store, 'id' | 'created_at' | 'updated_at'>>;
      };
      expeditions: {
        Row: Expedition;
        Insert: Omit<Expedition, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Expedition, 'id' | 'created_at' | 'updated_at'>>;
      };
      assets: {
        Row: Asset;
        Insert: Omit<Asset, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Asset, 'id' | 'created_at' | 'updated_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Sale, 'id' | 'created_at' | 'updated_at'>>;
      };
      sale_items: {
        Row: SaleItem;
        Insert: Omit<SaleItem, 'id' | 'created_at'>;
        Update: Partial<Omit<SaleItem, 'id' | 'created_at'>>;
      };
      purchases: {
        Row: Purchase;
        Insert: Omit<Purchase, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Purchase, 'id' | 'created_at' | 'updated_at'>>;
      };
      purchase_items: {
        Row: PurchaseItem;
        Insert: Omit<PurchaseItem, 'id' | 'created_at'>;
        Update: Partial<Omit<PurchaseItem, 'id' | 'created_at'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>;
      };
      incomes: {
        Row: Income;
        Insert: Omit<Income, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Income, 'id' | 'created_at' | 'updated_at'>>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Settlement, 'id' | 'created_at' | 'updated_at'>>;
      };
      stock_movements: {
        Row: StockMovement;
        Insert: Omit<StockMovement, 'id' | 'created_at'>;
        Update: Partial<Omit<StockMovement, 'id' | 'created_at'>>;
      };
      sales_adjustments: {
        Row: SalesAdjustment;
        Insert: Omit<SalesAdjustment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SalesAdjustment, 'id' | 'created_at' | 'updated_at'>>;
      };
      stock_alerts: {
        Row: StockAlert;
        Insert: Omit<StockAlert, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StockAlert, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: { user_id: string };
        Returns: import('./database').UserRole;
      };
      check_low_stock: {
        Args: {};
        Returns: void;
      };
      validate_sale_with_adjustments: {
        Args: { 
          sale_id_param: string;
          adjustments?: any;
        };
        Returns: void;
      };
    };
    Enums: {
      user_role: import('./database').UserRole;
      transaction_status: import('./database').TransactionStatus;
      payment_method: import('./database').PaymentMethod;
      category_type: import('./database').CategoryType;
      adjustment_type: 'penalty' | 'shipping_diff' | 'commission' | 'other';
    };
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return phoneRegex.test(phone);
}

export function isValidCurrency(amount: number): boolean {
  return typeof amount === 'number' && amount >= 0 && isFinite(amount);
}

export function isValidDate(date: string): boolean {
  return !isNaN(Date.parse(date));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createSelectOptions<T>(
  items: T[],
  valueKey: keyof T,
  labelKey: keyof T,
  disabledKey?: keyof T
): import('./api').SelectOption[] {
  return items.map(item => ({
    value: String(item[valueKey]),
    label: String(item[labelKey]),
    disabled: disabledKey ? Boolean(item[disabledKey]) : false
  }));
}

export function formatCurrency(
  amount: number,
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  format: string = 'dd/MM/yyyy',
  locale: string = 'id-ID'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale).format(dateObj);
}

export function formatPercentage(
  value: number,
  decimals: number = 2,
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  sort_by: 'created_at',
  sort_order: 'desc' as const
};

export const SUPPORTED_CURRENCIES = ['IDR', 'USD', 'EUR'] as const;
export const SUPPORTED_LOCALES = ['id-ID', 'en-US'] as const;
export const SUPPORTED_THEMES = ['light', 'dark'] as const;

export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  ISO: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm'
} as const;

export const TRANSACTION_STATUSES = [
  'pending',
  'processing', 
  'shipped',
  'delivered',
  'cancelled',
  'returned'
] as const;

export const PAYMENT_METHODS = [
  'cash',
  'transfer',
  'credit'
] as const;

export const USER_ROLES = [
  'superadmin',
  'admin',
  'staff',
  'viewers'
] as const;

export const CATEGORY_TYPES = [
  'income',
  'expense'
] as const;