-- =====================================================
-- VERIFICACIÓN DEL SISTEMA ERP
-- Ejecute este SQL en el SQL Editor de Supabase
-- =====================================================

-- 1. Verificar conexión
SELECT '✓ Conexión exitosa' AS status, NOW() AS server_time;

-- 2. Tabla: production_scrap
DO $$
DECLARE
  scrap_count INTEGER;
  scrap_cols TEXT;
BEGIN
  SELECT COUNT(*) INTO scrap_count FROM information_schema.tables 
  WHERE table_name = 'production_scrap' AND table_schema = 'public';
  
  IF scrap_count > 0 THEN
    SELECT string_agg(column_name, ', ')
    INTO scrap_cols
    FROM information_schema.columns
    WHERE table_name = 'production_scrap' AND table_schema = 'public';
    
    RAISE NOTICE '✓ production_scrap existe. Columnas: %', scrap_cols;
  ELSE
    RAISE NOTICE '✗ production_scrap NO existe';
  END IF;
END $$;

-- 3. Tabla: production_orders
DO $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count FROM information_schema.tables 
  WHERE table_name = 'production_orders' AND table_schema = 'public';
  RAISE NOTICE '% production_orders', CASE WHEN count > 0 THEN '✓' ELSE '✗' END;
END $$;

-- 4. Tabla: production_routing
DO $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count FROM information_schema.tables 
  WHERE table_name = 'production_routing' AND table_schema = 'public';
  RAISE NOTICE '% production_routing', CASE WHEN count > 0 THEN '✓' ELSE '✗' END;
END $$;

-- 5. Tabla: inspecciones
DO $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count FROM information_schema.tables 
  WHERE table_name = 'inspecciones' AND table_schema = 'public';
  RAISE NOTICE '% inspecciones', CASE WHEN count > 0 THEN '✓' ELSE '✗' END;
END $$;

-- 6. Tabla: languages
DO $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count FROM information_schema.tables 
  WHERE table_name = 'languages' AND table_schema = 'public';
  RAISE NOTICE '% languages', CASE WHEN count > 0 THEN '✓' ELSE '✗' END;
END $$;

-- 7. Datos en production_scrap
SELECT 
  'Datos en production_scrap' AS check_name,
  COUNT(*) AS row_count
FROM public.production_scrap;

-- 8. Datos en languages
SELECT 
  'Traducciones cargadas' AS check_name,
  COUNT(*) AS translation_count
FROM public.languages;

-- 9. Verificar RLS en production_scrap
SELECT 
  'RLS en production_scrap' AS check_name,
  relrowsecurity::TEXT AS rls_enabled
FROM pg_class
WHERE relname = 'production_scrap';

-- 10. Test de relaciones (si existen orders)
SELECT 
  'Test de relaciones' AS check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.production_scrap LIMIT 1) THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.production_scrap ps
          LEFT JOIN public.production_orders po ON ps.order_id = po.id
          WHERE ps.order_id IS NOT NULL
        ) THEN '✓ Relaciones OK'
        WHEN EXISTS (SELECT 1 FROM public.production_scrap WHERE order_id IS NOT NULL LIMIT 1) = FALSE THEN
          '⚠ Scrap sin order_id (datos de prueba)'
        ELSE '✗ Error en relaciones'
      END
    ELSE '⚠ Sin datos en production_scrap'
  END AS status;

-- Resultado final
SELECT '========================================' AS separator;
SELECT 'Verificación completada' AS result;
