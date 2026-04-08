import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, ChevronDown, Calendar, Hash, Package, MoreVertical, Loader2, CheckCircle2, Trash2, RefreshCw, Edit2, Search, X } from 'lucide-react';

const ProductionOrders = ({ userRole }) => {
  const canEdit = userRole && !['calidad', 'operador'].includes(userRole.toLowerCase());
  const isReadOnly = !canEdit;
  const [orders, setOrders] = useState([]);
  const [partNumbers, setPartNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newOrder, setNewOrder] = useState({
    order_number: '',
    part_number_id: '',
    quantity_planned: '',
    start_date: new Date().toISOString().split('T')[0],
    commit_date: '',
    lot_number: ''
  });
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, order: null });

  const statuses = [
    { id: 'Planeada', label: 'Planeada', class: 'badge-planeada' },
    { id: 'Liberada', label: 'Liberada', class: 'badge-liberada' },
    { id: 'En Proceso', label: 'En Proceso', class: 'badge-proceso' },
    { id: 'Completada', label: 'Completada', class: 'badge-completada' },
    { id: 'Cerrada', label: 'Cerrada', class: 'badge-cerrada' }
  ];

  useEffect(() => {
    fetchOrders();
    fetchPartNumbers();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('production_orders')
      .select(`
        *,
        is_active,
        part_numbers (part_number, description),
        wip_balances:production_wip_balance(
          quantity_available,
          routing:production_routing(sequence, sequence_base, sequence_sub)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Supabase Error fetching orders:", error);
      // Fallback
      const { data: fallbackData } = await supabase
        .from('production_orders')
        .select('*, part_numbers(part_number, description)')
        .limit(20);
      if (fallbackData) setOrders(fallbackData.map(o => ({ ...o, progress: 0 })));
    } else if (data) {
      const enriched = data.map(order => {
        if (!order.wip_balances || order.wip_balances.length === 0) {
          return { ...order, progress: 0 };
        }
        
        if (order.status === 'Completada' || order.status === 'Cerrada') {
          return { ...order, progress: 100 };
        }

        const totalSteps = order.wip_balances.length;
        const planned = order.quantity_planned || 1;
        
        // Sequential progress logic:
        // Sum of all good pieces reported at each step.
        // A piece is "complete" for step i if it's in step i+1 or beyond.
        const steps = [...order.wip_balances].sort((a,b) => {
          const aBase = a.routing?.sequence_base ?? a.routing?.sequence ?? 0;
          const bBase = b.routing?.sequence_base ?? b.routing?.sequence ?? 0;
          if (aBase !== bBase) return aBase - bBase;
          return (a.routing?.sequence_sub ?? 0) - (b.routing?.sequence_sub ?? 0);
        });
        
        let totalOperationCompletions = 0;
        for (let i = 0; i < totalSteps; i++) {
          // Items that have finished step i are all items currently in steps > i
          // Plus items that have already finished the last operation.
          const itemsFinishedStepI = steps.slice(i + 1).reduce((acc, s) => acc + (parseFloat(s.quantity_available) || 0) + (parseFloat(s.quantity_in_process) || 0), 0);
          
          // Pieces in Step N (available + process) imply they FINISHED all steps < N.
          totalOperationCompletions += itemsFinishedStepI;
        }

        const progress = (totalOperationCompletions / (planned * totalSteps)) * 100;
        return { ...order, progress: Math.min(100, Math.round(progress)) };
      });
      setOrders(enriched);
    }
    setLoading(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.part_numbers?.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.part_numbers?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const fetchPartNumbers = async () => {
    const { data } = await supabase
      .from('part_numbers')
      .select('id, part_number, description')
      .eq('active', true);
    if (data) setPartNumbers(data);
  };

  const generateOrderNumber = async () => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from('production_orders')
      .select('order_number')
      .like('order_number', `OP-${year}%`)
      .order('order_number', { ascending: false })
      .limit(1);
    
    let nextNum = 1;
    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].order_number.split('-')[2] || '0');
      nextNum = lastNum + 1;
    }
    return `OP-${year}-${String(nextNum).padStart(4, '0')}`;
  };

  const handleOpenNewOrder = async () => {
    setEditingOrder(null);
    const newOrderNum = await generateOrderNumber();
    setNewOrder({
      order_number: newOrderNum,
      part_number_id: '',
      quantity_planned: '',
      start_date: new Date().toISOString().split('T')[0],
      commit_date: '',
      lot_number: ''
    });
    setShowAddModal(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    
    if (!newOrder.part_number_id || !newOrder.quantity_planned) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    setSaving(true);
    
    const orderData = {
      order_number: newOrder.order_number,
      part_number_id: newOrder.part_number_id,
      quantity_planned: parseFloat(newOrder.quantity_planned),
      start_date: newOrder.start_date || null,
      commit_date: newOrder.commit_date || null,
      lot_number: newOrder.lot_number || null,
      status: editingOrder ? newOrder.status : 'Planeada'
    };

    let result;
    if (editingOrder) {
      result = await supabase
        .from('production_orders')
        .update(orderData)
        .eq('id', editingOrder.id);
    } else {
      result = await supabase
        .from('production_orders')
        .insert(orderData)
        .select();
    }

    setSaving(false);

    if (result.error) {
      alert("Error al guardar la orden: " + result.error.message);
    } else {
      alert(editingOrder ? "Orden actualizada con éxito" : "Orden creada con éxito");
      fetchOrders();
      setShowAddModal(false);
      setEditingOrder(null);
      setNewOrder({
        order_number: '',
        part_number_id: '',
        quantity_planned: '',
        start_date: new Date().toISOString().split('T')[0],
        commit_date: '',
        lot_number: ''
      });
    }
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setNewOrder({
      order_number: order.order_number,
      part_number_id: order.part_number_id,
      quantity_planned: order.quantity_planned,
      start_date: order.start_date,
      commit_date: order.commit_date,
      lot_number: order.lot_number || '',
      status: order.status
    });
    setShowAddModal(true);
  };

  const handleToggleActive = async (orderId, currentStatus) => {
    const { error } = await supabase
      .from('production_orders')
      .update({ is_active: !currentStatus })
      .eq('id', orderId);

    if (error) {
      alert("Error al actualizar el estado: " + error.message);
    } else {
      fetchOrders();
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    
    if (order?.status === 'En Proceso' && newStatus === 'Planeada') {
      alert("No se puede regresar una orden 'En Proceso' a 'Planeada'.");
      return;
    }

    const { error } = await supabase
      .from('production_orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select();

    if (error) {
      alert("Error al cambiar el estatus: " + error.message);
    } else {
      if (newStatus === 'Liberada') {
        initializeWIP(orderId);
      }
      fetchOrders();
    }
  };

  const confirmDeleteOrder = async () => {
    const order = deleteConfirm.order;
    const { error } = await supabase
      .from('production_orders')
      .delete()
      .eq('id', order.id);

    if (error) {
      alert("Error al eliminar orden: " + error.message);
    } else {
      fetchOrders();
    }
    setDeleteConfirm({ show: false, order: null });
  };

  const handleDeleteOrder = (order) => {
    setDeleteConfirm({ show: true, order });
  };

  const initializeWIP = async (orderId) => {
    const { data: order } = await supabase
      .from('production_orders')
      .select('part_number_id, quantity_planned, status')
      .eq('id', orderId)
      .single();

    if (!order) return;

    // Get the routing for that part
    const { data: routing } = await supabase
      .from('production_routing')
      .select('id, sequence')
      .eq('part_number_id', order.part_number_id)
      .order('sequence');

    if (!routing || routing.length === 0) {
      console.error("No routing found for this part number");
      return;
    }

    // Initialize WIP Balance for each routing step
    const wipBalanceEntries = routing.map((step, index) => ({
      production_order_id: orderId,
      routing_id: step.id,
      quantity_available: index === 0 ? order.quantity_planned : 0
    }));

    // Use upsert to prevent duplicates if Liberada is clicked twice
    const { error: errWip } = await supabase.from('production_wip_balance').upsert(wipBalanceEntries, { 
      onConflict: 'production_order_id,routing_id' 
    });

    if (errWip) {
      alert("Error al inicializar WIP: " + errWip.message);
      return;
    }

    // Record the initial transaction for traceability
    const { data: existingTx } = await supabase
      .from('wip_transactions')
      .select('id')
      .eq('production_order_id', orderId)
      .eq('transaction_type', 'START_ORDER')
      .limit(1);

    if (!existingTx || existingTx.length === 0) {
      const { error: errTx } = await supabase.from('wip_transactions').insert({
        production_order_id: orderId,
        routing_id: routing[0].id,
        transaction_type: 'START_ORDER',
        quantity: order.quantity_planned,
        operator_name: 'SYSTEM',
        created_at: new Date().toISOString()
      });
      if (errTx) console.error("Error recording initial transaction:", errTx.message);
    }
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1>Órdenes de Producción</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión y seguimiento de trabajos en planta.</p>
        </div>
        {!isReadOnly && (
          <button className="btn btn-primary" onClick={handleOpenNewOrder}>
            <Plus size={18} /> Nueva Orden
          </button>
        )}
      </header>

      <div className="card-mesh" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por orden o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="">Todos los estados</option>
          {statuses.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button className="btn" onClick={fetchOrders} title="Actualizar">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="card-mesh" style={{ overflowX: 'auto', padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>ORDEN</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>PRODUCTO</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>LOTE</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>CANTIDAD</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>AVANCE</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>FECHA INICIO</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>ESTADO</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  {searchTerm || statusFilter ? 'No se encontraron órdenes con los filtros aplicados.' : 'No hay órdenes registradas.'}
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>{order.order_number}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500' }}>{order.part_numbers?.part_number}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.part_numbers?.description}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {order.lot_number || '---'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{order.quantity_planned}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${order.progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', minWidth: '35px' }}>{order.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{order.start_date}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${statuses.find(s => s.id === order.status)?.class}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {isReadOnly ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Solo vista</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label 
                          className="switch" 
                          title={order.is_active ? "Orden Activa (Producción Habilitada)" : "Orden Inactiva (Producción Bloqueada)"}
                          style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}
                        >
                          <input 
                            type="checkbox" 
                            checked={order.is_active} 
                            onChange={() => handleToggleActive(order.id, order.is_active)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: order.is_active ? 'var(--primary)' : '#4b5563',
                            transition: '.4s',
                            borderRadius: '20px'
                          }}>
                            <span style={{
                              position: 'absolute',
                              height: '14px', width: '14px',
                              left: '3px', bottom: '3px',
                              backgroundColor: 'white',
                              transition: '.4s',
                              borderRadius: '50%',
                              transform: order.is_active ? 'translateX(20px)' : 'translateX(0)'
                            }}></span>
                          </span>
                        </label>
                        <select 
                          style={{ width: 'auto', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          {statuses.map(s => (
                            <option key={s.id} value={s.id} style={{ background: 'var(--bg)', color: 'white' }}>{s.label}</option>
                          ))}
                        </select>
                        <button 
                          className="icon-btn" 
                          title="Editar Orden"
                          onClick={() => handleEditClick(order)}
                          style={{ padding: '4px', color: 'var(--primary)' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="icon-btn icon-btn-danger" 
                          title="Eliminar Orden"
                          onClick={() => handleDeleteOrder(order)}
                          style={{ padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingOrder ? 'Editar Orden de Producción' : 'Nueva Orden de Producción'}</h3>
            <form onSubmit={handleSaveOrder}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Número de Orden</label>
                  <input 
                    type="text" 
                    required
                    value={newOrder.order_number}
                    onChange={(e) => setNewOrder({...newOrder, order_number: e.target.value})}
                    placeholder="OP-0001"
                  />
                </div>
                <div className="form-group">
                  <label>Cantidad Planeada</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newOrder.quantity_planned}
                    onChange={(e) => setNewOrder({...newOrder, quantity_planned: e.target.value})}
                    placeholder="100"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Seleccionar Producto</label>
                <select 
                  required
                  value={newOrder.part_number_id}
                  onChange={(e) => setNewOrder({...newOrder, part_number_id: e.target.value})}
                >
                  <option value="">-- Selecciona --</option>
                  {partNumbers.map(p => (
                    <option key={p.id} value={p.id}>{p.part_number} - {p.description}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Fecha de Inicio</label>
                  <input 
                    type="date" 
                    required
                    value={newOrder.start_date}
                    onChange={(e) => setNewOrder({...newOrder, start_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Compromiso</label>
                  <input 
                    type="date" 
                    required
                    value={newOrder.commit_date}
                    onChange={(e) => setNewOrder({...newOrder, commit_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Número de Lote</label>
                <input 
                  type="text" 
                  value={newOrder.lot_number}
                  onChange={(e) => setNewOrder({...newOrder, lot_number: e.target.value})}
                  placeholder="ej. LOTE-2024-001"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={16} /> : (editingOrder ? 'Actualizar' : 'Crear Orden')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="card-mesh" style={{ width: '400px', textAlign: 'center' }}>
            <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>¿Eliminar Orden?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              ¿Seguro que deseas eliminar la orden <strong>{deleteConfirm.order?.order_number}</strong>? Esta acción es irreversible y eliminará el historial asociado.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }} onClick={confirmDeleteOrder}>
                Sí, Eliminar
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setDeleteConfirm({ show: false, order: null })}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionOrders;
