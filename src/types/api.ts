// ============================================================================
// FINTRACKS ULTIMATE - API TYPES
// API request/response and utility types
// ============================================================================

import { TransactionStatus } from './database';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
  status?: number;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
  filters?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface TableColumn {
  key: string;
  title: string;
  dataIndex?: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

export interface TableAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: any) => void;
  disabled?: (record: any) => boolean;
  hidden?: (record: any) => boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'nin';
  value: any;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | undefined;
  };
}

export interface FormConfig {
  fields: FormField[];
  submitLabel?: string;
  resetLabel?: string;
  layout?: 'horizontal' | 'vertical';
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  dismissible?: boolean;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: string;
  isSuccess: boolean;
}

export interface AsyncState<T> extends LoadingState {
  data?: T;
  lastUpdated?: string;
}

export interface CacheState<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// ============================================================================
// FILTER AND SEARCH TYPES
// ============================================================================

export interface FilterState {
  activeFilters: Record<string, any>;
  searchTerm: string;
  sortConfig: SortConfig;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportConfig {
  format: 'csv' | 'pdf' | 'excel';
  filename?: string;
  fields?: string[];
  filters?: Record<string, any>;
  template?: string;
}

export interface ExportProgress {
  percentage: number;
  stage: 'preparing' | 'processing' | 'generating' | 'complete';
  message?: string;
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';
  allowed: boolean;
}

export interface UserPermissions {
  [resource: string]: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
    import: boolean;
  };
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface AuditFilter {
  user_id?: string;
  action?: string;
  resource?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookEvent {
  id: string;
  event_type: string;
  resource: string;
  resource_id: string;
  data: Record<string, any>;
  timestamp: string;
  signature: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface IntegrationConfig {
  platform: string;
  credentials: Record<string, string>;
  settings: Record<string, any>;
  enabled: boolean;
  last_sync?: string;
}

export interface SyncResult {
  success: boolean;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  errors: string[];
  duration: number;
}