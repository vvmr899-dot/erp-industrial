import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Loader2, Search, Factory } from 'lucide-react';

const ProductionWIP = ({ userRole }) => {
  const isReadOnly = userRole === 'calidad';
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [wipSteps, setWipSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      fetchWIP(selectedOrderId);
    } else {
      setWipSteps([]);
    }
  }, [selectedOrderId]);

  const fetchActiveOrders = async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('production_orders')
      .select('id, order_number, status, is_active, quantity_planned, part_numbers(part_number)')
      .in('status', ['Liberada', 'En Proceso'])
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (err) {
      setError("Error al cargar órdenes: " + err.message);
    } else if (data) {
      setOrders(data);
    }
  };

  const fetchWIP = async (orderId) => {
    if (!orderId) {
      setWipSteps([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('production_wip_balance')
      .select('*')
      .eq('production_order_id', orderId)
      .order('operation_sequence');
    
    if (err) {
      setError("Error al cargar WIP: " + err.message);
    } else if (data) {
      setWipSteps(data);
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Trazabilidad de Piso (WIP)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitoreo en tiempo real de unidades en cada estación de trabajo.</p>
        </div>
      </header>

      <div className="card-mesh" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Filtrar por Orden de Producción Activa</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={selectedOrderId} 
                onChange={(e) => setSelectedOrderId(e.target.value)}
                style={{ paddingLeft: '2.5rem', height: '3rem' }}
              >
                <option value="">-- Todas las órdenes en proceso --</option>
                 {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} {o.status}
                  </option>
                ))}
              </select>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <button className="btn" style={{ height: '3rem', padding: '0 1.5rem' }} onClick={() => fetchWIP(selectedOrderId)}>
            Actualizar Datos
          </button>
        </div>
      </div>

      {!selectedOrderId ? (
        <div className="card-mesh" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
           <Factory size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
           <h2>Selecciona una orden para ver su flujo</h2>
           <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0.5rem auto' }}>
             El sistema mostrará el inventario en proceso (WIP) distribuido a lo largo de toda la ruta de manufactura.
           </p>
        </div>
      ) : (
        <div className="wip-container">
          {error && (
            <div className="card-mesh" style={{ borderLeft: '4px solid var(--danger)', marginBottom: '1rem', color: 'var(--danger)' }}>
               {error}
            </div>
          )}
          {selectedOrderId && orders.find(o => o.id === selectedOrderId) && (
            <div className="card-mesh" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', padding: '1rem 2rem', background: 'rgba(99, 102, 241, 0.05)' }}>
               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '800' }}>ORDEN ACTIVA</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{orders.find(o => o.id === selectedOrderId)?.order_number}</div>
               </div>
               <div style={{ flex: 2 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>PRODUCTO</div>
                  <div style={{ fontWeight: '600' }}>{orders.find(o => o.id === selectedOrderId)?.part_numbers?.part_number}</div>
               </div>
               <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>META</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{orders.find(o => o.id === selectedOrderId)?.quantity_planned} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PCS</span></div>
               </div>
            </div>
          )}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
          ) : (
            <>
              {/* Visual Flow Header */}
              <div className="card-mesh" style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                   <h3 style={{ fontSize: '1rem' }}>Perfil de Inventario en Ruta</h3>
                   <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></div> En Proceso</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></div> Terminado</span>
                   </div>
                </div>
                <div style={{ height: '40px', display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    {wipSteps.map(step => {
                      const total = wipSteps.reduce((acc, s) => acc + (s.quantity_available + s.quantity_in_process + (s.quantity_completed || 0)), 0);
                      const stepTotal = step.quantity_available + step.quantity_in_process + (step.quantity_completed || 0);
                      const width = total > 0 ? (stepTotal / total) * 100 : 0;
                      return (
                        <div key={step.id} style={{ width: `${width}%`, height: '100%', background: 'var(--primary)', opacity: 0.3 + (width/100), transition: 'width 0.5s ease' }} title={`Step ${step.operation_sequence}: ${stepTotal} units`} />
                      );
                    })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {wipSteps.length === 0 && !loading && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron estaciones configuradas para esta orden.
                  </div>
                )}
                {wipSteps.map((step, index) => {
                  const isBottleneck = step.quantity_available > 50; // Simple threshold for demo
                  return (
                    <div key={step.id} className="card-mesh" style={{ 
                      position: 'relative', 
                      borderTop: isBottleneck ? '4px solid var(--danger)' : '1px solid var(--border)',
                      background: isBottleneck ? 'rgba(244, 63, 94, 0.02)' : 'var(--card)'
                    }}>
                      {isBottleneck && (
                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: '800' }}>
                          <AlertTriangle size={14} /> CUELLO DE BOTELLA
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>
                            {step.operation_sequence}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{step.operation_name}</h3>
                              <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: step.status === 'Completada' ? 'rgba(16, 185, 129, 0.1)' : step.status === 'En Proceso' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)', color: step.status === 'Completada' ? 'var(--accent)' : step.status === 'En Proceso' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '800' }}>
                                {step.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{step.machine_area || 'Área General'}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="wip-stat-card">
                          <label>Disponible</label>
                          <div className="value">{step.quantity_available}</div>
                          <div className="bar"><div style={{ width: `${Math.min(100, (step.quantity_available/orders.find(o => o.id === selectedOrderId)?.quantity_planned)*100)}%`, background: 'var(--text-muted)' }}></div></div>
                        </div>
                        <div className="wip-stat-card">
                          <label style={{ color: 'var(--primary)' }}>En Proceso</label>
                          <div className="value" style={{ color: 'var(--primary)' }}>{step.quantity_in_process || 0}</div>
                          <div className="bar"><div style={{ width: `${Math.min(100, (step.quantity_in_process/(orders.find(o => o.id === selectedOrderId)?.quantity_planned || 1))*100)}%`, background: 'var(--primary)' }}></div></div>
                        </div>
                        <div className="wip-stat-card">
                          <label style={{ color: 'var(--accent)' }}>Terminado</label>
                          <div className="value" style={{ color: 'var(--accent)' }}>{step.quantity_completed || 0}</div>
                        </div>
                        <div className="wip-stat-card">
                          <label style={{ color: 'var(--danger)' }}>Scrap</label>
                          <div className="value" style={{ color: 'var(--danger)' }}>{step.quantity_scrapped || 0}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .wip-stat-card {
          background: rgba(255,255,255,0.02);
          padding: 0.75rem;
          border-radius: 0.5rem;
        }
        .wip-stat-card label {
          display: block;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }
        .wip-stat-card .value {
          font-size: 1.25rem;
          font-weight: 800;
        }
        .wip-stat-card .bar {
          height: 3px;
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
          margin-top: 0.5rem;
          overflow: hidden;
        }
        .wip-stat-card .bar div {
          height: 100%;
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default ProductionWIP;
