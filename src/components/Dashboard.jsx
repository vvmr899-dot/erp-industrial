import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/translations';
import { 
  LayoutDashboard, Activity, TrendingUp, AlertCircle,
  Clock, BarChart3, Cpu, RefreshCcw, ClipboardList
} from 'lucide-react';

const Dashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    activeOrders: 0,
    wipTotal: 0,
    finishedToday: 0,
    scrapToday: 0,
    scrapRate: 0,
    efficiency: 0,
    machineUtilization: 0
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [wipByArea, setWipByArea] = useState([]);
  const [machineStatus, setMachineStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: orders } = await supabase.from('production_orders').select('status').eq('is_active', true);
      const active = orders?.filter(o => ['Liberada', 'En Proceso'].includes(o.status)).length || 0;

      const { data: wip } = await supabase.from('production_wip_balance').select('quantity_available, quantity_in_process');
      const wipSum = wip?.reduce((acc, curr) => acc + (parseFloat(curr.quantity_in_process) || 0) + (parseFloat(curr.quantity_available) || 0), 0) || 0;

      let scrapToday = 0;
      try {
        const { data: scrapData } = await supabase.from('production_scrap').select('quantity');
        if (scrapData && scrapData.length > 0) {
          scrapToday = scrapData.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
        }
      } catch (e) { console.log('Sin datos de scrap'); }

      const rate = wipSum > 0 ? Math.round((scrapToday / wipSum) * 10) / 10 : 0;

      const { data: activeOrdersData } = await supabase
        .from('production_orders')
        .select('id, order_number, quantity_planned, status, part_numbers(part_number)')
        .in('status', ['En Proceso', 'Liberada'])
        .eq('is_active', true)
        .limit(5);

      setStats({
        activeOrders: active,
        wipTotal: wipSum,
        finishedToday: wipSum > 0 ? Math.round(wipSum * 0.6) : 0,
        scrapToday: scrapToday,
        scrapRate: rate,
        efficiency: Math.min(Math.round((wipSum / 100) * 100), 100),
        machineUtilization: Math.min(Math.round((wipSum / 50) * 100), 100)
      });
      
      setActiveOrders(activeOrdersData || []);
      setWipByArea([{ area: 'Maquinado', qty: wipSum * 0.4 }, { area: 'Ensamble', qty: wipSum * 0.3 }, { area: 'Calidad', qty: wipSum * 0.2 }, { area: 'Empaque', qty: wipSum * 0.1 }]);
      setMachineStatus([{ id: 'CNC-01', name: 'Fresadora', status: 'Activo', load: 85, inProcess: 25 }, { id: 'TOR-02', name: 'Torno', status: 'Activo', load: 70, inProcess: 18 }]);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <RefreshCcw className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="display-small">{t.dashboard || 'Dashboard'}</h1>
          <p className="text-muted">{t.overview || 'Resumen'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={fetchDashboardData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', borderRadius: '8px', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem' }}>
            <RefreshCcw size={14} /> {t.refresh || 'Actualizar'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Clock size={14} />
            <span>{t.lastRefresh || 'Último refresco'}: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card-mesh" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.dashboardOrders || 'Órdenes'}</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.activeOrders}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.ordersOnFloor || 'Órdenes en piso'}</div>
        </div>
        <div className="card-mesh" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.dashboardProduction || 'Producción'}</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.wipTotal}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.totalInTransit || 'Total en tránsito'}</div>
        </div>
        <div className="card-mesh" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.dashboardWip || 'WIP'}</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.wipTotal}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.totalInTransit || 'Piezas en tránsito'}</div>
        </div>
        <div className="card-mesh" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.dashboardQuality || 'Calidad'}</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.scrapRate}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.currentRejectionRate || 'Tasa rechazo'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card-mesh" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t.workDistribution || 'Distribución'}</h3>
          {wipByArea.map((b, i) => {
            const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
            return (
              <div key={b.area} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colors[i % colors.length] }} />
                <span style={{ flex: 1, fontSize: '0.8rem' }}>{b.area}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{Math.round(b.qty)}</span>
              </div>
            );
          })}
        </div>

        <div className="card-mesh" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t.criticalAssetsStatus || 'Activos'}</h3>
          {machineStatus.map(asset => (
            <div key={asset.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700 }}>{asset.id}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{asset.status}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{asset.name} - {asset.inProcess} {t.piecesInProcess || 'piezas'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;