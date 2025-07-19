
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Store, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStores } from '@/hooks/useSupabase';
import { formatCurrency } from '@/utils/format';
import { StoreForm } from '@/components/stores/StoreForm';

const Stores = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  
  const { stores, loading, fetchStores, createStore, updateStore, deleteStore } = useStores();

  useEffect(() => {
    fetchStores();
  }, []);

  const handleEdit = (store: any) => {
    setEditingStore(store);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus toko ini?')) {
      await deleteStore(id);
    }
  };

  const totalStores = stores.length;
  const totalBalance = stores.reduce((sum, store) => sum + (store.saldo_dashboard || 0), 0);

  const columns = [
    {
      key: 'store_info',
      title: 'Toko',
      render: (_: any, store: any) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-sm md:text-base">{store.nama_toko}</div>
          <div className="text-xs md:text-sm text-muted-foreground">
            {store.platform?.nama_platform || 'Platform tidak ditemukan'}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            Marketing: {store.nama_marketing}
          </div>
        </div>
      )
    },
    {
      key: 'balance',
      title: 'Saldo Dashboard',
      render: (_: any, store: any) => (
        <div className="font-medium text-green-600 text-sm">
          {formatCurrency(store.saldo_dashboard || 0)}
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Kontak',
      render: (_: any, store: any) => (
        <div className="text-xs md:text-sm">
          <div>{store.email}</div>
          <div className="text-muted-foreground">{store.no_hp}</div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_: any, store: any) => (
        <div className="flex gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(store)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(store.id)}
            className="h-8 w-8 p-0 text-destructive"
          >
            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Toko</h1>
          <p className="text-sm text-muted-foreground">Kelola data toko online</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStores}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tambah Toko</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4">
              <DialogHeader>
                <DialogTitle>
                  {editingStore ? 'Edit Toko' : 'Tambah Toko Baru'}
                </DialogTitle>
              </DialogHeader>
              <StoreForm
                editingStore={editingStore}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  setEditingStore(null);
                  fetchStores();
                }}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingStore(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards - Mobile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">Total Toko</div>
            </div>
            <div className="text-lg md:text-2xl font-bold mt-2">{totalStores}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Saldo</div>
            <div className="text-lg md:text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(totalBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Daftar Toko</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={stores}
              loading={loading}
              searchable={true}
              searchPlaceholder="Cari toko..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stores;
