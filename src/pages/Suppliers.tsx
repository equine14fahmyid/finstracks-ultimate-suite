
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSuppliers } from '@/hooks/useSupabase';
import { SupplierForm } from '@/components/suppliers/SupplierForm';

const Suppliers = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  
  const { suppliers, loading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
      await deleteSupplier(id);
    }
  };

  const columns = [
    {
      key: 'supplier_info',
      title: 'Supplier',
      render: (_: any, supplier: any) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-sm md:text-base">{supplier.nama_supplier}</div>
          <div className="text-xs md:text-sm text-muted-foreground">{supplier.alamat}</div>
          <div className="text-xs md:text-sm text-muted-foreground">{supplier.no_hp}</div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_: any, supplier: any) => (
        <div className="flex gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(supplier)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(supplier.id)}
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Supplier</h1>
          <p className="text-sm text-muted-foreground">Kelola data supplier</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuppliers}
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
                <span className="hidden sm:inline">Tambah Supplier</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                </DialogTitle>
              </DialogHeader>
              <SupplierForm
                editingSupplier={editingSupplier}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  setEditingSupplier(null);
                  fetchSuppliers();
                }}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingSupplier(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">Total Supplier</div>
            </div>
            <div className="text-lg md:text-2xl font-bold mt-2">{suppliers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Daftar Supplier</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={suppliers}
              loading={loading}
              searchable={true}
              searchPlaceholder="Cari supplier..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Suppliers;
