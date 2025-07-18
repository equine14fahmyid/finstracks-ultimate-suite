import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, InputCurrency } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Landmark } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatShortDate } from '@/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

// PERBAIKAN: Tambahkan umur_ekonomis_bulan
interface AssetFormData {
  nama_aset: string;
  tanggal_perolehan: string;
  harga_perolehan: number;
  umur_ekonomis_bulan: number;
  deskripsi: string;
}

const Assets = () => {
  const { hasPermission } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [formData, setFormData] = useState<AssetFormData>({
    nama_aset: '',
    tanggal_perolehan: new Date().toISOString().split('T')[0],
    harga_perolehan: 0,
    umur_ekonomis_bulan: 0,
    deskripsi: ''
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('assets').select('*').order('tanggal_perolehan', { ascending: false });
      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data aset.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createAsset = async (assetData: AssetFormData) => {
    try {
      const { data, error } = await supabase.from('assets').insert([assetData]).select().single();
      if (error) throw error;
      toast({ title: "Sukses", description: "Aset berhasil ditambahkan." });
      await fetchAssets();
      return { success: true, data };
    } catch (error: any) {
      toast({ title: "Error", description: `Gagal menambahkan aset: ${error.message}`, variant: "destructive" });
      return { error: true };
    }
  };

  const updateAsset = async (id: string, assetData: AssetFormData) => {
    try {
      const { data, error } = await supabase.from('assets').update(assetData).eq('id', id).select().single();
      if (error) throw error;
      toast({ title: "Sukses", description: "Aset berhasil diperbarui." });
      await fetchAssets();
      return { success: true, data };
    } catch (error: any) {
      toast({ title: "Error", description: `Gagal memperbarui aset: ${error.message}`, variant: "destructive" });
      return { error: true };
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sukses", description: "Aset berhasil dihapus." });
      await fetchAssets();
    } catch (error: any) {
      toast({ title: "Error", description: `Gagal menghapus aset: ${error.message}`, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_aset || formData.harga_perolehan <= 0 || formData.umur_ekonomis_bulan <= 0) {
      toast({
        title: "Error",
        description: "Semua field wajib diisi dengan benar",
        variant: "destructive",
      });
      return;
    }

    const result = editingAsset
      ? await updateAsset(editingAsset.id, formData)
      : await createAsset(formData);

    if (result && !result.error) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (asset: any) => {
    setEditingAsset(asset);
    setFormData({
      nama_aset: asset.nama_aset,
      tanggal_perolehan: asset.tanggal_perolehan,
      harga_perolehan: asset.harga_perolehan,
      umur_ekonomis_bulan: asset.umur_ekonomis_bulan || 0,
      deskripsi: asset.deskripsi || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteAsset(id);
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
      nama_aset: '',
      tanggal_perolehan: new Date().toISOString().split('T')[0],
      harga_perolehan: 0,
      umur_ekonomis_bulan: 0,
      deskripsi: ''
    });
  };

  const columns = [
    {
      key: 'nama_aset',
      title: 'Nama Aset',
      render: (_: any, asset: any) => (
        <div>
          <div className="font-medium">{asset.nama_aset}</div>
          <div className="text-sm text-muted-foreground">
            Diperoleh: {formatShortDate(asset.tanggal_perolehan)}
          </div>
        </div>
      )
    },
    {
      key: 'harga_perolehan',
      title: 'Harga Perolehan',
      render: (_: any, asset: any) => (
        <span className="font-medium">{formatCurrency(asset.harga_perolehan)}</span>
      )
    },
    {
      key: 'umur_ekonomis_bulan',
      title: 'Umur Ekonomis',
      render: (_: any, asset: any) => (
        <span>{asset.umur_ekonomis_bulan} bulan</span>
      )
    },
    {
      key: 'deskripsi',
      title: 'Deskripsi',
      render: (_: any, asset: any) => <span className="text-sm text-muted-foreground">{asset.deskripsi || '-'}</span>
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_: any, asset: any) => (
        <div className="flex gap-2">
          {hasPermission('assets.update') && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(asset)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('assets.delete') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Aset</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus aset "{asset.nama_aset}"? Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(asset.id)} className="bg-destructive text-destructive-foreground">
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manajemen Aset</h1>
          <p className="text-muted-foreground">
            Kelola aset tetap perusahaan Anda
          </p>
        </div>
        {hasPermission('assets.create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Aset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nama_aset">Nama Aset *</Label>
                  <Input
                    id="nama_aset"
                    value={formData.nama_aset}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama_aset: e.target.value }))}
                    placeholder="Contoh: Laptop, Mesin Jahit"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tanggal_perolehan">Tanggal Perolehan *</Label>
                    <Input
                      id="tanggal_perolehan"
                      type="date"
                      value={formData.tanggal_perolehan}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggal_perolehan: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="harga_perolehan">Harga Perolehan *</Label>
                    <InputCurrency
                      id="harga_perolehan"
                      value={formData.harga_perolehan}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, harga_perolehan: value }))}
                      placeholder="Rp 0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="umur_ekonomis_bulan">Umur Ekonomis (Bulan) *</Label>
                  <Input
                    id="umur_ekonomis_bulan"
                    type="number"
                    value={formData.umur_ekonomis_bulan}
                    onChange={(e) => setFormData(prev => ({ ...prev, umur_ekonomis_bulan: parseInt(e.target.value) || 0 }))}
                    placeholder="Contoh: 48"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                    placeholder="Deskripsi atau catatan mengenai aset"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="gradient-primary">
                    {loading ? 'Menyimpan...' : editingAsset ? 'Update' : 'Simpan'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Daftar Aset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={assets || []}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari aset..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Assets;
