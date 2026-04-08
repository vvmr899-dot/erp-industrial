-- =====================================================
-- TRIGGER: Actualizar inventario cuando se captura ENVIO
-- =====================================================

-- Función que maneja el movimiento de inventario para ENVIO
CREATE OR REPLACE FUNCTION public.fn_handle_envio_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_routing_name TEXT;
  v_part_number_id UUID;
  v_quantity_good INTEGER;
  v_is_envio BOOLEAN := FALSE;
BEGIN
  -- Obtener el nombre de la operación
  SELECT operation_name INTO v_routing_name
  FROM production_routing
  WHERE id = NEW.routing_id;
  
  -- Verificar si es una operación ENVIO
  IF v_routing_name IS NOT NULL AND UPPER(v_routing_name) LIKE '%ENVIO%' THEN
    v_is_envio := TRUE;
  END IF;
  
  -- Si es ENVIO y hay piezas buenas, actualizar inventario
  IF v_is_envio AND NEW.quantity_good > 0 THEN
    -- Obtener el part_number_id de la orden de producción
    SELECT part_number_id INTO v_part_number_id
    FROM production_orders
    WHERE id = NEW.production_order_id;
    
    IF v_part_number_id IS NOT NULL THEN
      v_quantity_good := NEW.quantity_good;
      
      -- Actualizar o insertar en inventory_stock usando upsert
      INSERT INTO inventory_stock (part_number_id, quantity, last_updated)
      VALUES (v_part_number_id, v_quantity_good, NOW())
      ON CONFLICT (part_number_id) 
      DO UPDATE SET 
        quantity = inventory_stock.quantity + EXCLUDED.quantity,
        last_updated = NOW();
      
      -- Registrar la transacción
      INSERT INTO inventory_transactions (
        part_number_id, 
        production_order_id, 
        transaction_type, 
        quantity,
        created_at
      ) VALUES (
        v_part_number_id,
        NEW.production_order_id,
        'FINISHED_GOODS_RECEIPT',
        v_quantity_good,
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger (eliminar primero si existe)
DROP TRIGGER IF EXISTS trg_update_inventory_on_envio ON production_operation_log;

CREATE TRIGGER trg_update_inventory_on_envio
AFTER INSERT ON production_operation_log
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_envio_inventory();

-- Verificar que el trigger se creó correctamente
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trg_update_inventory_on_envio';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Trigger trg_update_inventory_on_envio creado exitosamente';
END $$;
