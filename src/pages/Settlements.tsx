import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, InputCurrency } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Banknote, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStores, useBanks } from '@/hooks/useSupabase';
import { useSettlements } from '@/hooks/useSettlements';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatShortDate, formatDate } from '@/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { exportDataTableAsPDF } from '@/utils/pdfExport';
import { exportToCSV } from '@/utils/csvExport';
import DateFilter from '@/components/dashboard/DateFilter';
import { supabase } from '@/integrations/supabase/client';

// Interface untuk rentang tanggal
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface SettlementFormData {
  tanggal: string;
  store_id: string;
  bank_id: string;
  jumlah_dicairkan: number;
  biaya_admin: number;
  keterangan: string;
}

const Settlements = () => {
  const { hasPermission } = useAuth();
  const { createSettlement, deleteSettlement } = useSettlements();
  const { stores, fetchStores } = useStores();
  const { banks, fetchBanks } = useBanks();

  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State untuk filter tanggal
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<any>(null);
  const [formData, setFormData] = useState<SettlementFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    store_id: '',
    bank_id: '',
    jumlah_dicairkan: 0,
    biaya_admin: 0,
    keterangan: ''
  });

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const startDate = dateRange.from?.toISOString().split('T')[0];
      const endDate = dateRange.to?.toISOString().split('T')[0];
      
      let query = supabase
        .from('settlements')
        .select(`
          *,
          store:stores(nama_toko, platform:platforms(nama_platform)),
          bank:banks(nama_bank, nama_pemilik)
        `)
        .order('tanggal', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('tanggal', startDate).lte('tanggal', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSettlements(data || []);
    } catch (error) {
      console.error("Error fetching settlements:", error);
      toast({ title: "Error", description: "Gagal memuat data pencairan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // useEffect untuk fetch data berdasarkan filter tanggal
  useEffect(() => {
    fetchSettlements();
  }, [dateRange]);

  const updateSettlement = async (id: string, settlementData: SettlementFormData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settlements')
        .update(settlementData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      
      toast({ 
          title: "Sukses", 
          description: "Pencairan diperbarui. CATATAN: Saldo bank/toko tidak disesuaikan ulang. Hapus dan buat ulang jika jumlah berubah." 
      });
      await fetchSettlements();
      return { success: true, data };
    } catch (error: any) {
        toast({ title: "Error", description: `Gagal memperbarui: ${error.message}`, variant: "destructive" });
        return { success: false, error: true };
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchBanks();
  }, []);

  // Fungsi export PDF
  const handleExportPDF = () => {
    toast({ title: "Mengekspor PDF...", description: "Harap tunggu sebentar." });
    
    const preparedData = settlements.map(settlement => ({
      tanggal: formatShortDate(settlement?.tanggal),
      toko: settlement?.store?.nama_toko || '-',
      platform: settlement?.store?.platform?.nama_platform || '-',
      bank: settlement?.bank?.nama_bank || '-',
      jumlah: formatCurrency(settlement?.jumlah_dicairkan),
      biaya_admin: formatCurrency(settlement?.biaya_admin || 0),
      keterangan: settlement?.keterangan || '-',
    }));

    exportDataTableAsPDF({
      data: preparedData,
      columns: [
        { title: 'Tanggal', dataKey: 'tanggal' },
        { title: 'Toko', dataKey: 'toko' },
        { title: 'Platform', dataKey: 'platform' },
        { title: 'Bank', dataKey: 'bank' },
        { title: 'Jumlah', dataKey: 'jumlah' },
        { title: 'Biaya Admin', dataKey: 'biaya_admin' },
        { title: 'Keterangan', dataKey: 'keterangan' },
      ],
      title: `Laporan Pencairan Dana (${formatDate(dateRange.from)} - ${formatDate(dateRange.to)})`,
      filename: `Laporan-Pencairan-${new Date().toISOString().split('T')[0]}.pdf`,
      companyInfo: {
        name: 'FINTracks Ultimate Suite',
        address: 'Tasikmalaya, Indonesia'
      }
    });
  };

  // Fungsi export CSV
  const handleExportCSV = () => {
    toast({ title: "Mengekspor CSV...", description: "Harap tunggu sebentar." });

    const preparedData = settlements.map(settlement => ({
      Tanggal: formatShortDate(settlement?.tanggal),
      'Nama Toko': settlement?.store?.nama_toko || '-',
      Platform: settlement?.store?.platform?.nama_platform || '-',
      'Bank Tujuan': settlement?.bank?.nama_bank || '-',
      'Nama Pemilik': settlement?.bank?.nama_pemilik || '-',
      'Jumlah Dicairkan': settlement?.jumlah_dicairkan || 0,
      'Biaya Admin': settlement?.biaya_admin || 0,
      'Jumlah Diterima': (settlement?.jumlah_dicairkan || 0) - (settlement?.biaya_admin || 0),
      Keterangan: settlement?.keterangan || '-'
    }));
    
    exportToCSV({
      data: preparedData,
      filename: `Laporan-Pencairan-${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.store_id || !formData.bank_id || formData.jumlah_dicairkan <= 0) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }

    if (editingSettlement) {
      const result = await updateSettlement(editingSettlement.id, formData);
      if (result.success) {
        setDialogOpen(false);
        resetForm();
      }
    } else {
      await createSettlement(formData);
      setDialogOpen(false);
      resetForm();
      await fetchSettlements();
    }
  };

  const handleEdit = (settlement: any) => {
    setEditingSettlement(settlement);
    setFormData({
      tanggal: settlement.tanggal,
      store_id: settlement.store_id,
      bank_id: settlement.bank_id,
      jumlah_dicairkan: settlement.jumlah_dicairkan,
      biaya_admin: settlement.biaya_admin || 0,
      keterangan: settlement.keterangan || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteSettlement(id);
    await fetchSettlements();
  };

  const resetForm = () => {
    setEditingSettlement(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      store_id: '',
      bank_id: '',
      jumlah_dicairkan: 0,
      biaya_admin: 0,
      keterangan: ''
    });
  };

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (_: any, settlement: any) => formatShortDate(settlement?.tanggal)
    },
    {
      key: 'store',
      title: 'Toko',
      render: (_: any, settlement: any) => (
        <div>
          <div className="font-medium">{settlement?.store?.nama_toko || '-'}</div>
          <div className="text-sm text-muted-foreground">{settlement?.store?.platform?.nama_platform || '-'}</div>
        </div>
      )
    },
    {
      key: 'bank',
      title: 'Bank Tujuan',
      render: (_: any, settlement: any) => (
        <div>
          <div className="font-medium">{settlement?.bank?.nama_bank || '-'}</div>
          <div className="text-sm text-muted-foreground">{settlement?.bank?.nama_pemilik || ''}</div>
        </div>
      )
    },
    {
      key: 'jumlah_dicairkan',
      title: 'Jumlah',
      render: (_: any, settlement: any) => (
        <div>
          <div className="font-medium text-green-600">{formatCurrency(settlement?.jumlah_dicairkan)}</div>
          {settlement.biaya_admin > 0 && (
            <div className="text-xs text-red-600">Biaya Admin: {formatCurrency(settlement.biaya_admin)}</div>
          )}
        </div>
      )
    },
    {
      key: 'keterangan',
      title: 'Catatan',
      render: (_: any, settlement: any) => <span className="text-sm text-muted-foreground">{settlement?.keterangan || '-'}</span>
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_: any, settlement: any) => (
        <div className="flex gap-2">
          {hasPermission('settlements.update') && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(settlement)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('settlements.delete') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Pencairan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus data pencairan ini? Tindakan ini akan mengembalikan saldo toko dan mengurangi saldo bank.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(settlement.id)} className="bg-destructive text-destructive-foreground">
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Pencairan Dana</h1>
          <p className="text-muted-foreground">
            Catat pencairan dana dari platform ke rekening bank
          </p>
        </div>
        {hasPermission('settlements.create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pencairan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSettlement ? 'Edit Pencairan' : 'Tambah Pencairan Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="store_id">Dari Toko *</Label>
                    <Select
                      value={formData.store_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, store_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih toko" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores?.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store?.nama_toko || 'Toko'} - {store?.platform?.nama_platform || 'Platform'}
                          </SelectItem>
                        )) || <SelectItem value="" disabled>Tidak ada toko</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bank_id">Ke Bank *</Label>
                  <Select
                    value={formData.bank_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, bank_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bank tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks?.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.nama_bank} - {bank.nama_pemilik} ({bank.no_rekening})
                        </SelectItem>
                      )) || <SelectItem value="" disabled>Tidak ada bank</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jumlah_dicairkan">Jumlah Dicairkan *</Label>
                    <InputCurrency
                      id="jumlah_dicairkan"
                      value={formData.jumlah_dicairkan}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, jumlah_dicairkan: value }))}
                      placeholder="Rp 0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="biaya_admin">Biaya Admin</Label>
                    <InputCurrency
                      id="biaya_admin"
                      value={formData.biaya_admin}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, biaya_admin: value }))}
                      placeholder="Rp 0"
                    />
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span>Dana Masuk ke Bank:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(formData.jumlah_dicairkan - formData.biaya_admin)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="gradient-primary">
                    {loading ? 'Menyimpan...' : editingSettlement ? 'Update' : 'Simpan'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter Tanggal */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
            📅 Filter Periode Pencairan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateFilter
            value={dateRange}
            onChange={setDateRange}
            className="w-full md:max-w-md"
          />
          <div className="mt-3 text-sm text-muted-foreground">
            Menampilkan data dari {formatDate(dateRange.from)} sampai {formatDate(dateRange.to)}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Riwayat Pencairan Dana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={settlements || []}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari pencairan..."
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Settlements;
