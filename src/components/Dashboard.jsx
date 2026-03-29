import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Package, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  Clock,
  CheckCircle2,
  BarChart3,
  Monitor,
  Cpu,
  RefreshCcw,
  ClipboardList
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeOrders: 0,
    wipTotal: 0,
    finishedToday: 0,
    scrapRate: 0,
    efficiency: 85, // Dummy initial
    machineUtilization: 72 // Dummy initial
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [wipByArea, setWipByArea] = useState([]);
  const [scrapHistory, setScrapHistory] = useState([]); // For chart
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(false); // Only set loading true once
    
    // 1. KPIs
    const { data: orders } = await supabase
      .from('production_orders')
      .select('id, status, quantity_planned');
    
    const active = orders?.filter(o => ['Liberada', 'En Proceso'].includes(o.status)).length || 0;

    const { data: wip } = await supabase
      .from('production_wip_balance')
      .select('quantity_available, quantity_in_process');
    
    const wipSum = wip?.reduce((acc, curr) => acc + (curr.quantity_in_process || 0) + (curr.quantity_available || 0), 0) || 0;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: trans } = await supabase
      .from('wip_transactions')
      .select('transaction_type, quantity, created_at')
      .gte('created_at', today);
    
    const finishedToday = trans?.filter(t => t.transaction_type === 'PRODUCTION')
                           .reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0) || 0;
    const scrapToday = trans?.filter(t => t.transaction_type === 'SCRAP')
                        .reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0) || 0;
    const totalToday = finishedToday + scrapToday;
    const rate = totalToday > 0 ? (scrapToday / totalToday) * 100 : 0;

    // 2. Active Orders Progress
    const { data: activeOrdersData } = await supabase
      .from('production_orders')
      .select(`
        id, order_number, status, quantity_planned,
        part_numbers(part_number, description),
        wip_balances:production_wip_balance(
          quantity_available,
          quantity_in_process,
          operation_name,
          operation_sequence
        )
      `)
      .in('status', ['En Proceso', 'Liberada'])
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    const processedOrders = [];
    if (activeOrdersData) {
      activeOrdersData.forEach(order => {
        let progress = 0;
        let activeOp = '';
        let activeOpPct = 0;

        if (order.status === 'Completada' || order.status === 'Cerrada') {
          progress = 100;
        } else if (order.wip_balances && order.wip_balances.length > 0) {
          const totalSteps = order.wip_balances.length;
          const planned = order.quantity_planned || 1;
          const steps = [...order.wip_balances].sort((a,b) => a.operation_sequence - b.operation_sequence);
          
          let totalOperationCompletions = 0;
          for (let i = 0; i < totalSteps; i++) {
            const itemsFinishedStepI = steps.slice(i + 1).reduce((acc, s) => acc + (parseFloat(s.quantity_available) || 0) + (parseFloat(s.quantity_in_process) || 0), 0);
            totalOperationCompletions += itemsFinishedStepI;
          }

          progress = (totalOperationCompletions / (planned * totalSteps)) * 100;

          const activeSteps = steps.filter(s => parseFloat(s.quantity_available) > 0 || parseFloat(s.quantity_in_process) > 0);
          if (activeSteps.length > 0) {
            const current = activeSteps[activeSteps.length - 1]; // Furthest active step
            activeOp = current.operation_name || `Op ${current.operation_sequence}`;
            
            const arrived = steps.slice(steps.indexOf(current)).reduce((acc, s) => acc + (parseFloat(s.quantity_available) || 0) + (parseFloat(s.quantity_in_process) || 0), 0);
            const passed = steps.slice(steps.indexOf(current) + 1).reduce((acc, s) => acc + (parseFloat(s.quantity_available) || 0) + (parseFloat(s.quantity_in_process) || 0), 0);
            
            if (arrived > 0) {
               activeOpPct = (passed / arrived) * 100;
            }
          }
        }

        processedOrders.push({
          number: order.order_number,
          part: order.part_numbers?.part_number || 'Desc.',
          planned: order.quantity_planned,
          cumProgress: Math.min(100, Math.max(0, Math.round(progress || 0))),
          activeOp: activeOp,
          activeOpPct: Math.min(100, Math.max(0, Math.round(activeOpPct || 0)))
        });
      });
    }

    // 3. WIP by Area
    const areaMap = {};
    const { data: routingWip } = await supabase
      .from('production_wip_balance')
      .select('quantity_in_process, routing:production_routing(machine_area)');
    
    routingWip?.forEach(item => {
      const area = item.routing?.machine_area || 'Sin Área';
      areaMap[area] = (areaMap[area] || 0) + (item.quantity_in_process || 0);
    });

    // 4. Machines and Utilization
    const { data: machineData } = await supabase.from('machines').select('*');
    const totalMachines = machineData?.length || 0;
    const activeMachinesCount = machineData?.filter(m => m.status === 'Active').length || 0;
    const utilization = totalMachines > 0 ? (activeMachinesCount / totalMachines) * 100 : 0;
    
    setMachines(machineData || []);

    setStats({
      activeOrders: active,
      wipTotal: wipSum,
      finishedToday: finishedToday,
      scrapRate: Math.round(rate * 10) / 10,
      efficiency: 92, // Target OEE
      machineUtilization: Math.round(utilization)
    });
    
    setActiveOrders(processedOrders);
    setWipByArea(Object.entries(areaMap).map(([name, value]) => ({ name, value })));
    setLastRefresh(new Date());
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Clock className="animate-spin" size={48} color="var(--primary)" />
    </div>
  );

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Dashboard de Producción</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas industriales en tiempo real.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <RefreshCcw size={14} className="animate-spin" style={{ animationDuration: '30s' }} />
          <span>Refresco automático: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card-mesh" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <ClipboardList size={20} color="var(--primary)" />
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>ÓRDENES</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.activeOrders}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Órdenes Activas</div>
        </div>

        <div className="card-mesh" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <TrendingUp size={20} color="var(--accent)" />
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>PRODUCCIÓN</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.finishedToday}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Salida Diaria (Hoy)</div>
        </div>

        <div className="card-mesh" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Activity size={20} color="#f59e0b" />
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>WIP</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.wipTotal}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Piezas en Piso</div>
        </div>

        <div className="card-mesh" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <AlertCircle size={20} color="var(--danger)" />
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>CALIDAD</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.scrapRate}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tasa de Rechazos</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* WIP Chart Visual */}
        <div className="card-mesh">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <BarChart3 size={18} color="var(--primary)" /> Flujo WIP por Área de Manufactura
          </h3>
          <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
            {wipByArea.map(area => (
              <div key={area.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)' }}>{area.value}</div>
                <div 
                  style={{ 
                    width: '100%', 
                    height: `${Math.min((area.value / (stats.wipTotal || 1)) * 300, 200)}px`, 
                    background: 'linear-gradient(to top, var(--primary), #818cf8)',
                    borderRadius: '4px 4px 0 0',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                    transition: 'height 1s ease-in-out'
                  }} 
                />
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', height: '1rem', whiteSpace: 'nowrap' }}>{area.name}</div>
              </div>
            ))}
            {wipByArea.length === 0 && <p style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>Sin datos de WIP activos.</p>}
          </div>
        </div>

        {/* Machine Performance */}
        <div className="card-mesh">
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Cpu size={18} color="var(--accent)" /> Estado de Maquinaria
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {machines.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: m.status === 'Active' ? 'var(--accent)' : m.status === 'Maintenance' ? '#f59e0b' : 'var(--danger)',
                    boxShadow: `0 0 10px ${m.status === 'Active' ? 'var(--accent)' : 'gray'}`
                  }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>{m.code}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.name}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: m.status === 'Active' ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {m.status.toUpperCase()}
                </span>
              </div>
            ))}
            {machines.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No hay máquinas registradas.</p>}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
        {/* Efficiency Chart Placeholder */}
        <div className="card-mesh" style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1rem', fontWeight: '700' }}>EFICIENCIA PROMEDIO</h4>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
             <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
               <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
               <circle 
                  cx="60" cy="60" r="50" fill="none" 
                  stroke="var(--primary)" 
                  strokeWidth="8" 
                  strokeDasharray="314" 
                  strokeDashoffset={314 - (314 * stats.efficiency / 100)} 
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.5s ease' }}
               />
             </svg>
             <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.efficiency}%</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>GENERAL</div>
             </div>
          </div>
        </div>

        {/* Utilization Gauge */}
        <div className="card-mesh" style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1rem', fontWeight: '700' }}>UTILIZACIÓN MAQUINARIA</h4>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
             <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
               <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
               <circle 
                  cx="60" cy="60" r="50" fill="none" 
                  stroke="var(--accent)" 
                  strokeWidth="8" 
                  strokeDasharray="314" 
                  strokeDashoffset={314 - (314 * stats.machineUtilization / 100)} 
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.5s ease' }}
               />
             </svg>
             <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.machineUtilization}%</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ACTIVO</div>
             </div>
          </div>
        </div>

        {/* Orders Progress Summary */}
        <div className="card-mesh">
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1.25rem', fontWeight: '700' }}>TOP ÓRDENES EN PROCESO</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activeOrders.map(o => (
              <div key={o.number}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: '700', marginRight: '0.5rem' }}>{o.number}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{o.part}</span>
                  </div>
                  <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{Math.round(o.cumProgress)}% Total</span>
                </div>
                
                {/* Overall Progress Bar */}
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{ width: `${o.cumProgress}%`, height: '100%', background: 'linear-gradient(to right, var(--primary), #818cf8)', transition: 'width 1s ease' }} />
                </div>

                {/* Sub-label for specific OP progress */}
                {o.activeOp && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                    <div style={{ color: 'var(--accent)', fontWeight: '600' }}>
                      <Activity size={10} style={{ marginRight: '4px' }} />
                      {o.activeOp}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>Avance etapa: {Math.round(o.activeOpPct)}%</div>
                  </div>
                )}
              </div>
            ))}
            {activeOrders.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No hay órdenes activas.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
