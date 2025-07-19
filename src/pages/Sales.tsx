import { useState, useEffect } from 'react';
import { Plus, FileDown, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSales } from '@/hooks/useSales';
import { formatCurrency, formatDate } from '@/utils/format';
import { SalesForm } from '@/components/sales/SalesForm';
import DateFilter from '@/components/dashboard/DateFilter';
import { exportToPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';
import { toast } from '@/hooks/use-toast';

const Sales = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  const { sales, loading, fetchSales, createSale, updateSale, deleteSale } = useSales();

  useEffect(() => {
    fetchSales();
  }, []);

  const handleEdit = (sale: any) => {
    setEditingSale(sale);
    setIsDialogOpen(true);
  };

  const handleExportCSV = () => {
    const csvData = sales.map(sale => ({
      Tanggal: formatDate(sale.tanggal),
      'No. Pesanan': sale.no_pesanan_platform,
      Customer: sale.customer_name,
      Total: sale.total,
      Status: sale.status,
      Toko: sale.store?.nama_toko || '-',
      Platform: sale.store?.platform?.nama_platform || '-'
    }));
    
    exportToCSV({
      filename: `penjualan_${new Date().toISOString().split('T')[0]}.csv`,
      data: csvData
    });
    toast({ title: "Berhasil", description: "Data berhasil diekspor ke CSV" });
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('sales-content');
    if (element) {
      await exportToPDF('sales-content', {
        filename: `penjualan_${new Date().toISOString().split('T')[0]}.pdf`,
        title: 'Laporan Penjualan',
        companyInfo: { name: 'EQUINE' }
      });
      toast({ title: "Berhasil", description: "Data berhasil diekspor ke PDF" });
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const completedSales = sales.filter(sale => sale.status === 'completed').length;

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (_: any, sale: any) => (
        <div className="text-sm">
          {formatDate(sale.tanggal)}
        </div>
      )
    },
    {
      key: 'no_pesanan_platform',
      title: 'No. Pesanan',
      render: (_: any, sale: any) => (
        <div className="text-sm">
          {sale.no_pesanan_platform}
        </div>
      )
    },
    {
      key: 'customer_name',
      title: 'Customer',
      render: (_: any, sale: any) => (
        <div className="text-sm">
          {sale.customer_name}
        </div>
      )
    },
    {
      key: 'total',
      title: 'Total',
      render: (_: any, sale: any) => (
        <div className="text-sm font-medium">
          {formatCurrency(sale.total)}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_: any, sale: any) => (
        <Badge variant="secondary">
          {sale.status}
        </Badge>
      )
    },
    {
      key: 'store',
      title: 'Toko',
      render: (_: any, sale: any) => {
        return sale.store ? (
          <div>
            <div className="font-medium">{sale.store.nama_toko}</div>
            <div className="text-muted-foreground text-xs">
              {sale.store.platform?.nama_platform || 'Platform tidak ditemukan'}
            </div>
          </div>
        ) : '-';
      },
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_: any, sale: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(sale)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteSale(sale.id)}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Penjualan</h1>
          <p className="text-sm text-muted-foreground">Kelola data penjualan produk</p>
        </div>
        
        {/* Action Buttons - Mobile Stack */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tambah Penjualan</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSale ? 'Edit Penjualan' : 'Tambah Penjualan Baru'}
                </DialogTitle>
              </DialogHeader>
              <SalesForm
                editingSale={editingSale}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  setEditingSale(null);
                  fetchSales();
                }}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingSale(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters - Collapsible on Mobile */}
      {showFilters && (
        <Card className="md:hidden">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Filter tanggal akan tersedia setelah implementasi lengkap</div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Filters */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Filter tanggal akan tersedia setelah implementasi lengkap</div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards - Mobile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Penjualan</div>
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(totalSales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Transaksi Selesai</div>
            <div className="text-lg md:text-2xl font-bold">{completedSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Transaksi</div>
            <div className="text-lg md:text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Rata-rata</div>
            <div className="text-lg md:text-2xl font-bold">
              {sales.length > 0 ? formatCurrency(totalSales / sales.length) : formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div id="sales-content">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <CardTitle className="text-lg md:text-xl">Daftar Penjualan</CardTitle>
              
              {/* Export Buttons - Mobile Stack */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportPDF}
                  className="w-full sm:w-auto"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSales()}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">↻</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={sales}
                loading={loading}
                searchable={true}
                searchPlaceholder="Cari penjualan..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sales;
