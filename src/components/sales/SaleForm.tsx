
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, InputCurrency } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { SaleFormData } from '@/types/forms';

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: SaleFormData;
  setFormData: (data: SaleFormData | ((prev: SaleFormData) => SaleFormData)) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  isEditing: boolean;
  stores: any[];
  stockProducts: any[];
  onReset: () => void;
}

export const SaleForm: React.FC<SaleFormProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  loading,
  isEditing,
  stores,
  stockProducts,
  onReset
}) => {
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_variant_id: '', quantity: 1, harga_satuan: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };

          // Auto-fill price when product is selected
          if (field === 'product_variant_id' && value) {
            const product = stockProducts?.find(p => p?.id === value);
            if (product?.product?.harga_jual_default) {
              updatedItem.harga_satuan = Number(product.product.harga_jual_default);
            }
          }

          return updatedItem;
        }
        return item;
      })
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) =>
      sum + (Number(item.quantity || 0) * Number(item.harga_satuan || 0)), 0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() + Number(formData.ongkir || 0) - Number(formData.diskon || 0);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SaleForm - Form submit triggered with data:', formData);
    
    // Basic validation before calling parent onSubmit
    if (!formData.tanggal) {
      console.log('SaleForm - Missing tanggal');
      return;
    }
    if (!formData.no_pesanan_platform?.trim()) {
      console.log('SaleForm - Missing no_pesanan_platform');
      return;
    }
    if (!formData.store_id) {
      console.log('SaleForm - Missing store_id');
      return;
    }
    if (!formData.customer_name?.trim()) {
      console.log('SaleForm - Missing customer_name');
      return;
    }
    
    const validItems = formData.items.filter(item => 
      item.product_variant_id && 
      item.product_variant_id.trim() !== '' &&
      item.quantity > 0 && 
      item.harga_satuan > 0
    );
    
    if (validItems.length === 0) {
      console.log('SaleForm - No valid items');
      return;
    }
    
    console.log('SaleForm - Validation passed, calling parent onSubmit');
    onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Penjualan' : 'Tambah Penjualan Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal" className="text-sm font-medium">Tanggal *</Label>
              <Input 
                id="tanggal" 
                type="date" 
                value={formData.tanggal} 
                onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))} 
                required 
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="no_pesanan_platform" className="text-sm font-medium">No. Pesanan Platform *</Label>
              <Input 
                id="no_pesanan_platform" 
                value={formData.no_pesanan_platform} 
                onChange={(e) => setFormData(prev => ({ ...prev, no_pesanan_platform: e.target.value }))} 
                placeholder="Contoh: TKP12345678" 
                required 
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_id" className="text-sm font-medium">Toko *</Label>
              <Select 
                value={formData.store_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, store_id: value }))}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih toko" />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store?.nama_toko} - {store?.platform?.nama_platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Diproses</SelectItem>
                  <SelectItem value="shipped">Dikirim</SelectItem>
                  <SelectItem value="delivered">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-medium">Informasi Customer</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-sm font-medium">Nama Customer *</Label>
                <Input 
                  id="customer_name" 
                  value={formData.customer_name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} 
                  placeholder="Nama lengkap customer" 
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_phone" className="text-sm font-medium">No. HP Customer</Label>
                <Input 
                  id="customer_phone" 
                  value={formData.customer_phone || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))} 
                  placeholder="081234567890" 
                  className="w-full"
                />
              </div>

              <div className="lg:col-span-2 space-y-2">
                <Label htmlFor="customer_address" className="text-sm font-medium">Alamat Customer</Label>
                <Textarea 
                  id="customer_address" 
                  value={formData.customer_address || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))} 
                  placeholder="Alamat lengkap customer" 
                  rows={2}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Product Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Detail Produk *</h3>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={addItem}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Item
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-6 gap-3 p-4 border rounded-lg bg-card">
                  <div className="lg:col-span-2 space-y-2">
                    <Label className="text-sm font-medium">Produk *</Label>
                    <Select 
                      value={item.product_variant_id} 
                      onValueChange={(value) => updateItem(index, 'product_variant_id', value)}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockProducts?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product?.product?.nama_produk} - {product?.warna} {product?.size} (Stok: {product?.stok})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Qty *</Label>
                    <Input 
                      type="number" 
                      value={item.quantity || 1} 
                      onChange={(e) => updateItem(index, 'quantity', Math.max(1, Number(e.target.value) || 1))} 
                      min="1"
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Harga Satuan *</Label>
                    <InputCurrency
                      value={item.harga_satuan || 0}
                      onValueChange={(value) => updateItem(index, 'harga_satuan', Math.max(0, value))}
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subtotal</Label>
                    <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                      {formatCurrency((item.quantity || 0) * (item.harga_satuan || 0))}
                    </div>
                  </div>

                  <div className="flex items-end">
                    {formData.items.length > 1 && (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={() => removeItem(index)}
                        className="w-full lg:w-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ongkir" className="text-sm font-medium">Ongkos Kirim</Label>
              <InputCurrency
                id="ongkir"
                value={formData.ongkir || 0}
                onValueChange={(value) => setFormData(prev => ({ ...prev, ongkir: Math.max(0, value) }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diskon" className="text-sm font-medium">Diskon</Label>
              <InputCurrency
                id="diskon"
                value={formData.diskon || 0}
                onValueChange={(value) => setFormData(prev => ({ ...prev, diskon: Math.max(0, value) }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="no_resi" className="text-sm font-medium">No. Resi</Label>
              <Input 
                id="no_resi" 
                value={formData.no_resi || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, no_resi: e.target.value }))} 
                placeholder="JNE123456789" 
                className="w-full"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Catatan</Label>
            <Textarea 
              id="notes" 
              value={formData.notes || ''} 
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
              placeholder="Catatan tambahan..." 
              rows={3}
              className="w-full"
            />
          </div>

          {/* Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="text-lg font-medium">Ringkasan Pembayaran</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ongkos Kirim:</span>
                <span className="font-medium">{formatCurrency(formData.ongkir || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Diskon:</span>
                <span className="font-medium text-red-500">-{formatCurrency(formData.diskon || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={loading} 
              className="gradient-primary flex-1 sm:flex-none"
            >
              {loading ? 'Menyimpan...' : isEditing ? 'Update Penjualan' : 'Simpan Penjualan'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onReset();
                onOpenChange(false);
              }}
              className="flex-1 sm:flex-none"
            >
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
