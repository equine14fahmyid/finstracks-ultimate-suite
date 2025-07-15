-- Create enum for adjustment types
CREATE TYPE public.adjustment_type AS ENUM ('denda', 'selisih_ongkir', 'pinalti');

-- Create sales_adjustments table
CREATE TABLE public.sales_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  adjustment_type adjustment_type NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add validation and adjustment fields to sales table
ALTER TABLE public.sales 
ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN needs_adjustment BOOLEAN DEFAULT FALSE,
ADD COLUMN adjustment_notes TEXT;

-- Enable RLS on sales_adjustments
ALTER TABLE public.sales_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for sales_adjustments
CREATE POLICY "Enable all operations for authenticated users" 
ON public.sales_adjustments 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_sales_adjustments_sale_id ON public.sales_adjustments(sale_id);
CREATE INDEX idx_sales_validated_at ON public.sales(validated_at);
CREATE INDEX idx_sales_needs_adjustment ON public.sales(needs_adjustment);

-- Create trigger for updating updated_at on sales_adjustments
CREATE TRIGGER update_sales_adjustments_updated_at
  BEFORE UPDATE ON public.sales_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to validate sales and create adjustment entries
CREATE OR REPLACE FUNCTION public.validate_sale_with_adjustments(
  sale_id_param UUID,
  adjustments JSONB DEFAULT '[]'::jsonb
) RETURNS VOID AS $$
DECLARE
  adjustment_record RECORD;
  total_adjustment NUMERIC := 0;
  sale_total NUMERIC;
BEGIN
  -- Get sale total for validation
  SELECT total INTO sale_total FROM public.sales WHERE id = sale_id_param;
  
  IF sale_total IS NULL THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;
  
  -- Process each adjustment
  FOR adjustment_record IN SELECT * FROM jsonb_array_elements(adjustments)
  LOOP
    -- Insert adjustment record
    INSERT INTO public.sales_adjustments (sale_id, adjustment_type, amount, notes, created_by)
    VALUES (
      sale_id_param,
      (adjustment_record.value->>'type')::adjustment_type,
      (adjustment_record.value->>'amount')::numeric,
      adjustment_record.value->>'notes',
      auth.uid()
    );
    
    -- Add to total adjustment
    total_adjustment := total_adjustment + (adjustment_record.value->>'amount')::numeric;
    
    -- Create expense entry for adjustment
    INSERT INTO public.expenses (tanggal, category_id, jumlah, keterangan, created_by)
    SELECT 
      CURRENT_DATE,
      c.id,
      (adjustment_record.value->>'amount')::numeric,
      CONCAT('Penyesuaian ', adjustment_record.value->>'type', ' untuk pesanan ', s.no_pesanan_platform),
      auth.uid()
    FROM public.sales s
    CROSS JOIN public.categories c
    WHERE s.id = sale_id_param 
    AND c.nama_kategori = 'Penyesuaian' 
    AND c.tipe_kategori = 'expense';
  END LOOP;
  
  -- Validate total adjustment doesn't exceed sale total
  IF total_adjustment > sale_total THEN
    RAISE EXCEPTION 'Total adjustment amount cannot exceed sale total';
  END IF;
  
  -- Mark sale as validated
  UPDATE public.sales 
  SET 
    validated_at = now(),
    needs_adjustment = CASE WHEN total_adjustment > 0 THEN TRUE ELSE FALSE END,
    adjustment_notes = CASE 
      WHEN total_adjustment > 0 THEN 'Disesuaikan dengan total: ' || total_adjustment::text
      ELSE 'Divalidasi tanpa penyesuaian'
    END
  WHERE id = sale_id_param;
  
  -- Update store dashboard balance
  UPDATE public.stores 
  SET saldo_dashboard = saldo_dashboard - total_adjustment
  WHERE id = (SELECT store_id FROM public.sales WHERE id = sale_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;