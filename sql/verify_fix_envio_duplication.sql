-- =====================================================
-- VERIFICACIÓN Y CORRECCIÓN DE DUPLICACIÓN EN INVENTARIO
-- =====================================================

-- 1. Verificar estado actual del inventario PT
SELECT 
  'Inventario Actual' AS verificacion,
  COALESCE(SUM(quantity), 0) AS total_piezas,
  COUNT(*) AS num_productos
FROM inventory_stock;

-- 2. Verificar historial de ENVIO en operation_log
SELECT 
  'Historial ENVIO' AS verificacion,
  COUNT(*) AS total_capturas,
  SUM(quantity_good) AS total_piezas_capturadas
FROM production_operation_log pol
JOIN production_routing pr ON pol.routing_id = pr.id
WHERE UPPER(pr.operation_name) LIKE '%ENVIO%';

-- 3. Mostrar detalle de capturas ENVIO por orden
SELECT 
  pol.production_order_id,
  po.order_number,
  pr.operation_name,
  SUM(pol.quantity_good) AS piezas_enviadas,
  COUNT(*) AS num_capturas,
  MIN(pol.created_at) AS primera_captura,
  MAX(pol.created_at) AS ultima_captura
FROM production_operation_log pol
JOIN production_routing pr ON pol.routing_id = pr.id
LEFT JOIN production_orders po ON pol.production_order_id = po.id
WHERE UPPER(pr.operation_name) LIKE '%ENVIO%'
GROUP BY pol.production_order_id, po.order_number, pr.operation_name
ORDER BY pol.production_order_id;

-- 4. Comparar inventario vs capturas esperadas
SELECT 
  is_.part_number_id,
  pn.part_number,
  COALESCE(is_.quantity, 0) AS inventario_actual,
  COALESCE(envios.total_capturado, 0) AS total_capturas_envio,
  COALESCE(is_.quantity, 0) - COALESCE(envios.total_capturado, 0) AS diferencia
FROM inventory_stock is_
JOIN part_numbers pn ON is_.part_number_id = pn.id
LEFT JOIN (
  SELECT po.part_number_id, SUM(pol.quantity_good) AS total_capturado
  FROM production_operation_log pol
  JOIN production_routing pr ON pol.routing_id = pr.id
  JOIN production_orders po ON pol.production_order_id = po.id
  WHERE UPPER(pr.operation_name) LIKE '%ENVIO%'
  GROUP BY po.part_number_id
) envios ON is_.part_number_id = envios.part_number_id;

-- 5. MOSTRAR ALERTAS DE POSIBLES DUPLICACIONES
DO $$
DECLARE
  diff INTEGER;
BEGIN
  SELECT SUM(COALESCE(is_.quantity, 0) - COALESCE(envios.total_capturado, 0))
  INTO diff
  FROM inventory_stock is_
  LEFT JOIN (
    SELECT po.part_number_id, SUM(pol.quantity_good) AS total_capturado
    FROM production_operation_log pol
    JOIN production_routing pr ON pol.routing_id = pr.id
    JOIN production_orders po ON pol.production_order_id = po.id
    WHERE UPPER(pr.operation_name) LIKE '%ENVIO%'
    GROUP BY po.part_number_id
  ) envios ON is_.part_number_id = envios.part_number_id;
  
  IF diff != 0 THEN
    RAISE NOTICE '⚠ ALERTA: Hay una diferencia de % piezas entre inventario y capturas', diff;
    RAISE NOTICE 'Ejecute la función fn_fix_inventory_duplication() para corregir';
  ELSE
    RAISE NOTICE '✓ Inventario correcto - Sin diferencias detectadas';
  END IF;
END $$;

-- =====================================================
-- FUNCIÓN PARA CORREGIR DUPLICACIONES
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_fix_inventory_duplication()
RETURNS TEXT AS $$
DECLARE
  rec RECORD;
  v_fixed_count INTEGER := 0;
BEGIN
  FOR rec IN (
    SELECT 
      is_.id AS stock_id,
      is_.part_number_id,
      pn.part_number,
      is_.quantity AS inventario_actual,
      COALESCE(envios.total_capturado, 0) AS total_capturas_envio,
      COALESCE(envios.total_capturado, 0) - is_.quantity AS ajuste_necesario
    FROM inventory_stock is_
    JOIN part_numbers pn ON is_.part_number_id = pn.id
    LEFT JOIN (
      SELECT po.part_number_id, SUM(pol.quantity_good) AS total_capturado
      FROM production_operation_log pol
      JOIN production_routing pr ON pol.routing_id = pr.id
      JOIN production_orders po ON pol.production_order_id = po.id
      WHERE UPPER(pr.operation_name) LIKE '%ENVIO%'
      GROUP BY po.part_number_id
    ) envios ON is_.part_number_id = envios.part_number_id
    WHERE is_.quantity != COALESCE(envios.total_capturado, 0)
  ) LOOP
    -- Corregir el inventario para que coincida con las capturas reales
    UPDATE inventory_stock
    SET quantity = rec.total_capturas_envio,
        last_updated = NOW()
    WHERE id = rec.stock_id;
    
    -- Registrar la corrección como ajuste
    INSERT INTO inventory_transactions (
      part_number_id,
      production_order_id,
      transaction_type,
      quantity,
      created_at
    ) VALUES (
      rec.part_number_id,
      NULL,
      'ADJUSTMENT',
      rec.total_capturas_envio - rec.inventario_actual,
      NOW()
    );
    
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE 'Corregido: % - Inventario anterior: % - Nuevo: %', 
      rec.part_number, rec.inventario_actual, rec.total_capturas_envio;
  END LOOP;
  
  RETURN 'Total de productos corregidos: ' || v_fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Ejecute este script en el SQL Editor de Supabase
-- 2. Revise los resultados de las consultas anteriores
-- 3. Si hay diferencias, ejecute:
--    SELECT fn_fix_inventory_duplication();
-- 4. Verifique que el trigger trg_update_inventory_on_envio esté activo
-- =====================================================
