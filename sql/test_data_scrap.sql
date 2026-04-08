-- =====================================================
-- DATOS DE PRUEBA - production_scrap
-- Ejecute este SQL en Supabase (SQL Editor)
-- =====================================================

-- Insertar datos de prueba en production_scrap
INSERT INTO public.production_scrap (id, quantity, defect_type, defect_notes, operator_name, disposition, created_at, updated_at, order_id, routing_id) 
VALUES
  (gen_random_uuid(), 3, 'Surface Scratch', 'Rayado superficial en cara frontal', 'Juan Pérez', 'Pending', NOW() - INTERVAL '2 days', NOW(), NULL, NULL),
  (gen_random_uuid(), 2, 'Out of Tolerance', 'Dimensión fuera de tolerancia', 'María García', 'Pending', NOW() - INTERVAL '1 day', NOW(), NULL, NULL),
  (gen_random_uuid(), 5, 'Porosity', 'Porosidad en fundición', 'Pedro Sánchez', 'Approved', NOW() - INTERVAL '3 days', NOW(), NULL, NULL),
  (gen_random_uuid(), 1, 'Damaged Thread', 'Rosca dañada', 'Luis Hernández', 'Rejected', NOW() - INTERVAL '4 hours', NOW(), NULL, NULL),
  (gen_random_uuid(), 4, 'Irregular Finish', 'Acabado irregular', 'Juan Pérez', 'Pending', NOW() - INTERVAL '5 hours', NOW(), NULL, NULL),
  (gen_random_uuid(), 2, 'Material Issue', 'Material con defectos', 'Ana Martínez', 'Pending', NOW() - INTERVAL '1 hour', NOW(), NULL, NULL);

-- Verificar los datos insertados
SELECT * FROM public.production_scrap ORDER BY created_at DESC;
