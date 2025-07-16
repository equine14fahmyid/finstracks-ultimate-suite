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

  // Helper function to calculate months between dates
  const calculateMonthsBetween = (startDate: string, endDate: Date): number => {
    const start = new Date(startDate);
    const end = endDate;
    
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    const dayDiff = end.getDate() - start.getDate();
    
    let totalMonths = yearDiff * 12 + monthDiff;
    if (dayDiff >= 0) {
      totalMonths += dayDiff / 30; // Approximate partial month
    }
    
    return Math.max(0, Math.floor(totalMonths));
  };

  const { data: balanceSheetData, isLoading } = useQuery({
    queryKey: ['balance-sheet', reportDate],
    queryFn: async (): Promise<BalanceSheetData> => {
      try {
        const reportDateStr = format(reportDate, 'yyyy-MM-dd');
        
        console.log('Generating Balance Sheet for date:', reportDateStr);

        // 1. Fetch bank balances (current balances)
        const { data: banksData } = await supabase
          .from('banks')
          .select('saldo_akhir')
          .eq('is_active', true);

        // 2. Fetch store dashboard balances (as receivables)
        const { data: storesData } = await supabase
          .from('stores')
          .select('saldo_dashboard')
          .eq('is_active', true);

        // 3. Fetch inventory value (current stock * purchase price)
        const { data: inventoryData } = await supabase
          .from('product_variants')
          .select(`
            stok,
            products!inner(harga_beli)
          `)
          .eq('is_active', true);

        // 4. Fetch assets data for depreciation calculation
        const { data: assetsData } = await supabase
          .from('assets')
          .select('harga_perolehan, penyusutan_per_bulan, tanggal_perolehan')
          .eq('is_active', true)
          .lte('tanggal_perolehan', reportDateStr); // Only assets acquired before report date

        // 5. Fetch pending purchases (hutang usaha)
        const { data: pendingPurchases } = await supabase
          .from('purchases')
          .select('total')
          .eq('payment_status', 'pending')
          .lte('tanggal', reportDateStr);

        // 6. Fetch expenses up to report date for retained earnings
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('jumlah')
          .lte('tanggal', reportDateStr);

        // 7. Fetch sales up to report date for retained earnings
        const { data: salesData } = await supabase
          .from('sales')
          .select('total')
          .eq('status', 'delivered')
          .lte('tanggal', reportDateStr);

        // 8. Fetch modal awal from user settings
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('*')
          .limit(1)
          .single();

        // CALCULATIONS

        // Current Assets
        const kasBankTotal = banksData?.reduce((sum, bank) => sum + (bank.saldo_akhir || 0), 0) || 0;
        const piutangTotal = storesData?.reduce((sum, store) => sum + (store.saldo_dashboard || 0), 0) || 0;
        const persediaanTotal = inventoryData?.reduce((sum, variant) => {
          return sum + ((variant.stok || 0) * (variant.products?.harga_beli || 0));
        }, 0) || 0;

        const currentAssetsTotal = kasBankTotal + piutangTotal + persediaanTotal;

        // Fixed Assets with date-based depreciation calculation
        let equipmentTotal = 0;
        let accumulatedDepreciation = 0;
        let equipmentNetValue = 0;

        if (assetsData) {
          for (const asset of assetsData) {
            const monthsUsed = calculateMonthsBetween(asset.tanggal_perolehan, reportDate);
            const assetDepreciation = Math.min(
              monthsUsed * (asset.penyusutan_per_bulan || 0),
              asset.harga_perolehan || 0
            );
            
            equipmentTotal += asset.harga_perolehan || 0;
            accumulatedDepreciation += assetDepreciation;
            equipmentNetValue += Math.max(0, (asset.harga_perolehan || 0) - assetDepreciation);
          }
        }

        const totalAssets = currentAssetsTotal + equipmentNetValue;

        // Liabilities
        const hutangUsaha = pendingPurchases?.reduce((sum, purchase) => sum + (purchase.total || 0), 0) || 0;
        const totalLiabilities = hutangUsaha;

        // Equity - calculate retained earnings up to report date
        const totalSales = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
        const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
        const labaDitahan = totalSales - totalExpenses;

        // Modal awal from user settings or default
        const modalAwal = userSettings?.company_name ? 50000000 : 50000000; // Could be configurable in user_settings
        const totalEquity = modalAwal + labaDitahan;

        console.log('Balance Sheet Calculations:', {
          reportDate: reportDateStr,
          currentAssets: {
            kas_bank: kasBankTotal,
            piutang: piutangTotal,
            persediaan: persediaanTotal,
            total: currentAssetsTotal
          },
          fixedAssets: {
            equipment: equipmentTotal,
            accumulated_depreciation: accumulatedDepreciation,
            net_value: equipmentNetValue
          },
          liabilities: {
            hutang_usaha: hutangUsaha
          },
          equity: {
            modal_awal: modalAwal,
            laba_ditahan: labaDitahan,
            sales: totalSales,
            expenses: totalExpenses
          }
        });

        return {
          assets: {
            current_assets: {
              kas_bank: kasBankTotal,
              piutang: piutangTotal,
              persediaan: persediaanTotal,
              total: currentAssetsTotal
            },
            fixed_assets: {
              equipment: equipmentTotal,
              accumulated_depreciation: accumulatedDepreciation,
              total: equipmentNetValue
            },
            total_assets: totalAssets
          },
          liabilities: {
            current_liabilities: {
              hutang_usaha: hutangUsaha,
              total: hutangUsaha
            },
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
        toast({
          title: "Error",
          description: "Gagal memuat data neraca: " + (error as any)?.message,
          variant: "destructive"
        });
        throw error;
      }
    }
  });

  const exportToPDF = () => {
    toast({
      title: "Info",
      description: "Fitur ekspor PDF akan segera tersedia"
    });
  };

  // Calculate balance validation
  const isBalanced = balanceSheetData ? 
    Math.abs(balanceSheetData.assets.total_assets - (balanceSheetData.liabilities.total_liabilities + balanceSheetData.equity.total)) < 1 
    : true;

  const balanceDifference = balanceSheetData ? 
    Math.abs(balanceSheetData.assets.total_assets - (balanceSheetData.liabilities.total_liabilities + balanceSheetData.equity.total))
    : 0;

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
        <Card>
          <CardContent className="p-8 text-center">
            <p>Memuat data neraca...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Side - Assets */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-green-600">ASET</CardTitle>
                <Link to="/master-data/asset">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Kelola Aset
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Assets */}
                <div>
                  <h3 className="font-semibold mb-3">Aset Lancar</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span>Kas & Bank</span>
                      <span>{formatCurrency(balanceSheetData?.assets.current_assets.kas_bank || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Piutang Usaha</span>
                      <span>{formatCurrency(balanceSheetData?.assets.current_assets.piutang || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Persediaan</span>
                      <span>{formatCurrency(balanceSheetData?.assets.current_assets.persediaan || 0)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total Aset Lancar</span>
                      <span>{formatCurrency(balanceSheetData?.assets.current_assets.total || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Fixed Assets */}
                <div>
                  <h3 className="font-semibold mb-3">Aset Tetap</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span>Peralatan</span>
                      <span>{formatCurrency(balanceSheetData?.assets.fixed_assets.equipment || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Akumulasi Penyusutan</span>
                      <span>({formatCurrency(balanceSheetData?.assets.fixed_assets.accumulated_depreciation || 0)})</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total Aset Tetap</span>
                      <span>{formatCurrency(balanceSheetData?.assets.fixed_assets.total || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-lg border-t-2 pt-4">
                  <span>TOTAL ASET</span>
                  <span>{formatCurrency(balanceSheetData?.assets.total_assets || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Liabilities & Equity */}
          <div className="space-y-6">
            {/* Liabilities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-red-600">KEWAJIBAN</CardTitle>
                <Link to="/purchases">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Lihat Pembelian
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Kewajiban Lancar</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span>Hutang Usaha</span>
                      <span>{formatCurrency(balanceSheetData?.liabilities.current_liabilities.hutang_usaha || 0)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total Kewajiban Lancar</span>
                      <span>{formatCurrency(balanceSheetData?.liabilities.current_liabilities.total || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between font-bold border-t-2 pt-4">
                  <span>TOTAL KEWAJIBAN</span>
                  <span>{formatCurrency(balanceSheetData?.liabilities.total_liabilities || 0)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Equity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-blue-600">EKUITAS</CardTitle>
                <Link to="/reports/profit-loss">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Lihat Laba Rugi
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Modal Awal</span>
                    <span>{formatCurrency(balanceSheetData?.equity.modal_awal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Laba Ditahan</span>
                    <span className={balanceSheetData?.equity.laba_ditahan || 0 >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(balanceSheetData?.equity.laba_ditahan || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total Ekuitas</span>
                    <span>{formatCurrency(balanceSheetData?.equity.total || 0)}</span>
                  </div>
                </div>

                {/* Equity breakdown info */}
                <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
                  <div>💡 Laba ditahan dihitung dari seluruh penjualan dan pengeluaran sampai {format(reportDate, 'dd MMM yyyy', { locale: id })}</div>
                </div>
              </CardContent>
            </Card>

            {/* Total Liabilities + Equity */}
            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL KEWAJIBAN + EKUITAS</span>
                    <span>{formatCurrency((balanceSheetData?.liabilities.total_liabilities || 0) + (balanceSheetData?.equity.total || 0))}</span>
                  </div>
                  
                  {/* Balance Sheet Validation */}
                  {balanceSheetData && (
                    <div className={cn(
                      "text-sm font-medium p-3 rounded-lg",
                      isBalanced 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    )}>
                      {isBalanced 
                        ? "✅ Neraca Seimbang" 
                        : `⚠️ Neraca Tidak Seimbang (Selisih: ${formatCurrency(balanceDifference)})`
                      }
                    </div>
                  )}
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