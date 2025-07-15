import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { AdjustmentItem } from '@/hooks/useAdjustments';
import { formatCurrency } from '@/utils/format';

interface AdjustmentFormProps {
  saleTotal: number;
  onSubmit: (adjustments: AdjustmentItem[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

const adjustmentTypeLabels = {
  denda: 'Denda',
  selisih_ongkir: 'Selisih Ongkir',
  pinalti: 'Pinalti',
};

export const AdjustmentForm = ({ saleTotal, onSubmit, onCancel, loading }: AdjustmentFormProps) => {
  const [adjustments, setAdjustments] = useState<AdjustmentItem[]>([
    { type: 'denda', amount: 0, notes: '' }
  ]);

  const addAdjustment = () => {
    setAdjustments([...adjustments, { type: 'denda', amount: 0, notes: '' }]);
  };

  const removeAdjustment = (index: number) => {
    setAdjustments(adjustments.filter((_, i) => i !== index));
  };

  const updateAdjustment = (index: number, field: keyof AdjustmentItem, value: any) => {
    const updated = [...adjustments];
    updated[index] = { ...updated[index], [field]: value };
    setAdjustments(updated);
  };

  const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  const finalAmount = saleTotal - totalAdjustment;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that total adjustment doesn't exceed sale total
    if (totalAdjustment > saleTotal) {
      alert('Total penyesuaian tidak boleh melebihi total penjualan');
      return;
    }

    // Filter out adjustments with zero amount
    const validAdjustments = adjustments.filter(adj => adj.amount > 0);
    
    if (validAdjustments.length === 0) {
      alert('Minimal harus ada satu penyesuaian dengan nominal > 0');
      return;
    }

    onSubmit(validAdjustments);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Form Penyesuaian</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sale Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Total Penjualan:</span>
              <span className="font-semibold">{formatCurrency(saleTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Penyesuaian:</span>
              <span className="font-semibold text-destructive">
                -{formatCurrency(totalAdjustment)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Jumlah Bersih:</span>
              <span className="font-semibold text-primary">
                {formatCurrency(finalAmount)}
              </span>
            </div>
          </div>

          {/* Adjustments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Penyesuaian</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAdjustment}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Penyesuaian
              </Button>
            </div>

            {adjustments.map((adjustment, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Jenis Penyesuaian</Label>
                      <Select
                        value={adjustment.type}
                        onValueChange={(value: any) => updateAdjustment(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(adjustmentTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Jumlah</Label>
                      <Input
                        type="number"
                        min="0"
                        max={saleTotal}
                        value={adjustment.amount || ''}
                        onChange={(e) => updateAdjustment(index, 'amount', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label>Keterangan</Label>
                          <Textarea
                            value={adjustment.notes}
                            onChange={(e) => updateAdjustment(index, 'notes', e.target.value)}
                            placeholder="Alasan penyesuaian..."
                            rows={1}
                          />
                        </div>
                        {adjustments.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeAdjustment(index)}
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading || totalAdjustment > saleTotal}
            >
              {loading ? 'Menyimpan...' : 'Simpan Penyesuaian'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};