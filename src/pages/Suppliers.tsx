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
  const { suppliers, loading, fetchSuppliers, createSupplier } = useSuppliers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_supplier: '',
    alamat: '',
    no_hp: '',
    email: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

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

    const { error } = await createSupplier(formData);
    
    if (!error) {
      setIsDialogOpen(false);
      setFormData({
        nama_supplier: '',
        alamat: '',
        no_hp: '',
        email: '',
      });
    }
  };

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "nama_supplier",
      header: "Nama Supplier",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("nama_supplier")}</div>
      ),
    },
    {
      accessorKey: "alamat",
      header: "Alamat",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("alamat") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "no_hp",
      header: "No. HP",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("no_hp") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("email") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Tgl Dibuat",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.getValue("created_at"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {hasPermission('suppliers.update') && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('suppliers.delete') && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Tambah Supplier Baru</DialogTitle>
                  <DialogDescription>
                    Lengkapi informasi supplier yang akan ditambahkan
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
                      rows={3}
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
                    onClick={() => setIsDialogOpen(false)}
                    className="glass-button"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    Simpan
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
        title="Daftar Supplier"
        description="Data semua supplier yang terdaftar dalam sistem"
        searchKey="nama_supplier"
        onExport={() => {
          // Export functionality can be added here
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