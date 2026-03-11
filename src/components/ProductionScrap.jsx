import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Search, Filter, Calendar, User, Hash, Loader2, Trash2 } from 'lucide-react';

const ProductionScrap = () => {
  const [scrapData, setScrapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, items: 0, byDefect: [], byOperation: [] });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  useEffect(() => {
    fetchScrap();
  }, []);

  const fetchScrap = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('production_scrap')
      .select(`
        *,
        order:production_orders(order_number, part_numbers(part_number, description)),
        routing:production_routing(operation_name, sequence)
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      setScrapData(data);
      
      // ... stats calculation code ...
      const totalQty = data.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      const defectMap = data.reduce((acc, curr) => {
        const type = curr.defect_type || 'General';
        acc[type] = (acc[type] || 0) + curr.quantity;
        return acc;
      }, {});
      const byDefect = Object.entries(defectMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
      const opMap = data.reduce((acc, curr) => {
        const name = curr.routing?.operation_name || 'Desconocida';
        acc[name] = (acc[name] || 0) + curr.quantity;
        return acc;
      }, {});
      const byOperation = Object.entries(opMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

      setStats({ total: totalQty, items: data.length, byDefect, byOperation });
    }
    setLoading(false);
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    const { error } = await supabase
      .from('production_scrap')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error al eliminar el scrap: " + error.message);
    } else {
      fetchScrap();
    }
    setDeleteConfirm({ show: false, id: null });
  };

  const handleDeleteScrap = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const filteredData = scrapData.filter(s => 
    s.order?.order_number?.toLowerCase().includes(filter.toLowerCase()) ||
    s.order?.part_numbers?.part_number?.toLowerCase().includes(filter.toLowerCase()) ||
    s.operator_name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Control de Calidad (Scrap)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Análisis de mermas y causas raíz de defectos.</p>
        </div>
        <button className="btn" onClick={fetchScrap}>Actualizar</button>
      </header>

      {/* Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card-mesh" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>TOTAL SCRAP</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--danger)' }}>{stats.total}</div>
        </div>
        <div className="card-mesh" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>INCIDENCIAS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{stats.items}</div>
        </div>
        <div className="card-mesh" style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', overflow: 'hidden' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.5rem' }}>TOP DEFECTOS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
               {stats.byDefect.slice(0, 3).map((d, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                   <span>{d.name}</span>
                   <span style={{ fontWeight: '700' }}>{d.value}</span>
                 </div>
               ))}
            </div>
          </div>
          <div style={{ width: '1px', background: 'var(--border)' }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.5rem' }}>PEOR OPERACIÓN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
               {stats.byOperation.slice(0, 3).map((d, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                   <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{d.name}</span>
                   <span style={{ fontWeight: '700' }}>{d.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card-mesh" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Buscar por orden, pieza o responsable..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ paddingLeft: '2.5rem', background: 'rgba(0,0,0,0.2)' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div className="card-mesh" style={{ overflowX: 'auto', padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '800' }}>FECHA</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '800' }}>IDENTIFICACIÓN</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '800' }}>OPERACIÓN</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '800' }}>CANT</th>
               <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '800' }}>MOTIVO / HALLAZGO</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '800' }}>RESPONSABLE</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '800' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Sin registros que mostrar.
                </td>
              </tr>
            ) : (
              filteredData.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.9rem' }}>{s.order?.order_number}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.order?.part_numbers?.part_number}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem' }}>{s.routing?.operation_name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>SEQ {s.routing?.sequence}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                       {s.quantity}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{s.defect_type || 'General'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {s.defect_notes || '---'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {s.operator_name?.[0]}
                      </div>
                      {s.operator_name}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => handleDeleteScrap(s.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="card-mesh" style={{ width: '400px', textAlign: 'center' }}>
            <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>¿Eliminar Registro?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              ¿Estás seguro de que deseas eliminar este registro de scrap? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }} onClick={confirmDelete}>
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

export default ProductionScrap;
