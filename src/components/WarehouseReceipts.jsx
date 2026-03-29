import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ResponsiveTable from './ResponsiveTable';
import { Truck, Plus, CheckCircle2, XCircle, Clock, FileText, Search } from 'lucide-react';

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
    { key: 'folio', title: 'Folio' },
    { 
      key: 'fecha_recepcion', 
      title: 'Fecha', 
      render: (item) => new Date(item.fecha_recepcion).toLocaleDateString() 
    },
    { key: 'tipo_material', title: 'Tipo', render: (item) => item.tipo_material.replace('_', ' ').toUpperCase() },
    { key: 'proveedor', title: 'Proveedor' },
    { key: 'orden_compra', title: 'OC' },
    { 
      key: 'estatus', 
      title: 'Estado', 
      render: (item) => getStatusBadge(item.estatus) 
    },
    { key: 'notas', title: 'Notas' }
  ];

  const filteredData = receipts.filter(item => 
    item.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.orden_compra?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container animate-fade-in">
      <div className="header-actions">
        <div>
          <h1 className="display-small">Recepciones de Almacén</h1>
          <p className="text-muted">Gestión de entrada de materiales y materias primas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Nueva Recepción
        </button>
      </div>

      <ResponsiveTable 
        data={filteredData}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por folio, proveedor u OC..."
      />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card-mesh">
            <div className="modal-header">
              <h3>Nueva Recepción</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateReceipt}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Folio</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.folio}
                    onChange={(e) => setFormData({...formData, folio: e.target.value})}
                    placeholder="REC-XXXX"
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
                />
              </div>
              <div className="form-group">
                <label>Orden de Compra</label>
                <input 
                  type="text" 
                  value={formData.orden_compra}
                  onChange={(e) => setFormData({...formData, orden_compra: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea 
                  rows="3"
                  value={formData.notas}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Borrador</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseReceipts;
