import React from 'react';
import { Layout, Factory, ClipboardList, Package, ShoppingCart, BarChart3, LayoutDashboard, AlertCircle, Settings, X, Users } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose, userRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'part_numbers', label: 'Números de Parte', icon: Package },
    { id: 'routing', label: 'Rutas de Prod', icon: Settings },
    { id: 'orders', label: 'Órdenes Prod', icon: ClipboardList },
    { id: 'wip', label: 'Seguimiento WIP', icon: Layout },
    { id: 'capture', label: 'Captura Prod', icon: Layout },
    { id: 'scrap', label: 'Reporte Scrap', icon: AlertCircle },
    { id: 'inventory', label: 'Inventario', icon: ShoppingCart },
  ];

  if (userRole === 'admin') {
    menuItems.push({ id: 'users', label: 'Gestión Usuarios', icon: Users });
  }

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo">
        <Layout size={24} />
        <span className="desktop-only">G-ERP MES</span>
        <span className="mobile-only" style={{ marginLeft: 'auto' }}>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={24} />
          </button>
        </span>
      </div>
      <nav style={{ marginTop: '1rem' }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveTab(item.id);
              }
            }}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
