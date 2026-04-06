-- =====================================================
-- FIX: Asegurar que inspecciones tenga todas las columnas
-- =====================================================

-- Verificar/crear tabla inspecciones
CREATE TABLE IF NOT EXISTS public.inspecciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scrap_id UUID REFERENCES public.production_scrap(id),
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

-- Verificar estructura
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'inspecciones'
ORDER BY ordinal_position;

-- Agregar columnas faltantes si es necesario
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inspecciones' AND column_name = 'defect_type'
  ) THEN
    ALTER TABLE public.inspecciones ADD COLUMN defect_type VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inspecciones' AND column_name = 'defect_notes'
  ) THEN
    ALTER TABLE public.inspecciones ADD COLUMN defect_notes TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inspecciones' AND column_name = 'disposition'
  ) THEN
    ALTER TABLE public.inspecciones ADD COLUMN disposition VARCHAR(50);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.inspecciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.inspecciones;
CREATE POLICY "Allow all for authenticated" ON public.inspecciones
    FOR ALL USING (auth.role() = 'authenticated');

-- Verificar RLS
SELECT 'RLS habilitado en inspecciones' AS status, relrowsecurity 
FROM pg_class WHERE relname = 'inspecciones';
