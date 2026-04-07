-- Migration: Add missing columns to production_routing
-- Fix: could not find selected_machine column of production_routing in schema cache

ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS selected_machine VARCHAR(100);
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS machine_area VARCHAR(100);
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS standard_time_minutes DECIMAL(10,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS setup_time_minutes DECIMAL(10,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS is_final_operation BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS sequence_base INTEGER;
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS sequence_sub INTEGER;
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS sequence_str VARCHAR(50);
ALTER TABLE IF EXISTS public.production_routing ADD COLUMN IF NOT EXISTS part_number_id UUID REFERENCES public.part_numbers(id);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'production_routing' 
AND table_schema = 'public'
ORDER BY ordinal_position;
