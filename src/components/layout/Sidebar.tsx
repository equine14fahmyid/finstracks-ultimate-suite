import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  BarChart3,
  ShoppingCart,
  Package,
  Wallet,
  FileText,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  Home,
  TrendingUp,
  Package2,
  DollarSign,
  Receipt,
  Building2,
  Truck,
  Tags,
  UserCheck,
  BarChart,
  FileSpreadsheet,
  Cog,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  permission?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
    permission: 'dashboard.view'
  },
  {
    title: 'Penjualan',
    icon: ShoppingCart,
    permission: 'sales.read',
    children: [
      { title: 'Daftar Penjualan', href: '/sales', icon: ShoppingCart },
      { title: 'Tambah Penjualan', href: '/sales/create', icon: ShoppingCart },
    ]
  },
  {
    title: 'Pembelian',
    icon: Package,
    permission: 'purchases.read',
    children: [
      { title: 'Daftar Pembelian', href: '/purchases', icon: Package },
      { title: 'Tambah Pembelian', href: '/purchases/create', icon: Package },
    ]
  },
  {
    title: 'Inventori',
    icon: Package2,
    permission: 'inventory.read',
    children: [
      { title: 'Produk', href: '/products', icon: Package2 },
      { title: 'Stok', href: '/inventori/stok', icon: BarChart3 },
      { title: 'Supplier', href: '/suppliers', icon: Building2 },
    ]
  },
  {
    title: 'Keuangan',
    icon: Wallet,
    permission: 'finance.read',
    children: [
      { title: 'Pemasukan', href: '/incomes', icon: TrendingUp },
      { title: 'Pengeluaran', href: '/expenses', icon: DollarSign },
      { title: 'Bank', href: '/banks', icon: Wallet },
      { title: 'Pencairan', href: '/settlements', icon: Receipt },
      { title: 'Penyesuaian', href: '/adjustments', icon: Settings },
    ]
  },
  {
    title: 'Master Data',
    icon: Settings,
    permission: 'settings.read',
    children: [
      { title: 'Platform', href: '/platforms', icon: Building2 },
      { title: 'Toko', href: '/stores', icon: Building2 },
      { title: 'Ekspedisi', href: '/expeditions', icon: Truck },
      { title: 'Kategori', href: '/categories', icon: Tags },
      { title: 'Asset', href: '/master-data/asset', icon: Building2 },
    ]
  },
  {
    title: 'Laporan',
    icon: FileText,
    permission: 'reports.read',
    children: [
      { title: 'Laba Rugi', href: '/reports/profit-loss', icon: BarChart },
      { title: 'Neraca', href: '/reports/balance-sheet', icon: FileSpreadsheet },
      { title: 'Arus Kas', href: '/reports/cash-flow', icon: TrendingUp },
      { title: 'Analitik', href: '/reports/analytics', icon: BarChart3 },
    ]
  },
];

// Admin/Superadmin only items
const adminItems: NavItem[] = [
  {
    title: 'Pengguna',
    href: '/users',
    icon: Users,
    permission: '*'
  },
  {
    title: 'Pengaturan',
    href: '/settings',
    icon: Cog,
    permission: 'settings.update'
  },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { profile, hasPermission } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dashboard']);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    // Check permissions
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const isItemActive = item.href && isActive(item.href);

    if (hasChildren) {
      return (
        <Collapsible
          key={item.title}
          open={isExpanded}
          onOpenChange={() => toggleExpanded(item.title)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between px-3 py-2 h-auto font-medium hover-lift",
                level > 0 && "ml-4",
                isExpanded && "bg-primary/10 text-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <NavLink
        key={item.title}
        to={item.href!}
        onClick={() => window.innerWidth < 1024 && onClose()}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all hover-lift",
            level > 0 && "ml-4 text-sm",
            isActive || isItemActive
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-foreground hover:bg-primary/10 hover:text-primary"
          )
        }
      >
        <item.icon className="h-4 w-4" />
        <span>{item.title}</span>
      </NavLink>
    );
  };

  const filteredAdminItems = adminItems.filter(item => 
    !item.permission || item.permission === '*' 
      ? profile?.role === 'superadmin' 
      : hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform border-r border-border bg-background transition-transform duration-300 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4 lg:hidden">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="font-bold gradient-text">FINTracks</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-2">
              {navigationItems.map(item => renderNavItem(item))}
              
              {filteredAdminItems.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    {filteredAdminItems.map(item => renderNavItem(item))}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-primary" />
              <div className="text-xs">
                <p className="font-medium">Sistem Aktif</p>
                <p className="text-muted-foreground">
                  {profile?.role === 'superadmin' ? 'Admin Penuh' : 'Akses Terbatas'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;