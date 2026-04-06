-- =====================================================
-- FIX: Agregar columnas faltantes a production_scrap
-- =====================================================

-- 1. Agregar defect_notes si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'production_scrap' 
    AND column_name = 'defect_notes'
  ) THEN
    ALTER TABLE public.production_scrap ADD COLUMN defect_notes TEXT;
    RAISE NOTICE '✓ Columna defect_notes agregada';
  ELSE
    RAISE NOTICE '✓ Columna defect_notes ya existe';
  END IF;
END $$;

-- 2. Verificar estructura actual
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'production_scrap'
ORDER BY ordinal_position;

-- 3. Actualizar RLS si es necesario
ALTER TABLE public.production_scrap ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.production_scrap;
CREATE POLICY "Allow all for authenticated" ON public.production_scrap
    FOR ALL USING (auth.role() = 'authenticated');
