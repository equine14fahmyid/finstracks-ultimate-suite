import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, InputCurrency } from '@/components/ui/input'; // Impor InputCurrency
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency } from '@/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface ProductFormData {
  nama_produk: string;
  satuan: string;
  harga_beli: number;
  harga_jual_default: number;
  deskripsi: string;
  variants: {
    warna: string;
    size: string;
    stok: number;
  }[];
}

const Products = () => {
  const { hasPermission } = useAuth();
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    nama_produk: '',
    satuan: 'pcs',
    harga_beli: 0,
    harga_jual_default: 0,
    deskripsi: '',
    variants: [{ warna: '', size: '', stok: 0 }]
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_produk || formData.harga_beli <= 0 || formData.harga_jual_default <= 0) {
      toast({
        title: "Error",
        description: "Semua field wajib diisi dengan benar",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      nama_produk: formData.nama_produk,
      satuan: formData.satuan,
      harga_beli: formData.harga_beli,
      harga_jual_default: formData.harga_jual_default,
      deskripsi: formData.deskripsi || null,
    };

    const variants = formData.variants.filter(v => v.warna && v.size);

    let result;
    if (editingProduct) {
      result = await updateProduct(editingProduct.id, productData);
    } else {
      result = await createProduct(productData, variants);
    }
    
    if (result && !result.error) {
        setDialogOpen(false);
        resetForm();
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      nama_produk: product.nama_produk || '',
      satuan: product.satuan || 'pcs',
      harga_beli: product.harga_beli || 0,
      harga_jual_default: product.harga_jual_default || 0,
      deskripsi: product.deskripsi || '',
      variants: product.product_variants?.length > 0 
        ? product.product_variants.map((v: any) => ({ warna: v.warna || '', size: v.size || '', stok: v.stok || 0 }))
        : [{ warna: '', size: '', stok: 0 }]
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      await deleteProduct(id);
    }
  };

  const resetForm = () => {
    setFormData({
      nama_produk: '',
      satuan: 'pcs',
      harga_beli: 0,
      harga_jual_default: 0,
      deskripsi: '',
      variants: [{ warna: '', size: '', stok: 0 }]
    });
    setEditingProduct(null);
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { warna: '', size: '', stok: 0 }]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const columns = [
    {
      key: 'nama_produk',
      title: 'Nama Produk',
      render: (_: any, product: any) => (
        <div>
          <div className="font-medium">{product?.nama_produk || '-'}</div>
          <div className="text-sm text-muted-foreground">{product?.satuan || 'pcs'}</div>
        </div>
      )
    },
    {
      key: 'variants',
      title: 'Varian',
      render: (_: any, product: any) => (
        <div className="flex flex-wrap gap-1">
          {product?.product_variants?.slice(0, 3).map((variant: any, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {variant?.warna || '-'} / {variant?.size || '-'} ({variant?.stok || 0})
            </Badge>
          )) || <span className="text-muted-foreground text-sm">Tidak ada varian</span>}
          {product?.product_variants?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{product.product_variants.length - 3} lainnya
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'harga_beli',
      title: 'Harga Beli',
      render: (_: any, product: any) => formatCurrency(product?.harga_beli)
    },
    {
      key: 'harga_jual_default',
      title: 'Harga Jual',
      render: (_: any, product: any) => formatCurrency(product?.harga_jual_default)
    },
    {
      key: 'total_stock',
      title: 'Total Stok',
      render: (_: any, product: any) => {
        const totalStock = product?.product_variants?.reduce((sum: number, v: any) => sum + (v?.stok || 0), 0) || 0;
        return (
          <Badge variant={totalStock > 10 ? "default" : totalStock > 0 ? "secondary" : "destructive"}>
            {totalStock}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_: any, product: any) => (
        <div className="flex gap-2">
          {hasPermission('products.update') && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleEdit(product)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('products.delete') && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleDelete(product?.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manajemen Produk</h1>
          <p className="text-muted-foreground">
            Kelola produk dan varian untuk sistem penjualan
          </p>
        </div>

        {hasPermission('products.create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nama_produk">Nama Produk *</Label>
                    <Input
                      id="nama_produk"
                      value={formData.nama_produk}
                      onChange={(e) => setFormData(prev => ({ ...prev, nama_produk: e.target.value }))}
                      placeholder="Contoh: Kaos Polos"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="satuan">Satuan</Label>
                    <Select 
                      value={formData.satuan} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, satuan: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pcs</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                        <SelectItem value="lusin">Lusin</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="harga_beli">Harga Beli *</Label>
                    <InputCurrency
                      id="harga_beli"
                      value={formData.harga_beli}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, harga_beli: value }))}
                      placeholder="Rp 0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="harga_jual_default">Harga Jual Default *</Label>
                    <InputCurrency
                      id="harga_jual_default"
                      value={formData.harga_jual_default}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, harga_jual_default: value }))}
                      placeholder="Rp 0"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                    placeholder="Deskripsi produk (opsional)"
                    rows={3}
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Varian Produk</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addVariant}>
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah Varian
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {formData.variants.map((variant, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label>Warna</Label>
                            <Input
                              value={variant.warna}
                              onChange={(e) => updateVariant(index, 'warna', e.target.value)}
                              placeholder="Merah"
                            />
                          </div>
                          <div className="flex-1">
                            <Label>Size</Label>
                            <Input
                              value={variant.size}
                              onChange={(e) => updateVariant(index, 'size', e.target.value)}
                              placeholder="L"
                            />
                          </div>
                          <div className="flex-1">
                            <Label>Stok Awal</Label>
                            <Input
                              type="number"
                              value={variant.stok}
                              onChange={(e) => updateVariant(index, 'stok', Number(e.target.value))}
                              placeholder="10"
                            />
                          </div>
                          {formData.variants.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => removeVariant(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="gradient-primary">
                    {loading ? 'Menyimpan...' : editingProduct ? 'Update Produk' : 'Simpan Produk'}
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
            <Package className="h-5 w-5" />
            Daftar Produk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={products || []}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari produk..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
