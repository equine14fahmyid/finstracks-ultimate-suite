
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Settlement {
  id: string;
  tanggal: string;
  store_id: string;
  jumlah_dicairkan: number;
  bank_id: string;
  biaya_admin: number;
  keterangan: string;
  created_at: string;
  stores: {
    nama_toko: string;
  };
  banks: {
    nama_bank: string;
  };
}

interface Store {
  id: string;
  nama_toko: string;
  saldo_dashboard: number;
}

interface Bank {
  id: string;
  nama_bank: string;
}

const Settlements = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    store_id: '',
    jumlah_dicairkan: 0,
    bank_id: '',
    biaya_admin: 0,
    keterangan: ''
  });

  const queryClient = useQueryClient();

  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ['settlements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          *,
          stores!inner(nama_toko),
          banks!inner(nama_bank)
        `)
        .order('tanggal', { ascending: false });
      
      if (error) throw error;
      return data as Settlement[];
    }
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, nama_toko, saldo_dashboard')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as Store[];
    }
  });

  const { data: banks = [] } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banks')
        .select('id, nama_bank')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as Bank[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (settlementData: typeof formData) => {
      const { data, error } = await supabase
        .from('settlements')
        .insert([settlementData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: "Berhasil", description: "Pencairan dana berhasil dicatat" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: "Gagal mencatat pencairan: " + (error as Error).message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('settlements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: "Berhasil", description: "Pencairan berhasil dihapus" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Gagal menghapus pencairan: " + (error as Error).message, variant: "destructive" });
    }
  });

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
    await createMutation.mutateAsync(formData);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (settlement: Settlement) => format(new Date(settlement.tanggal), 'dd MMM yyyy', { locale: id })
    },
    {
      key: 'store_info',
      title: 'Toko',
      render: (settlement: Settlement) => settlement.stores?.nama_toko || 'N/A'
    },
    {
      key: 'jumlah_dicairkan',
      title: 'Jumlah Dicairkan',
      render: (settlement: Settlement) => formatCurrency(settlement.jumlah_dicairkan)
    },
    {
      key: 'bank_info',
      title: 'Bank Tujuan',
      render: (settlement: Settlement) => settlement.banks?.nama_bank || 'N/A'
    },
    {
      key: 'biaya_admin',
      title: 'Biaya Admin',
      render: (settlement: Settlement) => formatCurrency(settlement.biaya_admin || 0)
    },
    {
      key: 'keterangan',
      title: 'Keterangan',
      render: (settlement: Settlement) => settlement.keterangan || '-'
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (settlement: Settlement) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Pencairan</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus pencairan ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(settlement.id)}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pencairan Dana</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="store_id">Toko</Label>
                <Select value={formData.store_id} onValueChange={(value) => setFormData({ ...formData, store_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih toko" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.nama_toko} (Saldo: {formatCurrency(store.saldo_dashboard)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jumlah_dicairkan">Jumlah Dicairkan</Label>
                <Input
                  id="jumlah_dicairkan"
                  type="number"
                  value={formData.jumlah_dicairkan}
                  onChange={(e) => setFormData({ ...formData, jumlah_dicairkan: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="bank_id">Bank Tujuan</Label>
                <Select value={formData.bank_id} onValueChange={(value) => setFormData({ ...formData, bank_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
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
                  type="number"
                  value={formData.biaya_admin}
                  onChange={(e) => setFormData({ ...formData, biaya_admin: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Keterangan pencairan (opsional)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
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
            loading={isLoading}
            searchKey="stores.nama_toko"
            searchPlaceholder="Cari toko..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Settlements;
