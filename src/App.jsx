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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
    </>
  );
}

export default App;