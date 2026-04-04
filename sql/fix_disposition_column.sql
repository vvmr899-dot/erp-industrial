-- =====================================================
-- FIX: Asegurar que production_scrap tenga la columna disposition
-- =====================================================

-- 1. Verificar si existe la columna disposition
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'production_scrap' 
    AND column_name = 'disposition'
  ) THEN
    ALTER TABLE public.production_scrap ADD COLUMN disposition VARCHAR(50) DEFAULT 'Pending';
    RAISE NOTICE '✓ Columna disposition agregada a production_scrap';
  ELSE
    RAISE NOTICE '✓ Columna disposition ya existe';
  END IF;
END $$;

-- 2. Actualizar datos existentes con disposition si están NULL
UPDATE public.production_scrap 
SET disposition = 'Pending' 
WHERE disposition IS NULL;

-- 3. Verificar la estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'production_scrap'
ORDER BY ordinal_position;

-- 4. Actualizar valores de ejemplo
UPDATE public.production_scrap 
SET disposition = 'Approved' 
WHERE id = (SELECT id FROM public.production_scrap LIMIT 1);

-- 5. Verificar RLS en production_scrap
SELECT 
  'RLS Status' AS check,
  relrowsecurity AS enabled
FROM pg_class
WHERE relname = 'production_scrap';

-- 6. Verificar que hay datos
SELECT COUNT(*) AS total_registros FROM public.production_scrap;
