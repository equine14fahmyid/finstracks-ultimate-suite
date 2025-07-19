import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProducts } from '@/hooks/useSupabase';
import { toast } from '@/hooks/use-toast';

interface ProductFormProps {
  editingProduct?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProductForm = ({ editingProduct, onSuccess, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    nama_produk: editingProduct?.nama_produk || '',
    satuan: editingProduct?.satuan || 'pcs',
    harga_beli: editingProduct?.harga_beli || 0,
    harga_jual_default: editingProduct?.harga_jual_default || 0
  });
  const [loading, setLoading] = useState(false);
  const { createProduct, updateProduct } = useProducts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_produk.trim()) {
      toast({
        title: "Error",
        description: "Nama produk harus diisi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="nama_produk">Nama Produk*</Label>
          <Input
            id="nama_produk"
            value={formData.nama_produk}
            onChange={(e) => setFormData(prev => ({ ...prev, nama_produk: e.target.value }))}
            placeholder="Masukkan nama produk"
            required
          />
        </div>
        <div>
          <Label htmlFor="satuan">Satuan</Label>
          <Input
            id="satuan"
            value={formData.satuan}
            onChange={(e) => setFormData(prev => ({ ...prev, satuan: e.target.value }))}
            placeholder="pcs, kg, meter, dll"
          />
        </div>
        <div>
          <Label htmlFor="harga_beli">Harga Beli</Label>
          <Input
            id="harga_beli"
            type="number"
            value={formData.harga_beli}
            onChange={(e) => setFormData(prev => ({ ...prev, harga_beli: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="harga_jual_default">Harga Jual Default</Label>
          <Input
            id="harga_jual_default"
            type="number"
            value={formData.harga_jual_default}
            onChange={(e) => setFormData(prev => ({ ...prev, harga_jual_default: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : editingProduct ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};