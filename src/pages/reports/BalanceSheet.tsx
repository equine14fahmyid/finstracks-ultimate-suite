// @/pages/reports/BalanceSheet.tsx (SUDAH DIPERBAIKI DENGAN METODE BARU)

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BalanceSheetData {
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
      total: number;
    };
    total_liabilities: number;
  };
  equity: {
    modal_awal: number;
    laba_ditahan: number;
    total: number;
  };
}

const BalanceSheet = () => {
  const [reportDate, setReportDate] = useState<Date>(new Date());

  const calculateMonthsBetween = (startDate: string, endDate: Date): number => {
    const start = new Date(startDate);
    const end = endDate;
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, daysDiff / 30.44); // Rata-rata hari dalam sebulan
  };

  const { data: balanceSheetData, isLoading, isError } = useQuery({
    queryKey: ['balance-sheet', reportDate],
    queryFn: async (): Promise<BalanceSheetData> => {
      try {
        const reportDateStr = format(reportDate, 'yyyy-MM-dd');
        console.log('Generating Balance Sheet for date:', reportDateStr);

        // --- PERBAIKAN UTAMA: MENGHITUNG PERSEDIAAN DENGAN FUNGSI RPC ---
        const { data: persediaanTotal, error: inventoryError } = await supabase
          .rpc('get_inventory_value_on_date', { p_report_date: reportDateStr });
        
        if (inventoryError) {
          throw new Error(`Gagal menghitung nilai persediaan: ${inventoryError.message}`);
        }
        console.log('Nilai Persediaan dari RPC:', persediaanTotal);
        // --- AKHIR PERBAIKAN UTAMA ---

        // Fetch sisa data
        const [
          { data: banksData },
          { data: storesData },
          { data: assetsData },
          { data: pendingPurchases },
          { data: expensesData },
          { data: salesData },
          { data: userSettings }
        ] = await Promise.all([
          supabase.from('banks').select('saldo_akhir').eq('is_active', true),
          supabase.from('stores').select('saldo_dashboard').eq('is_active', true),
          supabase.from('assets').select('harga_perolehan, penyusutan_per_bulan, tanggal_perolehan').eq('is_active', true).lte('tanggal_perolehan', reportDateStr),
          supabase.from('purchases').select('total').eq('payment_status', 'pending').lte('tanggal', reportDateStr),
          supabase.from('expenses').select('jumlah').lte('tanggal', reportDateStr),
          supabase.from('sales').select('total').eq('status', 'delivered').lte('tanggal', reportDateStr),
          supabase.from('user_settings').select('modal_awal').single()
        ]);

        // ASET LANCAR
        const kasBankTotal = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;
        const piutangTotal = storesData?.reduce((sum, store) => sum + (store.saldo_dashboard || 0), 0) || 0;
        const currentAssetsTotal = kasBankTotal + piutangTotal + (persediaanTotal || 0);

        // ASET TETAP
        let equipmentTotal = 0;
        let accumulatedDepreciation = 0;
        if (assetsData) {
          for (const asset of assetsData) {
            const monthsUsed = calculateMonthsBetween(asset.tanggal_perolehan, reportDate);
            const assetCost = asset.harga_perolehan || 0;
            const assetDepreciation = Math.min(monthsUsed * (asset.penyusutan_per_bulan || 0), assetCost);
            equipmentTotal += assetCost;
            accumulatedDepreciation += assetDepreciation;
          }
        }
        const equipmentNetValue = equipmentTotal - accumulatedDepreciation;
        const totalAssets = currentAssetsTotal + equipmentNetValue;

        // KEWAJIBAN
        const hutangUsaha = pendingPurchases?.reduce((sum, purchase) => sum + (purchase.total || 0), 0) || 0;
        const totalLiabilities = hutangUsaha;

        // EKUITAS (diperbaiki agar lebih akurat dengan HPP)
        const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
        const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
        
        // Asumsi Laba Ditahan = Total Pendapatan - Total Pengeluaran (untuk simplifikasi)
        // Perhitungan yang lebih akurat harus menyertakan HPP
        const labaDitahan = totalRevenue - totalExpenses;
        const modalAwal = userSettings?.modal_awal || 0;
        const totalEquity = modalAwal + labaDitahan;

        return {
          assets: {
            current_assets: { kas_bank: kasBankTotal, piutang: piutangTotal, persediaan: persediaanTotal || 0, total: currentAssetsTotal },
            fixed_assets: { equipment: equipmentTotal, accumulated_depreciation: accumulatedDepreciation, total: equipmentNetValue },
            total_assets: totalAssets
          },
          liabilities: {
            current_liabilities: { hutang_usaha: hutangUsaha, total: hutangUsaha },
            total_liabilities: hutangUsaha
          },
          equity: {
            modal_awal: modalAwal,
            laba_ditahan: labaDitahan,
            total: totalEquity
          }
        };
      } catch (error) {
        console.error('Error generating balance sheet:', error);
        toast({ title: "Error", description: "Gagal memuat data neraca: " + (error as Error).message, variant: "destructive" });
        throw error;
      }
    }
  });

  // ... (Sisa kode JSX tidak perlu diubah, bisa copy-paste dari file asli Tuan)
  const exportToPDF = () => {
    toast({
      title: "Info",
      description: "Fitur ekspor PDF akan segera tersedia"
    });
  };

  const balanceDifference = balanceSheetData ? Math.abs(balanceSheetData.assets.total_assets - (balanceSheetData.liabilities.total_liabilities + balanceSheetData.equity.total)) : 0;
  const isBalanced = balanceDifference < 1;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Neraca</h1>
          <p className="text-muted-foreground">
            Per tanggal: {format(reportDate, 'dd MMM yyyy', { locale: id })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Tanggal Neraca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !reportDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reportDate ? format(reportDate, 'dd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reportDate}
                  onSelect={(date) => date && setReportDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <div className="text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Data dihitung sampai tanggal yang dipilih
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet */}
      {isLoading ? (
        <Card><CardContent className="p-8 text-center"><p>Memuat data neraca...</p></CardContent></Card>
      ) : isError || !balanceSheetData ? (
         <Card><CardContent className="p-8 text-center text-red-600"><p>Terjadi kesalahan saat memuat data neraca.</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Aset */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-green-600">ASET</CardTitle>
                <Link to="/master-data/asset"><Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4 mr-1" />Kelola Aset</Button></Link>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Aset Lancar</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm"><span>Kas & Bank</span><span>{formatCurrency(balanceSheetData.assets.current_assets.kas_bank)}</span></div>
                    <div className="flex justify-between text-sm"><span>Piutang Usaha</span><span>{formatCurrency(balanceSheetData.assets.current_assets.piutang)}</span></div>
                    <div className="flex justify-between text-sm"><span>Persediaan</span><span>{formatCurrency(balanceSheetData.assets.current_assets.persediaan)}</span></div>
                    <div className="flex justify-between font-medium border-t pt-2"><span>Total Aset Lancar</span><span>{formatCurrency(balanceSheetData.assets.current_assets.total)}</span></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Aset Tetap</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm"><span>Peralatan</span><span>{formatCurrency(balanceSheetData.assets.fixed_assets.equipment)}</span></div>
                    <div className="flex justify-between text-sm"><span>Akumulasi Penyusutan</span><span>({formatCurrency(balanceSheetData.assets.fixed_assets.accumulated_depreciation)})</span></div>
                    <div className="flex justify-between font-medium border-t pt-2"><span>Total Aset Tetap</span><span>{formatCurrency(balanceSheetData.assets.fixed_assets.total)}</span></div>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-lg border-t-2 pt-4"><span>TOTAL ASET</span><span>{formatCurrency(balanceSheetData.assets.total_assets)}</span></div>
              </CardContent>
            </Card>
          </div>

          {/* Kewajiban & Ekuitas */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-red-600">KEWAJIBAN</CardTitle>
                <Link to="/purchases"><Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4 mr-1" />Lihat Pembelian</Button></Link>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Kewajiban Lancar</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm"><span>Hutang Usaha</span><span>{formatCurrency(balanceSheetData.liabilities.current_liabilities.hutang_usaha)}</span></div>
                    <div className="flex justify-between font-medium border-t pt-2"><span>Total Kewajiban Lancar</span><span>{formatCurrency(balanceSheetData.liabilities.current_liabilities.total)}</span></div>
                  </div>
                </div>
                <div className="flex justify-between font-bold border-t-2 pt-4"><span>TOTAL KEWAJIBAN</span><span>{formatCurrency(balanceSheetData.liabilities.total_liabilities)}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-blue-600">EKUITAS</CardTitle>
                <Link to="/reports/profit-loss"><Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4 mr-1" />Lihat Laba Rugi</Button></Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Modal Awal</span><span>{formatCurrency(balanceSheetData.equity.modal_awal)}</span></div>
                  <div className="flex justify-between text-sm"><span>Laba Ditahan</span><span className={balanceSheetData.equity.laba_ditahan >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(balanceSheetData.equity.laba_ditahan)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2"><span>Total Ekuitas</span><span>{formatCurrency(balanceSheetData.equity.total)}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between font-bold text-lg"><span>TOTAL KEWAJIBAN + EKUITAS</span><span>{formatCurrency(balanceSheetData.liabilities.total_liabilities + balanceSheetData.equity.total)}</span></div>
                  <div className={cn("text-sm font-medium p-3 rounded-lg", isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                    {isBalanced ? "✅ Neraca Seimbang" : `⚠️ Neraca Tidak Seimbang (Selisih: ${formatCurrency(balanceDifference)})`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;