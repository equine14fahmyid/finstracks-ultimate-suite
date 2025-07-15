
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

interface ProfitLossData {
  revenue: {
    total_penjualan: number;
    penjualan_by_platform: Array<{
      platform: string;
      amount: number;
    }>;
  };
  cogs: {
    total_hpp: number;
  };
  expenses: {
    total_expenses: number;
    expenses_by_category: Array<{
      category: string;
      amount: number;
    }>;
  };
  gross_profit: number;
  net_profit: number;
  gross_margin: number;
}

const ProfitLoss = () => {
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: profitLossData, isLoading } = useQuery({
    queryKey: ['profit-loss', startDate, endDate],
    queryFn: async (): Promise<ProfitLossData> => {
      try {
        // Fetch sales data
        const { data: salesData } = await supabase
          .from('sales')
          .select(`
            total,
            subtotal,
            store_id,
            stores!inner(
              nama_toko,
              platforms!inner(nama_platform)
            )
          `)
          .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

        // Fetch purchase data for COGS
        const { data: purchaseData } = await supabase
          .from('purchases')
          .select('total')
          .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

        // Fetch expenses data
        const { data: expensesData } = await supabase
          .from('expenses')
          .select(`
            jumlah,
            categories(nama_kategori)
          `)
          .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal', format(endDate, 'yyyy-MM-dd'));

        // Calculate revenue
        const totalPenjualan = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
        
        // Group sales by platform
        const platformSales = salesData?.reduce((acc: any, sale) => {
          const platformName = sale.stores?.platforms?.nama_platform || 'Unknown';
          acc[platformName] = (acc[platformName] || 0) + (sale.total || 0);
          return acc;
        }, {}) || {};

        const penjualanByPlatform = Object.entries(platformSales).map(([platform, amount]) => ({
          platform,
          amount: amount as number
        }));

        // Calculate COGS
        const totalHpp = purchaseData?.reduce((sum, purchase) => sum + (purchase.total || 0), 0) || 0;

        // Calculate expenses
        const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.jumlah || 0), 0) || 0;
        
        // Group expenses by category
        const categoryExpenses = expensesData?.reduce((acc: any, expense) => {
          const categoryName = expense.categories?.nama_kategori || 'Lainnya';
          acc[categoryName] = (acc[categoryName] || 0) + (expense.jumlah || 0);
          return acc;
        }, {}) || {};

        const expensesByCategory = Object.entries(categoryExpenses).map(([category, amount]) => ({
          category,
          amount: amount as number
        }));

        const grossProfit = totalPenjualan - totalHpp;
        const netProfit = grossProfit - totalExpenses;
        const grossMargin = totalPenjualan > 0 ? (grossProfit / totalPenjualan) * 100 : 0;

        return {
          revenue: {
            total_penjualan: totalPenjualan,
            penjualan_by_platform: penjualanByPlatform
          },
          cogs: {
            total_hpp: totalHpp
          },
          expenses: {
            total_expenses: totalExpenses,
            expenses_by_category: expensesByCategory
          },
          gross_profit: grossProfit,
          net_profit: netProfit,
          gross_margin: grossMargin
        };
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal memuat data laporan laba rugi",
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
          <Button onClick={exportToPDF} variant="outline">
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

      {/* Profit Loss Report */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Memuat data laporan...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
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
