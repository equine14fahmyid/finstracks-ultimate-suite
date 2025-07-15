// ============================================================================
// FINTRACKS ULTIMATE - DATABASE TYPES
// Central database schema definitions
// ============================================================================

// Enum Types
export type UserRole = 'superadmin' | 'admin' | 'staff' | 'viewers';
export type TransactionStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'cash' | 'transfer' | 'credit';
export type CategoryType = 'income' | 'expense';
export type MovementType = 'in' | 'out' | 'adjustment';
export type ReferenceType = 'sale' | 'purchase' | 'return' | 'adjustment';

// Base interfaces
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface UserProfile extends BaseEntity {
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

// ============================================================================
// MASTER DATA TYPES
// ============================================================================

export interface Supplier extends BaseEntity {
  nama_supplier: string;
  alamat?: string;
  no_hp?: string;
  email?: string;
  deskripsi?: string;
}

export interface Bank extends BaseEntity {
  nama_bank: string;
  nama_pemilik: string;
  no_rekening: string;
  saldo_awal: number;
  saldo_akhir: number;
}

export interface Product extends BaseEntity {
  nama_produk: string;
  satuan: string;
  harga_beli: number;
  harga_jual_default: number;
  deskripsi?: string;
}

export interface ProductVariant extends BaseEntity {
  product_id: string;
  warna: string;
  size: string;
  stok: number;
  sku?: string;
  // Relations
  product?: Product;
}

export interface Platform extends BaseEntity {
  nama_platform: string;
  metode_pencairan?: string;
  komisi_default_persen: number;
}

export interface Store extends BaseEntity {
  platform_id: string;
  nama_toko: string;
  nama_marketing: string;
  email?: string;
  no_hp?: string;
  link_toko?: string;
  saldo_dashboard: number;
  // Relations
  platform?: Platform;
}

export interface Expedition extends BaseEntity {
  nama_ekspedisi: string;
  kode_ekspedisi?: string;
}

export interface Asset extends BaseEntity {
  kode_asset: string;
  nama_asset: string;
  harga_perolehan: number;
  tanggal_perolehan: string;
  umur_ekonomis_bulan: number;
  nilai_buku?: number;
  penyusutan_per_bulan?: number;
  akumulasi_penyusutan: number;
}

export interface Category extends BaseEntity {
  nama_kategori: string;
  tipe_kategori: CategoryType;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface Sale extends BaseEntity {
  tanggal: string;
  no_pesanan_platform: string;
  store_id: string;
  expedition_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  subtotal: number;
  ongkir: number;
  diskon: number;
  total: number;
  no_resi?: string;
  status: TransactionStatus;
  notes?: string;
  created_by?: string;
  validated_at?: string;
  needs_adjustment?: boolean;
  adjustment_notes?: string;
  // Relations
  store?: Store;
  expedition?: Expedition;
  sale_items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_variant_id: string;
  quantity: number;
  harga_satuan: number;
  subtotal: number;
  created_at: string;
  // Relations
  product_variant?: ProductVariant;
  sale?: Sale;
}

export interface Purchase extends BaseEntity {
  tanggal: string;
  supplier_id: string;
  no_invoice_supplier?: string;
  subtotal: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: string;
  notes?: string;
  created_by?: string;
  // Relations
  supplier?: Supplier;
  purchase_items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_variant_id: string;
  quantity: number;
  harga_beli_satuan: number;
  subtotal: number;
  created_at: string;
  // Relations
  product_variant?: ProductVariant;
  purchase?: Purchase;
}

export interface Expense extends BaseEntity {
  tanggal: string;
  category_id: string;
  jumlah: number;
  bank_id?: string;
  keterangan?: string;
  created_by?: string;
  // Relations
  category?: Category;
  bank?: Bank;
}

export interface Income extends BaseEntity {
  tanggal: string;
  category_id: string;
  jumlah: number;
  bank_id?: string;
  keterangan?: string;
  created_by?: string;
  // Relations
  category?: Category;
  bank?: Bank;
}

export interface Settlement extends BaseEntity {
  tanggal: string;
  store_id: string;
  jumlah_dicairkan: number;
  bank_id?: string;
  biaya_admin: number;
  keterangan?: string;
  created_by?: string;
  // Relations
  store?: Store;
  bank?: Bank;
}

export interface StockMovement {
  id: string;
  product_variant_id: string;
  movement_type: MovementType;
  quantity: number;
  reference_type?: ReferenceType;
  reference_id?: string;
  notes?: string;
  created_at: string;
  // Relations
  product_variant?: ProductVariant;
}

export interface SalesAdjustment extends BaseEntity {
  sale_id: string;
  adjustment_type: 'penalty' | 'shipping_diff' | 'commission' | 'other';
  amount: number;
  notes?: string;
  created_by?: string;
  // Relations
  sale?: Sale;
}

export interface StockAlert extends BaseEntity {
  product_variant_id: string;
  min_stock_threshold: number;
  alert_enabled: boolean;
  last_alert_sent?: string;
  // Relations
  product_variant?: ProductVariant;
}

export interface Notification extends BaseEntity {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  action_url?: string;
}

export interface UserSettings extends BaseEntity {
  user_id: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  tax_number?: string;
  logo_url?: string;
  theme: 'light' | 'dark';
  language: 'id' | 'en';
  timezone: string;
  date_format: string;
  currency: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  low_stock_alerts: boolean;
  payment_reminders: boolean;
  daily_reports: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
  login_attempts: number;
  password_expiry: number;
  session_timeout: number;
  two_factor_auth: boolean;
}