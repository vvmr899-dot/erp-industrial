import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import ProductionOrders from './components/ProductionOrders';
import ProductionWIP from './components/ProductionWIP';
import ProductionCapture from './components/ProductionCapture';
import ProductionScrap from './components/ProductionScrap';
import Inventory from './components/Inventory';
import Dashboard from './components/Dashboard';
import PartNumbers from './components/PartNumbers';
import ProductionRouting from './components/ProductionRouting';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import QualityInspections from './components/QualityInspections';
import WarehouseReceipts from './components/WarehouseReceipts';
import Traceability from './components/Traceability';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserRole(data?.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <ProductionOrders />;
      case 'wip':
        return <ProductionWIP />;
      case 'capture':
        return <ProductionCapture />;
      case 'scrap':
        return <ProductionScrap />;
      case 'inventory':
        return <Inventory />;
      case 'part_numbers':
        return <PartNumbers />;
      case 'routing':
        return <ProductionRouting />;
      case 'quality':
        return <QualityInspections userRole={userRole} />;
      case 'receipts':
        return <WarehouseReceipts userRole={userRole} />;
      case 'traceability':
        return <Traceability />;
      case 'users':
        return <UserManagement userRole={userRole} />;
      default:
        return (
          <div className="container">
            <h1 style={{ textTransform: 'capitalize' }}>{activeTab.replace('_', ' ')}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Módulo en desarrollo.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="mobile-header">
        <button 
          className={`hamburger-btn ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem' }}>Nexus ERP</span>
          <button 
            onClick={() => supabase.auth.signOut()}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              fontSize: '0.75rem', 
              cursor: 'pointer' 
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleNavClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />

      {/* Main Content */}
      <main className="main-content">
        <div style={{ position: 'absolute', top: '1rem', right: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }} className="desktop-only">
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{session.user.email} ({userRole})</span>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="btn"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          >
            Cerrar Sesión
          </button>
        </div>
        {renderContent()}
      </main>
    </>
  );
}

export default App;
