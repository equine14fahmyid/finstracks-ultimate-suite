import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlatforms } from '@/hooks/useSupabase';
import { toast } from '@/hooks/use-toast';

interface PlatformFormProps {
  editingPlatform?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PlatformForm = ({ editingPlatform, onSuccess, onCancel }: PlatformFormProps) => {
  const [formData, setFormData] = useState({
    nama_platform: editingPlatform?.nama_platform || '',
    metode_pencairan: editingPlatform?.metode_pencairan || '',
    komisi_default_persen: editingPlatform?.komisi_default_persen || 0
  });
  const [loading, setLoading] = useState(false);
  const { createPlatform, updatePlatform } = usePlatforms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_platform.trim()) {
      toast({
        title: "Error",
        description: "Nama platform harus diisi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (editingPlatform) {
        await updatePlatform(editingPlatform.id, formData);
      } else {
        await createPlatform(formData);
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
          <Label htmlFor="nama_platform">Nama Platform*</Label>
          <Input
            id="nama_platform"
            value={formData.nama_platform}
            onChange={(e) => setFormData(prev => ({ ...prev, nama_platform: e.target.value }))}
            placeholder="Masukkan nama platform"
            required
          />
        </div>
        <div>
          <Label htmlFor="metode_pencairan">Metode Pencairan</Label>
          <Input
            id="metode_pencairan"
            value={formData.metode_pencairan}
            onChange={(e) => setFormData(prev => ({ ...prev, metode_pencairan: e.target.value }))}
            placeholder="Contoh: Auto/Manual"
          />
        </div>
        <div>
          <Label htmlFor="komisi_default_persen">Komisi Default (%)</Label>
          <Input
            id="komisi_default_persen"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.komisi_default_persen}
            onChange={(e) => setFormData(prev => ({ ...prev, komisi_default_persen: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : editingPlatform ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};