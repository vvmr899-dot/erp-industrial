import React from 'react';
import { Layout, Factory, ClipboardList, Package, ShoppingCart, BarChart3, LayoutDashboard, AlertCircle, Settings } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
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

  return (
    <div className="sidebar">
      <div className="logo">
        <Layout size={24} />
        <span>G-ERP MES</span>
      </div>
      <nav>
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
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
