import React from 'react';
import { 
  Layout, Factory, ClipboardList, Package, ShoppingCart, 
  BarChart3, LayoutDashboard, AlertCircle, Settings, X, 
  Users, ShieldCheck, History, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/translations';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose, userRole }) => {
  const { t } = useLanguage();



  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'part_numbers', label: t.partNumbers, icon: Package },
    { id: 'routing', label: t.productionRouting, icon: Settings },
    { id: 'orders', label: t.productionOrders, icon: ClipboardList },
    { id: 'wip', label: t.wipBalance, icon: Layout },
    { id: 'capture', label: t.productionCapture, icon: Layout },
    { id: 'quality', label: t.qualityControl, icon: ShieldCheck },
    { id: 'inventory', label: t.inventoryTitle, icon: ShoppingCart },
  ];

  if (userRole === 'admin' || userRole === 'supervisor') {
    menuItems.push({ id: 'users', label: t.userManagementTitle, icon: Users });
  }

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo">
        <div style={{ 
          width: '32px', 
          height: '32px', 
          background: 'var(--primary)', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
        }}>
          <Layout size={20} color="white" />
        </div>
        <span className="desktop-only" style={{ background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nexus ERP</span>
        <span className="mobile-only" style={{ marginLeft: 'auto' }}>
          <button 
            onClick={onClose}
            className="icon-btn"
          >
            <X size={24} />
          </button>
        </span>
      </div>

      <nav style={{ flex: 1 }}>
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

      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="nav-link"
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
        >
          <LogOut size={20} />
          <span>{t.signOut}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
