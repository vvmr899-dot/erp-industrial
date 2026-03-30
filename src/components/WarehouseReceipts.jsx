import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ResponsiveTable from './ResponsiveTable';
import { Truck, Plus, CheckCircle2, XCircle, Clock, FileText, Search, PackageCheck, AlertCircle } from 'lucide-react';

const WarehouseReceipts = ({ userRole }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    folio: '',
    tipo_material: 'materia_prima',
    proveedor: '',
    orden_compra: '',
    notas: '',
    estatus: 'borrador'
  });

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('almacen_recepciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('almacen_recepciones')
        .insert([{
          ...formData,
          created_by: user?.id,
          fecha_recepcion: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;
      setShowModal(false);
      setFormData({
        folio: '',
        tipo_material: 'materia_prima',
        proveedor: '',
        orden_compra: '',
        notas: '',
        estatus: 'borrador'
      });
      fetchReceipts();
    } catch (error) {
      alert('Error al crear recepción: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmada':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Confirmada</span>;
      case 'cancelada':
        return <span className="badge badge-danger"><XCircle size={12} /> Cancelada</span>;
      default:
        return <span className="badge badge-info"><Clock size={12} /> Borrador</span>;
    }
  };

  const columns = [
    { key: 'folio', title: 'Folio', render: (item) => <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <PackageCheck size={18} className="text-primary" />
        <span style={{ fontWeight: 600 }}>{item.folio}</span>
      </div> 
    },
    { 
      key: 'fecha_recepcion', 
      title: 'Fecha', 
      render: (item) => new Date(item.fecha_recepcion).toLocaleDateString() 
    },
    { key: 'tipo_material', title: 'Tipo', render: (item) => <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{item.tipo_material.replace('_', ' ').toUpperCase()}</span> },
    { key: 'proveedor', title: 'Proveedor', render: (item) => <span style={{ fontWeight: 500 }}>{item.proveedor}</span> },
    { key: 'orden_compra', title: 'O.C.' },
    { 
      key: 'estatus', 
      title: 'Estado', 
      render: (item) => getStatusBadge(item.estatus) 
    }
  ];

  const filteredData = receipts.filter(item => 
    item.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.orden_compra?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="display-small">Recepciones de Almacén</h1>
          <p className="text-muted">Control de ingresos de suministros y materiales.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Nueva Recepción
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card-mesh" style={{ textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pendientes hoy</p>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>4</div>
        </div>
        <div className="card-mesh" style={{ textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Confirmadas mes</p>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>128</div>
        </div>
        <div className="card-mesh" style={{ textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Canceladas</p>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>2</div>
        </div>
      </div>

      <div className="card-mesh" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Search size={20} className="text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por folio, proveedor u OC..." 
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
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Registrar Recepción</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleCreateReceipt} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Folio</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.folio}
                    onChange={(e) => setFormData({...formData, folio: e.target.value})}
                    placeholder="REC-2024-001"
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de Material</label>
                  <select 
                    value={formData.tipo_material}
                    onChange={(e) => setFormData({...formData, tipo_material: e.target.value})}
                  >
                    <option value="materia_prima">Materia Prima</option>
                    <option value="producto_terminado">Producto Terminado</option>
                    <option value="consumible">Consumible</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Proveedor</label>
                <input 
                  type="text" 
                  value={formData.proveedor}
                  onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                  placeholder="Nombre del proveedor o distribuidor"
                />
              </div>
              <div className="form-group">
                <label>Orden de Compra / Referencia</label>
                <input 
                  type="text" 
                  value={formData.orden_compra}
                  onChange={(e) => setFormData({...formData, orden_compra: e.target.value})}
                  placeholder="OC-XXXX / Factura"
                />
              </div>
              <div className="form-group">
                <label>Notas Adicionales</label>
                <textarea 
                  rows="3"
                  value={formData.notas}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                  placeholder="Detalles sobre el estado del material recibido..."
                ></textarea>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Registrar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseReceipts;
