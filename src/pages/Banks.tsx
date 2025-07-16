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

  // DEBUG: Log data banks untuk troubleshooting
  useEffect(() => {
    console.log('Banks data:', banks);
    console.log('Banks length:', banks?.length);
    if (banks?.length > 0) {
      console.log('First bank:', banks[0]);
      console.log('Bank keys:', Object.keys(banks[0] || {}));
    }
  }, [banks]);

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
      // Refresh data setelah create/update
      await fetchBanks();
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
    console.log('Editing bank:', bank); // DEBUG
    
    if (!bank) return;
    
    setEditingBank(bank);
    setFormData({
      nama_bank: bank.nama_bank || '',
      nama_pemilik: bank.nama_pemilik || '',
      no_rekening: bank.no_rekening || '',
      saldo_awal: bank.saldo_awal || 0,
      saldo_akhir: bank.saldo_akhir || 0
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus bank ini?')) {
      const success = await deleteBank(id);
      if (success) {
        await fetchBanks(); // Refresh data setelah delete
      }
    }
  };

  const columns = [
    {
      key: 'bank_info',
      title: 'Informasi Bank',
      render: (bank: any) => {
        console.log('Rendering bank info for:', bank); // DEBUG
        
        // Pastikan data tersedia - berdasarkan schema SQL yang benar
        const bankName = bank?.nama_bank || '';
        const ownerName = bank?.nama_pemilik || '';
        const accountNumber = bank?.no_rekening || '';
        
        return (
          <div>
            <div className="font-medium">
              {bankName || 'Bank tidak diketahui'}
            </div>
            <div className="text-sm text-muted-foreground">
              {ownerName || 'Pemilik tidak diketahui'}
            </div>
            <div className="text-xs text-muted-foreground">
              {accountNumber || 'No rekening tidak diketahui'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'saldo_awal',
      title: 'Saldo Awal',
      render: (bank: any) => {
        const saldoAwal = bank?.saldo_awal || 0;
        return (
          <span className="font-medium">{formatCurrency(saldoAwal)}</span>
        );
      }
    },
    {
      key: 'saldo_akhir',
      title: 'Saldo Akhir',
      render: (bank: any) => {
        const saldoAwal = bank?.saldo_awal || 0;
        const saldoAkhir = bank?.saldo_akhir || 0;
        const selisih = saldoAkhir - saldoAwal;
        
        return (
          <div>
            <span className={`font-medium ${saldoAkhir >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoAkhir)}
            </span>
            <div className="text-xs text-muted-foreground mt-1">
              {selisih >= 0 ? (
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{formatCurrency(selisih)}
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {formatCurrency(selisih)}
                </span>
              )}
            </div>
          </div>
        );
      }
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

  // Pastikan banks adalah array dan tidak null/undefined
  const bankData = Array.isArray(banks) ? banks : [];
  
  const totalSaldoAwal = bankData.reduce((total, bank) => {
    const saldo = bank?.saldo_awal || 0;
    return total + saldo;
  }, 0);
  
  const totalSaldoAkhir = bankData.reduce((total, bank) => {
    const saldo = bank?.saldo_akhir || 0;
    return total + saldo;
  }, 0);
  
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
                  placeholder="5.000.000"
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
                  placeholder="7.500.000"
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

      {/* Debug Info - Hapus setelah masalah teratasi */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div>Loading: {loading ? 'Ya' : 'Tidak'}</div>
              <div>Banks Length: {bankData.length}</div>
              <div className="max-h-40 overflow-y-auto">
                <div>Banks Data: <pre className="text-xs">{JSON.stringify(bankData, null, 2)}</pre></div>
              </div>
              {bankData.length > 0 && (
                <div className="border-t pt-2">
                  <div className="font-medium">Sample Bank Data:</div>
                  <div>ID: {bankData[0]?.id}</div>
                  <div>Nama Bank: "{bankData[0]?.nama_bank}"</div>
                  <div>Nama Pemilik: "{bankData[0]?.nama_pemilik}"</div>
                  <div>No Rekening: "{bankData[0]?.no_rekening}"</div>
                  <div>Saldo Awal: {bankData[0]?.saldo_awal}</div>
                  <div>Saldo Akhir: {bankData[0]?.saldo_akhir}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bank</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankData.length}</div>
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
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Memuat data...</div>
            </div>
          ) : bankData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Belum ada data bank</div>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Bank Pertama
              </Button>
            </div>
          ) : (
            <>
              {/* DataTable Component */}
              <DataTable
                columns={columns}
                data={bankData}
                loading={loading}
                searchable={true}
                searchPlaceholder="Cari bank..."
              />
              
              {/* Fallback Manual Table jika DataTable bermasalah */}
              <div className="mt-8 border-t pt-4">
                <h4 className="font-medium mb-4">Manual Table (Backup)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Informasi Bank</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Saldo Awal</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Saldo Akhir</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankData.map((bank, index) => (
                        <tr key={bank?.id || index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">
                            <div>
                              <div className="font-medium">{bank?.nama_bank || 'N/A'}</div>
                              <div className="text-sm text-gray-600">{bank?.nama_pemilik || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{bank?.no_rekening || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className="font-medium">{formatCurrency(bank?.saldo_awal || 0)}</span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <div>
                              <span className={`font-medium ${(bank?.saldo_akhir || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(bank?.saldo_akhir || 0)}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {((bank?.saldo_akhir || 0) - (bank?.saldo_awal || 0)) >= 0 ? (
                                  <span className="text-green-600">
                                    +{formatCurrency((bank?.saldo_akhir || 0) - (bank?.saldo_awal || 0))}
                                  </span>
                                ) : (
                                  <span className="text-red-600">
                                    {formatCurrency((bank?.saldo_akhir || 0) - (bank?.saldo_awal || 0))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(bank)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(bank?.id)}>
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Banks;