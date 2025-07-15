import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Filter, FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm, useFieldArray } from 'react-hook-form';
import { usePurchases, useSuppliers, useProducts } from '@/hooks/useSupabase';
import { formatCurrency } from '@/utils/format';

const Purchases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const { purchases, loading, fetchPurchases, createPurchase, updatePurchase, deletePurchase } = usePurchases();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { products, fetchProducts } = useProducts();
  
  const form = useForm({
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      supplier_id: '',
      no_invoice_supplier: '',
      payment_method: 'cash' as 'cash' | 'transfer' | 'credit',
      payment_status: 'pending',
      notes: '',
      items: [
        {
          product_variant_id: '',
          quantity: 1,
          harga_beli_satuan: 0,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      const items = data.items.map((item: any) => ({
        ...item,
        subtotal: item.quantity * item.harga_beli_satuan,
      }));

      if (editingPurchase) {
        await updatePurchase(editingPurchase.id, { ...data, items });
      } else {
        await createPurchase(data, items);
      }
      setIsDialogOpen(false);
      setEditingPurchase(null);
      form.reset();
    } catch (error) {
      console.error('Error saving purchase:', error);
    }
  };

  const handleEdit = (purchase: any) => {
    setEditingPurchase(purchase);
    form.reset({
      tanggal: purchase.tanggal,
      supplier_id: purchase.supplier_id,
      no_invoice_supplier: purchase.no_invoice_supplier || '',
      payment_method: purchase.payment_method || 'cash',
      payment_status: purchase.payment_status || 'pending',
      notes: purchase.notes || '',
      items: purchase.purchase_items?.map((item: any) => ({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        harga_beli_satuan: item.harga_beli_satuan,
      })) || [{ product_variant_id: '', quantity: 1, harga_beli_satuan: 0 }],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (purchase: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus pembelian ini?')) {
      await deletePurchase(purchase.id);
    }
  };

  const getProductVariants = () => {
    const variants: any[] = [];
    products.forEach(product => {
      product.product_variants?.forEach((variant: any) => {
        variants.push({
          id: variant.id,
          label: `${product.nama_produk} - ${variant.warna} - ${variant.size}`,
          product: product,
          variant: variant,
        });
      });
    });
    return variants;
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.supplier?.nama_supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.no_invoice_supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDateFrom = !dateFrom || purchase.tanggal >= dateFrom;
    const matchesDateTo = !dateTo || purchase.tanggal <= dateTo;
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const columns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      dataIndex: 'tanggal',
      render: (value: string) => new Date(value).toLocaleDateString('id-ID'),
    },
    {
      key: 'supplier',
      title: 'Supplier',
      dataIndex: 'supplier',
      render: (supplier: any) => supplier?.nama_supplier || '-',
    },
    {
      key: 'no_invoice_supplier',
      title: 'No. Invoice',
      dataIndex: 'no_invoice_supplier',
      render: (value: string) => value || '-',
    },
    {
      key: 'total',
      title: 'Total',
      dataIndex: 'total',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'payment_method',
      title: 'Metode Bayar',
      dataIndex: 'payment_method',
      render: (value: string) => (
        <Badge variant="outline">
          {value === 'cash' ? 'Tunai' : value === 'transfer' ? 'Transfer' : 'Kredit'}
        </Badge>
      ),
    },
    {
      key: 'payment_status',
      title: 'Status',
      dataIndex: 'payment_status',
      render: (value: string) => (
        <Badge variant={value === 'paid' ? 'default' : 'secondary'}>
          {value === 'paid' ? 'Lunas' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Aksi',
      dataIndex: 'id',
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(record)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(record)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Purchase Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pembelian
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pembelian</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari supplier atau invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              placeholder="Tanggal Dari"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              placeholder="Tanggal Sampai"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredPurchases}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tanggal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.nama_supplier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="no_invoice_supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Invoice Supplier</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metode Pembayaran</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Tunai</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="credit">Kredit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Input placeholder="Catatan tambahan..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Detail Pembelian</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ product_variant_id: '', quantity: 1, harga_beli_satuan: 0 })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.product_variant_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Produk *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih produk" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getProductVariants().map((variant) => (
                                  <SelectItem key={variant.id} value={variant.id}>
                                    {variant.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.harga_beli_satuan`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Harga Beli *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingPurchase ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;