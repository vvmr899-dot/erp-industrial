-- =====================================================
-- FIX COMPLETO: Asegurar estructura correcta
-- =====================================================

-- 1. production_scrap - agregar defect_notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'production_scrap' AND column_name = 'defect_notes'
  ) THEN
    ALTER TABLE public.production_scrap ADD COLUMN defect_notes TEXT;
  END IF;
END $$;

-- 2. Crear/actualizar inspecciones
CREATE TABLE IF NOT EXISTS public.inspecciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scrap_id UUID,
  inspector_id UUID,
  piezas_revisadas INTEGER DEFAULT 0,
  piezas_aprobadas INTEGER DEFAULT 0,
  piezas_rechazadas INTEGER DEFAULT 0,
  defect_type VARCHAR(100),
  defect_notes TEXT,
  disposition VARCHAR(50),
  fecha_inspeccion DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS para ambas tablas
ALTER TABLE public.production_scrap ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.production_scrap;
CREATE POLICY "Allow all for authenticated" ON public.production_scrap
    FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.inspecciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.inspecciones;
CREATE POLICY "Allow all for authenticated" ON public.inspecciones
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Verificar
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'production_scrap' ORDER BY ordinal_position;

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'inspecciones' ORDER BY ordinal_position;
