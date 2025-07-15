// ============================================================================
// FINTRACKS ULTIMATE - AUTHENTICATION TYPES
// ============================================================================

export type UserRole = 'superadmin' | 'admin' | 'staff' | 'viewers';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  superadmin: ['*'], // All permissions
  admin: [
    'dashboard.view',
    'sales.create', 'sales.read', 'sales.update', 'sales.export',
    'purchases.create', 'purchases.read', 'purchases.update', 'purchases.export',
    'inventory.create', 'inventory.read', 'inventory.update', 'inventory.export',
    'finance.create', 'finance.read', 'finance.update', 'finance.export',
    'reports.read', 'reports.export',
    'settings.read', 'settings.update'
  ],
  staff: [
    'dashboard.view',
    'sales.create', 'sales.read', 'sales.update',
    'purchases.create', 'purchases.read', 'purchases.update',
    'inventory.read', 'inventory.update'
  ],
  viewers: [
    'dashboard.view',
    'reports.read'
  ]
};

export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes('*') || permissions.includes(permission);
};

export const getModuleAccess = (userRole: UserRole) => ({
  dashboard: hasPermission(userRole, 'dashboard.view'),
  sales: hasPermission(userRole, 'sales.read'),
  purchases: hasPermission(userRole, 'purchases.read'),
  inventory: hasPermission(userRole, 'inventory.read'),
  finance: hasPermission(userRole, 'finance.read'),
  reports: hasPermission(userRole, 'reports.read'),
  settings: hasPermission(userRole, 'settings.read'),
  users: userRole === 'superadmin'
});