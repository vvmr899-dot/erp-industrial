import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/translations';
import { 
  ClipboardCheck, 
  User, 
  Clock, 
  AlertCircle, 
  Save, 
  Loader2, 
  ArrowRight,
  Layers,
  Settings,
  Database,
  Activity,
  CheckCircle2,
  Package,
  TrendingUp,
  Cpu,
  Edit3,
  Trash2,
  X,
  RefreshCcw
} from 'lucide-react';

const ProductionCapture = ({ userRole }) => {
  const { t } = useLanguage();
  const DEBUG = import.meta.env.DEV;
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [wipSteps, setWipSteps] = useState([]);
  const [allRouteSteps, setAllRouteSteps] = useState([]);
  const [selectedStepId, setSelectedStepId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [completedQty, setCompletedQty] = useState(0);
  const [toast, setToast] = useState(null);
  const [operators, setOperators] = useState([]);
  const [showOperatorDropdown, setShowOperatorDropdown] = useState(false);
  
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnQty, setReturnQty] = useState(0);
  const [operationHistory, setOperationHistory] = useState([]);
  const [selectedLogForAdjustment, setSelectedLogForAdjustment] = useState(null);
  
  const [formData, setFormData] = useState({
    operator_name: '',
    shift: '1er Turno',
    quantity_good: '',
    quantity_bad: '',
    defect_type: '',
    defect_notes: '',
    lot_number: '',
    is_rework: false,
    adjustment_comment: ''
  });

  const [adjustmentData, setAdjustmentData] = useState({
    new_quantity: 0,
    adjustment_reason: '',
    adjustment_notes: ''
  });

  useEffect(() => {
    fetchActiveOrders();
    fetchOperators();
  }, []);

  useEffect(() => {
    if (!selectedOrderId) return;

    const selectedOrder = orders.find(o => o.id === selectedOrderId);
    if (!selectedOrder?.part_number_id) return;

    const partNumberId = selectedOrder.part_number_id;

    const channel = supabase
      .channel('production-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_routing',
          filter: `part_number_id=eq.${partNumberId}`
        },
        async (payload) => {
          if (DEBUG) console.log('[Realtime] Cambio en routing:', payload.eventType, payload);
          
          setSelectedStepId('');
          
          await fetchWIP(selectedOrderId);
          await fetchOrderDetails(selectedOrderId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_wip_balance'
        },
        async (payload) => {
          if (payload.new?.production_order_id === selectedOrderId || 
              payload.old?.production_order_id === selectedOrderId) {
            if (DEBUG) console.log('[Realtime] Cambio en WIP:', payload.eventType, payload);
            await fetchWIP(selectedOrderId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'production_operation_log',
          filter: `production_order_id=eq.${selectedOrderId}`
        },
        async (payload) => {
          if (DEBUG) console.log('[Realtime] Nueva captura:', payload.new);
          await fetchWIP(selectedOrderId);
          await fetchOrderDetails(selectedOrderId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedOrderId, orders]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchWIP(selectedOrderId);
      fetchOrderDetails(selectedOrderId);
      setSelectedStepId('');
    }
  }, [selectedOrderId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showOperatorDropdown && !e.target.closest('.operator-dropdown')) {
        setShowOperatorDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showOperatorDropdown]);

  const fetchActiveOrders = async () => {
    const { data } = await supabase
      .from('production_orders')
      .select('id, order_number, part_number_id, quantity_planned, created_at, part_numbers(part_number, description)')
      .in('status', ['Liberada', 'En Proceso'])
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchOperators = async () => {
    const { data } = await supabase
      .from('personal')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre');
    if (data) setOperators(data);
  };

  const fetchOrderDetails = async (orderId) => {
    const selectedOrder = orders.find(o => o.id === orderId);
    if (!selectedOrder) return;

    // "Completado" debe reflejar lo que existe en inventario (producto terminado)
    // para el numero de parte de la orden.
    const partNumberId = selectedOrder.part_number_id;
    if (!partNumberId) {
      setCompletedQty(0);
      return;
    }

    const { data: stockRow, error: stockErr } = await supabase
      .from('inventory_stock')
      .select('quantity')
      .eq('part_number_id', partNumberId)
      .single();

    if (stockErr) {
      // PGRST116 = No rows found
      if (stockErr.code === 'PGRST116') {
        setCompletedQty(0);
      } else {
        console.error('Error fetching inventory_stock for completed qty:', stockErr);
        setCompletedQty(0);
      }
      return;
    }

    setCompletedQty(parseFloat(stockRow?.quantity) || 0);
  };

  const handleSyncRoute = async () => {
    if (!selectedOrderId || loading) return;
    try {
      setSelectedStepId('');
      await fetchActiveOrders();
      await fetchWIP(selectedOrderId);
      await fetchOrderDetails(selectedOrderId);
      setToast({ type: 'success', message: t.routeSynced || 'Ruta sincronizada correctamente' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      if (DEBUG) console.error('[handleSyncRoute] Error:', err);
      setToast({ type: 'error', message: (t.transactionError || 'Error en la transacción: ') + (err?.message || 'Error') });
      setTimeout(() => setToast(null), 3000);
    }
  };

const fetchWIP = async (orderId) => {
    setLoading(true);
    if (DEBUG) console.log('[fetchWIP] Iniciando para orderId:', orderId);
    
    const { data: orderData } = await supabase
      .from('production_orders')
      .select('id, part_number_id')
      .eq('id', orderId)
      .single();
    
    if (!orderData) {
      setLoading(false);
      return;
    }
    
    if (DEBUG) console.log('[fetchWIP] Order part_number_id:', orderData.part_number_id);
    
    const { data: routingData } = await supabase
      .from('production_routing')
      .select('id, sequence, sequence_base, sequence_sub, sequence_str, operation_name, machine_area, work_center, is_final_operation')
      .eq('part_number_id', orderData.part_number_id)
      // Mantener consistencia con el modulo de Rutas: solo operaciones activas
      .or('active.is.null,active.eq.true')
      .order('sequence_base', { nullsFirst: false })
      .order('sequence_sub', { nullsFirst: true })
      .order('sequence', { nullsFirst: false });
    
    if (DEBUG) console.log('[fetchWIP] Routing actual desde DB:', routingData?.length, routingData?.map(r => r.operation_name));
    
    const routingIds = routingData ? routingData.map(r => r.id) : [];
    
    const { data: wipData } = await supabase
      .from('production_wip_balance')
      .select('*')
      .eq('production_order_id', orderId);
    
    if (DEBUG) console.log('[fetchWIP] WIP actual en BD:', wipData?.length);
    
    const orphanedWip = [];
    const validWip = [];
    
    if (wipData) {
      wipData.forEach(w => { 
        if (routingIds.includes(w.routing_id)) {
          validWip.push(w);
        } else {
          orphanedWip.push(w.id);
        }
      });
    }
    
    if (orphanedWip.length > 0) {
      if (DEBUG) console.log('[fetchWIP] Limpiando entradas WIP huérfanas:', orphanedWip);
      await supabase
        .from('production_wip_balance')
        .delete()
        .in('id', orphanedWip);
    }
    
    const wipMap = {};
    validWip.forEach(w => { wipMap[w.routing_id] = w; });
    
    if (routingData && routingData.length > 0) {
      const merged = routingData.map(r => {
        const existingWip = wipMap[r.id];
        if (existingWip) {
          return {
            ...existingWip,
            operation_name: r.operation_name,
            machine_area: r.machine_area,
            work_center: r.work_center,
            is_final_operation: r.is_final_operation,
            sequence_base: r.sequence_base,
            sequence_sub: r.sequence_sub,
            sequence_str: r.sequence_str,
            operation_sequence: r.sequence
          };
        }
        return {
          id: `new-${r.id}`,
          production_order_id: orderId,
          routing_id: r.id,
          quantity_available: 0,
          quantity_in_process: 0,
          status: 'Pendiente',
          ...r
        };
      });
      
      if (DEBUG) console.log('[fetchWIP] Resultado final merged:', merged.length, merged.map(s => ({ id: s.id, name: s.operation_name })));
      setWipSteps(merged);
    } else {
      setWipSteps([]);
      if (DEBUG) console.log('[fetchWIP] No hay rutas, WIP limpiado');
    }
    setLoading(false);
  };

  const fetchOperationHistory = async (orderId, stepId) => {
    setLoading(true);
    const { data } = await supabase
      .from('production_operation_log')
      .select('*')
      .eq('production_order_id', orderId)
      .eq('routing_id', stepId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setOperationHistory(data);
    }
    setLoading(false);
  };

  const handleOpenHistory = async () => {
    if (!selectedOrderId || !selectedStepId) return;
    await fetchOperationHistory(selectedOrderId, selectedStepId);
    setShowHistoryModal(true);
  };

  const handleOpenAdjustment = (log) => {
    setSelectedLogForAdjustment(log);
    setAdjustmentData({
      new_quantity: log.quantity_reported,
      adjustment_reason: '',
      adjustment_notes: ''
    });
    setShowAdjustmentModal(true);
  };

  const handleSaveAdjustment = async () => {
    if (!selectedLogForAdjustment) return;

    const qtyDiff = adjustmentData.new_quantity - selectedLogForAdjustment.quantity_reported;
    
    if (!adjustmentData.adjustment_reason) {
      alert('Por favor selecciona un motivo de ajuste');
      return;
    }

    if (!adjustmentData.adjustment_notes || adjustmentData.adjustment_notes.trim() === '') {
      alert('Por favor ingresa una descripción del ajuste');
      return;
    }

    setSubmitting(true);
    try {
      const { error: errLog } = await supabase.from('production_operation_log').insert({
        production_order_id: selectedLogForAdjustment.production_order_id,
        routing_id: selectedLogForAdjustment.routing_id,
        operator_name: adjustmentData.adjustment_reason,
        shift: 'AJUSTE',
        quantity_reported: qtyDiff,
        quantity_good: qtyDiff > 0 ? qtyDiff : 0,
        quantity_defects: qtyDiff < 0 ? Math.abs(qtyDiff) : 0,
        defect_notes: `AJUSTE - ${adjustmentData.adjustment_reason}: ${adjustmentData.adjustment_notes}`,
        is_rework: false,
        is_adjustment: true,
        original_log_id: selectedLogForAdjustment.id
      });

      if (errLog) throw new Error(errLog.message);

      alert('Ajuste aplicado correctamente');
      setShowAdjustmentModal(false);
      setSelectedLogForAdjustment(null);
      fetchWIP(selectedOrderId);
      fetchOrderDetails(selectedOrderId);
      if (selectedStepId) {
        fetchOperationHistory(selectedOrderId, selectedStepId);
      }

    } catch (err) {
      console.error(err);
      alert("Error en el ajuste: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const currentStep = wipSteps.find(s => s.id === selectedStepId);
  const fqcStep = wipSteps.find(s => s.operation_name?.toUpperCase().includes('FQC'));
  
  let captureRestricted = false;
  let captureRestrictionMessage = "";
  let captureRestrictionBadge = "";

  if (currentStep) {
    const isAdmin = userRole === 'admin' || userRole === 'administrador';
    if (!isAdmin) {
      const isFQC = currentStep.operation_name?.toUpperCase().includes('FQC');
      let isBeforeFQC = false;
      if (fqcStep) {
        const curVal = (currentStep.sequence_base ?? currentStep.operation_sequence) + ((currentStep.sequence_sub || 0) / 100);
        const fqcVal = (fqcStep.sequence_base ?? fqcStep.operation_sequence) + ((fqcStep.sequence_sub || 0) / 100);
        isBeforeFQC = curVal < fqcVal;
      }
      const phase = isFQC ? 'FQC' : ((isBeforeFQC || !fqcStep) ? 'BEFORE' : 'AFTER');

      if (phase === 'FQC') {
         if (userRole !== 'admin' && userRole !== 'administrador' && userRole !== 'calidad') {
            captureRestricted = true;
            captureRestrictionMessage = "Operación FQC Restringida: Solo Admin o Calidad pueden liberar en esta estación.";
            captureRestrictionBadge = "ESPERANDO LIBERACIÓN";
         }
      } else if (phase === 'BEFORE') {
         if (userRole !== 'operador' && userRole !== 'supervisor') {
            captureRestricted = true;
            captureRestrictionMessage = "Operación Restringida: Solo Operador y Supervisor pueden capturar en las estaciones previas a FQC.";
            captureRestrictionBadge = "ACCIÓN NO PERMITIDA";
         }
      } else if (phase === 'AFTER') {
         if (userRole !== 'almacen') {
            captureRestricted = true;
            captureRestrictionMessage = "Operación Restringida: Solo Almacén tiene acceso para la captura en embalaje o envíos (después de FQC).";
            captureRestrictionBadge = "ESPERANDO ALMACÉN";
         }
      }
    }
  }

  const totalAvailableForCapture = currentStep ? (parseFloat(currentStep.quantity_available) + parseFloat(currentStep.quantity_in_process)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitting(true);

    try {
      if (!currentStep) return;

      if (captureRestricted) {
        alert(captureRestrictionMessage);
        return;
      }

      const good = parseFloat(formData.quantity_good) || 0;
      const bad = parseFloat(formData.quantity_bad) || 0;
      const total = good + bad;

      if (total > totalAvailableForCapture) {
        alert(`No hay suficiente WIP disponible. Total disponible (Disp + Proc): ${totalAvailableForCapture} piezas.`);
        return;
      }

      if (bad > 0 && (!formData.lot_number || formData.lot_number.trim() === '')) {
        alert('Por favor especifica el Lote o Secuencia de Lote de las piezas rechazadas.');
        return;
      }

      const { data: opLog, error: errLog } = await supabase
        .from('production_operation_log')
        .insert({
          production_order_id: selectedOrderId,
          routing_id: currentStep.routing_id,
          operator_name: formData.operator_name,
          shift: formData.shift,
          quantity_reported: total,
          quantity_good: good,
          quantity_defects: bad,
          defect_type: formData.defect_type,
          defect_notes: formData.defect_notes,
          lot_number: formData.lot_number,
          is_rework: formData.is_rework
        })
        .select('id, created_at')
        .single();

      if (errLog) throw new Error(errLog.message);

      // Si hay piezas buenas y es ENVIO, el trigger de la base de datos
      // (trg_update_inventory_on_envio) maneja automáticamente el movimiento a inventario.
      // No agregar lógica adicional aquí para evitar duplicación.
      if (good > 0 && currentStep?.operation_name?.toUpperCase().includes('ENVIO')) {
        if (DEBUG) console.log('[ENVIO] Piezas buenas:', good, '- El trigger de BD actualizará el inventario');
      }

      if (!currentStep) {
        throw new Error('No se encontró la operación actual');
      }

      const isActualFQC = currentStep?.operation_name?.toUpperCase().includes('FQC');

      const hasRecentDuplicateScrap = async ({
        productionOrderId,
        routingId,
        quantity,
        operatorName,
        lotNumber,
        status,
        defectType,
        sinceISO,
      }) => {
        const base = supabase
          .from('production_scrap')
          .select('id')
          .eq('production_order_id', productionOrderId)
          .eq('routing_id', routingId)
          .eq('quantity', quantity)
          .eq('operator_name', operatorName)
          .eq('status', status)
          .gte('created_at', sinceISO)
          .limit(1);

        // Intento 1: match estricto (incluye lote y tipo)
        let q1 = base;
        if (lotNumber) q1 = q1.eq('lot_number', lotNumber);
        if (defectType) q1 = q1.eq('defect_type', defectType);

        const { data: d1, error: e1 } = await q1;
        if (e1) throw e1;
        if ((d1 || []).length > 0) return true;

        // Intento 2: match laxo (por si un trigger guarda campos diferentes)
        const { data: d2, error: e2 } = await base;
        if (e2) throw e2;
        return (d2 || []).length > 0;
      };

      // Si se reportaron piezas con defectos, las registramos en Calidad (production_scrap)
      if (bad > 0) {
        const defectType = formData.defect_type || (isActualFQC ? 'FQC Rechazo' : 'Pendiente de clasificar');
        const status = isActualFQC ? 'RECHAZADO' : 'Pendiente';
        const sinceISO = opLog?.created_at
          ? new Date(new Date(opLog.created_at).getTime() - 5000).toISOString()
          : new Date(Date.now() - 5000).toISOString();

        // Si la BD ya creo el scrap via trigger (o hubo doble submit), evitamos duplicar.
        const dup = await hasRecentDuplicateScrap({
          productionOrderId: selectedOrderId,
          routingId: currentStep.routing_id,
          quantity: bad,
          operatorName: formData.operator_name,
          lotNumber: formData.lot_number,
          status,
          defectType,
          sinceISO,
        });

        if (!dup) {
          await supabase.from('production_scrap').insert({
            production_order_id: selectedOrderId,
            routing_id: currentStep.routing_id,
            defect_type: defectType,
            quantity: bad,
            operator_name: formData.operator_name,
            defect_comment: formData.defect_notes,
            lot_number: formData.lot_number,
            status,
          });
        }
      }

      // Si es FQC y hay piezas buenas, generamos el registro de "Aprobado" para alimentar las métricas de calidad
      if (isActualFQC && good > 0) {
        const generatedLot = new Date().toISOString().slice(2,10).replace(/-/g,'') + '01';
        const lotNumber = formData.lot_number || generatedLot;
        const sinceISO = opLog?.created_at
          ? new Date(new Date(opLog.created_at).getTime() - 5000).toISOString()
          : new Date(Date.now() - 5000).toISOString();

        const dup = await hasRecentDuplicateScrap({
          productionOrderId: selectedOrderId,
          routingId: currentStep.routing_id,
          quantity: good,
          operatorName: formData.operator_name,
          lotNumber,
          status: 'APROBADO',
          defectType: 'N/A',
          sinceISO,
        });

        if (!dup) {
          await supabase.from('production_scrap').insert({
            production_order_id: selectedOrderId,
            routing_id: currentStep.routing_id,
            defect_type: 'N/A',
            quantity: good,
            operator_name: formData.operator_name,
            defect_comment: formData.adjustment_comment || 'Inspección FQC - Liberación Directa',
            lot_number: lotNumber,
            status: 'APROBADO',
          });
        }
      }

      setFormData({ ...formData, quantity_good: '', quantity_bad: '', defect_comment: '', adjustment_comment: '', lot_number: '' });
      fetchWIP(selectedOrderId);
      fetchOrderDetails(selectedOrderId);
      setToast({ type: 'success', message: 'Transacción completada exitosamente.' });
      setTimeout(() => setToast(null), 3000);

    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Error en la transacción: ' + err.message });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleReturnWIP = async () => {
    if (!selectedOrderId || !selectedStepId || returnQty <= 0) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('fn_return_wip', {
        p_order_id: selectedOrderId,
        p_routing_id: currentStep.routing_id,
        p_quantity: returnQty,
        p_operator: formData.operator_name || 'ADMIN'
      });

      if (error) throw error;

      alert(`Se han regresado ${returnQty} piezas a la operación anterior.`);
      setShowReturnModal(false);
      setReturnQty(0);
      fetchWIP(selectedOrderId);
      fetchOrderDetails(selectedOrderId);
    } catch (err) {
      console.error(err);
      alert("Error al regresar WIP: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cardStyle = {
    background: 'var(--card)',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid var(--border)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '1rem'
  };

  const labelStyle = {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    fontWeight: '500'
  };

  const valueStyle = {
    fontSize: '1rem',
    color: 'var(--text)',
    fontWeight: '700',
    textAlign: 'right'
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text)',
    marginBottom: '1.25rem'
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text)', marginBottom: '0.5rem' }}>Captura de Producción</h1>
        <p style={{ color: 'var(--text-muted)' }}>Terminal de piso para reporte de operaciones y control de WIP.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* TOP ROW: SELECTION & FORM */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* SELECTION */}
          <section>
            <div style={sectionHeaderStyle}>
              <Layers size={22} color="var(--primary)" />
              1. Selección de Trabajo
            </div>

            <div className="card-mesh" style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ ...labelStyle, marginBottom: '0.5rem', display: 'block' }}>{t.productionOrder}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    value={selectedOrderId} 
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                  >
                    <option value="">-- Buscar Orden --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.order_number} - {o.part_numbers?.part_number}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSyncRoute}
                    disabled={!selectedOrderId || loading}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: !selectedOrderId || loading ? '#1f2937' : 'rgba(99, 102, 241, 0.16)',
                      color: !selectedOrderId || loading ? 'var(--text-muted)' : 'var(--text)',
                      cursor: !selectedOrderId || loading ? 'not-allowed' : 'pointer',
                      opacity: !selectedOrderId || loading ? 0.7 : 1,
                    }}
                    title={t.syncRoute || 'Sincronizar ruta'}
                  >
                    <RefreshCcw size={18} />
                  </button>
                </div>
              </div>

              {selectedOrderId && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={labelStyle}>Producto:</span>
                    <span style={valueStyle}>{selectedOrder?.part_numbers?.part_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={labelStyle}>Planeado:</span>
                    <span style={valueStyle}>{selectedOrder?.quantity_planned}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={labelStyle}>Completado:</span>
                    <span style={{ ...valueStyle, color: '#10b981' }}>{completedQty}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={labelStyle}>Lote:</span>
                    <span style={valueStyle}>{new Date(selectedOrder?.created_at || Date.now()).toISOString().slice(2,10).replace(/-/g,'')}01</span>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label style={{ ...labelStyle, marginBottom: '0.5rem', display: 'block' }}>Operación Activa</label>
                <select 
                  value={selectedStepId} 
                  onChange={(e) => setSelectedStepId(e.target.value)}
                  disabled={!selectedOrderId}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                >
                  <option value="">-- Seleccionar Operación --</option>
                  {wipSteps.map(s => (
                    <option key={s.id} value={s.id}>
                    OP {s.sequence_str || s.operation_sequence} - {s.operation_name} ({parseFloat(s.quantity_available) + parseFloat(s.quantity_in_process)} disp)
                  </option>
                  ))}
                </select>
              </div>

              {currentStep && (
                <div style={{ ...cardStyle, background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--primary)', marginTop: '1rem', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <span style={{ ...labelStyle, color: 'var(--primary)' }}>Máquina/Área:</span>
                    <span style={{ ...valueStyle, color: 'var(--primary)' }}>{currentStep.machine_area || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...labelStyle, color: 'var(--primary)' }}>WIP Disponible:</span>
                    <span style={{ ...valueStyle, fontSize: '1.25rem', color: 'var(--primary)' }}>{totalAvailableForCapture}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* CAPTURE FORM (RIGHT SIDE) */}
          <section>
            <div style={sectionHeaderStyle}>
              <Activity size={22} color="var(--accent)" />
              2. Captura de Avance
            </div>

            {selectedStepId ? (
              <div className="card-mesh" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit}>
                  {captureRestricted && (
                    <div style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid var(--danger)', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      marginBottom: '1.5rem',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}>
                      <AlertCircle size={20} color="var(--danger)" />
                      <div style={{ fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 600 }}>
                        {captureRestrictionMessage}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label style={labelStyle}>Operador</label>
                      <div className="operator-dropdown" style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                        <input 
                          type="text" 
                          required 
                          placeholder="Selecciona un operador..."
                          value={formData.operator_name}
                          onClick={() => setShowOperatorDropdown(!showOperatorDropdown)}
                          readOnly
                          style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)', cursor: 'pointer' }}
                        />
                        {showOperatorDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#1a1a2e',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            marginTop: '4px'
                          }}>
                            {operators.map(op => (
                              <div 
                                key={op.id}
                                onClick={() => {
                                  setFormData({...formData, operator_name: op.nombre});
                                  setShowOperatorDropdown(false);
                                }}
                                style={{
                                  padding: '0.75rem',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--border)'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.2)'}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                              >
                                {op.nombre}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={labelStyle}>Turno</label>
                      <select 
                        value={formData.shift} 
                        onChange={(e) => setFormData({...formData, shift: e.target.value})}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                      >
                        <option value="1er Turno">1er Turno</option>
                        <option value="2do Turno">2do Turno</option>
                        <option value="3er Turno">3er Turno</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="form-group">
                      <label style={{ ...labelStyle, color: '#10b981' }}>Piezas BUENAS</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        placeholder="0"
                        value={formData.quantity_good}
                        onChange={(e) => setFormData({...formData, quantity_good: e.target.value})}
                        style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', fontWeight: '800', borderRadius: '8px', border: '2px solid #10b981', background: 'rgba(16, 185, 129, 0.05)', color: '#10b981' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ ...labelStyle, color: 'var(--danger)' }}>Piezas RECHAZADAS</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        placeholder="0"
                        value={formData.quantity_bad}
                        onChange={(e) => setFormData({...formData, quantity_bad: e.target.value})}
                        style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', fontWeight: '800', borderRadius: '8px', border: '2px solid var(--danger)', background: 'rgba(244, 63, 94, 0.05)', color: 'var(--danger)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="is_rework"
                      checked={formData.is_rework} 
                      onChange={(e) => setFormData({...formData, is_rework: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="is_rework" style={{ ...labelStyle, marginBottom: 0 }}>¿Es un reproceso?</label>
                  </div>

                  {parseFloat(formData.quantity_bad) > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={labelStyle}>Tipo de Defecto</label>
                          <select 
                            value={formData.defect_type} 
                            onChange={(e) => setFormData({...formData, defect_type: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                          >
                            <option value="">-- Seleccionar --</option>
                            <option value="Dimensional">Dimensional</option>
                            <option value="Visual/Acabado">Visual/Acabado</option>
                            <option value="Material">Material</option>
                            <option value="Funcional">Funcional</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ ...labelStyle, color: 'var(--danger)' }}>Lote / Secuencia de Lote *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Ej: L-001 o Seq 1-20"
                            value={formData.lot_number}
                            onChange={(e) => setFormData({...formData, lot_number: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid var(--danger)', background: '#111827', color: 'var(--text)' }}
                          />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={labelStyle}>Notas sobre Defectos</label>
                        <textarea 
                          required
                          rows="1"
                          placeholder="Escribe el motivo..."
                          value={formData.defect_notes}
                          onChange={(e) => setFormData({...formData, defect_notes: e.target.value})}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Comentarios / Observaciones (Opcional)</label>
                    <textarea 
                      rows="2"
                      placeholder="Agregar alguna observación sobre esta captura..."
                      value={formData.adjustment_comment}
                      onChange={(e) => setFormData({...formData, adjustment_comment: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <button 
                      type="button"
                      className="btn"
                      onClick={handleOpenHistory}
                      style={{ flex: 1, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                      disabled={!selectedStepId || submitting}
                    >
                      <Clock size={16} /> Historial
                    </button>
                    <button 
                      type="button"
                      className="btn"
                      onClick={() => {
                        setReturnQty(0);
                        setShowReturnModal(true);
                      }}
                      style={{ 
                        flex: 1, 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid var(--danger)', 
                        color: 'var(--danger)',
                        opacity: (!selectedStepId || submitting || captureRestricted) ? 0.5 : 1,
                        cursor: (!selectedStepId || submitting || captureRestricted) ? 'not-allowed' : 'pointer'
                      }}
                      disabled={!selectedStepId || submitting || captureRestricted}
                    >
                      Regresar WIP
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ 
                      width: '100%', 
                      height: '3.5rem', 
                      fontSize: '1.1rem', 
                      fontWeight: '700', 
                      borderRadius: '12px',
                      opacity: captureRestricted ? 0.5 : 1,
                      cursor: captureRestricted ? 'not-allowed' : 'pointer'
                    }}
                    disabled={submitting || captureRestricted}
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : <>{captureRestricted ? <CheckCircle2 size={20} /> : <Save size={20} />} {captureRestricted ? captureRestrictionBadge : "Registrar Producción"}</>}
                  </button>
                </form>
              </div>
            ) : (
              <div className="card-mesh" style={{ padding: '4rem 2rem', textAlign: 'center', opacity: 0.5, borderStyle: 'dashed' }}>
                <Clock size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }}>Selecciona una operación para habilitar la captura.</p>
              </div>
            )}
          </section>
        </div>

        {/* BOTTOM SECTION: WIP FLOW (Full Width) */}
        <section>
          <div style={sectionHeaderStyle}>
            <TrendingUp size={22} color="var(--primary)" />
            3. Flujo WIP y Estado de la Orden
          </div>

          <div className="card-mesh" style={{ padding: '2rem' }}>
            {wipSteps.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '1.25rem' 
              }}>
                {wipSteps.map((step, idx) => {
                  const isActive = step.id === selectedStepId;
                  const qtyTotal = parseFloat(step.quantity_available) + parseFloat(step.quantity_in_process);
                  
                  return (
                    <div 
                      key={step.id}
                      onClick={() => setSelectedStepId(step.id)}
                      style={{ 
                        padding: '1.25rem', 
                        borderRadius: '12px', 
                        border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '8px', 
                          background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#fff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: '800'
                        }}>
                          {step.sequence_str || step.operation_sequence}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontWeight: '700', color: isActive ? 'var(--primary)' : 'var(--text)', fontSize: '0.9rem' }}>
                              {step.operation_name}
                            </div>
                            <span style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem', borderRadius: '4px', background: step.status === 'Completada' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', color: step.status === 'Completada' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: '800' }}>
                              {step.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {step.machine_area || 'Área general'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: qtyTotal > 0 ? 'var(--text)' : 'rgba(255,255,255,0.1)' }}>
                          {qtyTotal}
                        </div>
                        {step.is_final_operation && <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}><CheckCircle2 size={12} /> FINAL</div>}
                      </div>
                      
                      {/* Visual separator except for last */}
                      {idx < wipSteps.length - 1 && (
                        <div style={{ 
                          position: 'absolute', 
                          right: '-1.5rem', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          display: 'none' // Hide for grid layout, keep for potential flex row
                        }}>
                          <ArrowRight size={16} color="var(--border)" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <Database size={48} style={{ margin: '0 auto 1rem', opacity: 0.1 }} />
                <p>Selecciona una orden para visualizar la ruta de manufactura.</p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Modal de Historial de Capturas */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content card-mesh" style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Historial de Capturas</h2>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            {operationHistory.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay capturas registradas para esta operación.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {operationHistory.map((log, idx) => (
                  <div key={log.id || idx} style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)',
                    background: log.is_adjustment ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.02)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600' }}>
                        {log.quantity_reported > 0 ? '+' : ''}{log.quantity_reported} piezas
                        {log.is_adjustment && <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>(AJUSTE)</span>}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <strong>Operador:</strong> {log.operator_name} | <strong>Turno:</strong> {log.shift}
                    </div>
                    {log.defect_notes && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                        <strong>Notas:</strong> {log.defect_notes}
                      </div>
                    )}
                    {!log.is_adjustment && (
                      <button 
                        onClick={() => handleOpenAdjustment(log)}
                        style={{ 
                          background: 'rgba(99, 102, 241, 0.1)', 
                          border: '1px solid var(--primary)', 
                          color: 'var(--primary)',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Edit3 size={14} /> Ajustar Cantidad
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Cantidad */}
      {showAdjustmentModal && selectedLogForAdjustment && (
        <div className="modal-overlay" onClick={() => setShowAdjustmentModal(false)}>
          <div className="modal-content card-mesh" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Ajuste de Cantidad</h2>
              <button onClick={() => setShowAdjustmentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Cantidad Original:</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{selectedLogForAdjustment.quantity_reported} piezas</p>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Nueva Cantidad</label>
              <input 
                type="number"
                min="0"
                value={adjustmentData.new_quantity}
                onChange={(e) => setAdjustmentData({...adjustmentData, new_quantity: parseFloat(e.target.value) || 0})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)', fontSize: '1.25rem' }}
              />
              <p style={{ fontSize: '0.875rem', color: adjustmentData.new_quantity - selectedLogForAdjustment.quantity_reported >= 0 ? 'var(--accent)' : 'var(--danger)', marginTop: '0.5rem' }}>
                Diferencia: {adjustmentData.new_quantity - selectedLogForAdjustment.quantity_reported >= 0 ? '+' : ''}{adjustmentData.new_quantity - selectedLogForAdjustment.quantity_reported} piezas
              </p>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Motivo del Ajuste *</label>
              <select 
                value={adjustmentData.adjustment_reason}
                onChange={(e) => setAdjustmentData({...adjustmentData, adjustment_reason: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
              >
                <option value="">-- Seleccionar motivo --</option>
                <option value="Error de captura">Error de captura</option>
                <option value="Conteo físico">Conteo físico</option>
                <option value="Material dañado">Material dañado</option>
                <option value="Retrabajo">Retrabajo</option>
                <option value="Ajuste de inventario">Ajuste de inventario</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Descripción / Porque del ajuste *</label>
              <textarea 
                rows="3"
                placeholder="Explica por qué se está realizando este ajuste..."
                value={adjustmentData.adjustment_notes}
                onChange={(e) => setAdjustmentData({...adjustmentData, adjustment_notes: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setShowAdjustmentModal(false)}
                className="btn"
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAdjustment}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Aplicar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Regresar WIP */}
      {showReturnModal && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="modal-content card-mesh" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <RefreshCcw size={24} className="text-danger" /> Regresar WIP
              </h2>
              <button onClick={() => setShowReturnModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Esta acción restará WIP de la operación <strong>{currentStep?.operation_name}</strong> y lo devolverá como disponible a la operación anterior.
              </p>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Cantidad a Regresar</label>
              <input 
                type="number"
                min="1"
                max={totalAvailableForCapture}
                value={returnQty}
                onChange={(e) => setReturnQty(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)', fontSize: '1.5rem', fontWeight: '800' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Máximo permitido: {totalAvailableForCapture} piezas
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setShowReturnModal(false)}
                className="btn"
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleReturnWIP}
                className="btn btn-primary"
                style={{ flex: 1, background: 'var(--danger)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                disabled={submitting || returnQty <= 0 || returnQty > totalAvailableForCapture}
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Regreso'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontWeight: 600,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ProductionCapture;
