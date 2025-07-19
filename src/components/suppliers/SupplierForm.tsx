import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSuppliers } from '@/hooks/useSupabase';
import { toast } from '@/hooks/use-toast';

interface SupplierFormProps {
  editingSupplier?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SupplierForm = ({ editingSupplier, onSuccess, onCancel }: SupplierFormProps) => {
  const [formData, setFormData] = useState({
    nama_supplier: editingSupplier?.nama_supplier || '',
    alamat: editingSupplier?.alamat || '',
    no_hp: editingSupplier?.no_hp || '',
    email: editingSupplier?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const { createSupplier, updateSupplier } = useSuppliers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_supplier.trim()) {
      toast({
        title: "Error",
        description: "Nama supplier harus diisi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await createSupplier(formData);
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
          <Label htmlFor="nama_supplier">Nama Supplier*</Label>
          <Input
            id="nama_supplier"
            value={formData.nama_supplier}
            onChange={(e) => setFormData(prev => ({ ...prev, nama_supplier: e.target.value }))}
            placeholder="Masukkan nama supplier"
            required
          />
        </div>
        <div>
          <Label htmlFor="alamat">Alamat</Label>
          <Textarea
            id="alamat"
            value={formData.alamat}
            onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
            placeholder="Masukkan alamat"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="no_hp">No. HP</Label>
          <Input
            id="no_hp"
            value={formData.no_hp}
            onChange={(e) => setFormData(prev => ({ ...prev, no_hp: e.target.value }))}
            placeholder="Masukkan nomor HP"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Masukkan email"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : editingSupplier ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};