import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Plus, Edit, Trash2, TrendingDown, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/utils/format';

interface Asset {
  id: string;
  kode_asset: string;
  nama_asset: string;
  harga_perolehan: number;
  tanggal_perolehan: string;
  umur_ekonomis_bulan: number;
  nilai_buku: number;
  penyusutan_per_bulan: number;
  akumulasi_penyusutan: number;
  created_at: string;
}

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    kode_asset: '',
    nama_asset: '',
    harga_perolehan: 0,
    tanggal_perolehan: '',
    umur_ekonomis_bulan: 12,
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data asset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDepreciation = (hargaPerolehan: number, umurEkonomis: number) => {
    return hargaPerolehan / umurEkonomis;
  };

  const resetForm = () => {
    setFormData({
      kode_asset: '',
      nama_asset: '',
      harga_perolehan: 0,
      tanggal_perolehan: '',
      umur_ekonomis_bulan: 12,
    });
    setIsEditMode(false);
    setSelectedAsset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.kode_asset || !formData.nama_asset || !formData.harga_perolehan || !formData.tanggal_perolehan) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      const penyusutanPerBulan = calculateDepreciation(formData.harga_perolehan, formData.umur_ekonomis_bulan);
      
      const assetData = {
        ...formData,
        nilai_buku: formData.harga_perolehan,
        penyusutan_per_bulan: penyusutanPerBulan,
        akumulasi_penyusutan: 0,
      };

      let result;
      if (isEditMode && selectedAsset) {
        const { data, error } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', selectedAsset.id)
          .select();
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('assets')
          .insert([assetData])
          .select();
        result = { data, error };
      }
      
      if (result.error) throw result.error;
      
      await fetchAssets();
      setDialogOpen(false);
      resetForm();
      
      toast({
        title: "Sukses",
        description: isEditMode ? "Asset berhasil diperbarui" : "Asset berhasil ditambahkan",
      });
    } catch (error) {
      console.error('Asset operation error:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan asset",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (asset: Asset) => {
    setFormData({
      kode_asset: asset.kode_asset,
      nama_asset: asset.nama_asset,
      harga_perolehan: asset.harga_perolehan,
      tanggal_perolehan: asset.tanggal_perolehan,
      umur_ekonomis_bulan: asset.umur_ekonomis_bulan,
    });
    setSelectedAsset(asset);
    setIsEditMode(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus asset ini?')) {
      try {
        const { error } = await supabase
          .from('assets')
          .update({ is_active: false })
          .eq('id', id);
        
        if (error) throw error;
        
        await fetchAssets();
        toast({
          title: "Sukses",
          description: "Asset berhasil dihapus",
        });
      } catch (error) {
        console.error('Delete asset error:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus asset",
          variant: "destructive",
        });
      }
    }
  };

  const totalAssetValue = assets.reduce((total, asset) => total + asset.harga_perolehan, 0);
  const totalNilaiBuku = assets.reduce((total, asset) => total + (asset.nilai_buku || asset.harga_perolehan), 0);
  const totalPenyusutan = assets.reduce((total, asset) => total + (asset.akumulasi_penyusutan || 0), 0);

  if (loading) return <div className="p-6">Loading asset data...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Asset</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Edit Asset' : 'Tambah Asset Baru'}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode ? 'Perbarui informasi asset' : 'Lengkapi informasi asset yang akan ditambahkan'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="kode_asset">Kode Asset *</Label>
                  <Input
                    id="kode_asset"
                    value={formData.kode_asset}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      kode_asset: e.target.value
                    }))}
                    placeholder="AST001"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nama_asset">Nama Asset *</Label>
                  <Input
                    id="nama_asset"
                    value={formData.nama_asset}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      nama_asset: e.target.value
                    }))}
                    placeholder="Komputer, Mesin, dll"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="harga_perolehan">Harga Perolehan *</Label>
                  <Input
                    id="harga_perolehan"
                    type="number"
                    value={formData.harga_perolehan}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      harga_perolehan: Number(e.target.value)
                    }))}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tanggal_perolehan">Tanggal Perolehan *</Label>
                  <Input
                    id="tanggal_perolehan"
                    type="date"
                    value={formData.tanggal_perolehan}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      tanggal_perolehan: e.target.value
                    }))}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="umur_ekonomis_bulan">Umur Ekonomis (Bulan) *</Label>
                  <Input
                    id="umur_ekonomis_bulan"
                    type="number"
                    value={formData.umur_ekonomis_bulan}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      umur_ekonomis_bulan: Number(e.target.value)
                    }))}
                    placeholder="12"
                    min="1"
                    required
                  />
                </div>

                {formData.harga_perolehan > 0 && formData.umur_ekonomis_bulan > 0 && (
                  <div className="grid gap-2 p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Estimasi Penyusutan:</div>
                    <div className="font-medium">
                      {formatCurrency(calculateDepreciation(formData.harga_perolehan, formData.umur_ekonomis_bulan))} / bulan
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Perbarui' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asset</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">Item asset</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harga Perolehan</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssetValue)}</div>
            <p className="text-xs text-muted-foreground">Total investasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Buku</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNilaiBuku)}</div>
            <p className="text-xs text-muted-foreground">Nilai saat ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akumulasi Penyusutan</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPenyusutan)}</div>
            <p className="text-xs text-muted-foreground">Total penyusutan</p>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Asset</TableHead>
                <TableHead>Nama Asset</TableHead>
                <TableHead>Harga Perolehan</TableHead>
                <TableHead>Tanggal Perolehan</TableHead>
                <TableHead>Umur Ekonomis</TableHead>
                <TableHead>Nilai Buku</TableHead>
                <TableHead>Penyusutan/Bulan</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length > 0 ? assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.kode_asset}</TableCell>
                  <TableCell>{asset.nama_asset}</TableCell>
                  <TableCell>{formatCurrency(asset.harga_perolehan)}</TableCell>
                  <TableCell>{formatDate(asset.tanggal_perolehan)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {asset.umur_ekonomis_bulan} bulan
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(asset.nilai_buku || asset.harga_perolehan)}</TableCell>
                  <TableCell>{formatCurrency(asset.penyusutan_per_bulan || 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(asset)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(asset.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    Belum ada data asset
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assets;