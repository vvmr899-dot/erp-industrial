-- =====================================================
-- RENOMBRAR TABLAS DE INGLÉS A ESPAÑOL
-- =====================================================

-- Verificar tablas actuales
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Renombrar tablas principales
ALTER TABLE IF EXISTS production_orders RENAME TO ordenes_produccion;
ALTER TABLE IF EXISTS production_routing RENAME TO enrutamiento_produccion;
ALTER TABLE IF EXISTS part_numbers RENAME TO numeros_parte;
ALTER TABLE IF EXISTS production_wip_balance RENAME TO balance_wip_produccion;
ALTER TABLE IF EXISTS inventory_transactions RENAME TO transacciones_inventario;
ALTER TABLE IF EXISTS inventory_stock RENAME TO inventario_stock;
ALTER TABLE IF EXISTS production_operation_log RENAME TO log_operaciones_produccion;
ALTER TABLE IF EXISTS wip_transactions RENAME TO transacciones_wip;

-- Verificar renombrado
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
