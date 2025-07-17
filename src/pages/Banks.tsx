import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
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
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    nama_bank: '',
    nama_pemilik: '',
    no_rekening: '',
    saldo_awal: 0,
    saldo_akhir: 0
  });
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('is_active', true)
        .order('nama_bank');
      
      if (error) throw error;
      setBanks(data as Bank[]);
    } catch (error: any) {
      console.error('Fetch banks error:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data bank",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBank = async (bankData: typeof formData) => {
    try {
      setLoading(true);
      
      const dataWithBalance = {
        ...bankData,
        saldo_akhir: bankData.saldo_awal || 0
      };

      const { data, error } = await supabase
        .from('banks')
        .insert([dataWithBalance])
        .select()
        .single();
      
      if (error) throw error;

      toast({ 
        title: "Berhasil", 
        description: "Bank berhasil ditambahkan" 
      });

      setIsAddDialogOpen(false);
      resetForm();
      return true;
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: "Gagal menambahkan bank: " + error.message, 
        variant: "destructive" 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateBank = async (id: string, bankData: Partial<Bank>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('banks')
        .update(bankData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      toast({ 
        title: "Berhasil", 
        description: "Bank berhasil diperbarui" 
      });

      setEditingBank(null);
      resetForm();
      return true;
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: "Gagal memperbarui bank: " + error.message, 
        variant: "destructive" 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteBank = async (id: string) => {
    try {
      setLoading(true);

      // Check if bank has transactions
      const { data: incomes } = await supabase
        .from('incomes')
        .select('id')
        .eq('bank_id', id)
        .limit(1);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('bank_id', id)
        .limit(1);

      if (incomes?.length || expenses?.length) {
        toast({
          title: "Error",
          description: "Tidak dapat menghapus bank yang sudah memiliki transaksi",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('banks')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;

      toast({ 
        title: "Berhasil", 
        description: "Bank berhasil dihapus" 
      });
      return true;
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: "Gagal menghapus bank: " + error.message, 
        variant: "destructive" 
      });
      return false;
    } finally {
      setLoading(false);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBank) {
      await updateBank(editingBank.id, formData);
    } else {
      await createBank(formData);
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
    await deleteBank(id);
  };

  // Setup real-time subscription
  useEffect(() => {
    fetchBanks();

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new real-time channel for banks
    const channel = supabase
      .channel('banks-realtime-page')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'banks'
        },
        (payload) => {
          console.log('🏦 Bank balance updated in real-time:', payload);
          
          if (payload.new.saldo_akhir !== payload.old?.saldo_akhir) {
            const bankName = payload.new.nama_bank;
            const oldBalance = payload.old?.saldo_akhir || 0;
            const newBalance = payload.new.saldo_akhir || 0;
            const difference = newBalance - oldBalance;
            
            toast({
              title: "💰 Saldo Bank Terupdate",
              description: `${bankName}: ${difference > 0 ? '+' : ''}Rp ${Math.abs(difference).toLocaleString('id-ID')}`,
              variant: difference > 0 ? "default" : "destructive",
            });
          }
          
          // Refresh bank data
          fetchBanks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banks'
        },
        (payload) => {
          console.log('🏦 Bank data changed:', payload);
          fetchBanks();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const columns = [
    {
      key: 'bank_info',
      title: 'Informasi Bank',
      render: (value: any, bank: Bank) => (
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
      render: (value: any, bank: Bank) => (
        <div className="text-blue-600 font-medium">
          {formatCurrency(bank.saldo_awal)}
        </div>
      )
    },
    {
      key: 'saldo_akhir',
      title: 'Saldo Akhir',
      render: (value: any, bank: Bank) => {
        const difference = bank.saldo_akhir - bank.saldo_awal;
        return (
          <div>
            <div className="font-bold text-lg">
              {formatCurrency(bank.saldo_akhir)}
            </div>
            {difference !== 0 && (
              <div className={`text-xs ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {difference > 0 ? '+' : ''}{formatCurrency(difference)}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (value: any, bank: Bank) => (
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
        <div>
          <h1 className="text-3xl font-bold">Master Data Bank</h1>
          <p className="text-muted-foreground">Data saldo real-time terupdate otomatis</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchBanks}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setFormData({ 
                        ...formData, 
                        saldo_awal: value,
                        saldo_akhir: value // Auto set saldo_akhir = saldo_awal untuk bank baru
                      });
                    }}
                    placeholder="0"
                  />
                </div>
                {editingBank && (
                  <div>
                    <Label htmlFor="saldo_akhir">Saldo Akhir (Manual Adjustment)</Label>
                    <Input
                      id="saldo_akhir"
                      type="number"
                      value={formData.saldo_akhir}
                      onChange={(e) => setFormData({ ...formData, saldo_akhir: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ Hati-hati mengubah saldo akhir secara manual
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingBank(null);
                    resetForm();
                  }}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : editingBank ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏦 Daftar Bank 
            <span className="text-sm font-normal text-muted-foreground">
              (Real-time • Auto-sync dengan transaksi)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={banks}
            columns={columns}
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