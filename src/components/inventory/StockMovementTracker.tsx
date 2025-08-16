
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Package, Search, Calendar, Filter } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatDate } from '@/utils/format';
import { useStock, useProducts } from '@/hooks/useSupabase';

interface StockMovementTrackerProps {
  productVariantId?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export const StockMovementTracker = ({ 
  productVariantId, 
  showFilters = true, 
  compact = false 
}: StockMovementTrackerProps) => {
  const { movements, loading, fetchStockMovements } = useStock();
  const { products } = useProducts();
  const [filteredMovements, setFilteredMovements] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    movementType: '',
    referenceType: '',
    productId: '',
    searchTerm: ''
  });

  useEffect(() => {
    fetchStockMovements();
  }, []);

  useEffect(() => {
    let filtered = movements || [];

    // Filter by product variant if specified
    if (productVariantId) {
      filtered = filtered.filter(m => m?.product_variant_id === productVariantId);
    }

    // Apply date filters
    if (filters.startDate) {
      filtered = filtered.filter(m => m?.created_at && new Date(m.created_at) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(m => m?.created_at && new Date(m.created_at) <= new Date(filters.endDate));
    }

    // Apply type filters
    if (filters.movementType) {
      filtered = filtered.filter(m => m?.movement_type === filters.movementType);
    }
    if (filters.referenceType) {
      filtered = filtered.filter(m => m?.reference_type === filters.referenceType);
    }

    // Apply search
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(m => {
        const productName = m?.product_variant?.products?.nama_produk || m?.product_variant?.product?.nama_produk || '';
        const warna = m?.product_variant?.warna || '';
        const size = m?.product_variant?.size || '';
        const notes = m?.notes || '';
        
        return productName.toLowerCase().includes(term) ||
               warna.toLowerCase().includes(term) ||
               size.toLowerCase().includes(term) ||
               notes.toLowerCase().includes(term);
      });
    }

    setFilteredMovements(filtered);
  }, [movements, filters, productVariantId]);

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-100';
      case 'out': return 'text-red-600 bg-red-100';
      case 'adjustment': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getReferenceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'sale': 'Penjualan',
      'purchase': 'Pembelian',
      'adjustment': 'Penyesuaian',
      'return': 'Retur',
      'transfer': 'Transfer',
      'manual': 'Manual'
    };
    return types[type] || type;
  };

  const movementColumns = [
    {
      key: 'created_at',
      title: 'Tanggal',
      render: (value: any, movement: any) => {
        if (!movement?.created_at) return <div className="text-sm">-</div>;
        return (
          <div className="text-sm">
            <div className="font-medium">{formatDate(movement.created_at)}</div>
            <div className="text-muted-foreground text-xs">
              {new Date(movement.created_at).toLocaleTimeString('id-ID')}
            </div>
          </div>
        );
      }
    },
    {
      key: 'product',
      title: 'Produk',
      render: (value: any, movement: any) => {
        const productName = movement?.product_variant?.products?.nama_produk || 
                           movement?.product_variant?.product?.nama_produk || 
                           'Produk tidak diketahui';
        const warna = movement?.product_variant?.warna || 'N/A';
        const size = movement?.product_variant?.size || 'N/A';
        const sku = movement?.product_variant?.sku;
        
        return (
          <div>
            <div className="font-medium">{productName}</div>
            <div className="text-sm text-muted-foreground">{warna} - {size}</div>
            {sku && (
              <div className="text-xs text-muted-foreground">SKU: {sku}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'movement_type',
      title: 'Jenis',
      render: (value: any, movement: any) => {
        if (!movement?.movement_type) return <Badge variant="secondary">N/A</Badge>;
        return (
          <Badge variant="outline" className={`${getMovementTypeColor(movement.movement_type)}`}>
            {movement.movement_type === 'in' ? (
              <><TrendingUp className="h-3 w-3 mr-1" />Masuk</>
            ) : movement.movement_type === 'out' ? (
              <><TrendingDown className="h-3 w-3 mr-1" />Keluar</>
            ) : (
              <><Package className="h-3 w-3 mr-1" />Penyesuaian</>
            )}
          </Badge>
        );
      }
    },
    {
      key: 'quantity',
      title: 'Jumlah',
      render: (value: any, movement: any) => {
        const quantity = movement?.quantity || 0;
        const color = movement?.movement_type === 'in' ? 'text-green-600' : 
                     movement?.movement_type === 'out' ? 'text-red-600' : 'text-blue-600';
        return (
          <span className={`font-medium ${color}`}>
            {movement?.movement_type === 'in' ? '+' : movement?.movement_type === 'out' ? '-' : '±'}
            {quantity.toLocaleString('id-ID')}
          </span>
        );
      }
    },
    {
      key: 'reference_type',
      title: 'Referensi',
      render: (value: any, movement: any) => {
        const referenceType = movement?.reference_type || 'manual';
        const referenceId = movement?.reference_id;
        
        return (
          <div className="text-sm">
            <div className="font-medium">{getReferenceTypeLabel(referenceType)}</div>
            {referenceId && (
              <div className="text-muted-foreground text-xs">
                ID: {referenceId.slice(-8)}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'notes',
      title: 'Catatan',
      render: (value: any, movement: any) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate" title={movement?.notes || ''}>
          {movement?.notes || '-'}
        </div>
      )
    }
  ];

  if (compact) {
    return (
      <div className="space-y-4">
        <DataTable 
          columns={movementColumns} 
          data={filteredMovements} 
          loading={loading}
          searchable={false}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Pelacakan Pergerakan Stok
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="startDate">Dari Tanggal</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Sampai Tanggal</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Jenis Pergerakan</Label>
              <Select value={filters.movementType} onValueChange={(value) => setFilters(prev => ({ ...prev, movementType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua jenis</SelectItem>
                  <SelectItem value="in">Masuk</SelectItem>
                  <SelectItem value="out">Keluar</SelectItem>
                  <SelectItem value="adjustment">Penyesuaian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Referensi</Label>
              <Select value={filters.referenceType} onValueChange={(value) => setFilters(prev => ({ ...prev, referenceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua referensi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua referensi</SelectItem>
                  <SelectItem value="sale">Penjualan</SelectItem>
                  <SelectItem value="purchase">Pembelian</SelectItem>
                  <SelectItem value="adjustment">Penyesuaian</SelectItem>
                  <SelectItem value="return">Retur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Cari Produk</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nama produk..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  startDate: '',
                  endDate: '',
                  movementType: '',
                  referenceType: '',
                  productId: '',
                  searchTerm: ''
                })}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        )}

        <DataTable 
          columns={movementColumns} 
          data={filteredMovements} 
          loading={loading}
          searchable={false}
          searchPlaceholder="Cari dalam hasil..."
        />
      </CardContent>
    </Card>
  );
};
