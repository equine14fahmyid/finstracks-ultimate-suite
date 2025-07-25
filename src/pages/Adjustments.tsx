
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/common/DataTable';
import { AdjustmentForm } from '@/components/adjustments/AdjustmentForm';
import { useAdjustments, PendingSale, AdjustmentItem } from '@/hooks/useAdjustments';
import { formatCurrency, formatDate } from '@/utils/format';
import { CheckCircle, AlertTriangle, Settings, FileText, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';

export default function Adjustments() {
  const { pendingSales, adjustments, loading, validateSale, createAdjustment, refreshData } = useAdjustments();
  const [selectedSale, setSelectedSale] = useState<PendingSale | null>(null);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleValidate = async (sale: PendingSale) => {
    setActionLoading(true);
    try {
      await validateSale(sale.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevise = (sale: PendingSale) => {
    setSelectedSale(sale);
    setShowAdjustmentForm(true);
  };

  const handleSubmitAdjustment = async (adjustmentItems: AdjustmentItem[]) => {
    if (!selectedSale) return;
    
    setActionLoading(true);
    try {
      await createAdjustment(selectedSale.id, adjustmentItems);
      setShowAdjustmentForm(false);
      setSelectedSale(null);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingSalesColumns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (value: any, record: PendingSale) => formatDate(record.tanggal),
    },
    {
      key: 'no_pesanan_platform',
      title: 'No. Pesanan',
      render: (value: any, record: PendingSale) => (
        <div className="font-mono text-sm">
          {record.no_pesanan_platform}
        </div>
      )
    },
    {
      key: 'customer_name',
      title: 'Customer',
      render: (value: any, record: PendingSale) => record.customer_name
    },
    {
      key: 'store',
      title: 'Toko/Platform',
      render: (value: any, record: PendingSale) => {
        return record.store ? (
          <div>
            <div className="font-medium">{record.store.nama_toko}</div>
            <div className="text-sm text-muted-foreground">
              {record.store.platform?.nama_platform || 'Platform tidak ditemukan'}
            </div>
          </div>
        ) : '-';
      },
    },
    {
      key: 'total',
      title: 'Total',
      render: (value: any, record: PendingSale) => (
        <div className="font-medium text-green-600">
          {formatCurrency(record.total)}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (value: any, sale: PendingSale) => {
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleValidate(sale)}
              disabled={actionLoading}
              className="flex items-center gap-1 w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Validasi</span>
              <span className="sm:hidden">✓</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRevise(sale)}
              disabled={actionLoading}
              className="flex items-center gap-1 w-full sm:w-auto"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Revisi</span>
              <span className="sm:hidden">⚙</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const adjustmentsColumns = [
    {
      key: 'created_at',
      title: 'Tanggal',
      render: (value: any, record: any) => formatDate(record.created_at),
    },
    {
      key: 'sale',
      title: 'No. Pesanan',
      render: (value: any, record: any) => {
        return record.sale ? (
          <div>
            <div className="font-medium font-mono text-sm">{record.sale.no_pesanan_platform}</div>
            <div className="text-sm text-muted-foreground">{record.sale.customer_name}</div>
          </div>
        ) : '-';
      },
    },
    {
      key: 'adjustment_type',
      title: 'Jenis',
      render: (value: any, record: any) => {
        const typeLabels: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
          denda: { label: 'Denda', variant: 'destructive' },
          selisih_ongkir: { label: 'Selisih Ongkir', variant: 'secondary' },
          pinalti: { label: 'Pinalti', variant: 'outline' },
        };
        const config = typeLabels[record.adjustment_type] || { label: record.adjustment_type, variant: 'outline' };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'amount',
      title: 'Jumlah',
      render: (value: any, record: any) => (
        <span className="font-medium text-destructive">
          -{formatCurrency(record.amount)}
        </span>
      ),
    },
    {
      key: 'notes',
      title: 'Keterangan',
      render: (value: any, record: any) => record.notes || '-',
    },
    {
      key: 'sale',
      title: 'Toko',
      render: (value: any, record: any) => {
        return record.sale?.store ? (
          <div>
            <div className="font-medium">{record.sale.store.nama_toko}</div>
            <div className="text-sm text-muted-foreground">
              {record.sale.store.platform?.nama_platform || 'Platform tidak ditemukan'}
            </div>
          </div>
        ) : '-';
      },
    },
  ];

  const totalPendingAmount = pendingSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalAdjustmentAmount = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

  return (
    <div className="container mx-auto py-4 md:py-8 px-3 md:px-6 space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Penyesuaian & Validasi</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Validasi penjualan yang sudah selesai dan buat penyesuaian jika diperlukan
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Validasi</p>
                <p className="text-2xl font-bold">{pendingSales.length}</p>
              </div>
              <AlertCircle className="h-4 w-4 text-warning ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPendingAmount)}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-success ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Penyesuaian</p>
                <p className="text-2xl font-bold text-destructive">-{formatCurrency(totalAdjustmentAmount)}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-destructive ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Riwayat Penyesuaian</p>
                <p className="text-2xl font-bold">{adjustments.length}</p>
              </div>
              <FileText className="h-4 w-4 text-info ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="pending" className="flex-1 sm:flex-none">
              <span className="hidden sm:inline">Pending Validasi ({pendingSales.length})</span>
              <span className="sm:hidden">Pending ({pendingSales.length})</span>
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="flex-1 sm:flex-none">
              <span className="hidden sm:inline">Riwayat Penyesuaian ({adjustments.length})</span>
              <span className="sm:hidden">Riwayat ({adjustments.length})</span>
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        </div>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Penjualan Menunggu Validasi</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daftar penjualan dengan status "delivered" yang perlu divalidasi atau disesuaikan
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={pendingSalesColumns}
                data={pendingSales}
                loading={loading}
                searchable={true}
                searchPlaceholder="Cari no. pesanan..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penyesuaian</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={adjustmentsColumns}
                data={adjustments}
                loading={loading}
                searchable={true}
                searchPlaceholder="Cari no. pesanan..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAdjustmentForm} onOpenChange={setShowAdjustmentForm}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Buat Penyesuaian</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Detail Penjualan</h4>
                <p className="text-sm text-muted-foreground">No. Pesanan: {selectedSale.no_pesanan_platform}</p>
                <p className="text-sm text-muted-foreground">Customer: {selectedSale.customer_name}</p>
                <p className="text-sm text-muted-foreground">Total: {formatCurrency(selectedSale.total)}</p>
              </div>
              <AdjustmentForm
                onSubmit={handleSubmitAdjustment}
                onCancel={() => setShowAdjustmentForm(false)}
                loading={actionLoading}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
