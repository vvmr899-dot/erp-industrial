import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ResponsiveTable from './ResponsiveTable';
import { ShieldCheck, Plus, CheckCircle2, XCircle, Clock, AlertTriangle, Search, TrendingUp, TrendingDown } from 'lucide-react';

const QualityInspections = ({ userRole }) => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    orden_produccion_id: '',
    punto_control: '',
    piezas_revisadas: 0,
    piezas_aprobadas: 0,
    piezas_rechazadas: 0,
    codigo_defecto: '',
    comentarios: '',
    estado_inspeccion: 'Pendiente'
  });

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inspecciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInspections(data || []);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInspection = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('inspecciones')
        .insert([{
          ...formData,
          inspector_id: user?.id,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      setShowModal(false);
      setFormData({
        orden_produccion_id: '',
        punto_control: '',
        piezas_revisadas: 0,
        piezas_aprobadas: 0,
        piezas_rechazadas: 0,
        codigo_defecto: '',
        comentarios: '',
        estado_inspeccion: 'Pendiente'
      });
      fetchInspections();
    } catch (error) {
      alert('Error al crear inspección: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Aprobado':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Aprobado</span>;
      case 'Rechazado':
        return <span className="badge badge-danger"><XCircle size={12} /> Rechazado</span>;
      case 'POR VALIDAR':
        return <span className="badge badge-warning"><AlertTriangle size={12} /> Por Validar</span>;
      default:
        return <span className="badge badge-info"><Clock size={12} /> Pendiente</span>;
    }
  };

  const columns = [
    { 
      key: 'created_at', 
      title: 'Fecha/Hora', 
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{new Date(item.created_at).toLocaleDateString()}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleTimeString()}</span>
        </div>
      )
    },
    { key: 'orden_produccion_id', title: 'Orden', render: (item) => <span className="badge badge-info" style={{ borderRadius: '4px', textTransform: 'none' }}>{item.orden_produccion_id}</span> },
    { key: 'punto_control', title: 'Punto Control', render: (item) => <span style={{ fontWeight: 500 }}>{item.punto_control}</span> },
    { key: 'piezas_revisadas', title: 'Rev.', align: 'center' },
    { key: 'piezas_aprobadas', title: 'Aprob.', align: 'center', render: (item) => <span className="text-success">{item.piezas_aprobadas}</span> },
    { key: 'piezas_rechazadas', title: 'Rech.', align: 'center', render: (item) => <span className="text-danger">{item.piezas_rechazadas}</span> },
    { 
      key: 'estado_inspeccion', 
      title: 'Estado', 
      render: (item) => getStatusBadge(item.estado_inspeccion) 
    }
  ];

  const filteredData = inspections.filter(item => 
    item.orden_produccion_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.punto_control?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="display-small">Control de Calidad</h1>
          <p className="text-muted">Gestión de inspecciones y auditorías en tiempo real.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Nueva Inspección
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card-mesh" style={{ borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}><ShieldCheck size={80} /></div>
          <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Auditorías</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{inspections.length}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            <TrendingUp size={16} /> <span>12% este mes</span>
          </div>
        </div>
        
        <div className="card-mesh" style={{ borderLeft: '4px solid var(--accent)' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Aprobadas</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)' }}>
            {inspections.filter(i => i.estado_inspeccion === 'Aprobado').length}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Tasa de aceptación: 98.2%</div>
        </div>

        <div className="card-mesh" style={{ borderLeft: '4px solid var(--danger)' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Rechazadas</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--danger)' }}>
            {inspections.filter(i => i.estado_inspeccion === 'Rechazado').length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            <TrendingDown size={16} /> <span>Acciones requeridas</span>
          </div>
        </div>
      </div>

      <div className="card-mesh" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Search size={20} className="text-muted" />
          <input 
            type="text" 
            placeholder="Filtrar por orden o punto de control..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.95rem' }}
          />
        </div>
        <ResponsiveTable 
          data={filteredData}
          columns={columns}
          loading={loading}
        />
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="card-mesh" style={{ maxWidth: '600px', width: '90%', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Nueva Inspección</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleCreateInspection} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Orden de Producción</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.orden_produccion_id}
                    onChange={(e) => setFormData({...formData, orden_produccion_id: e.target.value})}
                    placeholder="Ej: OP-2024-001"
                  />
                </div>
                <div className="form-group">
                  <label>Punto de Control</label>
                  <select 
                    required
                    value={formData.punto_control}
                    onChange={(e) => setFormData({...formData, punto_control: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Recibo MP">Recibo Materia Prima</option>
                    <option value="Proceso">En Proceso</option>
                    <option value="Final">Inspección Final</option>
                    <option value="Auditoría">Auditoría de Embarque</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Pzas. Revisadas</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.piezas_revisadas}
                    onChange={(e) => setFormData({...formData, piezas_revisadas: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Aprobadas</label>
                  <input 
                    type="number" 
                    required 
                    style={{ borderBottomColor: 'var(--accent)' }}
                    value={formData.piezas_aprobadas}
                    onChange={(e) => setFormData({...formData, piezas_aprobadas: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Rechazadas</label>
                  <input 
                    type="number" 
                    required 
                    style={{ borderBottomColor: 'var(--danger)' }}
                    value={formData.piezas_rechazadas}
                    onChange={(e) => setFormData({...formData, piezas_rechazadas: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Comentarios</label>
                <textarea 
                  rows="3"
                  value={formData.comentarios}
                  onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                  placeholder="Descripción de defectos o notas de auditoría..."
                ></textarea>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Registrar Auditoría</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityInspections;
