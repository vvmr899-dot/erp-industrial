import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Plus, Search, Loader2, Trash2, Edit2 } from 'lucide-react';

const PartNumbers = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPart, setNewPart] = useState({ part_number: '', description: '', uom: '' });
  const [editingPart, setEditingPart] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('part_numbers')
      .select('*')
      .order('part_number');
    
    if (data) setParts(data);
    setLoading(false);
  };

  const handleSavePart = async (e) => {
    e.preventDefault();
    if (editingPart) {
      const { error } = await supabase
        .from('part_numbers')
        .update(newPart)
        .eq('id', editingPart.id);
      if (!error) {
        fetchParts();
        setShowAddModal(false);
        setEditingPart(null);
        setNewPart({ part_number: '', description: '', uom: '' });
      }
    } else {
      const { error } = await supabase.from('part_numbers').insert([newPart]);
      if (!error) {
        fetchParts();
        setShowAddModal(false);
        setNewPart({ part_number: '', description: '', uom: '' });
      }
    }
  };

  const handleEditClick = (part) => {
    setEditingPart(part);
    setNewPart({
      part_number: part.part_number,
      description: part.description,
      uom: part.uom || ''
    });
    setShowAddModal(true);
  };

  const confirmDeletePart = async () => {
    const id = deleteConfirm.id;
    const { error } = await supabase.from('part_numbers').delete().eq('id', id);
    if (!error) fetchParts();
    else alert("Error al eliminar la pieza: " + error.message);
    setDeleteConfirm({ show: false, id: null });
  };

  const deletePart = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Números de Parte</h1>
          <p style={{ color: 'var(--text-muted)' }}>Catálogo maestro de piezas y componentes.</p>
        </div>
        <button onClick={() => { setEditingPart(null); setNewPart({ part_number: '', description: '', uom: '' }); setShowAddModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Nuevo Número de Parte
        </button>
      </header>

      <div className="card-mesh" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>NÚMERO DE PARTE</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>DESCRIPCIÓN</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>UOM</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                </td>
              </tr>
            ) : parts.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No hay números de parte registrados.
                </td>
              </tr>
            ) : (
              parts.map(part => (
                <tr key={part.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Package size={18} color="var(--primary)" />
                      <span style={{ fontWeight: '600' }}>{part.part_number}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{part.description}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{part.uom || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEditClick(part)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deletePart(part.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content card-mesh" style={{ width: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingPart ? 'Editar Número de Parte' : 'Añadir Número de Parte'}</h2>
            <form onSubmit={handleSavePart}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Número de Parte</label>
                <input 
                  type="text" 
                  value={newPart.part_number}
                  onChange={(e) => setNewPart({...newPart, part_number: e.target.value})}
                  className="input-field" 
                  required 
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Descripción</label>
                <input 
                  type="text" 
                  value={newPart.description}
                  onChange={(e) => setNewPart({...newPart, description: e.target.value})}
                  className="input-field" 
                  required 
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Unidad de Medida (UOM)</label>
                <input 
                  type="text" 
                  value={newPart.uom}
                  onChange={(e) => setNewPart({...newPart, uom: e.target.value})}
                  className="input-field" 
                  placeholder="ej. PZA, KG, MT"
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="card-mesh" style={{ width: '400px', textAlign: 'center' }}>
            <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>¿Eliminar Número de Parte?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              ¿Estás seguro de que deseas eliminar este número de parte? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }} onClick={confirmDeletePart}>
                Sí, Eliminar
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setDeleteConfirm({ show: false, id: null })}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartNumbers;
