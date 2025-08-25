
-- Fix database security issues and add missing RLS policies

-- 1. Add missing foreign key constraints for better data integrity
ALTER TABLE public.product_variants 
ADD CONSTRAINT fk_product_variants_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.sale_items 
ADD CONSTRAINT fk_sale_items_sale_id 
FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;

ALTER TABLE public.sale_items 
ADD CONSTRAINT fk_sale_items_product_variant_id 
FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);

ALTER TABLE public.purchase_items 
ADD CONSTRAINT fk_purchase_items_purchase_id 
FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_items 
ADD CONSTRAINT fk_purchase_items_product_variant_id 
FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);

ALTER TABLE public.sales 
ADD CONSTRAINT fk_sales_store_id 
FOREIGN KEY (store_id) REFERENCES public.stores(id);

ALTER TABLE public.sales 
ADD CONSTRAINT fk_sales_expedition_id 
FOREIGN KEY (expedition_id) REFERENCES public.expeditions(id);

ALTER TABLE public.stores 
ADD CONSTRAINT fk_stores_platform_id 
FOREIGN KEY (platform_id) REFERENCES public.platforms(id);

ALTER TABLE public.purchases 
ADD CONSTRAINT fk_purchases_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE public.expenses 
ADD CONSTRAINT fk_expenses_category_id 
FOREIGN KEY (category_id) REFERENCES public.categories(id);

ALTER TABLE public.expenses 
ADD CONSTRAINT fk_expenses_bank_id 
FOREIGN KEY (bank_id) REFERENCES public.banks(id);

ALTER TABLE public.incomes 
ADD CONSTRAINT fk_incomes_category_id 
FOREIGN KEY (category_id) REFERENCES public.categories(id);

ALTER TABLE public.incomes 
ADD CONSTRAINT fk_incomes_bank_id 
FOREIGN KEY (bank_id) REFERENCES public.banks(id);

ALTER TABLE public.settlements 
ADD CONSTRAINT fk_settlements_store_id 
FOREIGN KEY (store_id) REFERENCES public.stores(id);

ALTER TABLE public.settlements 
ADD CONSTRAINT fk_settlements_bank_id 
FOREIGN KEY (bank_id) REFERENCES public.banks(id);

-- 2. Fix function security issues by updating search paths
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_income()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.bank_id IS NOT NULL THEN
    UPDATE public.banks 
    SET saldo_akhir = saldo_akhir + NEW.jumlah,
        updated_at = NOW()
    WHERE id = NEW.bank_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_bank_balance_on_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.bank_id IS NOT NULL THEN
    UPDATE public.banks 
    SET saldo_akhir = saldo_akhir - NEW.jumlah,
        updated_at = NOW()
    WHERE id = NEW.bank_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_income_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Rollback saldo lama
  IF OLD.bank_id IS NOT NULL THEN
    UPDATE public.banks 
    SET saldo_akhir = saldo_akhir - OLD.jumlah,
        updated_at = NOW()
    WHERE id = OLD.bank_id;
  END IF;
  
  -- Apply saldo baru
  IF NEW.bank_id IS NOT NULL THEN
    UPDATE public.banks 
    SET saldo_akhir = saldo_akhir + NEW.jumlah,
        updated_at = NOW()
    WHERE id = NEW.bank_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_expense_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Rollback saldo lama
  IF OLD.bank_id IS NOT NULL THEN
    UPDATE public.banks 
    SET saldo_akhir = saldo_akhir + OLD.jumlah,
        updated_at = NOW()
    WHERE id = OLD.bank_id;
  END IF;
  
  -- Apply saldo baru
  IF NEW.bank_id IS NOT NULL THEN
    UPDATE public.banks 
    SET saldo_akhir = saldo_akhir - NEW.jumlah,
        updated_at = NOW()
    WHERE id = NEW.bank_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Create secure function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role::text FROM public.user_profiles WHERE id = auth.uid();
$$;

-- 4. Add more restrictive RLS policies based on user roles
CREATE POLICY "Superadmin can manage all data" ON public.user_profiles
FOR ALL USING (public.get_current_user_role() = 'superadmin');

CREATE POLICY "Admin can view all profiles" ON public.user_profiles
FOR SELECT USING (public.get_current_user_role() IN ('superadmin', 'admin'));

-- 5. Add audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, old_values)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- 6. Create triggers for audit logging on sensitive tables
CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_banks
  AFTER INSERT OR UPDATE OR DELETE ON public.banks
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_sales
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 7. Add policy for activity logs
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
FOR SELECT USING (auth.uid() = user_id);

-- 8. Create secure function for session validation
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND is_active = true
  );
$$;

-- 9. Add updated_at triggers for all tables that need them
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banks_updated_at
  BEFORE UPDATE ON public.banks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create indexes for better performance on frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_tanggal ON public.sales(tanggal);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_store_id ON public.sales(store_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_tanggal ON public.purchases(tanggal);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
