import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { useUserProfiles } from '@/hooks/useSupabase';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const { userProfiles, loading, fetchUserProfiles, createUserProfile, updateUserProfile, deleteUserProfile } = useUserProfiles();
  
  const form = useForm({
    defaultValues: {
      full_name: '',
      phone: '',
      avatar_url: '',
      role: 'staff' as 'superadmin' | 'admin' | 'staff' | 'viewers',
    },
  });

  useEffect(() => {
    fetchUserProfiles();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      if (editingUser) {
        await updateUserProfile(editingUser.id, data);
      } else {
        await createUserProfile(data);
      }
      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.reset({
      full_name: user.full_name,
      phone: user.phone || '',
      avatar_url: user.avatar_url || '',
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (user: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      await deleteUserProfile(user.id);
    }
  };

  const filteredUsers = userProfiles.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'destructive';
      case 'admin': return 'default';
      case 'staff': return 'secondary';
      case 'viewers': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'staff': return 'Staff';
      case 'viewers': return 'Viewers';
      default: return role;
    }
  };

  const columns = [
    {
      key: 'avatar',
      title: 'Avatar',
      dataIndex: 'avatar_url',
      render: (avatar_url: string, record: any) => (
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar_url} alt={record.full_name} />
          <AvatarFallback>
            {record.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: 'full_name',
      title: 'Nama Lengkap',
      dataIndex: 'full_name',
    },
    {
      key: 'phone',
      title: 'No. HP',
      dataIndex: 'phone',
      render: (value: string) => value || '-',
    },
    {
      key: 'role',
      title: 'Role',
      dataIndex: 'role',
      render: (role: string) => (
        <Badge variant={getRoleBadgeVariant(role)}>
          {getRoleLabel(role)}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      title: 'Status',
      dataIndex: 'is_active',
      render: (is_active: boolean) => (
        <Badge variant={is_active ? 'default' : 'secondary'}>
          {is_active ? (
            <>
              <UserCheck className="h-3 w-3 mr-1" />
              Aktif
            </>
          ) : (
            <>
              <UserX className="h-3 w-3 mr-1" />
              Nonaktif
            </>
          )}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      title: 'Tanggal Dibuat',
      dataIndex: 'created_at',
      render: (value: string) => new Date(value).toLocaleDateString('id-ID'),
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
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pengguna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredUsers}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. HP</FormLabel>
                    <FormControl>
                      <Input placeholder="08xxxxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="viewers">Viewers</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Avatar</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingUser ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;