-- =====================================================
-- HABILITAR REALTIME PARA production_routing
-- =====================================================

-- 1. Habilitar Realtime en la tabla production_routing
ALTER PUBLICATION supabase_realtime ADD TABLE production_routing;

-- 2. Verificar que el realtime está habilitado
SELECT 
  schemaname,
  tablename,
  relid
FROM pg_publication_tables 
WHERE tablename = 'production_routing';

-- 3. Verificar Publication
SELECT 
  pubname,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- 4. Verificar si hay subscribers activos
SELECT 
  channel,
  subscribed,
  status
FROM pg_stat_subscription;

-- Nota: Si el realtime no funciona, verifica en el dashboard de Supabase:
-- Database > Replication > Publications > supabase_realtime
-- Y asegúrate de que production_routing esté incluida.

DO $$
BEGIN
  RAISE NOTICE 'Realtime habilitado para production_routing';
  RAISE NOTICE 'Si los cambios no se reflejan, verifica en el dashboard de Supabase';
END $$;
