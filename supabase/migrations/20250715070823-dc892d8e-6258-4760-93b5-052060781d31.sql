-- Create notifications table for realtime notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_settings table for settings persistence
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT DEFAULT 'EQUINE Fashion',
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  tax_number TEXT,
  logo_url TEXT,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'id' CHECK (language IN ('id', 'en')),
  timezone TEXT DEFAULT 'Asia/Jakarta',
  date_format TEXT DEFAULT 'dd/MM/yyyy',
  currency TEXT DEFAULT 'IDR',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  low_stock_alerts BOOLEAN DEFAULT TRUE,
  payment_reminders BOOLEAN DEFAULT TRUE,
  daily_reports BOOLEAN DEFAULT FALSE,
  weekly_reports BOOLEAN DEFAULT TRUE,
  monthly_reports BOOLEAN DEFAULT TRUE,
  two_factor_auth BOOLEAN DEFAULT FALSE,
  session_timeout INTEGER DEFAULT 30,
  password_expiry INTEGER DEFAULT 90,
  login_attempts INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create activity_logs table for audit trail
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create stock_alerts table for stock monitoring
CREATE TABLE public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  min_stock_threshold INTEGER NOT NULL DEFAULT 10,
  alert_enabled BOOLEAN DEFAULT TRUE,
  last_alert_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_variant_id)
);

-- Enable RLS on all tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view their own settings" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for activity_logs
CREATE POLICY "Superadmin can view all activity logs" 
ON public.activity_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Create RLS policies for stock_alerts
CREATE POLICY "Authenticated users can manage stock alerts" 
ON public.stock_alerts FOR ALL 
USING (auth.role() = 'authenticated');

-- Create function to automatically create user settings
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create user settings
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_settings();

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_alerts_updated_at
  BEFORE UPDATE ON public.stock_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to check low stock and create notifications
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  low_stock_record RECORD;
BEGIN
  FOR low_stock_record IN
    SELECT 
      pv.id as variant_id,
      p.nama_produk,
      pv.warna,
      pv.size,
      pv.stok,
      sa.min_stock_threshold,
      sa.last_alert_sent
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN stock_alerts sa ON pv.id = sa.product_variant_id
    WHERE pv.stok <= sa.min_stock_threshold 
    AND sa.alert_enabled = TRUE
    AND (sa.last_alert_sent IS NULL OR sa.last_alert_sent < now() - interval '24 hours')
  LOOP
    -- Create notification for all users with low_stock_alerts enabled
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT 
      up.id,
      'Stok Rendah!',
      format('Produk %s (%s, %s) tersisa %s pcs', 
        low_stock_record.nama_produk, 
        low_stock_record.warna, 
        low_stock_record.size, 
        low_stock_record.stok),
      'warning'
    FROM user_profiles up
    JOIN user_settings us ON up.id = us.user_id
    WHERE us.low_stock_alerts = TRUE;
    
    -- Update last alert sent
    UPDATE stock_alerts 
    SET last_alert_sent = now()
    WHERE product_variant_id = low_stock_record.variant_id;
  END LOOP;
END;
$$;