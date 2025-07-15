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
import { CheckCircle, AlertTriangle, Settings, FileText } from 'lucide-react';

export default function Adjustments() {
  const { pendingSales, adjustments, loading, validateSale, createAdjustment } = useAdjustments();
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
      render: (value: string) => formatDate(value),
    },
    {
      key: 'no_pesanan_platform',
      title: 'No. Pesanan',
    },
    {
      key: 'customer_name',
      title: 'Customer',
    },
    {
      key: 'store',
      title: 'Toko/Platform',
      render: (store: any) => {
        return store ? (
          <div>
            <div className="font-medium">{store.nama_toko}</div>
            <div className="text-sm text-muted-foreground">
              {store.platform?.nama_platform || 'Platform tidak ditemukan'}
            </div>
          </div>
        ) : '-';
      },
    },
    {
      key: 'total',
      title: 'Total',
      render: (value: number) => formatCurrency(value),
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
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Validasi
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRevise(sale)}
              disabled={actionLoading}
              className="flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              Revisi
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
      render: (value: string) => formatDate(value),
    },
    {
      key: 'sale',
      title: 'No. Pesanan',
      render: (sale: any) => {
        return sale ? (
          <div>
            <div className="font-medium">{sale.no_pesanan_platform}</div>
            <div className="text-sm text-muted-foreground">{sale.customer_name}</div>
          </div>
        ) : '-';
      },
    },
    {
      key: 'adjustment_type',
      title: 'Jenis',
      render: (type: string) => {
        const typeLabels = {
          denda: 'Denda',
          selisih_ongkir: 'Selisih Ongkir',
          pinalti: 'Pinalti',
        };
        return (
          <Badge variant="outline">
            {typeLabels[type as keyof typeof typeLabels] || type}
          </Badge>
        );
      },
    },
    {
      key: 'amount',
      title: 'Jumlah',
      render: (value: number) => (
        <span className="font-medium text-destructive">
          -{formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'notes',
      title: 'Keterangan',
      render: (value: string) => value || '-',
    },
    {
      key: 'sale',
      title: 'Toko',
      render: (sale: any) => {
        return sale?.store ? (
          <div>
            <div className="font-medium">{sale.store.nama_toko}</div>
            <div className="text-sm text-muted-foreground">
              {sale.store.platform?.nama_platform || 'Platform tidak ditemukan'}
            </div>
          </div>
        ) : '-';
      },
    },
  ];

  const totalPendingAmount = pendingSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalAdjustmentAmount = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat data penyesuaian...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Penyesuaian & Validasi</h1>
        <p className="text-muted-foreground">
          Validasi penjualan yang sudah selesai dan buat penyesuaian jika diperlukan
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Validasi</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSales.length}</div>
            <p className="text-xs text-muted-foreground">
              Total nilai: {formatCurrency(totalPendingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penyesuaian</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adjustments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total nilai: {formatCurrency(totalAdjustmentAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efektivitas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingSales.length > 0 
                ? Math.round((adjustments.length / (adjustments.length + pendingSales.length)) * 100)
                : 100}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sudah diproses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Validasi ({pendingSales.length})
          </TabsTrigger>
          <TabsTrigger value="adjustments">
            Riwayat Penyesuaian ({adjustments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Penjualan Menunggu Validasi</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daftar penjualan dengan status "delivered" yang perlu divalidasi atau disesuaikan
              </p>
            </CardHeader>
            <CardContent>
              {pendingSales.length > 0 ? (
                <DataTable
                  columns={pendingSalesColumns}
                  data={pendingSales}
                  searchable={true}
                  searchPlaceholder="Cari no. pesanan..."
                />
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Semua Sudah Divalidasi</h3>
                  <p className="text-muted-foreground">
                    Tidak ada penjualan yang perlu divalidasi saat ini
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penyesuaian</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daftar semua penyesuaian yang telah dibuat
              </p>
            </CardHeader>
            <CardContent>
              {adjustments.length > 0 ? (
                <DataTable
                  columns={adjustmentsColumns}
                  data={adjustments}
                  searchable={true}
                  searchPlaceholder="Cari no. pesanan..."
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Penyesuaian</h3>
                  <p className="text-muted-foreground">
                    Belum ada penyesuaian yang dibuat
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjustment Form Dialog */}
      <Dialog open={showAdjustmentForm} onOpenChange={setShowAdjustmentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Penyesuaian untuk Pesanan: {selectedSale?.no_pesanan_platform}
            </DialogTitle>
            {selectedSale && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Customer: {selectedSale.customer_name}</p>
                <p>Total: {formatCurrency(selectedSale.total)}</p>
                <p>Toko: {selectedSale.store?.nama_toko} ({selectedSale.store?.platform?.nama_platform})</p>
              </div>
            )}
          </DialogHeader>
          {selectedSale && (
            <AdjustmentForm
              saleTotal={selectedSale.total}
              onSubmit={handleSubmitAdjustment}
              onCancel={() => {
                setShowAdjustmentForm(false);
                setSelectedSale(null);
              }}
              loading={actionLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}