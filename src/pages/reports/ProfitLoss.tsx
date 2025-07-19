import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, AlertTriangle, FileSearch } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/hooks/use-toast';
import { calculateProfitLoss, ProfitLossCalculation } from '@/utils/financialCalculations';
import { exportToPDF } from '@/utils/pdfExport';

const ProfitLoss = () => {
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  // --- PERBAIKAN 1: Mengambil state 'isError' dan 'error' dari useQuery ---
  const { data: profitLossData, isLoading, isError, error } = useQuery({
    queryKey: ['profit-loss', startDate, endDate],
    queryFn: async (): Promise<ProfitLossCalculation> => {
      try {
        // Menambahkan log untuk debugging
        console.log(`[ProfitLoss] Menghitung Laba Rugi untuk periode: ${startDate.toISOString()} - ${endDate.toISOString()}`);
        const result = await calculateProfitLoss(startDate, endDate);
        console.log('[ProfitLoss] Hasil kalkulasi:', result);
        return result;
      } catch (err) {
        // Menambahkan log error yang lebih detail
        console.error('[ProfitLoss] Gagal menjalankan calculateProfitLoss:', err);
        toast({
          title: "Error Kalkulasi",
          description: (err as Error).message || "Terjadi kesalahan pada fungsi kalkulasi.",
          variant: "destructive"
        });
        throw err;
      }
    }
  });

  // --- PERBAIKAN 2: Cek apakah ada data transaksi yang valid ---
  const hasTransactions = profitLossData && (profitLossData.revenue.total_penjualan > 0 || profitLossData.expenses.total_expenses > 0);

  const exportToPDFReport = async () => {
    try {
      await exportToPDF('profit-loss-content', {
        filename: `laporan-laba-rugi-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.pdf`,
        title: 'Laporan Laba Rugi',
        orientation: 'portrait',
        companyInfo: {
          name: 'EQUINE Fashion',
          address: 'Indonesia'
        }
      });
      toast({
        title: "Sukses",
        description: "Laporan PDF berhasil diunduh"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Laporan Laba Rugi</h1>
          <p className="text-muted-foreground">
            Periode: {format(startDate, 'dd MMM yyyy', { locale: id })} - {format(endDate, 'dd MMM yyyy', { locale: id })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDFReport} variant="outline" disabled={!hasTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div>
            <label className="text-sm font-medium">Tanggal Mulai</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium">Tanggal Akhir</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* --- PERBAIKAN 3: Menampilkan state Loading, Error, dan Data Kosong --- */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Memuat data laporan...</p>
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Gagal Memuat Laporan</CardTitle>
          </CardHeader>
          <CardContent className="text-destructive">
            <p>Terjadi kesalahan saat mengambil data. Silakan coba lagi.</p>
            <p className="text-xs mt-2">Detail: {(error as Error).message}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && !hasTransactions && (
         <Card>
          <CardContent className="p-8 text-center">
            <FileSearch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Tidak Ada Data</h3>
            <p className="text-muted-foreground">Tidak ditemukan data penjualan atau pengeluaran pada periode yang dipilih.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && hasTransactions && (
        <div id="profit-loss-content" className="grid gap-6">
          {/* Revenue Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">PENDAPATAN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Total Penjualan</span>
                <span className="font-bold">{formatCurrency(profitLossData?.revenue.total_penjualan || 0)}</span>
              </div>
              
              <div className="pl-4 space-y-2">
                <p className="font-medium text-sm text-muted-foreground">Rincian per Platform:</p>
                {profitLossData?.revenue.penjualan_by_platform.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="pl-4">{item.platform}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* COGS Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">HARGA POKOK PENJUALAN (HPP)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <span className="font-medium">Total HPP</span>
                <span className="font-bold">({formatCurrency(profitLossData?.cogs.total_hpp || 0)})</span>
              </div>
            </CardContent>
          </Card>

          {/* Gross Profit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">LABA KOTOR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <span className="font-medium">Laba Kotor</span>
                <span className="font-bold text-lg">{formatCurrency(profitLossData?.gross_profit || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Margin Laba Kotor</span>
                <span>{profitLossData?.gross_margin.toFixed(2)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">BIAYA OPERASIONAL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Total Biaya Operasional</span>
                <span className="font-bold">({formatCurrency(profitLossData?.expenses.total_expenses || 0)})</span>
              </div>
              
              <div className="pl-4 space-y-2">
                <p className="font-medium text-sm text-muted-foreground">Rincian per Kategori:</p>
                {profitLossData?.expenses.expenses_by_category.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="pl-4">{item.category}</span>
                    <span>({formatCurrency(item.amount)})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-primary text-xl">LABA BERSIH</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <span className="font-bold text-lg">Laba Bersih</span>
                <span className={cn(
                  "font-bold text-2xl",
                  (profitLossData?.net_profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(profitLossData?.net_profit || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProfitLoss;
