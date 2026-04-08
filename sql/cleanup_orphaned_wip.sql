-- =====================================================
-- LIMPIEZA Y VERIFICACIÓN DE DATOS HUÉRFANOS
-- =====================================================

-- 1. Ver estructura de production_routing
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'production_routing' 
ORDER BY ordinal_position;

-- 2. Ver cuántas operaciones tiene cada part_number en routing
SELECT 
  pr.part_number_id,
  pn.part_number,
  COUNT(*) as num_operaciones
FROM production_routing pr
LEFT JOIN part_numbers pn ON pr.part_number_id = pn.id
GROUP BY pr.part_number_id, pn.part_number
ORDER BY num_operaciones DESC;

-- 3. Ver todas las operaciones routing (primeros 50)
SELECT 
  pr.id,
  pr.part_number_id,
  pr.order_id,
  pr.operation_name,
  pr.sequence,
  pn.part_number,
  po.order_number
FROM production_routing pr
LEFT JOIN part_numbers pn ON pr.part_number_id = pn.id
LEFT JOIN production_orders po ON pr.order_id = po.id
ORDER BY pr.part_number_id, pr.sequence
LIMIT 50;

-- 4. Ver entradas WIP por orden
SELECT 
  pwb.id,
  pwb.production_order_id,
  pwb.routing_id,
  pwb.quantity_available,
  pwb.quantity_in_process,
  po.order_number,
  pr.operation_name
FROM production_wip_balance pwb
LEFT JOIN production_orders po ON pwb.production_order_id = po.id
LEFT JOIN production_routing pr ON pwb.routing_id = pr.id
ORDER BY pwb.production_order_id
LIMIT 50;

-- 5. DETECTAR Y MOSTRAR ENTRADAS WIP HUÉRFANAS
-- (WIP que referencia un routing_id que ya no existe o es de otro part_number)
SELECT 
  pwb.id as wip_id,
  pwb.production_order_id,
  pwb.routing_id,
  po.order_number,
  po.part_number_id as order_part_number_id,
  pr.operation_name as wip_operation,
  CASE WHEN pr.id IS NULL THEN 'ROUTING ELIMINADO' 
       WHEN pr.part_number_id != po.part_number_id THEN 'ROUTING DE OTRO PRODUCTO'
       ELSE 'OK' END as problema
FROM production_wip_balance pwb
LEFT JOIN production_orders po ON pwb.production_order_id = po.id
LEFT JOIN production_routing pr ON pwb.routing_id = pr.id
WHERE pr.id IS NULL 
   OR pr.part_number_id != po.part_number_id
   OR pr.part_number_id IS NULL;

-- 6. CONTAR DIFERENCIAS
SELECT 
  'WIP huérfanos' as tipo,
  COUNT(*) as cantidad
FROM production_wip_balance pwb
LEFT JOIN production_orders po ON pwb.production_order_id = po.id
LEFT JOIN production_routing pr ON pwb.routing_id = pr.id
WHERE pr.id IS NULL 
   OR pr.part_number_id != po.part_number_id
   OR pr.part_number_id IS NULL
UNION ALL
SELECT 
  'Total entradas WIP' as tipo,
  COUNT(*) as cantidad
FROM production_wip_balance;

-- =====================================================
-- LIMPIEZA AUTOMÁTICA (descomenta para ejecutar)
-- =====================================================
DO $$
DECLARE
  wip_record RECORD;
  cleaned_count INTEGER := 0;
BEGIN
  FOR wip_record IN 
    SELECT pwb.id
    FROM production_wip_balance pwb
    LEFT JOIN production_orders po ON pwb.production_order_id = po.id
    LEFT JOIN production_routing pr ON pwb.routing_id = pr.id
    WHERE pr.id IS NULL 
       OR pr.part_number_id != po.part_number_id
       OR pr.part_number_id IS NULL
  LOOP
    DELETE FROM production_wip_balance WHERE id = wip_record.id;
    cleaned_count := cleaned_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Limpieza completada: % entradas WIP huérfanas eliminadas', cleaned_count;
END $$;
