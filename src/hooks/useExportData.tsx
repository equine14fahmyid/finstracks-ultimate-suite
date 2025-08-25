
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/utils/format';

export type ExportFormat = 'csv' | 'pdf' | 'xlsx';
export type ExportType = 'sales' | 'purchases' | 'inventory' | 'financial' | 'full';

interface ExportOptions {
  type: ExportType;
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeDetails?: boolean;
}

export const useExportData = () => {
  const [exporting, setExporting] = useState(false);

  const generateCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const downloadFile = (content: string, filename: string, type: string = 'text/csv') => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportSalesData = async (options: ExportOptions) => {
    const { data: salesData, error } = await supabase
      .from('sales')
      .select(`
        tanggal,
        no_pesanan_platform,
        customer_name,
        customer_phone,
        subtotal,
        ongkir,
        diskon,
        total,
        status,
        stores!inner(nama_toko),
        sale_items(
          quantity,
          harga_satuan,
          subtotal,
          product_variants!inner(
            warna,
            size,
            products!inner(nama_produk)
          )
        )
      `)
      .gte('tanggal', options.dateRange?.start?.toISOString().split('T')[0])
      .lte('tanggal', options.dateRange?.end?.toISOString().split('T')[0])
      .order('tanggal', { ascending: false });

    if (error) throw error;

    if (options.format === 'csv') {
      const flatData = salesData?.map(sale => ({
        tanggal: formatDate(sale.tanggal),
        no_pesanan: sale.no_pesanan_platform,
        toko: sale.stores?.nama_toko,
        customer: sale.customer_name,
        phone: sale.customer_phone,
        subtotal: sale.subtotal,
        ongkir: sale.ongkir,
        diskon: sale.diskon,
        total: sale.total,
        status: sale.status,
        items: sale.sale_items?.map((item: any) => 
          `${item.product_variants.products.nama_produk} (${item.product_variants.warna}, ${item.product_variants.size}) x${item.quantity}`
        ).join('; ')
      })) || [];

      const headers = ['tanggal', 'no_pesanan', 'toko', 'customer', 'phone', 'subtotal', 'ongkir', 'diskon', 'total', 'status', 'items'];
      const csvContent = generateCSV(flatData, headers);
      
      const filename = `penjualan_${options.dateRange?.start?.toISOString().split('T')[0]}_${options.dateRange?.end?.toISOString().split('T')[0]}.csv`;
      downloadFile(csvContent, filename);
    }

    return salesData;
  };

  const exportPurchasesData = async (options: ExportOptions) => {
    const { data: purchasesData, error } = await supabase
      .from('purchases')
      .select(`
        tanggal,
        no_invoice_supplier,
        subtotal,
        total,
        payment_status,
        payment_method,
        suppliers!inner(nama_supplier),
        purchase_items(
          quantity,
          harga_beli_satuan,
          subtotal,
          product_variants!inner(
            warna,
            size,
            products!inner(nama_produk)
          )
        )
      `)
      .gte('tanggal', options.dateRange?.start?.toISOString().split('T')[0])
      .lte('tanggal', options.dateRange?.end?.toISOString().split('T')[0])
      .order('tanggal', { ascending: false });

    if (error) throw error;

    if (options.format === 'csv') {
      const flatData = purchasesData?.map(purchase => ({
        tanggal: formatDate(purchase.tanggal),
        no_invoice: purchase.no_invoice_supplier,
        supplier: purchase.suppliers?.nama_supplier,
        subtotal: purchase.subtotal,
        total: purchase.total,
        payment_status: purchase.payment_status,
        payment_method: purchase.payment_method,
        items: purchase.purchase_items?.map((item: any) => 
          `${item.product_variants.products.nama_produk} (${item.product_variants.warna}, ${item.product_variants.size}) x${item.quantity}`
        ).join('; ')
      })) || [];

      const headers = ['tanggal', 'no_invoice', 'supplier', 'subtotal', 'total', 'payment_status', 'payment_method', 'items'];
      const csvContent = generateCSV(flatData, headers);
      
      const filename = `pembelian_${options.dateRange?.start?.toISOString().split('T')[0]}_${options.dateRange?.end?.toISOString().split('T')[0]}.csv`;
      downloadFile(csvContent, filename);
    }

    return purchasesData;
  };

  const exportInventoryData = async (options: ExportOptions) => {
    const { data: inventoryData, error } = await supabase
      .from('product_variants')
      .select(`
        warna,
        size,
        stok,
        sku,
        products!inner(
          nama_produk,
          harga_beli,
          harga_jual_default,
          satuan
        )
      `)
      .order('products.nama_produk');

    if (error) throw error;

    if (options.format === 'csv') {
      const flatData = inventoryData?.map(variant => ({
        nama_produk: variant.products.nama_produk,
        warna: variant.warna,
        size: variant.size,
        sku: variant.sku,
        stok: variant.stok,
        satuan: variant.products.satuan,
        harga_beli: variant.products.harga_beli,
        harga_jual: variant.products.harga_jual_default,
        nilai_stok: variant.stok * Number(variant.products.harga_beli)
      })) || [];

      const headers = ['nama_produk', 'warna', 'size', 'sku', 'stok', 'satuan', 'harga_beli', 'harga_jual', 'nilai_stok'];
      const csvContent = generateCSV(flatData, headers);
      
      const filename = `inventori_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csvContent, filename);
    }

    return inventoryData;
  };

  const exportData = async (options: ExportOptions) => {
    try {
      setExporting(true);

      switch (options.type) {
        case 'sales':
          await exportSalesData(options);
          break;
        case 'purchases':
          await exportPurchasesData(options);
          break;
        case 'inventory':
          await exportInventoryData(options);
          break;
        case 'financial':
          // Will implement financial export
          toast({
            title: "Info",
            description: "Export laporan keuangan akan segera tersedia"
          });
          break;
        case 'full':
          // Will implement full export
          toast({
            title: "Info", 
            description: "Export lengkap akan segera tersedia"
          });
          break;
        default:
          throw new Error('Tipe export tidak dikenal');
      }

      toast({
        title: "Berhasil",
        description: "Data berhasil diexport"
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Gagal mengexport data: " + error.message,
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return {
    exportData,
    exporting
  };
};
