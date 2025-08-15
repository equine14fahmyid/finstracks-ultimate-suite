
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit3 } from 'lucide-react';
import { useStock } from '@/hooks/useSupabase';
import { useStockMovements } from '@/hooks/useStockMovements';
import { toast } from '@/hooks/use-toast';

interface StockAdjustmentDialogProps {
  variant: any;
  onStockUpdated?: () => void;
}

export const StockAdjustmentDialog = ({ variant, onStockUpdated }: StockAdjustmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newStock, setNewStock] = useState(variant?.stok || 0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { adjustStock } = useStock();
  const { createStockMovement } = useStockMovements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newStock < 0) {
      toast({
        title: "Error",
        description: "Stok tidak boleh kurang dari 0",
        variant: "destructive",
      });
      return;
    }

    if (!variant?.id) {
      toast({
        title: "Error",
        description: "Data varian tidak valid",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const currentStock = variant.stok || 0;
      const difference = newStock - currentStock;
      
      // First, adjust the stock
      await adjustStock(variant.id, newStock, notes || 'Penyesuaian stok manual');
      
      // Then, create stock movement record
      if (difference !== 0) {
        await createStockMovement({
          productVariantId: variant.id,
          movementType: 'adjustment',
          quantity: Math.abs(difference),
          referenceType: 'adjustment',
          notes: `${notes || 'Penyesuaian stok manual'} (${currentStock} → ${newStock})`
        });
      }
      
      setOpen(false);
      setNotes('');
      onStockUpdated?.();
      toast({
        title: "Sukses",
        description: `Stok berhasil disesuaikan dari ${currentStock} menjadi ${newStock}`,
      });
    } catch (error) {
      console.error('Stock adjustment error:', error);
      toast({
        title: "Error",
        description: "Gagal melakukan penyesuaian stok",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render if variant data is invalid
  if (!variant) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sesuaikan Stok</DialogTitle>
          <DialogDescription>
            Sesuaikan stok untuk {variant?.products?.nama_produk || variant?.product?.nama_produk || 'N/A'} - {variant?.warna || 'N/A'} {variant?.size || 'N/A'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Stok Saat Ini</Label>
              <div className="text-2xl font-bold text-muted-foreground">
                {variant?.stok || 0} pcs
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newStock">Stok Baru *</Label>
              <Input
                id="newStock"
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                min="0"
                required
              />
              <div className="text-xs text-muted-foreground">
                {newStock > (variant?.stok || 0) ? 
                  `Akan menambah ${newStock - (variant?.stok || 0)} unit` : 
                  newStock < (variant?.stok || 0) ? 
                  `Akan mengurangi ${(variant?.stok || 0) - newStock} unit` : 
                  'Tidak ada perubahan'
                }
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alasan penyesuaian stok..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Sesuaikan Stok'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
