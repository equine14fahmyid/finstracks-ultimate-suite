import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSettlements, type SettlementData } from '@/hooks/useSettlements';
import { toast } from '@/hooks/use-toast';

const Settlements = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SettlementData>({
    tanggal: new Date().toISOString().split('T')[0],
    store_id: '',
    jumlah_dicairkan: 0,
    bank_id: '',
    biaya_admin: 0,
    keterangan: ''
  });

  const {
    settlements,
    stores,
    banks,
    loading,
    createSettlement
  } = useSettlements();

  const resetForm = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      store_id: '',
      jumlah_dicairkan: 0,
      bank_id: '',
      biaya_admin: 0,
      keterangan: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi form
    if (!formData.store_id || !formData.bank_id || !formData.jumlah_dicairkan || !formData.tanggal) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }

    if (formData.jumlah_dicairkan <= 0) {
      toast({
        title: "Error",
        description: "Jumlah pencairan harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createSettlement(formData);
      if (result.error) {
        console.error('Settlement creation failed:', result.error);
        return;
      }

      // Success - tutup dialog dan reset form
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleInputChange = (field: keyof SettlementData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Format number input dengan pemisah ribuan
  const formatNumberInput = (value: number) => {
    return value.toLocaleString('id-ID');
  };

  const parseNumberInput = (value: string) => {
    return parseInt(value.replace(/\./g, '')) || 0;
  };

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (value: any, record: any) => {
        try {
          return format(new Date(record.tanggal), 'dd MMM yyyy', { locale: id });
        } catch {
          return record.tanggal;
        }
      }
    },
    {
      key: 'store_info',
      title: 'Dari Toko',
      render: (value: any, record: any) => record.stores?.nama_toko || 'N/A'
    },
    {
      key: 'jumlah_dicairkan',
      title: 'Jumlah Dicairkan',
      render: (value: any, record: any) => formatCurrency(record.jumlah_dicairkan)
    },
    {
      key: 'bank_info',
      title: 'Ke Bank',
      render: (value: any, record: any) => record.banks?.nama_bank || 'N/A'
    },
    {
      key: 'biaya_admin',
      title: 'Biaya Admin',
      render: (value: any, record: any) => formatCurrency(record.biaya_admin || 0)
    },
    {
      key: 'keterangan',
      title: 'Keterangan',
      render: (value: any, record: any) => record.keterangan || '-'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pencairan Dana</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="text-base bg-blue-700 hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Catat Pencairan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Catat Pencairan Dana</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tanggal">Tanggal *</Label>
                <Input 
                  id="tanggal" 
                  type="date" 
                  value={formData.tanggal} 
                  onChange={e => handleInputChange('tanggal', e.target.value)} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="store_id">Toko *</Label>
                <Select value={formData.store_id} onValueChange={value => handleInputChange('store_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih toko" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.nama_toko} (Saldo: {formatCurrency(store.saldo_dashboard)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="jumlah_dicairkan">Jumlah Dicairkan *</Label>
                <Input 
                  id="jumlah_dicairkan" 
                  type="text" 
                  value={formatNumberInput(formData.jumlah_dicairkan)} 
                  onChange={e => handleInputChange('jumlah_dicairkan', parseNumberInput(e.target.value))} 
                  placeholder="0" 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="bank_id">Bank Tujuan *</Label>
                <Select value={formData.bank_id} onValueChange={value => handleInputChange('bank_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map(bank => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.nama_bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="biaya_admin">Biaya Admin</Label>
                <Input 
                  id="biaya_admin" 
                  type="text" 
                  value={formatNumberInput(formData.biaya_admin)} 
                  onChange={e => handleInputChange('biaya_admin', parseNumberInput(e.target.value))} 
                  placeholder="0" 
                />
              </div>
              
              <div>
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea 
                  id="keterangan" 
                  value={formData.keterangan} 
                  onChange={e => handleInputChange('keterangan', e.target.value)} 
                  placeholder="Keterangan pencairan (opsional)" 
                  rows={3} 
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Memproses...' : 'Simpan & Proses'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pencairan Dana</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={settlements} 
            columns={columns} 
            loading={loading} 
            searchable={true} 
            searchPlaceholder="Cari toko..." 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Settlements;
