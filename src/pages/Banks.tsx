
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency } from '@/utils/format';

interface Bank {
  id: string;
  nama_bank: string;
  nama_pemilik: string;
  no_rekening: string;
  saldo_awal: number;
  saldo_akhir: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Banks = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    nama_bank: '',
    nama_pemilik: '',
    no_rekening: '',
    saldo_awal: 0,
    saldo_akhir: 0
  });

  const queryClient = useQueryClient();

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('is_active', true)
        .order('nama_bank');
      
      if (error) throw error;
      return data as Bank[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (bankData: typeof formData) => {
      const { data, error } = await supabase
        .from('banks')
        .insert([bankData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      toast({ title: "Berhasil", description: "Bank berhasil ditambahkan" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: "Gagal menambahkan bank: " + (error as Error).message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...bankData }: Partial<Bank>) => {
      const { data, error } = await supabase
        .from('banks')
        .update(bankData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      toast({ title: "Berhasil", description: "Bank berhasil diperbarui" });
      setEditingBank(null);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: "Gagal memperbarui bank: " + (error as Error).message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banks')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      toast({ title: "Berhasil", description: "Bank berhasil dihapus" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Gagal menghapus bank: " + (error as Error).message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      nama_bank: '',
      nama_pemilik: '',
      no_rekening: '',
      saldo_awal: 0,
      saldo_akhir: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBank) {
      await updateMutation.mutateAsync({ id: editingBank.id, ...formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      nama_bank: bank.nama_bank,
      nama_pemilik: bank.nama_pemilik,
      no_rekening: bank.no_rekening,
      saldo_awal: bank.saldo_awal,
      saldo_akhir: bank.saldo_akhir
    });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const columns = [
    {
      key: 'bank_info',
      title: 'Informasi Bank',
      render: (bank: Bank) => (
        <div>
          <div className="font-medium">{bank.nama_bank}</div>
          <div className="text-sm text-muted-foreground">{bank.nama_pemilik}</div>
          <div className="text-xs text-muted-foreground">{bank.no_rekening}</div>
        </div>
      )
    },
    {
      key: 'saldo_awal',
      title: 'Saldo Awal',
      render: (bank: Bank) => formatCurrency(bank.saldo_awal)
    },
    {
      key: 'saldo_akhir',
      title: 'Saldo Akhir',
      render: (bank: Bank) => formatCurrency(bank.saldo_akhir)
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (bank: Bank) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(bank)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Bank</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus bank {bank.nama_bank}? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(bank.id)}>
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Master Data Bank</h1>
        <Dialog open={isAddDialogOpen || !!editingBank} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingBank(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Bank
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBank ? 'Edit Bank' : 'Tambah Bank Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama_bank">Nama Bank</Label>
                <Input
                  id="nama_bank"
                  value={formData.nama_bank}
                  onChange={(e) => setFormData({ ...formData, nama_bank: e.target.value })}
                  placeholder="Contoh: BCA, Mandiri, BRI"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nama_pemilik">Nama Pemilik</Label>
                <Input
                  id="nama_pemilik"
                  value={formData.nama_pemilik}
                  onChange={(e) => setFormData({ ...formData, nama_pemilik: e.target.value })}
                  placeholder="Nama pemilik rekening"
                  required
                />
              </div>
              <div>
                <Label htmlFor="no_rekening">Nomor Rekening</Label>
                <Input
                  id="no_rekening"
                  value={formData.no_rekening}
                  onChange={(e) => setFormData({ ...formData, no_rekening: e.target.value })}
                  placeholder="Nomor rekening"
                  required
                />
              </div>
              <div>
                <Label htmlFor="saldo_awal">Saldo Awal</Label>
                <Input
                  id="saldo_awal"
                  type="number"
                  value={formData.saldo_awal}
                  onChange={(e) => setFormData({ ...formData, saldo_awal: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="saldo_akhir">Saldo Akhir</Label>
                <Input
                  id="saldo_akhir"
                  type="number"
                  value={formData.saldo_akhir}
                  onChange={(e) => setFormData({ ...formData, saldo_akhir: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingBank(null);
                  resetForm();
                }}>
                  Batal
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : editingBank ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={banks}
            columns={columns}
            loading={isLoading}
            searchKey="nama_bank"
            searchPlaceholder="Cari bank..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Banks;
