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
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = today + 'T00:00:00.000Z';

      let active = 0;
      try {
        const { data: orders, error: ordersErr } = await supabase.from('production_orders').select('status').eq('is_active', true);
        if (!ordersErr && orders) {
          active = orders.filter(o => ['Liberada', 'En Proceso'].includes(o.status)).length;
        }
      } catch (e) { console.error('Error fetching orders:', e); }

      let wipSum = 0;
      try {
        const { data: wip, error: wipErr } = await supabase.from('production_wip_balance').select('quantity_available, quantity_in_process');
        if (!wipErr && wip) {
          wipSum = wip.reduce((acc, curr) => acc + (parseFloat(curr.quantity_in_process) || 0) + (parseFloat(curr.quantity_available) || 0), 0);
        }
      } catch (e) { console.error('Error fetching WIP:', e); }

      let scrapToday = 0;
      let finishedToday = 0;

      try {
        const { data: scrapData, error: scrapErr } = await supabase
          .from('production_scrap')
          .select('quantity, created_at')
          .gte('created_at', startOfDay)
          .neq('status', 'APROBADO');
        if (!scrapErr && scrapData && scrapData.length > 0) {
          scrapToday = scrapData.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
        }
      } catch (e) { console.error('Error fetching scrap:', e); }

      try {
        const { data: finishedData, error: txErr } = await supabase
          .from('inventory_transactions')
          .select('quantity')
          .eq('transaction_type', 'FINISHED_GOODS_RECEIPT')
          .gte('created_at', startOfDay);
        if (!txErr && finishedData && finishedData.length > 0) {
          finishedToday = finishedData.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
        }
      } catch (e) { console.error('Error fetching transactions:', e); }

      try {
        const { data: stockData, error: stockErr } = await supabase
          .from('inventory_stock')
          .select('quantity')
          .gt('quantity', 0);
        if (!stockErr && stockData && stockData.length > 0) {
          const totalStock = stockData.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
          if (totalStock > finishedToday) {
            finishedToday = totalStock;
          }
        }
      } catch (e) { console.error('Error fetching stock:', e); }

      const totalProd = finishedToday + scrapToday;
      const rate = totalProd > 0 ? Math.round((scrapToday / totalProd) * 100) : 0;

      let activeOrdersData = [];
      try {
        const { data, error } = await supabase
          .from('production_orders')
          .select('id, order_number, quantity_planned, status, part_numbers(part_number)')
          .in('status', ['En Proceso', 'Liberada'])
          .eq('is_active', true)
          .limit(5);
        if (!error && data) activeOrdersData = data;
      } catch (e) { console.error('Error fetching active orders:', e); }

      const areaMap = {};
      try {
        const { data: wipAreasData, error: areaErr } = await supabase
          .from('production_wip_balance')
          .select('quantity_available, routing_id')
          .gt('quantity_available', 0);
        if (!areaErr && wipAreasData) {
          for (const w of wipAreasData) {
            const { data: routing } = await supabase.from('production_routing').select('machine_area').eq('id', w.routing_id).single();
            const area = routing?.machine_area || 'Sin área';
            if (!areaMap[area]) areaMap[area] = 0;
            areaMap[area] += parseFloat(w.quantity_available) || 0;
          }
        }
      } catch (e) { console.error('Error fetching WIP areas:', e); }
      const wipByAreaReal = Object.entries(areaMap).map(([area, qty]) => ({ area, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);

      let machineStatusReal = [];
      try {
        const { data: routingMachines, error: machErr } = await supabase
          .from('production_routing')
          .select('id, work_center, machine_area, operation_name')
          .not('work_center', 'is', null)
          .limit(10);
        if (!machErr && routingMachines) {
          machineStatusReal = routingMachines.map((m, i) => ({
            id: m.work_center || `MC-${i + 1}`,
            name: m.operation_name || m.machine_area || 'Máquina',
            status: 'Activo',
            load: 75,
            inProcess: 0
          }));
        }
      } catch (e) { console.error('Error fetching machines:', e); }

      setStats({
        activeOrders: active,
        wipTotal: wipSum,
        finishedToday: finishedToday,
        scrapToday: scrapToday,
        scrapRate: rate,
        efficiency: wipSum > 0 ? Math.min(Math.round((finishedToday / wipSum) * 100), 100) : 0,
        machineUtilization: machineStatusReal.length > 0 ? Math.round((machineStatusReal.filter(m => m.status === 'Activo').length / machineStatusReal.length) * 100) : 0
      });
      
      setActiveOrders(activeOrdersData);
      setWipByArea(wipByAreaReal.length > 0 ? wipByAreaReal : [{ area: 'Sin datos', qty: 0 }]);
      setMachineStatus(machineStatusReal.length > 0 ? machineStatusReal : []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Error en fetchDashboardData:', e);
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
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.finishedToday}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.terminados || 'Terminados hoy'}</div>
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