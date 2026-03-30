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
          <div className="container animate-fade-in">
            <h1 className="display-small" style={{ textTransform: 'capitalize' }}>
              {activeTab.replace('_', ' ')}
            </h1>
            <p className="text-muted">Módulo en desarrollo.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <>
      {/* Background Radial Glow */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% -10%, rgba(99, 102, 241, 0.12), transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>

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
        {/* Desktop Header Overlay */}
        <div style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 10,
          background: 'rgba(3, 7, 18, 0.5)',
          backdropFilter: 'blur(8px)',
          margin: '-2.5rem -3rem 2rem',
          padding: '1.25rem 3rem',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '1.5rem',
          borderBottom: '1px solid var(--border)'
        }} className="desktop-only">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{session.user.email}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{userRole}</div>
            </div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'var(--primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)'
            }}>
              {session.user.email[0].toUpperCase()}
            </div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="btn"
            style={{ 
              padding: '0.5rem 1rem', 
              fontSize: '0.75rem', 
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
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
