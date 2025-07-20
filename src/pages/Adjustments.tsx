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
import { CheckCircle, AlertTriangle, Settings, FileText, RefreshCw } from 'lucide-react';

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
      render: (value: any, record: PendingSale) => record.no_pesanan_platform
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
      render: (value: any, record: PendingSale) => formatCurrency(record.total),
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
            <div className="font-medium">{record.sale.no_pesanan_platform}</div>
            <div className="text-sm text-muted-foreground">{record.sale.customer_name}</div>
          </div>
        ) : '-';
      },
    },
    {
      key: 'adjustment_type',
      title: 'Jenis',
      render: (value: any, record: any) => {
        const typeLabels: Record<string, string> = {
          denda: 'Denda',
          selisih_ongkir: 'Selisih Ongkir',
          pinalti: 'Pinalti',
        };
        return (
          <Badge variant="outline">
            {typeLabels[record.adjustment_type] || record.adjustment_type}
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Summary Cards */}
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
        {/* ... Dialog Content ... */}
      </Dialog>
    </div>
  );
}
