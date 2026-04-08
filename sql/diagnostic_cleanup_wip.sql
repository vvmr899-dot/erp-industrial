-- =====================================================
-- SCRIPT DE DIAGNÓSTICO Y LIMPIEZA COMPLETO
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. VER TODAS LAS ÓRDENES ACTIVAS
SELECT id, order_number, part_number_id, status 
FROM production_orders 
WHERE status IN ('Liberada', 'En Proceso')
ORDER BY created_at DESC;

-- 2. VER PRODUCTION_ROUTING AGRUPADO POR PART_NUMBER
SELECT 
  pr.part_number_id,
  pn.part_number,
  COUNT(*) as num_rutas
FROM production_routing pr
JOIN part_numbers pn ON pr.part_number_id = pn.id
GROUP BY pr.part_number_id, pn.part_number;

-- 3. VER WIP BALANCE POR ÓRDEN
SELECT 
  pwb.id,
  pwb.production_order_id,
  po.order_number,
  po.part_number_id as orden_part_id,
  pwb.routing_id,
  pr.part_number_id as ruta_part_id,
  pr.operation_name,
  CASE WHEN pr.id IS NULL THEN '❌ ELIMINADA' 
       WHEN pr.part_number_id != po.part_number_id THEN '❌ OTRO PRODUCTO'
       ELSE '✓ OK' END as estado
FROM production_wip_balance pwb
JOIN production_orders po ON pwb.production_order_id = po.id
LEFT JOIN production_routing pr ON pwb.routing_id = pr.id
ORDER BY po.order_number, pr.sequence;

-- 4. LIMPIEZA: Eliminar entradas WIP que referencian rutas eliminadas o de otro producto
DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Eliminar WIP huérfano (routing no existe)
  DELETE FROM production_wip_balance 
  WHERE routing_id NOT IN (SELECT id FROM production_routing);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Eliminados % WIP con routing_id inexistente', v_count;

  -- Eliminar WIP que referencia un part_number diferente al de la orden
  DELETE FROM production_wip_balance pwb
  USING production_orders po
  WHERE pwb.production_order_id = po.id
    AND pwb.routing_id IN (
      SELECT pr.id 
      FROM production_routing pr 
      WHERE pr.part_number_id != po.part_number_id
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Eliminados % WIP con part_number diferente', v_count;
  
  RAISE NOTICE '✓ Limpieza completada';
END $$;

-- 5. VERIFICAR RESULTADO
SELECT 
  'WIP Balance después de limpieza' as info,
  COUNT(*) as total_entradas
FROM production_wip_balance;
