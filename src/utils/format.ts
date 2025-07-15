// ============================================================================
// FINTRACKS ULTIMATE - FORMATTING UTILITIES
// Indonesian Number & Currency Formatting
// ============================================================================

/**
 * Format number as Indonesian currency (Rupiah)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number with Indonesian thousand separators
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

/**
 * Parse formatted Indonesian number back to number
 */
export const parseFormattedNumber = (value: string): number => {
  // Remove currency symbols and spaces, then parse
  const cleaned = value.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

/**
 * Format Indonesian date
 */
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (date: string | Date): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format short date (DD/MM/YYYY)
 */
export const formatShortDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Format datetime
 */
export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Get date range presets in Indonesian
 */
export const getDateRangePresets = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return {
    today: {
      start: formatDateForInput(today),
      end: formatDateForInput(today),
      label: 'Hari Ini'
    },
    yesterday: {
      start: formatDateForInput(yesterday),
      end: formatDateForInput(yesterday),
      label: 'Kemarin'
    },
    thisWeek: {
      start: formatDateForInput(thisWeekStart),
      end: formatDateForInput(today),
      label: 'Minggu Ini'
    },
    thisMonth: {
      start: formatDateForInput(thisMonthStart),
      end: formatDateForInput(today),
      label: 'Bulan Ini'
    },
    lastMonth: {
      start: formatDateForInput(lastMonthStart),
      end: formatDateForInput(lastMonthEnd),
      label: 'Bulan Lalu'
    }
  };
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format compact numbers (1K, 1M, etc)
 */
export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

/**
 * Calculate profit margin percentage
 */
export const calculateProfitMargin = (sellPrice: number, buyPrice: number): number => {
  if (buyPrice === 0) return 0;
  return ((sellPrice - buyPrice) / sellPrice) * 100;
};

/**
 * Generate SKU
 */
export const generateSKU = (productName: string, color: string, size: string): string => {
  const productCode = productName.substring(0, 3).toUpperCase();
  const colorCode = color.substring(0, 2).toUpperCase();
  const sizeCode = size.toUpperCase();
  const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${productCode}-${colorCode}-${sizeCode}-${randomCode}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T, 
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
};

/**
 * Indonesian month names
 */
export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Indonesian day names
 */
export const INDONESIAN_DAYS = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

/**
 * Format relative time in Indonesian
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Hari ini';
  if (diffInDays === 1) return 'Kemarin';
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} minggu yang lalu`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} bulan yang lalu`;
  return `${Math.floor(diffInDays / 365)} tahun yang lalu`;
};