import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/common/DataTable';
import { formatDate, formatCurrency } from '@/utils/format';
import { useSuppliers } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/integrations/supabase/client';

interface Supplier {
  id: string;
  nama_supplier: string;
  alamat?: string;
  no_hp?: string;
  email?: string;
  created_at: string;
  is_active: boolean;
}

const Suppliers = () => {
  const { hasPermission } = useAuth();
  const { suppliers, loading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_supplier: '',
    alamat: '',
    no_hp: '',
    email: '',
    deskripsi: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const resetForm = () => {
    setFormData({
      nama_supplier: '',
      alamat: '',
      no_hp: '',
      email: '',
      deskripsi: '',
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_supplier.trim()) {
      toast({
        title: "Error",
        description: "Nama supplier wajib diisi",
        variant: "destructive",
      });
      return;
    }

    let result;
    if (isEditMode && editingId) {
      result = await updateSupplier(editingId, formData);
    } else {
      result = await createSupplier(formData);
    }
    
    if (!result?.error) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (supplier: any) => {
    setFormData({
      nama_supplier: supplier.nama_supplier,
      alamat: supplier.alamat || '',
      no_hp: supplier.no_hp || '',
      email: supplier.email || '',
      deskripsi: supplier.deskripsi || '',
    });
    setIsEditMode(true);
    setEditingId(supplier.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Check if supplier is being used in any purchases
    try {
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('supplier_id', id)
        .limit(1);

      if (error) throw error;

      if (purchases && purchases.length > 0) {
        toast({
          title: "Tidak dapat menghapus",
          description: "Supplier ini masih memiliki transaksi pembelian terkait",
          variant: "destructive",
        });
        return;
      }

      if (confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
        await deleteSupplier(id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal memeriksa data: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  const columns = [
    {
      key: "nama_supplier",
      title: "Nama Supplier",
      render: (supplier: any) => (
        <div className="font-medium">{supplier.nama_supplier}</div>
      ),
    },
    {
      key: "deskripsi",
      title: "Deskripsi",
      render: (supplier: any) => (
        <div className="max-w-xs">
          <div className="text-sm text-foreground font-medium">
            {supplier.deskripsi ? (
              <div className="line-clamp-2 break-words">
                {supplier.deskripsi}
              </div>
            ) : (
              <span className="text-muted-foreground italic">-</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "alamat",
      title: "Alamat",
      render: (supplier: any) => (
        <div className="max-w-xs">
          <div className="text-sm text-foreground">
            {supplier.alamat ? (
              <div className="line-clamp-2 break-words">
                {supplier.alamat}
              </div>
            ) : (
              <span className="text-muted-foreground italic">-</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "no_hp",
      title: "No. HP",
      render: (supplier: any) => (
        <div className="text-muted-foreground">
          {supplier.no_hp || "-"}
        </div>
      ),
    },
    {
      key: "email",
      title: "Email",
      render: (supplier: any) => (
        <div className="text-muted-foreground">
          {supplier.email || "-"}
        </div>
      ),
    },
    {
      key: "created_at",
      title: "Tgl Dibuat",
      render: (supplier: any) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(supplier.created_at)}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Aksi",
      render: (supplier: any) => (
        <div className="flex items-center gap-2">
          {hasPermission('suppliers.update') && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => handleEdit(supplier)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('suppliers.delete') && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              onClick={() => handleDelete(supplier.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!hasPermission('suppliers.read')) {
    return (
      <div className="p-6">
        <Card className="glass-card border-0 p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
          <p className="text-muted-foreground">
            Anda tidak memiliki izin untuk melihat data supplier.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Data Supplier</h1>
          <p className="text-muted-foreground">
            Kelola data supplier dan vendor bisnis Anda
          </p>
        </div>

        {hasPermission('suppliers.create') && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {isEditMode ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditMode 
                      ? 'Perbarui informasi supplier' 
                      : 'Lengkapi informasi supplier yang akan ditambahkan'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nama_supplier">Nama Supplier *</Label>
                    <Input
                      id="nama_supplier"
                      value={formData.nama_supplier}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        nama_supplier: e.target.value
                      }))}
                      placeholder="Masukkan nama supplier"
                      className="glass-input"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="deskripsi">Deskripsi</Label>
                    <Textarea
                      id="deskripsi"
                      value={formData.deskripsi}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        deskripsi: e.target.value
                      }))}
                      placeholder="Masukkan deskripsi supplier"
                      className="glass-input"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="alamat">Alamat</Label>
                    <Textarea
                      id="alamat"
                      value={formData.alamat}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        alamat: e.target.value
                      }))}
                      placeholder="Masukkan alamat lengkap"
                      className="glass-input"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="no_hp">No. HP</Label>
                      <Input
                        id="no_hp"
                        value={formData.no_hp}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          no_hp: e.target.value
                        }))}
                        placeholder="08xxxxxxxxxx"
                        className="glass-input"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        placeholder="supplier@example.com"
                        className="glass-input"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="glass-button"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    {isEditMode ? 'Perbarui' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supplier</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">
              Supplier aktif terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dengan Kontak</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.no_hp || s.email).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Supplier dengan info kontak
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terbaru</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => {
                const created = new Date(s.created_at);
                const today = new Date();
                const diffTime = Math.abs(today.getTime() - created.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ditambahkan 30 hari terakhir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        searchable={true}
        searchPlaceholder="Cari supplier..."
        onExport={() => {
          toast({
            title: "Info",
            description: "Fitur export akan ditambahkan pada versi berikutnya",
          });
        }}
      />
    </div>
  );
};

export default Suppliers;