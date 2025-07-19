
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { exportToPDF } from '@/utils/pdfExport';

interface CashFlowData {
  operating_activities: {
    penerimaan_dari_penjualan: number;
    pembayaran_ke_supplier: number;
    pembayaran_biaya_operasional: number;
    net_operating_cash: number;
  };
  investing_activities: {
    pembelian_aset: number;
    net_investing_cash: number;
  };
  financing_activities: {
    tambahan_modal: number;
    penarikan_modal: number;
    net_financing_cash: number;
  };
  net_cash_flow: number;
  beginning_cash: number;
  ending_cash: number;
}

const CashFlow = () => {
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: cashFlowData, isLoading } = useQuery({
    queryKey: ['cash-flow', startDate, endDate],
    queryFn: async (): Promise<CashFlowData> => {
      try {
        // Fetch settlements (cash received from sales)
        const { data: settlementsData } = await supabase
          .from('settlements')
          .select('jumlah_dicairkan, biaya_admin')
          .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

        // Fetch purchases (cash paid to suppliers)
        const { data: purchasesData } = await supabase
          .from('purchases')
          .select('total')
          .eq('payment_method', 'cash')
          .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

        // Fetch expenses (operational expenses)
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('jumlah')
          .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

        // Fetch incomes (additional capital or other income)
        const { data: incomesData } = await supabase
          .from('incomes')
          .select('jumlah')
          .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

        // Fetch asset purchases
        const { data: assetsData } = await supabase
          .from('assets')
          .select('harga_perolehan')
          .gte('tanggal_perolehan', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal_perolehan', format(endDate, 'yyyy-MM-dd'));

        // Get beginning cash balance
        const { data: banksData } = await supabase
          .from('banks')
          .select('saldo_awal, saldo_akhir')
          .eq('is_active', true);

        // Calculate operating activities
        const penerimaanPenjualan = settlementsData?.reduce((sum, settlement) => 
          sum + (settlement.jumlah_dicairkan || 0) - (settlement.biaya_admin || 0), 0) || 0;
        
        const pembayaranSupplier = purchasesData?.reduce((sum, purchase) => sum + (purchase.total || 0), 0) || 0;
        const pembayaranBiayaOperasional = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
        
        const netOperatingCash = penerimaanPenjualan - pembayaranSupplier - pembayaranBiayaOperasional;

        // Calculate investing activities
        const pembelianAset = assetsData?.reduce((sum, asset) => sum + (asset.harga_perolehan || 0), 0) || 0;
        const netInvestingCash = -pembelianAset;

        // Calculate financing activities
        const tambahanModal = incomesData?.reduce((sum, income) => sum + (income.jumlah || 0), 0) || 0;
        const penarikanModal = 0; // This would need to be tracked separately
        const netFinancingCash = tambahanModal - penarikanModal;

        // Calculate net cash flow
        const netCashFlow = netOperatingCash + netInvestingCash + netFinancingCash;

        // Calculate beginning and ending cash
        const beginningCash = banksData?.reduce((sum, bank) => sum + (bank.saldo_awal || 0), 0) || 0;
        const endingCash = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;

        return {
          operating_activities: {
            penerimaan_dari_penjualan: penerimaanPenjualan,
            pembayaran_ke_supplier: pembayaranSupplier,
            pembayaran_biaya_operasional: pembayaranBiayaOperasional,
            net_operating_cash: netOperatingCash
          },
          investing_activities: {
            pembelian_aset: pembelianAset,
            net_investing_cash: netInvestingCash
          },
          financing_activities: {
            tambahan_modal: tambahanModal,
            penarikan_modal: penarikanModal,
            net_financing_cash: netFinancingCash
          },
          net_cash_flow: netCashFlow,
          beginning_cash: beginningCash,
          ending_cash: endingCash
        };
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal memuat data arus kas",
          variant: "destructive"
        });
        throw error;
      }
    }
  });

  const exportToPDFReport = async () => {
    try {
      await exportToPDF('cash-flow-content', {
        filename: `arus-kas-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.pdf`,
        title: 'Laporan Arus Kas',
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
          <h1 className="text-3xl font-bold">Laporan Arus Kas</h1>
          <p className="text-muted-foreground">
            Periode: {format(startDate, 'dd MMM yyyy', { locale: id })} - {format(endDate, 'dd MMM yyyy', { locale: id })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDFReport} variant="outline">
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

      {/* Cash Flow Report */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Memuat data arus kas...</p>
          </CardContent>
        </Card>
      ) : (
        <div id="cash-flow-content" className="space-y-6">
          {/* Operating Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">ARUS KAS DARI AKTIVITAS OPERASI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Penerimaan dari penjualan</span>
                  <span>{formatCurrency(cashFlowData?.operating_activities.penerimaan_dari_penjualan || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pembayaran ke supplier</span>
                  <span>({formatCurrency(cashFlowData?.operating_activities.pembayaran_ke_supplier || 0)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Pembayaran biaya operasional</span>
                  <span>({formatCurrency(cashFlowData?.operating_activities.pembayaran_biaya_operasional || 0)})</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Arus Kas Bersih dari Aktivitas Operasi</span>
                  <span className={cn(
                    (cashFlowData?.operating_activities.net_operating_cash || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(cashFlowData?.operating_activities.net_operating_cash || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investing Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">ARUS KAS DARI AKTIVITAS INVESTASI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Pembelian aset tetap</span>
                  <span>({formatCurrency(cashFlowData?.investing_activities.pembelian_aset || 0)})</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Arus Kas Bersih dari Aktivitas Investasi</span>
                  <span className={cn(
                    (cashFlowData?.investing_activities.net_investing_cash || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(cashFlowData?.investing_activities.net_investing_cash || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financing Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">ARUS KAS DARI AKTIVITAS PENDANAAN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tambahan modal</span>
                  <span>{formatCurrency(cashFlowData?.financing_activities.tambahan_modal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penarikan modal</span>
                  <span>({formatCurrency(cashFlowData?.financing_activities.penarikan_modal || 0)})</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Arus Kas Bersih dari Aktivitas Pendanaan</span>
                  <span className={cn(
                    (cashFlowData?.financing_activities.net_financing_cash || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(cashFlowData?.financing_activities.net_financing_cash || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Cash Flow Summary */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-primary">RINGKASAN ARUS KAS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Kenaikan/Penurunan Kas Bersih</span>
                  <span className={cn(
                    "font-bold",
                    (cashFlowData?.net_cash_flow || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(cashFlowData?.net_cash_flow || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kas dan Setara Kas Awal Periode</span>
                  <span>{formatCurrency(cashFlowData?.beginning_cash || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t-2 pt-2">
                  <span>Kas dan Setara Kas Akhir Periode</span>
                  <span className="text-primary">
                    {formatCurrency(cashFlowData?.ending_cash || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CashFlow;
