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
    scrapRate: 0,
    efficiency: 92,
    machineUtilization: 75
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [wipByArea, setWipByArea] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(false);
    
    try {
      // 1. KPIs Basics
      const { data: orders } = await supabase.from('production_orders').select('status');
      const active = orders?.filter(o => ['Liberada', 'En Proceso'].includes(o.status)).length || 0;

      const { data: wip } = await supabase.from('production_wip_balance').select('quantity_available, quantity_in_process');
      const wipSum = wip?.reduce((acc, curr) => acc + (curr.quantity_in_process || 0) + (curr.quantity_available || 0), 0) || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const { data: trans } = await supabase.from('wip_transactions').select('transaction_type, quantity').gte('created_at', today);
      
      const finishedToday = trans?.filter(t => t.transaction_type === 'PRODUCTION').reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0) || 0;
      const scrapToday = trans?.filter(t => t.transaction_type === 'SCRAP').reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0) || 0;
      const rate = (finishedToday + scrapToday) > 0 ? (scrapToday / (finishedToday + scrapToday)) * 100 : 0;

      // 2. Active Orders
      const { data: activeOrdersData } = await supabase
        .from('production_orders')
        .select(`
          order_number, quantity_planned,
          part_numbers(part_number)
        `)
        .in('status', ['En Proceso', 'Liberada'])
        .limit(5);

      setStats({
        activeOrders: active,
        wipTotal: wipSum,
        finishedToday: finishedToday,
        scrapRate: Math.round(rate * 10) / 10,
        efficiency: 92,
        machineUtilization: 78
      });
      
      setActiveOrders(activeOrdersData || []);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.65rem 1.25rem', borderRadius: '2rem', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
          <Clock size={14} className="text-primary" />
          <span>Último refresco: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <KPICard title="Órdenes" value={stats.activeOrders} sub="Órdenes en piso hoy" icon={ClipboardList} color="var(--primary)" glow />
        <KPICard title="Producción" value={stats.finishedToday} sub="Unidades terminadas hoy" icon={TrendingUp} color="var(--accent)" glow />
        <KPICard title="WIP" value={stats.wipTotal} sub="Total piezas en tránsito" icon={Activity} color="#f59e0b" />
        <KPICard title="Calidad" value={`${stats.scrapRate}%`} sub="Tasa de rechazo actual" icon={AlertCircle} color="var(--danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Main Chart Card */}
        <div className="card-mesh" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
             <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <BarChart3 size={20} className="text-primary" /> Distribución de Carga de Trabajo
             </h3>
             <div style={{ display: 'flex', gap: '0.5rem' }}>
               <div className="badge badge-info" style={{ fontSize: '0.6rem' }}>EN PROCESO</div>
             </div>
          </div>
          <div style={{ height: '280px', display: 'flex', alignItems: 'flex-end', gap: '2rem', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
            {/* Synthetic Data Visual for Bars */}
            {[
              { label: 'Maquinado', val: 85 },
              { label: 'Ensamble', val: 45 },
              { label: 'Calidad', val: 65 },
              { label: 'Pintura', val: 30 },
              { label: 'Empaque', val: 55 }
            ].map(b => (
              <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '100%', 
                  height: `${b.val * 2}px`, 
                  background: 'linear-gradient(to top, var(--primary), #818cf8)',
                  borderRadius: '12px 12px 4px 4px',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                  position: 'relative',
                  transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{b.val}</div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Lists */}
        <div className="card-mesh" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cpu size={20} className="text-accent" /> Estado Activos Críticos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { id: 'CNC-01', name: 'Haas VF-2', status: 'Active', load: 88, color: 'var(--accent)' },
              { id: 'ASM-04', name: 'Manual Line 4', status: 'Active', load: 72, color: 'var(--accent)' },
              { id: 'QUAL-01', name: 'CMM Bridge', status: 'Maintenance', load: 0, color: 'var(--warning)' },
              { id: 'PKG-02', name: 'Auto-Bagger', status: 'Idle', load: 15, color: 'var(--text-muted)' }
            ].map(asset => (
              <div key={asset.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{asset.id}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{asset.name}</div>
                  </div>
                  <div className="badge" style={{ background: `${asset.color}15`, color: asset.color, border: `1px solid ${asset.color}30` }}>
                    {asset.status.toUpperCase()}
                  </div>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                   <div style={{ width: `${asset.load}%`, height: '100%', background: asset.color, boxShadow: `0 0 10px ${asset.color}` }} />
                </div>
              </div>
            ))}
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
