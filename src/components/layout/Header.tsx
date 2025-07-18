
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Moon, 
  Sun, 
  Settings, 
  LogOut, 
  User, 
  TrendingUp,
  Menu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { NotificationCenter } from '@/components/common/NotificationCenter';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-error text-white';
      case 'admin': return 'bg-warning text-white';
      case 'staff': return 'bg-primary text-white';
      case 'viewers': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Administrator';
      case 'staff': return 'Staff';
      case 'viewers': return 'Viewer';
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-card backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 md:h-16 items-center justify-between px-3 md:px-6">
        {/* Left Section - Logo & Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden hover-lift h-10 w-10 md:h-10 md:w-10"
          >
            <Menu className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1 md:gap-2">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold font-display gradient-text">
                  FINTracks
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">
                  Ultimate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Notifications */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="hover-lift h-10 w-10 md:h-10 md:w-10"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Moon className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 md:gap-3 px-2 md:px-3 hover-lift h-10 md:h-auto">
                <Avatar className="h-7 w-7 md:h-8 md:w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">
                    {profile?.full_name || 'User'}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-2 py-0 ${getRoleBadgeColor(profile?.role || '')}`}
                  >
                    {getRoleLabel(profile?.role || '')}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 md:w-56 glass-card border-0">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="hover:bg-primary/10">
                <User className="mr-2 h-4 w-4" />
                Profil Saya
              </DropdownMenuItem>
              
              <DropdownMenuItem className="hover:bg-primary/10">
                <Settings className="mr-2 h-4 w-4" />
                Pengaturan
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-error hover:bg-error/10 hover:text-error"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
