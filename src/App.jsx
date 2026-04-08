import React, { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import { LanguageProvider, useLanguage } from './lib/translations';
import Sidebar from './components/Sidebar';
import { Layout } from 'lucide-react';

const ProductionOrders = lazy(() => import('./components/ProductionOrders'));
const ProductionWIP = lazy(() => import('./components/ProductionWIP'));
const ProductionCapture = lazy(() => import('./components/ProductionCapture'));
const Inventory = lazy(() => import('./components/Inventory'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const PartNumbers = lazy(() => import('./components/PartNumbers'));
const ProductionRouting = lazy(() => import('./components/ProductionRouting'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const Login = lazy(() => import('./components/Login'));
const QualityInspections = lazy(() => import('./components/QualityInspections'));

function LanguageSelector() {
  const { lang, setLang, t } = useLanguage();
  
  const langConfig = {
    es: { label: "ES", locale: "es-MX" },
    en: { label: "EN", locale: "en-US" },
    zh: { label: "中", locale: "zh-CN" }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {Object.entries(langConfig).map(([code, config]) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            borderRadius: '4px',
            background: lang === code ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
            color: lang === code ? '#8B5CF6' : 'var(--text-muted)',
            border: `1px solid ${lang === code ? '#8B5CF6' : 'var(--border)'}`,
            cursor: 'pointer',
            fontWeight: lang === code ? 600 : 400,
            transition: 'all 0.15s'
          }}
        >
          {config.label}
        </button>
      ))}
    </div>
  );
}

function AppContent() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

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

  // Realtime Alerts para Scrap (Rechazos) - Modal Persistente
  useEffect(() => {
    if (!session || !["admin", "calidad", "administrador"].includes(userRole?.toLowerCase())) {
      return;
    }

    const channel = supabase.channel('scrap_alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'production_scrap' },
        (payload) => {
          try {
            const newRecord = payload.new;
            if (!newRecord) return;
            const qty = newRecord.quantity || 0;
            const defect = newRecord.defect_type || "No especificado";
            const status = newRecord.status || '';
            const recordId = newRecord.id;
            
            if (status === 'RECHAZADO' || status === 'Pendiente') {
              setCriticalAlerts(prev => {
                if (prev.some(a => a.id === recordId)) return prev;
                return [...prev, { id: recordId, qty, defect }];
              });
            }
          } catch (e) {
            console.error('Error processing scrap alert:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, userRole]);

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
    if (userRole === 'supervisor' && ['users', 'quality', 'inventory'].includes(tab)) {
      alert('No tienes permisos para acceder a este módulo.');
      return;
    }
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <ProductionOrders userRole={userRole} />;
      case 'wip':
        return <ProductionWIP userRole={userRole} />;
      case 'capture':
        return <ProductionCapture userRole={userRole} />;
      case 'inventory':
        return <Inventory userRole={userRole} />;
      case 'part_numbers':
        return <PartNumbers userRole={userRole} />;
      case 'routing':
        return <ProductionRouting userRole={userRole} />;
      case 'quality':
        return <QualityInspections userRole={userRole} session={session} embedded />;
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
        {/* Mobile Header */}
        <div style={{ 
          display: 'none',
          position: 'sticky', 
          top: 0, 
          zIndex: 10,
          background: 'rgba(3, 7, 18, 0.9)',
          backdropFilter: 'blur(8px)',
          margin: '-1rem -1rem 1rem',
          padding: '0.75rem 1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)'
        }} className="mobile-menu-btn">
          <button 
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '0.5rem' }}
          >
            <Layout size={24} />
          </button>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>ERP</div>
          <div style={{ width: 24 }}></div>
        </div>

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
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)'
        }} className="desktop-only">
          <LanguageSelector />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
              {t.signOut}
            </button>
          </div>
        </div>

        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><div className="animate-spin text-primary">Cargando...</div></div>}>
          {renderContent()}
        </Suspense>

        {/* Modal Bloqueante de Alerta Crítica (Rechazos) */}
        {criticalAlerts.length > 0 && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(153, 27, 27, 0.95)', // Deep red
            backdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '2rem',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '1rem', animation: 'pulse 1s ease-in-out infinite alternate' }}>
              ⚠️
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '-0.05em', marginBottom: '1rem', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
              REPORTE DE RECHAZO DETECTADO
            </h1>
            <div style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '3rem', textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: '2rem 3rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <span style={{ fontSize: '1.25rem', opacity: 0.9 }}>
                Se reportó: <strong>{criticalAlerts[criticalAlerts.length - 1].qty} pieza(s)</strong> por defecto de <strong>"{criticalAlerts[criticalAlerts.length - 1].defect}"</strong>.
              </span>
            </div>
            
            <button 
              className="btn"
              onClick={() => {
                setCriticalAlerts([]); 
                setActiveTab('quality'); 
              }}
              style={{
                background: '#FFFFFF',
                color: '#991B1B',
                padding: '1.25rem 3rem',
                fontSize: '1.25rem',
                fontWeight: 800,
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                textTransform: 'uppercase'
              }}
            >
              ✅ ENTERADO, IR A CALIDAD
            </button>
          </div>
        )}
      </main>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
