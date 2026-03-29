import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ResponsiveTable from './ResponsiveTable';
import { History, Search, Box, Tag, Calendar, User } from 'lucide-react';

const Traceability = () => {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTraces();
  }, []);

  const fetchTraces = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trazabilidad_lotes')
        .select(`
          *,
          part_numbers (part_number, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTraces(data || []);
    } catch (error) {
      console.error('Error fetching traceability:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      key: 'created_at', 
      title: 'Fecha/Hora', 
      render: (item) => new Date(item.created_at).toLocaleString() 
    },
    { key: 'numero_lote_mp', title: 'Lote MP', render: (item) => <span style={{ fontWeight: 600 }}>{item.numero_lote_mp}</span> },
    { key: 'part_number', title: 'N/P Producido', render: (item) => item.numero_parte_producido },
    { key: 'cantidad_mp_usada', title: 'Cant MP', align: 'right' },
    { key: 'cantidad_producida', title: 'Cant Prod', align: 'right' },
    { key: 'fecha_produccion', title: 'Fecha Prod' },
    { key: 'observaciones', title: 'Observaciones' }
  ];

  const filteredData = traces.filter(item => 
    item.numero_lote_mp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numero_parte_producido?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container animate-fade-in">
      <div className="header-actions">
        <div>
          <h1 className="display-small">Trazabilidad de Lotes</h1>
          <p className="text-muted">Rastreo completo desde materia prima hasta producto terminado.</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="card-mesh stat-card">
          <div className="stat-label">Registros de Trazabilidad</div>
          <div className="stat-value">{traces.length}</div>
        </div>
        <div className="card-mesh stat-card">
          <div className="stat-label">Lotes Únicos</div>
          <div className="stat-value text-primary">
            {new Set(traces.map(t => t.numero_lote_mp)).size}
          </div>
        </div>
      </div>

      <ResponsiveTable 
        data={filteredData}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por número de lote o N/P..."
      />
    </div>
  );
};

export default Traceability;
