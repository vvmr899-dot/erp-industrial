import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ResponsiveTable from './ResponsiveTable';
import { History, Search, Box, Tag, Calendar, User, Info, FileSearch } from 'lucide-react';

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
      title: 'Registro', 
      render: (item) => (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <History size={16} className="text-muted" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600 }}>{new Date(item.created_at).toLocaleDateString()}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
      )
    },
    { key: 'numero_lote_mp', title: 'Lote MP', render: (item) => <div className="badge badge-info" style={{ fontWeight: 700, borderRadius: '4px' }}>{item.numero_lote_mp}</div> },
    { key: 'part_number', title: 'NP Final', render: (item) => <span style={{ fontWeight: 500 }}>{item.numero_parte_producido}</span> },
    { key: 'cantidad_mp_usada', title: 'MP Usada', align: 'right', render: (item) => <span style={{ fontWeight: 700 }}>{item.cantidad_mp_usada}</span> },
    { key: 'cantidad_producida', title: 'Producido', align: 'right', render: (item) => <span className="text-success" style={{ fontWeight: 700 }}>{item.cantidad_producida}</span> },
    { key: 'fecha_produccion', title: 'Fecha Prod.', render: (item) => item.fecha_produccion },
    { 
      key: 'observaciones', 
      title: 'Observaciones', 
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '200px' }}>
          <Info size={14} className="text-muted" />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.observaciones || 'Sin notas'}
          </span>
        </div>
      )
    }
  ];

  const filteredData = traces.filter(item => 
    item.numero_lote_mp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numero_parte_producido?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="display-small">Trazabilidad de Lotes</h1>
          <p className="text-muted">Registro de genealogía de materiales y lotes de producción.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card-mesh" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(17, 24, 39, 0.7))' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <FileSearch size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Registros</p>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{traces.length}</div>
          </div>
        </div>
        
        <div className="card-mesh" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Tag size={24} className="text-success" />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Lotes Únicos</p>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{new Set(traces.map(t => t.numero_lote_mp)).size}</div>
          </div>
        </div>
      </div>

      <div className="card-mesh" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Search size={20} className="text-muted" />
          <input 
            type="text" 
            placeholder="Rastrear por Lote MP o Número de Parte..." 
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
    </div>
  );
};

export default Traceability;
