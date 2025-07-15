
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowLeftRight, Calendar, DollarSign } from 'lucide-react';
import { useSettlements, useStores, useBanks } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatShortDate } from '@/utils/format';

interface SettlementFormData {
  tanggal: string;
  store_id: string;
  jumlah_dicairkan: number;
  bank_id: string;
  biaya_admin: number;
  keterangan: string;
}

const Settlements = () => {
  const { settlements, loading, fetchSettlements, createSettlement, updateSettlement, deleteSettlement } = useSettlements();
  const { stores, fetchStores } = useStores();
  const { banks, fetchBanks } = useBanks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<any>(null);
  const [formData, setFormData] = useState<SettlementFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    store_id: '',
    jumlah_dicairkan: 0,
    bank_id: '',
    biaya_admin: 0,
    keterangan: ''
  });

  useEffect(() => {
    fetchSettlements();
    fetchStores();
    fetchBanks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.store_id || formData.jumlah_dicairkan <= 0) {
      toast({
        title: "Error",
        description: "Mohon lengkapi data pencairan",
        variant: "destructive",
      });
      return;
    }

    const success = editingSettlement 
      ? await updateSettlement(editingSettlement.id, formData)
      : await createSettlement(formData);

    if (success) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      store_id: '',
      jumlah_dicairkan: 0,
      bank_id: '',
      biaya_admin: 0,
      keterangan: ''
    });
    setEditingSettlement(null);
  };

  const handleEdit = (settlement: any) => {
    setEditingSettlement(settlement);
    setFormData({
      tanggal: settlement.tanggal,
      store_id: settlement.store_id || '',
      jumlah_dicairkan: settlement.jumlah_dicairkan,
      bank_id: settlement.bank_id || '',
      biaya_admin: settlement.biaya_admin || 0,
      keterangan: settlement.keterangan || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pencairan ini?')) {
      await deleteSettlement(id);
    }
  };

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (settlement: any) => formatShortDate(settlement.tanggal)
    },
    {
      key: 'store',
      title: 'Toko',
      render: (settlement: any) => (
        <div>
          <div className="font-medium">{settlement.store?.nama_toko}</div>
          <div className="text-sm text-muted-foreground">
            {settlement.store?.platform?.nama_platform}
          </div>
        </div>
      )
    },
    {
      key: 'jumlah_dicairkan',
      title: 'Jumlah Dicairkan',
      render: (settlement: any) => (
        <span className="font-medium text-green-600">
          {formatCurrency(settlement.jumlah_dicairkan)}
        </span>
      )
    },
    {
      key: 'biaya_admin',
      title: 'Biaya Admin',
      render: (settlement: any) => (
        <span className="text-red-600">
          {formatCurrency(settlement.biaya_admin || 0)}
        </span>
      )
    },
    {
      key: 'net_amount',
      title: 'Diterima',
      render: (settlement: any) => (
        <span className="font-medium">
          {formatCurrency(settlement.jumlah_dicairkan - (settlement.biaya_admin || 0))}
        </span>
      )
    },
    {
      key: 'bank',
      title: 'Ke Bank',
      render: (settlement: any) => (
        <span>{settlement.bank?.nama_bank || 'Kas'}</span>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (settlement: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(settlement)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(settlement.id)}>
            Hapus
          </Button>
        </div>
      )
    }
  ];

  const totalSettlements = settlements.reduce((total, settlement) => total + settlement.jumlah_dicairkan, 0);
  const totalFees = settlements.reduce((total, settlement) => total + (settlement.biaya_admin || 0), 0);
  const netReceived = totalSettlements - totalFees;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pencairan Dana</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pencairan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSettlement ? 'Edit Pencairan' : 'Tambah Pencairan'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tanggal">Tanggal *</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="store_id">Toko *</Label>
                <Select 
                  value={formData.store_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, store_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih toko" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.nama_toko} - {store.platform?.nama_platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jumlah_dicairkan">Jumlah Dicairkan *</Label>
                <Input
                  id="jumlah_dicairkan"
                  type="number"
                  value={formData.jumlah_dicairkan || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    jumlah_dicairkan: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <Label htmlFor="biaya_admin">Biaya Admin</Label>
                <Input
                  id="biaya_admin"
                  type="number"
                  value={formData.biaya_admin || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    biaya_admin: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="bank_id">Masuk ke Bank</Label>
                <Select 
                  value={formData.bank_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bank_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.nama_bank} - {bank.nama_pemilik}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Catatan pencairan..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingSettlement ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pencairan</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSettlements)}</div>
            <p className="text-xs text-muted-foreground">Dari platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Biaya Admin</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalFees)}</div>
            <p className="text-xs text-muted-foreground">Total biaya</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diterima</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(netReceived)}</div>
            <p className="text-xs text-muted-foreground">Setelah biaya admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settlements.length}</div>
            <p className="text-xs text-muted-foreground">Total pencairan</p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pencairan</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={settlements}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari pencairan..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Settlements;
