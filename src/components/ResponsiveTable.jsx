import React from 'react';

const ResponsiveTable = ({ 
  data, 
  columns, 
  keyField = 'id', 
  loading, 
  emptyMessage = 'No hay datos disponibles'
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}></div>
        <p className="text-muted" style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>Procesando información...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p className="text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper animate-fade-in" style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ minWidth: '800px' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key} 
                style={{ 
                  textAlign: col.align || 'left',
                  whiteSpace: 'nowrap'
                }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item[keyField]} className="table-row-hover">
              {columns.map((col) => (
                <td 
                  key={col.key} 
                  style={{ 
                    textAlign: col.align || 'left'
                  }}
                >
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResponsiveTable;
