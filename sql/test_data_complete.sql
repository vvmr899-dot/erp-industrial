-- =====================================================
-- DATOS DE PRUEBA MÍNIMOS - Con relaciones
-- Para que el módulo de Calidad funcione correctamente
-- =====================================================

-- 1. Primero verificar/crear tablas base si no existen

-- Tabla de órdenes de producción
CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer VARCHAR(100),
  part_numbers JSONB,
  quantity INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de routing
CREATE TABLE IF NOT EXISTS public.production_routing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.production_orders(id),
  operation_name VARCHAR(100),
  sequence INTEGER,
  work_center VARCHAR(50),
  setup_time INTEGER,
  run_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insertar órdenes de prueba
INSERT INTO public.production_orders (order_number, customer, part_numbers, quantity, status)
VALUES
  ('OP-2025-049', 'Cliente A', '{"part_number": "9120-002", "description": "BASE SENSOR"}', 100, 'active'),
  ('OP-2025-050', 'Cliente B', '{"part_number": "7840-003", "description": "ADAPTADOR"}', 50, 'active'),
  ('OP-2025-048', 'Cliente C', '{"part_number": "9110-005", "description": "BRIDA"}', 200, 'active')
ON CONFLICT (order_number) DO NOTHING
RETURNING order_number, id;

-- 3. Insertar routing para cada orden
INSERT INTO public.production_routing (order_id, operation_name, sequence, work_center)
SELECT id, 'Torneado CNC', 10, 'MC-01'
FROM public.production_orders WHERE order_number = 'OP-2025-049'
ON CONFLICT DO NOTHING;

INSERT INTO public.production_routing (order_id, operation_name, sequence, work_center)
SELECT id, 'Fresado CNC', 20, 'MC-02'
FROM public.production_orders WHERE order_number = 'OP-2025-049'
ON CONFLICT DO NOTHING;

INSERT INTO public.production_routing (order_id, operation_name, sequence, work_center)
SELECT id, 'Inspección Final', 30, 'QC-01'
FROM public.production_orders WHERE order_number = 'OP-2025-049'
ON CONFLICT DO NOTHING;

INSERT INTO public.production_routing (order_id, operation_name, sequence, work_center)
SELECT id, 'Fresado CNC', 20, 'MC-02'
FROM public.production_orders WHERE order_number = 'OP-2025-050'
ON CONFLICT DO NOTHING;

INSERT INTO public.production_routing (order_id, operation_name, sequence, work_center)
SELECT id, 'Fundición', 5, 'LF-01'
FROM public.production_orders WHERE order_number = 'OP-2025-048'
ON CONFLICT DO NOTHING;

-- 4. Obtener IDs para usar en scrap
DO $$
DECLARE
  order_049_id UUID;
  order_050_id UUID;
  order_048_id UUID;
  routing_049_10_id UUID;
  routing_050_20_id UUID;
  routing_048_5_id UUID;
BEGIN
  SELECT id INTO order_049_id FROM public.production_orders WHERE order_number = 'OP-2025-049';
  SELECT id INTO order_050_id FROM public.production_orders WHERE order_number = 'OP-2025-050';
  SELECT id INTO order_048_id FROM public.production_orders WHERE order_number = 'OP-2025-048';
  
  SELECT id INTO routing_049_10_id FROM public.production_routing WHERE order_id = order_049_id AND sequence = 10;
  SELECT id INTO routing_050_20_id FROM public.production_routing WHERE order_id = order_050_id AND sequence = 20;
  SELECT id INTO routing_048_5_id FROM public.production_routing WHERE order_id = order_048_id AND sequence = 5;
  
  -- 5. Insertar scrap con relaciones
  INSERT INTO public.production_scrap (quantity, defect_type, defect_notes, operator_name, disposition, created_at, order_id, routing_id)
  VALUES
    (3, 'Surface Scratch', 'Rayado superficial en cara frontal', 'Juan Pérez', 'Pending', NOW() - INTERVAL '2 days', order_049_id, routing_049_10_id),
    (2, 'Out of Tolerance', 'Dimensión fuera de tolerancia', 'María García', 'Pending', NOW() - INTERVAL '1 day', order_050_id, routing_050_20_id),
    (5, 'Porosity', 'Porosidad en fundición', 'Pedro Sánchez', 'Approved', NOW() - INTERVAL '3 days', order_048_id, routing_048_5_id),
    (1, 'Damaged Thread', 'Rosca dañada', 'Luis Hernández', 'Rejected', NOW() - INTERVAL '4 hours', order_049_id, routing_049_10_id),
    (4, 'Irregular Finish', 'Acabado irregular', 'Juan Pérez', 'Pending', NOW() - INTERVAL '5 hours', order_050_id, routing_050_20_id),
    (2, 'Material Issue', 'Material con defectos', 'Ana Martínez', 'Pending', NOW() - INTERVAL '1 hour', order_048_id, routing_048_5_id);
END $$;

-- 6. Verificar datos insertados con relaciones
SELECT 
  ps.id,
  ps.quantity,
  ps.defect_type,
  ps.disposition,
  po.order_number,
  pr.operation_name,
  pr.sequence
FROM public.production_scrap ps
LEFT JOIN public.production_orders po ON ps.order_id = po.id
LEFT JOIN public.production_routing pr ON ps.routing_id = pr.id
ORDER BY ps.created_at DESC;

-- 7. Contar registros
SELECT 
  'production_scrap' AS table_name,
  COUNT(*) AS row_count
FROM public.production_scrap
UNION ALL
SELECT 
  'production_orders' AS table_name,
  COUNT(*) AS row_count
FROM public.production_orders
UNION ALL
SELECT 
  'production_routing' AS table_name,
  COUNT(*) AS row_count
FROM public.production_routing;
