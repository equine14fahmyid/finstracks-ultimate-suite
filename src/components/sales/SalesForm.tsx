import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface SalesFormProps {
  editingSale?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SalesForm = ({ editingSale, onSuccess, onCancel }: SalesFormProps) => {
  const [formData, setFormData] = useState({
    tanggal: editingSale?.tanggal || new Date().toISOString().split('T')[0],
    no_pesanan_platform: editingSale?.no_pesanan_platform || '',
    customer_name: editingSale?.customer_name || '',
    customer_phone: editingSale?.customer_phone || '',
    customer_address: editingSale?.customer_address || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.no_pesanan_platform.trim()) {
      toast({
        title: "Error",
        description: "No pesanan harus diisi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Logic for save will be implemented
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
          <Label htmlFor="tanggal">Tanggal*</Label>
          <Input
            id="tanggal"
            type="date"
            value={formData.tanggal}
            onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="no_pesanan_platform">No. Pesanan Platform*</Label>
          <Input
            id="no_pesanan_platform"
            value={formData.no_pesanan_platform}
            onChange={(e) => setFormData(prev => ({ ...prev, no_pesanan_platform: e.target.value }))}
            placeholder="Masukkan nomor pesanan"
            required
          />
        </div>
        <div>
          <Label htmlFor="customer_name">Nama Customer</Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
            placeholder="Masukkan nama customer"
          />
        </div>
        <div>
          <Label htmlFor="customer_phone">No. HP Customer</Label>
          <Input
            id="customer_phone"
            value={formData.customer_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
            placeholder="Masukkan nomor HP"
          />
        </div>
        <div>
          <Label htmlFor="customer_address">Alamat Customer</Label>
          <Input
            id="customer_address"
            value={formData.customer_address}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
            placeholder="Masukkan alamat"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : editingSale ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};