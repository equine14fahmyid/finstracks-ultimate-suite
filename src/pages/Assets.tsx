import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Plus, Edit, Trash2, TrendingDown, Calculator, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      setLoading(true);
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
    if (umurEkonomis <= 0) return 0;
    return hargaPerolehan / umurEkonomis;
  };

  // Improved month calculation
  const calculateMonthsUsed = (tanggalPerolehan: string): number => {
    const now = new Date();
    const startDate = new Date(tanggalPerolehan);
    
    const yearDiff = now.getFullYear() - startDate.getFullYear();
    const monthDiff = now.getMonth() - startDate.getMonth();
    const dayDiff = now.getDate() - startDate.getDate();
    
    let totalMonths = yearDiff * 12 + monthDiff;
    
    // Add partial month if current day is past the start day
    if (dayDiff >= 0) {
      totalMonths += dayDiff / 30; // Approximate partial month
    }
    
    return Math.max(0, Math.floor(totalMonths));
  };

  const validateFormData = async (data: typeof formData, isEdit: boolean = false): Promise<string[]> => {
    const errors: string[] = [];
    
    // Basic validation
    if (!data.kode_asset.trim()) {
      errors.push("Kode asset wajib diisi");
    } else if (!/^[A-Z0-9]{3,10}$/.test(data.kode_asset)) {
      errors.push("Kode asset harus 3-10 karakter (huruf besar dan angka)");
    }
    
    if (!data.nama_asset.trim()) {
      errors.push("Nama asset wajib diisi");
    }
    
    if (!data.harga_perolehan || data.harga_perolehan <= 0) {
      errors.push("Harga perolehan harus lebih dari 0");
    }
    
    if (!data.tanggal_perolehan) {
      errors.push("Tanggal perolehan wajib diisi");
    } else {
      const selectedDate = new Date(data.tanggal_perolehan);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (selectedDate > today) {
        errors.push("Tanggal perolehan tidak boleh di masa depan");
      }
    }
    
    if (!data.umur_ekonomis_bulan || data.umur_ekonomis_bulan <= 0) {
      errors.push("Umur ekonomis harus lebih dari 0 bulan");
    }
    
    // Check for duplicate kode_asset (only for new assets or when editing different asset)
    if (!isEdit || (selectedAsset && selectedAsset.kode_asset !== data.kode_asset)) {
      try {
        const { data: existingAssets, error } = await supabase
          .from('assets')
          .select('id')
          .eq('kode_asset', data.kode_asset)
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (existingAssets && existingAssets.length > 0) {
          errors.push("Kode asset sudah digunakan");
        }
      } catch (error) {
        console.error('Error checking duplicate kode_asset:', error);
        errors.push("Gagal validasi kode asset");
      }
    }
    
    return errors;
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

  const createExpenseRecord = async (assetData: any, categoryId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          tanggal: assetData.tanggal_perolehan,
          category_id: categoryId,
          jumlah: assetData.harga_perolehan,
          keterangan: `Pembelian asset: ${assetData.nama_asset} (${assetData.kode_asset})`,
          created_by: user?.id
        }]);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating expense record:', error);
      return false;
    }
  };

  const findOrCreateCategory = async (): Promise<string | null> => {
    try {
      // Try to find existing category
      let { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('nama_kategori', 'Pembelian Asset')
        .eq('tipe_kategori', 'expense')
        .eq('is_active', true)
        .limit(1);

      let categoryId = categories?.[0]?.id;

      if (!categoryId) {
        // Create the category if it doesn't exist
        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert([{
            nama_kategori: 'Pembelian Asset',
            tipe_kategori: 'expense'
          }])
          .select('id')
          .single();
        
        if (error) throw error;
        categoryId = newCategory?.id;
      }

      return categoryId;
    } catch (error) {
      console.error('Error finding/creating category:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      // Validate form data
      const validationErrors = await validateFormData(formData, isEditMode);
      if (validationErrors.length > 0) {
        toast({
          title: "Error Validasi",
          description: validationErrors.join(", "),
          variant: "destructive",
        });
        return;
      }

      const penyusutanPerBulan = calculateDepreciation(formData.harga_perolehan, formData.umur_ekonomis_bulan);
      
      const assetData = {
        ...formData,
        kode_asset: formData.kode_asset.toUpperCase().trim(),
        nama_asset: formData.nama_asset.trim(),
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

        // Record as expense when creating new asset
        if (!error && data && data[0]) {
          const categoryId = await findOrCreateCategory();
          if (categoryId) {
            const expenseCreated = await createExpenseRecord(assetData, categoryId);
            if (!expenseCreated) {
              toast({
                title: "Warning",
                description: "Asset berhasil dibuat, namun gagal mencatat pengeluaran",
                variant: "default",
              });
            }
          }
        }
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
        description: "Gagal menyimpan asset. " + (error as any)?.message || '',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateDepreciation = async (assetId: string) => {
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;

      const monthsUsed = calculateMonthsUsed(asset.tanggal_perolehan);
      
      const akumulasiPenyusutan = Math.min(
        monthsUsed * asset.penyusutan_per_bulan,
        asset.harga_perolehan
      );
      
      const nilaiBuku = Math.max(0, asset.harga_perolehan - akumulasiPenyusutan);

      const { error } = await supabase
        .from('assets')
        .update({
          akumulasi_penyusutan: akumulasiPenyusutan,
          nilai_buku: nilaiBuku
        })
        .eq('id', assetId);

      if (error) throw error;

      await fetchAssets();
      toast({
        title: "Sukses",
        description: "Penyusutan asset berhasil diperbarui",
      });
    } catch (error) {
      console.error('Update depreciation error:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui penyusutan: " + (error as any)?.message,
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
          description: "Gagal menghapus asset: " + (error as any)?.message,
          variant: "destructive",
        });
      }
    }
  };

  const totalAssetValue = assets.reduce((total, asset) => total + asset.harga_perolehan, 0);
  const totalNilaiBuku = assets.reduce((total, asset) => total + (asset.nilai_buku || asset.harga_perolehan), 0);
  const totalPenyusutan = assets.reduce((total, asset) => total + (asset.akumulasi_penyusutan || 0), 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Memuat data asset...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Asset</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button disabled={submitting}>
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
                      kode_asset: e.target.value.toUpperCase()
                    }))}
                    placeholder="AST001"
                    maxLength={10}
                    pattern="[A-Z0-9]{3,10}"
                    title="3-10 karakter (huruf besar dan angka)"
                    required
                  />
                  <div className="text-xs text-muted-foreground">
                    Format: 3-10 karakter huruf besar dan angka
                  </div>
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
                    value={formData.harga_perolehan || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      harga_perolehan: Number(e.target.value) || 0
                    }))}
                    placeholder="10.000.000"
                    min="1"
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
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="umur_ekonomis_bulan">Umur Ekonomis (Bulan) *</Label>
                  <Input
                    id="umur_ekonomis_bulan"
                    type="number"
                    value={formData.umur_ekonomis_bulan || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      umur_ekonomis_bulan: Number(e.target.value) || 1
                    }))}
                    placeholder="12"
                    min="1"
                    max="600"
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
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>Processing...</>
                  ) : (
                    isEditMode ? 'Perbarui' : 'Simpan'
                  )}
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
          <div className="overflow-x-auto">
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
                {assets.length > 0 ? assets.map((asset) => {
                  const monthsUsed = calculateMonthsUsed(asset.tanggal_perolehan);
                  const isFullyDepreciated = (asset.akumulasi_penyusutan || 0) >= asset.harga_perolehan;
                  
                  return (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium font-mono">{asset.kode_asset}</TableCell>
                      <TableCell>{asset.nama_asset}</TableCell>
                      <TableCell>{formatCurrency(asset.harga_perolehan)}</TableCell>
                      <TableCell>{formatDate(asset.tanggal_perolehan)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {asset.umur_ekonomis_bulan} bulan
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {formatCurrency(asset.nilai_buku || asset.harga_perolehan)}
                          {isFullyDepreciated && (
                            <Badge variant="secondary" className="text-xs">
                              Habis
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(asset.penyusutan_per_bulan || 0)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateDepreciation(asset.id)}
                            title={`Update Penyusutan (${monthsUsed} bulan)`}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                            title="Edit Asset"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(asset.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Hapus Asset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      <div className="text-center py-12">
                        <div className="text-gray-500 text-lg mb-4">
                          🏢 Belum ada data asset
                        </div>
                        <p className="text-gray-400 mb-6">
                          Tambahkan asset pertama untuk mulai mengelola aset perusahaan
                        </p>