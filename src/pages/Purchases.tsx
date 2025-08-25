
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency } from '@/utils/format';
import { usePurchases } from '@/hooks/usePurchases';
import { useSuppliers } from '@/hooks/useSupabase';

const Purchases = () => {
  const { purchases, loading, fetchPurchases } = usePurchases();
  const { suppliers, fetchSuppliers } = useSuppliers();

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
  }, []);

  const purchaseColumns = [
    {
      key: 'tanggal',
      title: 'Tanggal',
      render: (value: string) => new Date(value).toLocaleDateString('id-ID')
    },
    {
      key: 'no_invoice_supplier',
      title: 'No. Invoice',
      render: (value: string) => value || '-'
    },
    {
      key: 'supplier',
      title: 'Supplier',
      render: (value: any) => value?.nama_supplier || '-'
    },
    {
      key: 'total',
      title: 'Total',
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'payment_status',
      title: 'Status',
      render: (value: string) => {
        const statusMap = {
          pending: 'Pending',
          received: 'Diterima',
          paid: 'Lunas',
          cancelled: 'Batal',
          returned: 'Return'
        };
        return statusMap[value as keyof typeof statusMap] || value;
      }
    },
    {
      key: 'items_count',
      title: 'Items',
      render: (value: any, item: any) => item.purchase_items?.length || 0
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Pembelian</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pembelian
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={purchaseColumns} 
            data={purchases} 
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari pembelian..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Purchases;
