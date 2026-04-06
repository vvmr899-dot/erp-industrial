import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  Clock, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Package,
  Copy
} from 'lucide-react';

const ProductionRouting = ({ userRole }) => {
  const isReadOnly = userRole === 'calidad';
  const [routings, setRoutings] = useState([]);
  const [partNumbers, setPartNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterPartId, setFilterPartId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, mode: 'initial' }); // modes: initial | deactivate
  const [copyModal, setCopyModal] = useState({ show: false, sourcePartId: null, targetPartId: '' });
  const [formData, setFormData] = useState({
    part_number_id: '',
    sequence: '',
    operation_name: '',
    machine_area: '',
    work_center: '',
    standard_time_minutes: '',
    setup_time_minutes: 0,
    is_final_operation: false,
    instructions: '',
    active: true
  });

  useEffect(() => {
    fetchPartNumbers();
    fetchRoutings();
  }, []);

  const fetchPartNumbers = async () => {
    const { data } = await supabase.from('part_numbers').select('id, part_number, description').eq('is_active', true);
    if (data) setPartNumbers(data);
  };

  const fetchRoutings = async () => {
    setLoading(true);
    let query = supabase
      .from('production_routing')
      .select('*, part_numbers(part_number, description)')
      .order('part_number_id')
      .order('sequence_base', { nullsFirst: false })
      .order('sequence_sub', { nullsFirst: true })
      .order('sequence', { nullsFirst: false });
    
    if (filterPartId) {
      query = query.eq('part_number_id', filterPartId);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
    } else {
      setRoutings(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const rawSeq = String(formData.sequence).trim();
    const parts = rawSeq.split('-');
    const base = parseInt(parts[0], 10) || 0;
    const sub = parts.length > 1 ? parseInt(parts[1], 10) || 0 : null;
    const finalStr = sub ? `${base}-${sub}` : `${base}`;

    const dataToSave = {
      ...formData,
      sequence: base,
      sequence_base: base,
      sequence_sub: sub,
      sequence_str: finalStr,
      standard_time_minutes: parseFloat(formData.standard_time_minutes) || 0,
      setup_time_minutes: parseFloat(formData.setup_time_minutes) || 0
    };

    if (editingId) {
      const { error } = await supabase.from('production_routing').update(dataToSave).eq('id', editingId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('production_routing').insert(dataToSave);
      if (error) alert(error.message);
    }

    setLoading(false);
    setShowModal(false);
    setEditingId(null);
    resetForm();
    fetchRoutings();
  };

  const handleEdit = (routing) => {
    setEditingId(routing.id);
    setFormData({
      part_number_id: routing.part_number_id,
      sequence: routing.sequence_str || routing.sequence,
      operation_name: routing.operation_name,
      machine_area: routing.machine_area,
      work_center: routing.work_center || '',
      standard_time_minutes: routing.standard_time_minutes,
      setup_time_minutes: routing.setup_time_minutes || 0,
      is_final_operation: routing.is_final_operation || false,
      instructions: routing.instructions || '',
      active: routing.active ?? true
    });
    setShowModal(true);
  };

  const confirmAction = async () => {
    const id = deleteConfirm.id;
    
    if (deleteConfirm.mode === 'initial') {
      const { data, error } = await supabase.from('production_routing').delete().eq('id', id).select();
      
      if (error) {
        if (error.code === '23503') {
          // Transition to deactivate mode
          setDeleteConfirm({ show: true, id: id, mode: 'deactivate' });
        } else {
          alert("Error de BD: " + JSON.stringify(error));
          setDeleteConfirm({ show: false, id: null, mode: 'initial' });
        }
      } else {
        setDeleteConfirm({ show: false, id: null, mode: 'initial' });
        fetchRoutings();
      }
    } else if (deleteConfirm.mode === 'deactivate') {
      const { error: updateError } = await supabase.from('production_routing').update({ active: false }).eq('id', id);
      if (updateError) {
        alert("Error al desactivar: " + updateError.message);
      }
      setDeleteConfirm({ show: false, id: null, mode: 'initial' });
      fetchRoutings();
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, id: id, mode: 'initial' });
  };

  const handleCopyRouting = async (e) => {
    e.preventDefault();
    if (!copyModal.sourcePartId || !copyModal.targetPartId) return;
    setLoading(true);

    const sourceSteps = routings.filter(r => r.part_number_id === copyModal.sourcePartId && r.active !== false);
    
    if (sourceSteps.length === 0) {
      alert("No hay operaciones activas para copiar.");
      setLoading(false);
      return;
    }

    const newSteps = sourceSteps.map(step => ({
      part_number_id: copyModal.targetPartId,
      sequence: step.sequence,
      sequence_base: step.sequence_base,
      sequence_sub: step.sequence_sub,
      sequence_str: step.sequence_str,
      operation_name: step.operation_name,
      machine_area: step.machine_area,
      work_center: step.work_center,
      standard_time_minutes: step.standard_time_minutes,
      setup_time_minutes: step.setup_time_minutes,
      is_final_operation: step.is_final_operation,
      instructions: step.instructions,
      active: true
    }));

    const { error } = await supabase.from('production_routing').insert(newSteps);
    
    if (error) {
      alert("Error al copiar ruta: " + error.message);
    } else {
      setCopyModal({ show: false, sourcePartId: null, targetPartId: '' });
      fetchRoutings();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      part_number_id: '',
      sequence: '',
      operation_name: '',
      machine_area: '',
      work_center: '',
      standard_time_minutes: '',
      setup_time_minutes: 0,
      is_final_operation: false,
      instructions: '',
      active: true
    });
  };

  // Group routings by part number for display
  const groupedRoutings = routings.filter(r => r.active !== false).reduce((acc, curr) => {
    const partKey = curr.part_number_id;
    if (!acc[partKey]) {
      acc[partKey] = {
        info: curr.part_numbers,
        steps: []
      };
    }
    acc[partKey].steps.push(curr);
    return acc;
  }, {});

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Rutas de Producción</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configuración de secuencias y tiempos estándar por producto.</p>
        </div>
        {!isReadOnly && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}>
            <Plus size={18} /> Nueva Operación
          </button>
        )}
      </header>

      <div className="card-mesh" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Package size={20} color="var(--text-muted)" />
          <select 
            value={filterPartId} 
            onChange={(e) => setFilterPartId(e.target.value)}
            style={{ minWidth: '300px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
          >
            <option value="">-- Todos los Números de Parte --</option>
            {partNumbers.map(p => (
              <option key={p.id} value={p.id}>{p.part_number}</option>
            ))}
          </select>
          <button className="btn" onClick={fetchRoutings}>Filtrar</button>
        </div>
      </div>

      {loading && !showModal ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        </div>
      ) : Object.keys(groupedRoutings).length === 0 ? (
        <div className="card-mesh" style={{ textAlign: 'center', padding: '5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No hay rutas configuradas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(groupedRoutings).map(([partId, group]) => (
            <div key={partId} className="card-mesh" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{group.info?.part_number}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{group.info?.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', background: 'var(--bg)', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    {group.steps.length} OPERACIONES
                  </div>
                  {!isReadOnly && (
                    <button 
                      className="icon-btn" 
                      title="Copiar esta ruta a otro número de parte"
                      onClick={() => setCopyModal({ show: true, sourcePartId: partId, targetPartId: '' })}
                    >
                      <Copy size={18} />
                    </button>
                  )}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>
                      <th style={{ padding: '1rem' }}>SEQ</th>
                      <th style={{ padding: '1rem' }}>OPERACIÓN</th>
                      <th style={{ padding: '1rem' }}>MÁQUINA/ÁREA</th>
                      <th style={{ padding: '1rem' }}>STD (MIN)</th>
                      <th style={{ padding: '1rem' }}>SETUP</th>
                      <th style={{ padding: '1rem' }}>TIPO</th>
                      <th style={{ padding: '1rem' }}>ESTADO</th>
                      <th style={{ padding: '1rem' }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.steps.map(step => (
                      <tr key={step.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1rem', fontWeight: '800' }}>{step.sequence_str || step.sequence}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600' }}>{step.operation_name}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>{step.machine_area}</td>
                        <td style={{ padding: '1rem' }}>{step.standard_time_minutes}</td>
                        <td style={{ padding: '1rem' }}>{step.setup_time_minutes || 0}</td>
                        <td style={{ padding: '1rem' }}>
                          {step.is_final_operation ? (
                            <span style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={12} /> FINAL
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>INTERMEDIA</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            fontSize: '0.6rem', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '4px', 
                            background: step.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', 
                            color: step.active ? 'var(--accent)' : 'var(--danger)',
                            fontWeight: '800'
                          }}>
                            {step.active ? 'ACTIVA' : 'INACTIVA'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isReadOnly ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Solo vista</span>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="icon-btn" onClick={() => handleEdit(step)}><Edit2 size={16} /></button>
                              <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(step.id)}><Trash2 size={16} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="card-mesh" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>{editingId ? 'Editar Operación' : 'Nueva Operación'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Número de Parte</label>
                <select 
                  required
                  value={formData.part_number_id}
                  onChange={(e) => setFormData({...formData, part_number_id: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                >
                  <option value="">Seleccionar...</option>
                  {partNumbers.map(p => (
                    <option key={p.id} value={p.id}>{p.part_number} - {p.description}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Secuencia (Ej. 20, 20-1, 20-2)</label>
                <input 
                  type="text" 
                  required
                  placeholder="20, 20-1"
                  value={formData.sequence}
                  onChange={(e) => setFormData({...formData, sequence: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Nombre de Operación</label>
                <input 
                  type="text" 
                  required
                  value={formData.operation_name}
                  onChange={(e) => setFormData({...formData, operation_name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                />
              </div>
              <div className="form-group">
                <label>Máquina / Área</label>
                <input 
                  type="text" 
                  required
                  value={formData.machine_area}
                  onChange={(e) => setFormData({...formData, machine_area: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                />
              </div>
              <div className="form-group">
                <label>Centro de Trabajo</label>
                <input 
                  type="text" 
                  value={formData.work_center}
                  onChange={(e) => setFormData({...formData, work_center: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                />
              </div>
              <div className="form-group">
                <label>Tiempo Std (Min/Pza)</label>
                <input 
                  type="number" 
                  required
                  step="0.001"
                  value={formData.standard_time_minutes}
                  onChange={(e) => setFormData({...formData, standard_time_minutes: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                />
              </div>
              <div className="form-group">
                <label>Tiempo Setup (Min)</label>
                <input 
                  type="number" 
                  step="1"
                  value={formData.setup_time_minutes}
                  onChange={(e) => setFormData({...formData, setup_time_minutes: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Instrucciones de Trabajo</label>
                <textarea 
                  rows="3"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '2rem', gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_final_operation}
                    onChange={(e) => setFormData({...formData, is_final_operation: e.target.checked})}
                  />
                  Operación Final
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  />
                  Activa
                </label>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar'}
                </button>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="card-mesh" style={{ width: '400px', textAlign: 'center' }}>
            {deleteConfirm.mode === 'initial' ? (
              <>
                <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ marginBottom: '1rem' }}>¿Eliminar Operación?</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  ¿Estás seguro de que deseas eliminar esta operación de la ruta? Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }} onClick={confirmAction}>
                    Sí, Eliminar
                  </button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setDeleteConfirm({ show: false, id: null, mode: 'initial' })}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={48} color="var(--accent)" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ marginBottom: '1rem' }}>Operación en Uso</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  Esta operación ya tiene historial (WIP, capturas o scrap) y no se puede borrar de la base de datos.
                  ¿Deseas <strong>desactivarla</strong> para que se oculte y ya no se use en nuevas órdenes?
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmAction}>
                    Sí, Desactivar
                  </button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setDeleteConfirm({ show: false, id: null, mode: 'initial' })}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {copyModal.show && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="card-mesh" style={{ width: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>Copiar Ruta de Producción</h2>
              <button className="icon-btn" onClick={() => setCopyModal({ show: false, sourcePartId: null, targetPartId: '' })}>&times;</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Selecciona el número de parte destino. Todas las operaciones activas de la ruta actual serán duplicadas de forma idéntica en el producto seleccionado.
            </p>
            <form onSubmit={handleCopyRouting}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Copiar a (Producto Destino):</label>
                <select 
                  required
                  value={copyModal.targetPartId}
                  onChange={(e) => setCopyModal({...copyModal, targetPartId: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#111827', color: 'var(--text)' }}
                >
                  <option value="">-- Seleccionar Nuevo Producto --</option>
                  {partNumbers
                    .filter(p => p.id !== copyModal.sourcePartId) // No permitir copiar a sí mismo
                    .map(p => (
                    <option key={p.id} value={p.id}>{p.part_number} - {p.description}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || !copyModal.targetPartId}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Copia'}
                </button>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setCopyModal({ show: false, sourcePartId: null, targetPartId: '' })}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionRouting;
