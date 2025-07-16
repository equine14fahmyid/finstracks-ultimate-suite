import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowLeftRight, Calendar, DollarSign, Search } from 'lucide-react';
import { useStores, useBanks } from '@/hooks/useSupabase';
import { useSettlements } from '@/hooks/useSettlements';
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
  const [searchTerm, setSearchTerm] = useState('');
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

  // DEBUG: Log settlements data
  useEffect(() => {
    console.log('Settlements data:', settlements);
    console.log('Settlements length:', settlements?.length);
    if (settlements?.length > 0) {
      console.log('First settlement:', settlements[0]);
      console.log('Settlement keys:', Object.keys(settlements[0] || {}));
    }
  }, [settlements]);

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
      await fetchSettlements(); // Refresh data
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
    console.log('Editing settlement:', settlement);
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
      const success = await deleteSettlement(id);
      if (success) {
        await fetchSettlements(); // Refresh data
      }
    }
  };

  // Filter out any undefined/null settlements and calculate totals safely
  const validSettlements = Array.isArray(settlements) ? settlements.filter(settlement => settlement && typeof settlement.jumlah_dicairkan === 'number') : [];
  
  // Filter berdasarkan search term
  const filteredSettlements = validSettlements.filter(settlement => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (settlement?.store?.nama_toko || '').toLowerCase().includes(searchLower) ||
      (settlement?.store?.platform?.nama_platform || '').toLowerCase().includes(searchLower) ||
      (settlement?.bank?.nama_bank || '').toLowerCase().includes(searchLower) ||
      (settlement?.keterangan || '').toLowerCase().includes(searchLower) ||
      (settlement?.tanggal || '').includes(searchLower)
    );
  });

  const totalSettlements = validSettlements.reduce((total, settlement) => total + (settlement.jumlah_dicairkan || 0), 0);
  const totalFees = validSettlements.reduce((total, settlement) => total + (settlement.biaya_admin || 0), 0);
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
                  max={new Date().toISOString().split('T')[0]}
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
                  placeholder="1.000.000"
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
                  placeholder="50.000"
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
                    <SelectValue placeholder="Pilih bank atau kas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Kas</SelectItem>
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

              {/* Preview Net Amount */}
              {formData.jumlah_dicairkan > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Jumlah Diterima:</div>
                  <div className="font-medium text-lg text-green-600">
                    {formatCurrency(formData.jumlah_dicairkan - formData.biaya_admin)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(formData.jumlah_dicairkan)} - {formatCurrency(formData.biaya_admin)} biaya admin
                  </div>
                </div>
              )}

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
            <div className="text-2xl font-bold">{validSettlements.length}</div>
            <p className="text-xs text-muted-foreground">Total pencairan</p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Table - Native Implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pencairan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Memuat data...</div>
            </div>
          ) : validSettlements.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Belum ada data pencairan</div>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pencairan Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari pencairan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Results Info */}
              <div className="text-sm text-muted-foreground">
                {filteredSettlements.length} dari {validSettlements.length} data
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                        <th className="px-4 py-3 text-left font-medium">Toko</th>
                        <th className="px-4 py-3 text-left font-medium">Jumlah Dicairkan</th>
                        <th className="px-4 py-3 text-left font-medium">Biaya Admin</th>
                        <th className="px-4 py-3 text-left font-medium">Diterima</th>
                        <th className="px-4 py-3 text-left font-medium">Ke Bank</th>
                        <th className="px-4 py-3 text-left font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredSettlements.map((settlement, index) => {
                        const netAmount = (settlement.jumlah_dicairkan || 0) - (settlement.biaya_admin || 0);
                        
                        return (
                          <tr key={settlement?.id || index} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-medium">
                                {settlement?.tanggal ? formatShortDate(settlement.tanggal) : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <div className="font-medium text-foreground">
                                  {settlement?.store?.nama_toko || 'Toko tidak diketahui'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {settlement?.store?.platform?.nama_platform || 'Platform tidak diketahui'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-green-600">
                                {formatCurrency(settlement?.jumlah_dicairkan || 0)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-red-600">
                                {formatCurrency(settlement?.biaya_admin || 0)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-blue-600">
                                {formatCurrency(netAmount)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-muted-foreground">
                                {settlement?.bank?.nama_bank || 'Kas'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleEdit(settlement)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => handleDelete(settlement?.id)}
                                >
                                  Hapus
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* No Results */}
              {filteredSettlements.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    Tidak ada data yang sesuai dengan pencarian "{searchTerm}"
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-2" 
                    onClick={() => setSearchTerm('')}
                  >
                    Reset Pencarian
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settlements;