
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown, Package, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  salesTrend: Array<{
    date: string;
    total: number;
    transaction_count: number;
  }>;
  topProducts: Array<{
    product_name: string;
    variant_display: string;
    quantity_sold: number;
    total_revenue: number;
  }>;
  platformPerformance: Array<{
    platform_name: string;
    total_sales: number;
    transaction_count: number;
  }>;
  lowStockItems: Array<{
    product_name: string;
    variant_display: string;
    current_stock: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics = () => {
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', startDate, endDate],
    queryFn: async (): Promise<AnalyticsData> => {
      try {
        // Fetch sales trend data
        const { data: salesData } = await supabase
          .from('sales')
          .select(`
            tanggal,
            total,
            store_id,
            stores!inner(
              platform_id,
              platforms!inner(nama_platform)
            )
          `)
          .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('tanggal', format(endDate, 'yyyy-MM-dd'))
          .order('tanggal');

        // Fetch top products data
        const { data: saleItemsData } = await supabase
          .from('sale_items')
          .select(`
            quantity,
            harga_satuan,
            product_variant_id,
            product_variants!inner(
              warna,
              size,
              products!inner(nama_produk)
            ),
            sales!inner(tanggal)
          `)
          .gte('sales.tanggal', format(startDate, 'yyyy-MM-dd'))
          .lte('sales.tanggal', format(endDate, 'yyyy-MM-dd'));

        // Fetch low stock items
        const { data: lowStockData } = await supabase
          .from('product_variants')
          .select(`
            stok,
            warna,
            size,
            products!inner(nama_produk)
          `)
          .eq('is_active', true)
          .lt('stok', 10)
          .order('stok');

        // Process sales trend
        const salesByDate = salesData?.reduce((acc: any, sale) => {
          const date = sale.tanggal;
          if (!acc[date]) {
            acc[date] = { total: 0, count: 0 };
          }
          acc[date].total += sale.total || 0;
          acc[date].count += 1;
          return acc;
        }, {}) || {};

        const salesTrend = Object.entries(salesByDate).map(([date, data]: [string, any]) => ({
          date: format(new Date(date), 'dd/MM', { locale: id }),
          total: data.total,
          transaction_count: data.count
        }));

        // Process platform performance
        const platformSales = salesData?.reduce((acc: any, sale) => {
          const platformName = sale.stores?.platforms?.nama_platform || 'Unknown';
          if (!acc[platformName]) {
            acc[platformName] = { total: 0, count: 0 };
          }
          acc[platformName].total += sale.total || 0;
          acc[platformName].count += 1;
          return acc;
        }, {}) || {};

        const platformPerformance = Object.entries(platformSales).map(([platform, data]: [string, any]) => ({
          platform_name: platform,
          total_sales: data.total,
          transaction_count: data.count
        }));

        // Process top products
        const productSales = saleItemsData?.reduce((acc: any, item) => {
          const productName = item.product_variants?.products?.nama_produk || 'Unknown';
          const variantDisplay = `${item.product_variants?.warna} - ${item.product_variants?.size}`;
          const key = `${productName}_${variantDisplay}`;
          
          if (!acc[key]) {
            acc[key] = {
              product_name: productName,
              variant_display: variantDisplay,
              quantity_sold: 0,
              total_revenue: 0
            };
          }
          acc[key].quantity_sold += item.quantity || 0;
          acc[key].total_revenue += (item.quantity || 0) * (item.harga_satuan || 0);
          return acc;
        }, {}) || {};

        const topProducts = Object.values(productSales)
          .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
          .slice(0, 10) as Array<{
            product_name: string;
            variant_display: string;
            quantity_sold: number;
            total_revenue: number;
          }>;

        // Process low stock items
        const lowStockItems = lowStockData?.map(item => ({
          product_name: item.products?.nama_produk || 'Unknown',
          variant_display: `${item.warna} - ${item.size}`,
          current_stock: item.stok || 0
        })) || [];

        return {
          salesTrend,
          topProducts,
          platformPerformance,
          lowStockItems
        };
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal memuat data analitik",
          variant: "destructive"
        });
        throw error;
      }
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analitik & Laporan Performa</h1>
          <p className="text-muted-foreground">
            Periode: {format(startDate, 'dd MMM yyyy', { locale: id })} - {format(endDate, 'dd MMM yyyy', { locale: id })}
          </p>
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

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Memuat data analitik...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Sales Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tren Penjualan Harian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData?.salesTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'total' ? formatCurrency(value) : value,
                      name === 'total' ? 'Total Penjualan' : 'Jumlah Transaksi'
                    ]}
                  />
                  <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Platform Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Performa Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.platformPerformance || []}
                      dataKey="total_sales"
                      nameKey="platform_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ platform_name, total_sales }) => `${platform_name}: ${formatCurrency(total_sales)}`}
                    >
                      {analyticsData?.platformPerformance?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produk Terlaris
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {analyticsData?.topProducts?.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground">{product.variant_display}</p>
                        <p className="text-sm">Terjual: {product.quantity_sold} pcs</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(product.total_revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingDown className="h-5 w-5" />
                Peringatan Stok Rendah (&lt; 10 pcs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData?.lowStockItems?.length ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.lowStockItems.map((item, index) => (
                    <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">{item.variant_display}</p>
                      <p className="text-sm font-bold text-red-600">Stok: {item.current_stock} pcs</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Tidak ada produk dengan stok rendah
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics;
