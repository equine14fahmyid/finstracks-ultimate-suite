
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Wallet, TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import { useBanks } from '@/hooks/useSupabase';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/format';

interface BankFormData {
  nama_bank: string;
  nama_pemilik: string;
  no_rekening: string;
  saldo_awal: number;
  saldo_akhir: number;
}

const Banks = () => {
  const { banks, loading, fetchBanks, createBank, updateBank, deleteBank } = useBanks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [formData, setFormData] = useState<BankFormData>({
    nama_bank: '',
    nama_pemilik: '',
    no_rekening: '',
    saldo_awal: 0,
    saldo_akhir: 0
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_bank || !formData.nama_pemilik || !formData.no_rekening) {
      toast({
        title: "Error",
        description: "Mohon lengkapi data bank",
        variant: "destructive",
      });
      return;
    }

    const success = editingBank 
      ? await updateBank(editingBank.id, formData)
      : await createBank(formData);

    if (success) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      nama_bank: '',
      nama_pemilik: '',
      no_rekening: '',
      saldo_awal: 0,
      saldo_akhir: 0
    });
    setEditingBank(null);
  };

  const handleEdit = (bank: any) => {
    if (!bank) return;
    
    setEditingBank(bank);
    setFormData({
      nama_bank: bank?.nama_bank || '',
      nama_pemilik: bank?.nama_pemilik || '',
      no_rekening: bank?.no_rekening || '',
      saldo_awal: bank?.saldo_awal || 0,
      saldo_akhir: bank?.saldo_akhir || 0
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus bank ini?')) {
      await deleteBank(id);
    }
  };

  const columns = [
    {
      key: 'bank_info',
      title: 'Informasi Bank',
      render: (bank: any) => (
        <div>
          <div className="font-medium">{bank?.nama_bank || '-'}</div>
          <div className="text-sm text-muted-foreground">{bank?.nama_pemilik || '-'}</div>
          <div className="text-xs text-muted-foreground">{bank?.no_rekening || '-'}</div>
        </div>
      )
    },
    {
      key: 'saldo_awal',
      title: 'Saldo Awal',
      render: (bank: any) => (
        <span className="font-medium">{formatCurrency(bank?.saldo_awal || 0)}</span>
      )
    },
    {
      key: 'saldo_akhir',
      title: 'Saldo Akhir',
      render: (bank: any) => (
        <div>
          <span className={`font-medium ${(bank?.saldo_akhir || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(bank?.saldo_akhir || 0)}
          </span>
          <div className="text-xs text-muted-foreground mt-1">
            {(bank?.saldo_akhir || 0) >= (bank?.saldo_awal || 0) ? (
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{formatCurrency((bank?.saldo_akhir || 0) - (bank?.saldo_awal || 0))}
              </span>
            ) : (
              <span className="text-red-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                {formatCurrency((bank?.saldo_akhir || 0) - (bank?.saldo_awal || 0))}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (bank: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(bank)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(bank?.id)}>
            Hapus
          </Button>
        </div>
      )
    }
  ];

  const totalSaldoAwal = banks?.reduce((total, bank) => total + (bank?.saldo_awal || 0), 0) || 0;
  const totalSaldoAkhir = banks?.reduce((total, bank) => total + (bank?.saldo_akhir || 0), 0) || 0;
  const totalPerubahan = totalSaldoAkhir - totalSaldoAwal;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Bank</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Bank
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBank ? 'Edit Bank' : 'Tambah Bank'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama_bank">Nama Bank *</Label>
                <Input
                  id="nama_bank"
                  value={formData.nama_bank}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama_bank: e.target.value }))}
                  placeholder="BCA, Mandiri, BNI..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="nama_pemilik">Nama Pemilik *</Label>
                <Input
                  id="nama_pemilik"
                  value={formData.nama_pemilik}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama_pemilik: e.target.value }))}
                  placeholder="Nama pemilik rekening"
                  required
                />
              </div>

              <div>
                <Label htmlFor="no_rekening">Nomor Rekening *</Label>
                <Input
                  id="no_rekening"
                  value={formData.no_rekening}
                  onChange={(e) => setFormData(prev => ({ ...prev, no_rekening: e.target.value }))}
                  placeholder="1234567890"
                  required
                />
              </div>

              <div>
                <Label htmlFor="saldo_awal">Saldo Awal</Label>
                <Input
                  id="saldo_awal"
                  type="number"
                  value={formData.saldo_awal || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    saldo_awal: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="saldo_akhir">Saldo Saat Ini</Label>
                <Input
                  id="saldo_akhir"
                  type="number"
                  value={formData.saldo_akhir || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    saldo_akhir: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                  step="0.01"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingBank ? 'Update' : 'Simpan'}
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
            <CardTitle className="text-sm font-medium">Total Bank</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banks.length}</div>
            <p className="text-xs text-muted-foreground">Rekening terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Awal</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSaldoAwal)}</div>
            <p className="text-xs text-muted-foreground">Modal awal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Saat Ini</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSaldoAkhir)}</div>
            <p className="text-xs text-muted-foreground">Total kas & bank</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perubahan</CardTitle>
            {totalPerubahan >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPerubahan >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPerubahan >= 0 ? '+' : ''}{formatCurrency(totalPerubahan)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPerubahan >= 0 ? 'Keuntungan' : 'Kerugian'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Banks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Rekening Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={banks}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari bank..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Banks;
