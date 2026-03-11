import React from 'react';

const ResponsiveTable = ({ 
  data, 
  columns, 
  keyField = 'id', 
  loading, 
  emptyMessage = 'No hay datos disponibles',
  searchTerm,
  onSearch,
  searchPlaceholder = 'Buscar...'
}) => {
  const renderDesktopTable = () => (
    <div className="card-mesh table-container" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map((col) => (
              <th 
                key={col.key} 
                style={{ 
                  padding: '1rem', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.75rem', 
                  fontWeight: '700',
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
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>Cargando...</div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item[keyField]} style={{ borderBottom: '1px solid var(--border)' }}>
                {columns.map((col) => (
                  <td 
                    key={col.key} 
                    style={{ 
                      padding: '1rem',
                      textAlign: col.align || 'left'
                    }}
                  >
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="responsive-cards">
      {loading ? (
        <div className="card-mesh" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: 'var(--text-muted)' }}>Cargando...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="card-mesh" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          {emptyMessage}
        </div>
      ) : (
        data.map((item) => (
          <div key={item[keyField]} className="table-card">
            <div className="table-card-header">
              <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                {columns[0]?.render ? columns[0].render(item) : item[columns[0]?.key]}
              </span>
              {columns[columns.length - 1]?.render && (
                <div onClick={(e) => e.stopPropagation()}>
                  {columns[columns.length - 1].render(item)}
                </div>
              )}
            </div>
            {columns.slice(1, -1).map((col) => (
              <div key={col.key} className="table-card-row">
                <span className="table-card-label">{col.title}</span>
                <span className="table-card-value">
                  {col.render ? col.render(item) : item[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="responsive-table-wrapper">
      {onSearch && (
        <div className="card-mesh" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm || ''}
            onChange={(e) => onSearch(e.target.value)}
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </div>
      )}
      {/* Desktop: Show table */}
      <div className="desktop-table">
        {renderDesktopTable()}
      </div>
      {/* Mobile: Show cards */}
      <div className="mobile-cards">
        {renderMobileCards()}
      </div>
    </div>
  );
};

export default ResponsiveTable;
