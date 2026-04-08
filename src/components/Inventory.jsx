import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Package, Search, Loader2, ArrowUpRight, History,
  Trash2, X, ClipboardList, GitBranch, ArrowRightLeft, ChevronRight, Edit3
} from 'lucide-react';

/* ─── MODAL DE DETALLE ──────────────────────────────────────────── */
const ProductDetail = ({ item, onClose }) => {
  const [tab, setTab] = useState('info');
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [routing, setRouting] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!item) return;
    const partId = item.part_number_id;
    setLoadingDetail(true);

    Promise.all([
      supabase
        .from('production_orders')
        .select('order_number, quantity_planned, status, start_date, commit_date, lot_number')
        .eq('part_number_id', partId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('inventory_transactions')
        .select('transaction_type, quantity, created_at, production_orders(order_number)')
        .eq('part_number_id', partId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('production_routing')
        .select('sequence, sequence_str, sequence_base, sequence_sub, operation_name, machine_area, standard_time_minutes, setup_time_minutes, is_final_operation')
        .eq('part_number_id', partId)
        .eq('active', true)
        .order('sequence_base', { nullsFirst: false })
        .order('sequence_sub', { nullsFirst: true })
        .order('sequence', { nullsFirst: false }),
    ]).then(([o, t, r]) => {
      setOrders(o.data || []);
      setTransactions(t.data || []);
      setRouting(r.data || []);
      setLoadingDetail(false);
    });
  }, [item]);

  if (!item) return null;

  const pn = item.part_numbers;

  const statusColor = (s) => ({
    'Planeada':   { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8' },
    'Liberada':   { bg: 'rgba(59,130,246,0.1)',  color: '#60a5fa' },
    'En Proceso': { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24' },
    'Completada': { bg: 'rgba(16,185,129,0.1)',  color: '#34d399' },
    'Cerrada':    { bg: 'rgba(107,114,128,0.1)', color: '#9ca3af' },
  }[s] || { bg: 'rgba(107,114,128,0.1)', color: '#9ca3af' });

  const txLabel = (t) => ({
    'FINISHED_GOODS_RECEIPT': 'Entrada PT',
    'ADJUSTMENT':             'Ajuste',
    'SHIPMENT':               'Salida',
  }[t] || t);

  const tabs = [
    { id: 'info',         label: 'Información',  icon: Package },
    { id: 'orders',       label: 'Órdenes',       icon: ClipboardList },
    { id: 'routing',      label: 'Rutas',         icon: GitBranch },
    { id: 'transactions', label: 'Historial',     icon: ArrowRightLeft },
  ];

  return (
    <div className="modal-overlay" style={{ zIndex: 200, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div style={{
        width: '580px',
        maxWidth: '95vw',
        height: '100vh',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideInRight 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              width: '48px', height: '48px',
              background: 'rgba(16,185,129,0.1)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(16,185,129,0.3)',
              flexShrink: 0,
            }}>
              <Package size={24} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary)' }}>
                {pn?.part_number || '—'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                {pn?.description || '—'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Stock badge */}
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(16,185,129,0.05)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '2rem',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>STOCK DISPONIBLE</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent)', lineHeight: 1.2 }}>
              {item.quantity} <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>{pn?.uom || 'PCS'}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>ÚLTIMA ACTUALIZACIÓN</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text)', marginTop: '4px' }}>
              {new Date(item.last_updated).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.15)',
          flexShrink: 0,
          overflowX: 'auto',
        }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: active ? '700' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loadingDetail ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 className="animate-spin" size={28} color="var(--primary)" />
            </div>
          ) : (
            <>
              {/* INFO */}
              {tab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Código de Parte', value: pn?.part_number },
                    { label: 'Descripción',     value: pn?.description },
                    { label: 'Unidad de Medida', value: pn?.uom || 'PCS' },
                    { label: 'Estado',           value: pn?.is_active ? 'Activo' : 'Inactivo' },
                    { label: 'Stock Actual',     value: `${item.quantity} ${pn?.uom || 'PCS'}` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ÓRDENES */}
              {tab === 'orders' && (
                orders.length === 0 ? (
                  <EmptyState icon={ClipboardList} message="No hay órdenes de producción para este producto." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.map((o, i) => {
                      const sc = statusColor(o.status);
                      return (
                        <div key={i} style={{
                          padding: '1rem',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                        }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--primary)' }}>{o.order_number}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Lote: {o.lot_number || '—'} · Plan: {o.start_date || '—'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              background: sc.bg,
                              color: sc.color,
                              marginBottom: '4px',
                            }}>{o.status}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {o.quantity_planned} pcs
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* RUTAS */}
              {tab === 'routing' && (
                routing.length === 0 ? (
                  <EmptyState icon={GitBranch} message="No hay rutas configuradas para este producto." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {routing.map((r, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}>
                        {/* Línea vertical conectora */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{
                            width: '32px', height: '32px',
                            borderRadius: '50%',
                            background: r.is_final_operation ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                            border: `2px solid ${r.is_final_operation ? 'var(--accent)' : 'var(--primary)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: '800',
                            color: r.is_final_operation ? 'var(--accent)' : 'var(--primary)',
                          }}>{r.sequence_str || r.sequence}</div>
                          {i < routing.length - 1 && (
                            <div style={{ width: '2px', height: '24px', background: 'var(--border)' }} />
                          )}
                        </div>
                        <div style={{
                          flex: 1,
                          padding: '0.75rem 1rem',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          marginBottom: i < routing.length - 1 ? '0' : '0',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{r.operation_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {r.machine_area || '—'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>T. Estándar</div>
                              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary)' }}>
                                {r.standard_time_minutes} min
                              </div>
                            </div>
                          </div>
                          {r.is_final_operation && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '700' }}>
                              ✓ OPERACIÓN FINAL — ENTRADA A ALMACÉN PT
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* HISTORIAL */}
              {tab === 'transactions' && (
                transactions.length === 0 ? (
                  <EmptyState icon={ArrowRightLeft} message="No hay movimientos de inventario registrados." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {transactions.map((t, i) => {
                      const isIn = t.quantity > 0;
                      return (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          gap: '1rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: isIn ? 'var(--accent)' : 'var(--danger)',
                              flexShrink: 0,
                            }} />
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{txLabel(t.transaction_type)}</div>
                              {t.production_orders?.order_number && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  OT: {t.production_orders.order_number}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{
                              fontWeight: '800',
                              color: isIn ? 'var(--accent)' : 'var(--danger)',
                              fontSize: '1rem',
                            }}>
                              {isIn ? '+' : ''}{t.quantity}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {new Date(t.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const EmptyState = ({ icon: Icon, message }) => (
  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
    <Icon size={40} color="var(--border)" style={{ marginBottom: '1rem' }} />
    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{message}</p>
  </div>
);

/* ─── INVENTARIO PRINCIPAL ──────────────────────────────────────── */
const Inventory = ({ userRole }) => {
  const isReadOnly = userRole === 'calidad';
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    new_quantity: 0,
    adjustment_reason: '',
    adjustment_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory_stock')
      .select('*, part_numbers(id, part_number, description, uom, is_active)')
      .order('last_updated', { ascending: false });
    if (data) setStock(data);
    setLoading(false);
  };

  const handleOpenAdjustment = (item, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setAdjustmentItem(item);
    setAdjustmentData({
      new_quantity: item.quantity,
      adjustment_reason: '',
      adjustment_notes: ''
    });
    setShowAdjustmentModal(true);
  };

  const handleSaveAdjustment = async () => {
    if (!adjustmentItem) return;

    const qtyDiff = adjustmentData.new_quantity - adjustmentItem.quantity;
    
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
      // Update the inventory stock
      const { error: errStock } = await supabase
        .from('inventory_stock')
        .update({ 
          quantity: adjustmentData.new_quantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', adjustmentItem.id);

      if (errStock) throw new Error(errStock.message);

      // Record the transaction
      const { error: errTx } = await supabase
        .from('inventory_transactions')
        .insert({
          part_number_id: adjustmentItem.part_number_id,
          production_order_id: null,
          transaction_type: 'ADJUSTMENT',
          quantity: qtyDiff
        });

      if (errTx) throw new Error(errTx.message);

      alert('Ajuste aplicado correctamente');
      setShowAdjustmentModal(false);
      setAdjustmentItem(null);
      fetchInventory();

    } catch (err) {
      console.error(err);
      alert("Error en el ajuste: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteStock = async () => {
    const id = deleteConfirm.id;
    const { error } = await supabase.from('inventory_stock').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar el inventario: ' + error.message);
    } else {
      if (selectedItem?.id === id) setSelectedItem(null);
      fetchInventory();
    }
    setDeleteConfirm({ show: false, id: null });
  };

  const filteredStock = stock.filter(s =>
    s.part_numbers?.part_number?.toLowerCase().includes(filter.toLowerCase()) ||
    s.part_numbers?.description?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Almacén de Producto Terminado</h1>
          <p style={{ color: 'var(--text-muted)' }}>Disponibilidad inmediata de piezas producidas en planta.</p>
        </div>
        <button className="btn" onClick={fetchInventory}><History size={16} /> Actualizar</button>
      </header>

      <div className="card-mesh" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar por código o descripción..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ paddingLeft: '2.5rem', background: 'rgba(0,0,0,0.2)', height: '3rem' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="card-mesh" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
            <Package size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>No se detecta inventario de producto terminado aún.</p>
          </div>
        ) : (
          filteredStock.map(item => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <div
                key={item.id}
                className="card-mesh"
                style={{
                  borderLeft: `3px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onClick={() => setSelectedItem(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    background: 'rgba(16,185,129,0.1)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Package size={20} color="var(--accent)" />
                  </div>
                  <div style={{
                    background: 'var(--bg)', padding: '0.25rem 0.6rem',
                    borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800',
                    color: 'var(--text-muted)', border: '1px solid var(--border)',
                  }}>
                    STOCK DISPONIBLE
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.1rem' }}>
                    {item.part_numbers?.part_number}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {item.part_numbers?.description}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text)', lineHeight: 1 }}>
                    {item.quantity}
                  </div>
                  <div style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.85rem', paddingBottom: '0.4rem' }}>
                    {item.part_numbers?.uom || 'PCS'}
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border)', paddingTop: '1rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ACTUALIZADO: {new Date(item.last_updated).toLocaleDateString('es-MX')}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!isReadOnly && (
                        <>
                          <button
                            onClick={(e) => handleOpenAdjustment(item, e)}
                            className="icon-btn"
                            title="Ajustar Cantidad"
                            style={{ color: 'var(--primary)' }}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ show: true, id: item.id }); }}
                            className="icon-btn"
                            title="Eliminar del Almacén"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                        className="icon-btn"
                        title="Ver Detalle"
                        style={{ color: isSelected ? 'var(--primary)' : undefined }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .icon-btn:hover { color: var(--primary); background: rgba(99,102,241,0.1); }
      `}</style>

      {/* Panel de detalle */}
      {selectedItem && (
        <ProductDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* Confirm delete */}
      {deleteConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="card-mesh" style={{ width: '400px', textAlign: 'center' }}>
            <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>¿Eliminar Inventario?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              ¿Estás seguro de que deseas eliminar este registro de inventario de forma definitiva? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }} onClick={confirmDeleteStock}>
                Sí, Eliminar
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setDeleteConfirm({ show: false, id: null })}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Inventario */}
      {showAdjustmentModal && adjustmentItem && (
        <div className="modal-overlay" onClick={() => setShowAdjustmentModal(false)}>
          <div className="card-mesh" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Ajuste de Inventario</h2>
              <button onClick={() => setShowAdjustmentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Producto:</p>
              <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}>{adjustmentItem.part_numbers?.part_number}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{adjustmentItem.part_numbers?.description}</p>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', border: '1px solid var(--accent)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cantidad Actual:</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>{adjustmentItem.quantity} {adjustmentItem.part_numbers?.uom || 'PCS'}</p>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nueva Cantidad</label>
              <input 
                type="number"
                min="0"
                value={adjustmentData.new_quantity}
                onChange={(e) => setAdjustmentData({...adjustmentData, new_quantity: parseFloat(e.target.value) || 0})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)', fontSize: '1.25rem' }}
              />
              <p style={{ fontSize: '0.875rem', color: adjustmentData.new_quantity - adjustmentItem.quantity >= 0 ? 'var(--accent)' : 'var(--danger)', marginTop: '0.5rem' }}>
                Diferencia: {adjustmentData.new_quantity - adjustmentItem.quantity >= 0 ? '+' : ''}{adjustmentData.new_quantity - adjustmentItem.quantity} piezas
              </p>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Motivo del Ajuste *</label>
              <select 
                value={adjustmentData.adjustment_reason}
                onChange={(e) => setAdjustmentData({...adjustmentData, adjustment_reason: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
              >
                <option value="">-- Seleccionar motivo --</option>
                <option value="Conteo físico">Conteo físico</option>
                <option value="Producto dañado">Producto dañado</option>
                <option value="Error de captura">Error de captura</option>
                <option value="Ajuste de inventario">Ajuste de inventario</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Descripción / Porque del ajuste *</label>
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
    </div>
  );
};

export default Inventory;
