
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Smartphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePlatforms } from '@/hooks/useSupabase';
import { PlatformForm } from '@/components/platforms/PlatformForm';

const Platforms = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<any>(null);
  
  const { platforms, loading, fetchPlatforms, createPlatform, updatePlatform, deletePlatform } = usePlatforms();

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleEdit = (platform: any) => {
    setEditingPlatform(platform);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus platform ini?')) {
      await deletePlatform(id);
    }
  };

  const columns = [
    {
      key: 'platform_info',
      title: 'Platform',
      render: (_: any, platform: any) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-sm md:text-base">{platform.nama_platform}</div>
          <div className="text-xs md:text-sm text-muted-foreground">{platform.metode_pencairan}</div>
        </div>
      )
    },
    {
      key: 'commission',
      title: 'Komisi',
      render: (_: any, platform: any) => (
        <Badge variant="outline" className="text-xs">
          {platform.komisi_default_persen}%
        </Badge>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (_: any, platform: any) => (
        <div className="flex gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(platform)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(platform.id)}
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Platform</h1>
          <p className="text-sm text-muted-foreground">Kelola platform marketplace</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlatforms}
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
                <span className="hidden sm:inline">Tambah Platform</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4">
              <DialogHeader>
                <DialogTitle>
                  {editingPlatform ? 'Edit Platform' : 'Tambah Platform Baru'}
                </DialogTitle>
              </DialogHeader>
              <PlatformForm
                editingPlatform={editingPlatform}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  setEditingPlatform(null);
                  fetchPlatforms();
                }}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingPlatform(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">Total Platform</div>
            </div>
            <div className="text-lg md:text-2xl font-bold mt-2">{platforms.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Daftar Platform</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={platforms}
              loading={loading}
              searchable={true}
              searchPlaceholder="Cari platform..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Platforms;
