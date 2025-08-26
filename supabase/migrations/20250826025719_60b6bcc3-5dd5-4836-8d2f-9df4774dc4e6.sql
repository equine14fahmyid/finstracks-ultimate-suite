-- Fix security vulnerability in sales table RLS policies
-- Remove the overly permissive policy that allows all authenticated users to access all sales data

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.sales;

-- Create a security definer function to get user role without causing RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(up.role, 'viewers'::user_role)
  FROM public.user_profiles up
  WHERE up.id = auth.uid()
  LIMIT 1;
$$;

-- Create a function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN public.get_current_user_role() = 'superadmin' THEN true
    WHEN public.get_current_user_role() = 'admin' AND permission_name IN (
      'sales.create', 'sales.read', 'sales.update', 'sales.export'
    ) THEN true
    WHEN public.get_current_user_role() = 'staff' AND permission_name IN (
      'sales.create', 'sales.read', 'sales.update'
    ) THEN true
    ELSE false
  END;
$$;

-- Create secure RLS policies for sales table based on user roles and permissions

-- Policy for SELECT (reading sales data)
CREATE POLICY "Users can view sales based on role permissions"
ON public.sales
FOR SELECT
TO authenticated
USING (public.user_has_permission('sales.read'));

-- Policy for INSERT (creating new sales)
CREATE POLICY "Users can create sales based on role permissions"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_permission('sales.create'));

-- Policy for UPDATE (modifying existing sales)
CREATE POLICY "Users can update sales based on role permissions"
ON public.sales
FOR UPDATE
TO authenticated
USING (public.user_has_permission('sales.update'))
WITH CHECK (public.user_has_permission('sales.update'));

-- Policy for DELETE (only superadmin should be able to delete sales for audit purposes)
CREATE POLICY "Only superadmin can delete sales"
ON public.sales
FOR DELETE
TO authenticated
USING (public.get_current_user_role() = 'superadmin');

-- Also secure the sale_items table with similar policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.sale_items;

CREATE POLICY "Users can view sale items based on role permissions"
ON public.sale_items
FOR SELECT
TO authenticated
USING (public.user_has_permission('sales.read'));

CREATE POLICY "Users can create sale items based on role permissions"
ON public.sale_items
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_permission('sales.create'));

CREATE POLICY "Users can update sale items based on role permissions"
ON public.sale_items
FOR UPDATE
TO authenticated
USING (public.user_has_permission('sales.update'))
WITH CHECK (public.user_has_permission('sales.update'));

CREATE POLICY "Only superadmin can delete sale items"
ON public.sale_items
FOR DELETE
TO authenticated
USING (public.get_current_user_role() = 'superadmin');