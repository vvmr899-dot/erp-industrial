-- INSERTAR RECHAZO DE PRUEBA
INSERT INTO public.production_scrap (
  production_order_id,
  routing_id,
  defect_type,
  quantity,
  operator_name,
  defect_comment,
  lot_number,
  status
)
SELECT 
  id,
  NULL,
  'Prueba Rechazo',
  5,
  'TEST_USER',
  'Rechazo de prueba para verificar alerta',
  'LOTE-TEST-001',
  'RECHAZADO'
FROM public.production_orders 
WHERE is_active = true 
LIMIT 1;
