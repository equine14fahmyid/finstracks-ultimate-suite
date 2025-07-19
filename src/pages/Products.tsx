
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useSupabase';
import { formatCurrency } from '@/utils/format';
import { ProductForm } from '@/components/products/ProductForm';

const Products = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts();

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      await deleteProduct(id);
    }
  };

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;

  const columns = [
    {
      key: 'product_info',
      title: 'Produk',
      render: (_: any, product: any) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-sm md:text-base">{product.nama_produk}</div>
          <div className="text-xs md:text-sm text-muted-foreground">{product.satuan}</div>
          {!product.is_active && (
            <Badge variant="secondary" className="mt-1 text-xs">Tidak Aktif</Badge>
          )}
        </div>
      )
    },
    {
      key: 'prices',
      title: 'Harga',
      render: (_: any, product: any) => (
        <div className="text-sm">
          <div className="text-green-600 font-medium">
            Jual: {formatCurrency(product.harga_jual_default)}
          </div>
          <div className="text-orange-600">
            Beli: {formatCurrency(product.harga_beli)}
          </div>
        </div>
      )
    },
    {
      key: 'variants',
      title: 'Varian',
      render: (_: any, product: any) => (
        <div className="text-sm">
          <Badge variant="outline" className="text-xs">
            {product.variants?.length || 0} varian
          </Badge>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_: any, product: any) => (
        <div className="flex gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(product)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(product.id)}
            className="h-8 w-8 p-0 text-destructive"
          >
            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Produk</h1>
          <p className="text-sm text-muted-foreground">Kelola data produk dan varian</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tambah Produk</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </DialogTitle>
              </DialogHeader>
              <ProductForm
                editingProduct={editingProduct}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  setEditingProduct(null);
                  fetchProducts();
                }}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingProduct(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards - Mobile Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">Total Produk</div>
            </div>
            <div className="text-lg md:text-2xl font-bold mt-2">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Produk Aktif</div>
            <div className="text-lg md:text-2xl font-bold text-green-600 mt-2">{activeProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Tidak Aktif</div>
            <div className="text-lg md:text-2xl font-bold text-orange-600 mt-2">{totalProducts - activeProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Varian Total</div>
            <div className="text-lg md:text-2xl font-bold mt-2">
              {products.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={products}
              loading={loading}
              searchable={true}
              searchPlaceholder="Cari produk..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
