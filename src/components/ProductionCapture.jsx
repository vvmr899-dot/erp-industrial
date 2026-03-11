import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  Cpu
} from 'lucide-react';

const ProductionCapture = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [wipSteps, setWipSteps] = useState([]);
  const [allRouteSteps, setAllRouteSteps] = useState([]); // All steps in routing
  const [selectedStepId, setSelectedStepId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedQty, setCompletedQty] = useState(0);
  
  const [formData, setFormData] = useState({
    operator_name: '',
    shift: '1er Turno',
    quantity_good: '',
    quantity_bad: '',
    defect_type: '',
    defect_notes: '',
    is_rework: false
  });

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      fetchWIP(selectedOrderId);
      fetchOrderDetails(selectedOrderId);
      setSelectedStepId('');
    }
  }, [selectedOrderId]);

  const fetchActiveOrders = async () => {
    const { data } = await supabase
      .from('production_orders')
      .select('id, order_number, part_number_id, quantity_planned, created_at, part_numbers(part_number, description)')
      .in('status', ['Liberada', 'En Proceso'])
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchOrderDetails = async (orderId) => {
    const selectedOrder = orders.find(o => o.id === orderId);
    if (!selectedOrder) return;

    // Calculate "Completado" based on actual inventory transactions
    // This allows synchronization if a record is deleted from Finished Goods
    const { data: invData, error: invErr } = await supabase
      .from('inventory_transactions')
      .select('quantity')
      .eq('production_order_id', orderId)
      .eq('transaction_type', 'FINISHED_GOODS_RECEIPT');

    if (invErr) {
      console.error("Error fetching inventory for completed qty:", invErr);
      setCompletedQty(0);
    } else {
      const total = invData?.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0) || 0;
      setCompletedQty(total);
    }
  };

  const fetchWIP = async (orderId) => {
    setLoading(true);
    // Fetch WIP balances with routing info
    const { data } = await supabase
      .from('production_wip_balance')
      .select('*')
      .eq('production_order_id', orderId);
    
    if (data) {
      const sorted = [...data].sort((a, b) => a.operation_sequence - b.operation_sequence);
      setWipSteps(sorted);
    }
    setLoading(false);
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const currentStep = wipSteps.find(s => s.id === selectedStepId);
  const totalAvailableForCapture = currentStep ? (parseFloat(currentStep.quantity_available) + parseFloat(currentStep.quantity_in_process)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentStep) return;

    const good = parseFloat(formData.quantity_good) || 0;
    const bad = parseFloat(formData.quantity_bad) || 0;
    const total = good + bad;

    if (total > totalAvailableForCapture) {
      alert(`No hay suficiente WIP disponible. Total disponible (Disp + Proc): ${totalAvailableForCapture} piezas.`);
      return;
    }


    setSubmitting(true);

    try {
      const { error: errLog } = await supabase.from('production_operation_log').insert({
        production_order_id: selectedOrderId,
        routing_id: currentStep.routing_id,
        operator_name: formData.operator_name,
        shift: formData.shift,
        quantity_reported: total,
        quantity_good: good,
        quantity_defects: bad,
        defect_type: formData.defect_type,
        defect_notes: formData.defect_notes,
        is_rework: formData.is_rework
      });

      if (errLog) throw new Error(errLog.message);

      setFormData({ ...formData, quantity_good: '', quantity_bad: '', defect_comment: '' });
      fetchWIP(selectedOrderId);
      fetchOrderDetails(selectedOrderId);
      alert('Transacción completada exitosamente.');

    } catch (err) {
      console.error(err);
      alert("Error en la transacción: " + err.message);
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
                <label style={{ ...labelStyle, marginBottom: '0.5rem', display: 'block' }}>Orden de Producción</label>
                <select 
                  value={selectedOrderId} 
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                >
                  <option value="">-- Buscar Orden --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.order_number} - {o.part_numbers?.part_number}</option>
                  ))}
                </select>
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
                      OP {s.operation_sequence} - {s.operation_name} ({parseFloat(s.quantity_available) + parseFloat(s.quantity_in_process)} disp)
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label style={labelStyle}>Operador</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          required 
                          placeholder="Nombre del operador"
                          value={formData.operator_name}
                          onChange={(e) => setFormData({...formData, operator_name: e.target.value})}
                          style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                        />
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', height: '3.5rem', fontSize: '1.1rem', fontWeight: '700', borderRadius: '12px' }}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Registrar Producción</>}
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
                          {step.operation_sequence}
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
    </div>
  );
};

export default ProductionCapture;
