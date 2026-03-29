import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ResponsiveTable from './ResponsiveTable';
import { ShieldCheck, Plus, CheckCircle2, XCircle, Clock, AlertTriangle, Search } from 'lucide-react';

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
      title: 'Fecha', 
      render: (item) => new Date(item.created_at).toLocaleString() 
    },
    { key: 'orden_produccion_id', title: 'Orden' },
    { key: 'punto_control', title: 'Punto Control' },
    { key: 'piezas_revisadas', title: 'Revisadas', align: 'center' },
    { key: 'piezas_aprobadas', title: 'Aprobadas', align: 'center' },
    { key: 'piezas_rechazadas', title: 'Rechazadas', align: 'center' },
    { 
      key: 'estado_inspeccion', 
      title: 'Estado', 
      render: (item) => getStatusBadge(item.estado_inspeccion) 
    },
    { key: 'comentarios', title: 'Comentarios' }
  ];

  const filteredData = inspections.filter(item => 
    item.orden_produccion_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.punto_control?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.estado_inspeccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container animate-fade-in">
      <div className="header-actions">
        <div>
          <h1 className="display-small">Inspecciones de Calidad</h1>
          <p className="text-muted">Gestión de control de calidad y auditorías de proceso.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Nueva Inspección
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="card-mesh stat-card">
          <div className="stat-label">Total Inspecciones</div>
          <div className="stat-value">{inspections.length}</div>
        </div>
        <div className="card-mesh stat-card">
          <div className="stat-label">Aprobadas</div>
          <div className="stat-value text-success">
            {inspections.filter(i => i.estado_inspeccion === 'Aprobado').length}
          </div>
        </div>
        <div className="card-mesh stat-card">
          <div className="stat-label">Rechazadas</div>
          <div className="stat-value text-danger">
            {inspections.filter(i => i.estado_inspeccion === 'Rechazado').length}
          </div>
        </div>
      </div>

      <ResponsiveTable 
        data={filteredData}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por orden, punto de control o estado..."
      />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card-mesh">
            <div className="modal-header">
              <h3>Nueva Inspección de Calidad</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateInspection}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Piezas Revisadas</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={formData.piezas_revisadas}
                    onChange={(e) => setFormData({...formData, piezas_revisadas: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Aprobadas</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={formData.piezas_aprobadas}
                    onChange={(e) => setFormData({...formData, piezas_aprobadas: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Rechazadas</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={formData.piezas_rechazadas}
                    onChange={(e) => setFormData({...formData, piezas_rechazadas: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select 
                  required
                  value={formData.estado_inspeccion}
                  onChange={(e) => setFormData({...formData, estado_inspeccion: e.target.value})}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado">Rechazado</option>
                  <option value="POR VALIDAR">Por Validar</option>
                </select>
              </div>
              <div className="form-group">
                <label>Código de Defecto (si aplica)</label>
                <input 
                  type="text" 
                  value={formData.codigo_defecto}
                  onChange={(e) => setFormData({...formData, codigo_defecto: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Comentarios</label>
                <textarea 
                  rows="3"
                  value={formData.comentarios}
                  onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Inspección</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityInspections;
