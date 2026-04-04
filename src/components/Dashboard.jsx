import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, Package, Activity, TrendingUp, AlertCircle,
  Clock, CheckCircle2, BarChart3, Cpu, RefreshCcw, ClipboardList, ShieldCheck, Truck
} from 'lucide-react';

const Dashboard = () => {
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
      const endOfDay = today + 'T23:59:59.999Z';

      // 1. Órdenes Activas
      const { data: orders } = await supabase.from('production_orders').select('status').eq('is_active', true);
      const active = orders?.filter(o => ['Liberada', 'En Proceso'].includes(o.status)).length || 0;

      // 2. WIP Total
      const { data: wip } = await supabase.from('production_wip_balance').select('quantity_available, quantity_in_process');
      const wipSum = wip?.reduce((acc, curr) => acc + (parseFloat(curr.quantity_in_process) || 0) + (parseFloat(curr.quantity_available) || 0), 0) || 0;

      // 3. Terminados Hoy (de inventory_transactions - Finished Goods)
      const { data: finishedData } = await supabase
        .from('inventory_transactions')
        .select('quantity')
        .eq('transaction_type', 'FINISHED_GOODS_RECEIPT')
        .gte('created_at', startOfDay);
      const finishedToday = finishedData?.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0) || 0;

      // 4. Scrap Total (de production_scrap con status RECHAZADO o Pendiente)
      let scrapToday = 0;
      try {
        const { data: scrapData } = await supabase
          .from('production_scrap')
          .select('quantity');
        if (scrapData && scrapData.length > 0) {
          scrapToday = scrapData.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
        }
      } catch (e) {
        console.log('Sin datos de scrap o error:', e);
      }

      // 5. Tasa de Scrap
      const totalProduced = finishedToday + scrapToday;
      const rate = totalProduced > 0 ? Math.round((scrapToday / totalProduced) * 10) / 10 : 0;

      // 6. Eficiencia (basado en operaciones completadas vs planificado)
      const { data: allOrders } = await supabase.from('production_orders').select('quantity_planned');
      const totalPlanned = allOrders?.reduce((acc, o) => acc + (parseFloat(o.quantity_planned) || 0), 0) || 0;
      const efficiency = totalPlanned > 0 ? Math.round((finishedToday / totalPlanned) * 100) : 0;

      // 7. Utilización de máquinas (basado en operaciones en proceso)
      const { data: inProcessData } = await supabase
        .from('production_wip_balance')
        .select('quantity_in_process')
        .gt('quantity_in_process', 0);
      const machinesWithWork = inProcessData?.length || 0;
      const totalMachines = await supabase.from('production_routing').select('work_center', { count: 'exact', head: true });
      const machineUtilization = totalMachines.count > 0 ? Math.round((machinesWithWork / Math.min(totalMachines.count, 20)) * 100) : 0;

      // 8. Órdenes Activas con Detalle
      const { data: activeOrdersData } = await supabase
        .from('production_orders')
        .select('id, order_number, quantity_planned, status, created_at, part_numbers(part_number, description)')
        .in('status', ['En Proceso', 'Liberada'])
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      // 9. WIP por Área
      const { data: wipAreas } = await supabase
        .from('production_wip_balance')
        .select('quantity_available, quantity_in_process, routing_id')
        .gt('quantity_available', 0);
      
      const areaMap = {};
      for (const w of (wipAreas || [])) {
        const { data: routing } = await supabase.from('production_routing').select('machine_area').eq('id', w.routing_id).single();
        const area = routing?.machine_area || 'Sin área';
        if (!areaMap[area]) areaMap[area] = 0;
        areaMap[area] += parseFloat(w.quantity_available) || 0;
      }
      const wipByAreaData = Object.entries(areaMap).map(([area, qty]) => ({ area, qty })).slice(0, 5);

      // 10. Estado de Máquinas/Activos desde production_routing
      const { data: routingData } = await supabase
        .from('production_routing')
        .select('id, work_center, machine_area, operation_name, is_final_operation')
        .not('work_center', 'is', null)
        .order('machine_area');
      
      const { data: wipData } = await supabase
        .from('production_wip_balance')
        .select('routing_id, quantity_in_process');
      
      const wipByRouting = {};
      wipData?.forEach(w => { wipByRouting[w.routing_id] = parseFloat(w.quantity_in_process) || 0; });
      
      const machineMap = {};
      routingData?.forEach(r => {
        const key = r.work_center || r.machine_area || 'Sin asignar';
        if (!machineMap[key]) {
          machineMap[key] = { 
            id: key, 
            name: r.operation_name || key, 
            area: r.machine_area || 'General',
            inProcess: 0 
          };
        }
        machineMap[key].inProcess += wipByRouting[r.id] || 0;
      });
      
      const machineStatusData = Object.values(machineMap)
        .map(m => ({
          ...m,
          status: m.inProcess > 0 ? 'Activo' : 'Inactivo',
          load: Math.min(Math.round((m.inProcess / 100) * 100), 100)
        }))
        .sort((a, b) => b.inProcess - a.inProcess)
        .slice(0, 6);

      setStats({
        activeOrders: active,
        wipTotal: wipSum,
        finishedToday: finishedToday,
        scrapToday: scrapToday,
        scrapRate: Math.round(rate * 10) / 10,
        efficiency: Math.min(efficiency, 100),
        machineUtilization: Math.min(machineUtilization, 100)
      });
      
      setActiveOrders(activeOrdersData || []);
      setWipByArea(wipByAreaData);
      setMachineStatus(machineStatusData);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({ title, value, sub, icon: Icon, color, glow }) => (
    <div className="card-mesh" style={{ 
      position: 'relative', 
      overflow: 'hidden',
      borderLeft: `4px solid ${color}`,
      background: glow ? `linear-gradient(135deg, ${color}10, var(--card))` : 'var(--card)'
    }}>
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
        <Icon size={100} color={color} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '10px', 
          background: `${color}20`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: `1px solid ${color}40`
        }}>
          <Icon size={20} color={color} />
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      <div style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <RefreshCcw className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="display-small">Resumen de Operaciones</h1>
          <p className="text-muted">Estado actual de la planta en tiempo real.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', borderRadius: '8px', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.65rem 1.25rem', borderRadius: '2rem', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
            <Clock size={14} className="text-primary" />
            <span>Último refresco: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <KPICard title="Órdenes" value={stats.activeOrders} sub="Órdenes en piso hoy" icon={ClipboardList} color="var(--primary)" glow />
        <KPICard title="Producción" value={stats.finishedToday} sub="Unidades terminadas hoy" icon={TrendingUp} color="var(--accent)" glow />
        <KPICard title="WIP" value={stats.wipTotal} sub="Total piezas en tránsito" icon={Activity} color="#f59e0b" />
        <KPICard title="Calidad" value={`${stats.scrapRate}%`} sub="Tasa de rechazo actual" icon={AlertCircle} color="var(--danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Main Chart Card - Donut Chart */}
        <div className="card-mesh" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <BarChart3 size={20} className="text-primary" /> Distribución de Carga de Trabajo
             </h3>
          </div>
          {wipByArea.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
              <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  {(() => {
                    const total = wipByArea.reduce((acc, b) => acc + b.qty, 0);
                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                    let cumulative = 0;
                    return wipByArea.map((b, i) => {
                      const percent = (b.qty / total) * 100;
                      const dashArray = `${percent} ${100 - percent}`;
                      const dashOffset = -cumulative;
                      cumulative += percent;
                      return (
                        <circle 
                          key={b.area} 
                          cx="50" cy="50" r="40" 
                          fill="none" 
                          stroke={colors[i % colors.length]} 
                          strokeWidth="20"
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          style={{ transition: 'all 0.5s ease' }}
                        />
                      );
                    });
                  })()}
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{wipByArea.reduce((acc, b) => acc + b.qty, 0)}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total WIP</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {wipByArea.map((b, i) => {
                  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  const total = wipByArea.reduce((acc, x) => acc + x.qty, 0);
                  const percent = Math.round((b.qty / total) * 100);
                  return (
                    <div key={b.area} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colors[i % colors.length] }} />
                      <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{b.area}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.qty} ({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
              No hay datos de carga de trabajo
            </div>
          )}
        </div>

        {/* Status Lists */}
        <div className="card-mesh" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cpu size={20} className="text-accent" /> Estado Activos Críticos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {machineStatus.length > 0 ? machineStatus.map(asset => (
              <div key={asset.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{asset.id}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{asset.name}</div>
                  </div>
                  <div className="badge" style={{ background: `${asset.status === 'Activo' ? 'var(--accent)' : 'var(--text-muted)'}15`, color: asset.status === 'Activo' ? 'var(--accent)' : 'var(--text-muted)', border: `1px solid ${asset.status === 'Activo' ? 'var(--accent)' : 'var(--text-muted)'}30` }}>
                    {asset.status.toUpperCase()}
                  </div>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                   <div style={{ width: `${asset.load}%`, height: '100%', background: asset.status === 'Activo' ? 'var(--accent)' : 'var(--text-muted)', boxShadow: `0 0 10px ${asset.status === 'Activo' ? 'var(--accent)' : 'transparent'}` }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {asset.inProcess} piezas en proceso
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No hay máquinas con actividad reciente
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
         {/* Gauges */}
         {[
           { label: 'OEE PROMEDIO', val: stats.efficiency, color: 'var(--primary)' },
           { label: 'UTILIZACIÓN', val: stats.machineUtilization, color: 'var(--accent)' }
         ].map(g => (
           <div key={g.label} className="card-mesh" style={{ textAlign: 'center', padding: '2rem' }}>
              <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>{g.label}</h4>
              <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
                  <circle 
                    cx="60" cy="60" r="54" fill="none" 
                    stroke={g.color} 
                    strokeWidth="10" 
                    strokeDasharray="339.29" 
                    strokeDashoffset={339.29 - (339.29 * g.val / 100)} 
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 8px ${g.color}40)`, transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{g.val}%</div>
                </div>
              </div>
           </div>
         ))}

         {/* Latest Active Orders */}
         <div className="card-mesh" style={{ padding: '1.5rem' }}>
           <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>ÓRDENES PRIORITARIAS</h4>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {activeOrders.map(o => (
               <div key={o.order_number} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '0.5rem', hover: { background: 'rgba(255,255,255,0.05)' } }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Package size={16} className="text-primary" />
                 </div>
                 <div style={{ flex: 1 }}>
                   <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{o.order_number}</div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{o.part_numbers?.part_number}</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{o.quantity_planned}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Planeado</div>
                 </div>
               </div>
             ))}
           </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
