import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStores, usePlatforms } from '@/hooks/useSupabase';
import { toast } from '@/hooks/use-toast';

interface StoreFormProps {
  editingStore?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StoreForm = ({ editingStore, onSuccess, onCancel }: StoreFormProps) => {
  const [formData, setFormData] = useState({
    platform_id: editingStore?.platform_id || '',
    nama_toko: editingStore?.nama_toko || '',
    nama_marketing: editingStore?.nama_marketing || '',
    email: editingStore?.email || '',
    no_hp: editingStore?.no_hp || '',
    link_toko: editingStore?.link_toko || '',
    saldo_dashboard: editingStore?.saldo_dashboard || 0
  });
  const [loading, setLoading] = useState(false);
  const { createStore, updateStore } = useStores();
  const { platforms, fetchPlatforms } = usePlatforms();

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_toko.trim() || !formData.platform_id) {
      toast({
        title: "Error",
        description: "Nama toko dan platform harus diisi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (editingStore) {
        await updateStore(editingStore.id, formData);
      } else {
        await createStore(formData);
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
          <Label htmlFor="platform_id">Platform*</Label>
          <Select value={formData.platform_id} onValueChange={(value) => setFormData(prev => ({ ...prev, platform_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map(platform => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.nama_platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="nama_toko">Nama Toko*</Label>
          <Input
            id="nama_toko"
            value={formData.nama_toko}
            onChange={(e) => setFormData(prev => ({ ...prev, nama_toko: e.target.value }))}
            placeholder="Masukkan nama toko"
            required
          />
        </div>
        <div>
          <Label htmlFor="nama_marketing">Nama Marketing</Label>
          <Input
            id="nama_marketing"
            value={formData.nama_marketing}
            onChange={(e) => setFormData(prev => ({ ...prev, nama_marketing: e.target.value }))}
            placeholder="Masukkan nama marketing"
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
          <Label htmlFor="link_toko">Link Toko</Label>
          <Input
            id="link_toko"
            value={formData.link_toko}
            onChange={(e) => setFormData(prev => ({ ...prev, link_toko: e.target.value }))}
            placeholder="Masukkan link toko"
          />
        </div>
        <div>
          <Label htmlFor="saldo_dashboard">Saldo Dashboard</Label>
          <Input
            id="saldo_dashboard"
            type="number"
            value={formData.saldo_dashboard}
            onChange={(e) => setFormData(prev => ({ ...prev, saldo_dashboard: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : editingStore ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};