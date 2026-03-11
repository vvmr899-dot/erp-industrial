import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ProductionOrders from './components/ProductionOrders';
import ProductionWIP from './components/ProductionWIP';
import ProductionCapture from './components/ProductionCapture';
import ProductionScrap from './components/ProductionScrap';
import Inventory from './components/Inventory';
import Dashboard from './components/Dashboard';
import PartNumbers from './components/PartNumbers';
import ProductionRouting from './components/ProductionRouting';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      default:
        return (
          <div className="container">
            <h1 style={{ textTransform: 'capitalize' }}>{activeTab.replace('_', ' ')}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Módulo en desarrollo.</p>
          </div>
        );
    }
  };

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
        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem' }}>Nexus ERP</span>
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
      />

      {/* Main Content */}
      <main className="main-content">
        {renderContent()}
      </main>
    </>
  );
}

export default App;
