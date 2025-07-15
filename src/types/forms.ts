// ============================================================================
// FINTRACKS ULTIMATE - FORM TYPES
// Form data and validation types
// ============================================================================

import { TransactionStatus, PaymentMethod } from './database';

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface SaleFormData {
  tanggal: string;
  no_pesanan_platform: string;
  store_id: string;
  expedition_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  ongkir: number;
  diskon: number;
  no_resi?: string;
  status: TransactionStatus;
  notes?: string;
  items: SaleItemFormData[];
}

export interface SaleItemFormData {
  product_variant_id: string;
  quantity: number;
  harga_satuan: number;
  // For display purposes
  product_name?: string;
  variant_display?: string;
  available_stock?: number;
}

export interface PurchaseFormData {
  tanggal: string;
  supplier_id: string;
  no_invoice_supplier?: string;
  payment_method: PaymentMethod;
  payment_status: string;
  notes?: string;
  items: PurchaseItemFormData[];
}

export interface PurchaseItemFormData {
  product_variant_id: string;
  quantity: number;
  harga_beli_satuan: number;
  // For display purposes
  product_name?: string;
  variant_display?: string;
}

export interface ExpenseFormData {
  tanggal: string;
  category_id: string;
  jumlah: number;
  bank_id?: string;
  keterangan?: string;
}

export interface IncomeFormData {
  tanggal: string;
  category_id: string;
  jumlah: number;
  bank_id?: string;
  keterangan?: string;
}

export interface SettlementFormData {
  tanggal: string;
  store_id: string;
  jumlah_dicairkan: number;
  bank_id?: string;
  biaya_admin: number;
  keterangan?: string;
}

export interface ProductFormData {
  nama_produk: string;
  satuan: string;
  harga_beli: number;
  harga_jual_default: number;
  deskripsi?: string;
  variants: ProductVariantFormData[];
}

export interface ProductVariantFormData {
  warna: string;
  size: string;
  stok: number;
  sku?: string;
}

export interface SupplierFormData {
  nama_supplier: string;
  alamat?: string;
  no_hp?: string;
  email?: string;
  deskripsi?: string;
}

export interface BankFormData {
  nama_bank: string;
  nama_pemilik: string;
  no_rekening: string;
  saldo_awal: number;
}

export interface CategoryFormData {
  nama_kategori: string;
  tipe_kategori: 'income' | 'expense';
}

export interface StoreFormData {
  platform_id: string;
  nama_toko: string;
  nama_marketing: string;
  email?: string;
  no_hp?: string;
  link_toko?: string;
  saldo_dashboard: number;
}

export interface PlatformFormData {
  nama_platform: string;
  metode_pencairan?: string;
  komisi_default_persen: number;
}

export interface ExpeditionFormData {
  nama_ekspedisi: string;
  kode_ekspedisi?: string;
}

export interface AssetFormData {
  kode_asset: string;
  nama_asset: string;
  harga_perolehan: number;
  tanggal_perolehan: string;
  umur_ekonomis_bulan: number;
}

export interface AdjustmentFormData {
  sale_id: string;
  adjustment_type: 'penalty' | 'shipping_diff' | 'commission' | 'other';
  amount: number;
  notes?: string;
}

export interface UserProfileFormData {
  full_name: string;
  role: 'superadmin' | 'admin' | 'staff' | 'viewers';
  avatar_url?: string;
  phone?: string;
}

export interface UserSettingsFormData {
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  tax_number?: string;
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

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

export interface FormValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: FormValidationError[];
}

// ============================================================================
// FORM STATE TYPES
// ============================================================================

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// ============================================================================
// FORM HOOK TYPES
// ============================================================================

export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: any;
  onSubmit: (values: T) => Promise<void> | void;
  enableReinitialize?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  handleReset: () => void;
  validateField: (field: keyof T) => void;
  validateForm: () => boolean;
}