-- Enable realtime for dashboard-related tables
ALTER TABLE public.sales REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.banks REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banks;