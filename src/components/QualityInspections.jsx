import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/translations';
import { Trash2 } from "lucide-react";

const G = {
  bg: "#030712",
  surface: "rgba(10, 11, 16, 0.8)",
  card: "rgba(17, 24, 39, 0.7)",
  border: "rgba(255, 255, 255, 0.1)",
  accent: "#6366F1",
  accentDim: "rgba(99, 102, 241, 0.15)",
  green: "#10B981",
  greenDim: "rgba(16, 185, 129, 0.1)",
  red: "#EF4444",
  redDim: "rgba(239, 68, 68, 0.15)",
  amber: "#F59E0B",
  amberDim: "rgba(245, 158, 11, 0.15)",
  purple: "#8B5CF6",
  purpleDim: "rgba(139, 92, 246, 0.1)",
  text: "#FFFFFF",
  muted: "#94A3B8",
  subtle: "#64748B",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
  
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${G.bg};color:${G.text};font-family:'Inter',sans-serif;font-size:14.5px;line-height:1.5; -webkit-font-smoothing: antialiased}
  
  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${G.border};border-radius:10px}
  ::-webkit-scrollbar-thumb:hover{background:${G.subtle}}

  .mono{font-family:'IBM Plex Mono',monospace}
  
  .card{
    background:${G.card};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid ${G.border};
    border-radius: 12px;
    transition: all 0.2s ease;
  }
  .card:hover{
    box-shadow: 0 8px 30px rgba(0,0,0,0.04);
    border-color: ${G.subtle}44;
  }

  table{border-collapse:separate;border-spacing:0;width:100%}
  th{
    background:rgba(10, 11, 16, 0.5);
    color:${G.muted};
    font-size:11px;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.05em;
    padding:14px 16px;
    text-align:left;
    border-bottom:1px solid ${G.border};
    position:sticky;
    top:0;
    z-index:10;
  }
  td{
    padding:16px;
    border-bottom:1px solid ${G.border};
    font-size:13.5px;
    vertical-align:middle;
    color:${G.text};
    transition: background 0.1s ease;
  }
  tr:hover td{background:rgba(255, 255, 255, 0.02)}
  tr:last-child td{border-bottom:none}

  input,select,textarea{
    background:rgba(17, 24, 39, 0.6);
    border:1px solid ${G.border};
    color:#FFFFFF;
    padding:12px 16px;
    border-radius:8px;
    font-family:'Inter',sans-serif;
    font-size:14px;
    outline:none;
    transition: all 0.2s ease;
  }
  input:focus,select:focus,textarea:focus{
    border-color:${G.accent};
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    background:rgba(17, 24, 39, 0.8);
  }
  input::placeholder{color:${G.subtle}}

  button{
    cursor:pointer;
    font-family:'IBM Plex Sans',sans-serif;
    font-size:13.5px;
    font-weight:600;
    border:none;
    border-radius:6px;
    padding:10px 20px;
    transition:all .2s cubic-bezier(0.4, 0, 0.2, 1);
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    user-select: none;
  }
  button:disabled{opacity:0.5;cursor:not-allowed}

  .btn-primary{background:${G.accent};color:#fff;box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1)}
  .btn-primary:hover:not(:disabled){background:#1D4ED8;transform:translateY(-1px);box-shadow: 0 4px 6px rgba(37,99,235,0.2)}
  .btn-primary:active{transform:translateY(0)}

  .btn-ghost{background:#FFFFFF;color:${G.text};border:1px solid ${G.border}}
  .btn-ghost:hover:not(:disabled){background:#F8FAFC;border-color:${G.subtle}}

  .btn-success{background:${G.green};color:#fff}
  .btn-success:hover:not(:disabled){background:#059669;box-shadow: 0 4px 6px rgba(16,185,129,0.2)}

  .btn-danger{background:${G.red};color:#fff}
  .btn-danger:hover:not(:disabled){background:#DC2626;box-shadow: 0 4px 6px rgba(239,68,68,0.2)}

  .badge{
    display:inline-flex;
    align-items:center;
    padding:4px 10px;
    border-radius:6px;
    font-size:11.5px;
    font-weight:700;
    font-family:'IBM Plex Mono',monospace;
    border-width: 1px;
    border-style: solid;
    text-transform: uppercase;
  }

  .modal-overlay{
    position:fixed;
    inset:0;
    background:rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(8px);
    z-index:100;
    display:flex;
    align-items:center;
    justify-content:center;
    padding: 20px;
  }
  .modal{
    background:#FFFFFF;
    border-radius:12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid ${G.border};
  }

  .label{
    display:block;
    color:${G.muted};
    font-size:11px;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.05em;
    margin-bottom:6px;
  }

  .alert{
    padding:14px 18px;
    border-radius:8px;
    font-size:14px;
    margin-bottom:24px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
  }
  .alert-error{background:${G.redDim};color:${G.red};border:1px solid ${G.red}44}

  /* Responsive Adjustments */
  @media (max-width: 1024px) {
    .dashboard-stats { flex-wrap: wrap !important; }
    .dashboard-stats > div { min-width: calc(33.333% - 16px) !important; flex: 1 1 auto; }
  }
  @media (max-width: 768px) {
    .dashboard-stats > div { min-width: calc(50% - 16px) !important; }
    .header-main { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
    .header-actions { margin-left: 0 !important; width: 100% !important; justify-content: space-between !important; flex-wrap: wrap !important; gap: 16px !important; }
    .toolbar { flex-direction: column !important; align-items: stretch !important; }
    .toolbar-search { flex: 1 !important; width: 100% !important; }
    .toolbar-actions { margin-left: 0 !important; justify-content: space-between !important; width: 100% !important; }
    .tabs-nav { flex-wrap: wrap !important; }
    .tabs-nav button { flex: 1 1 auto !important; justify-content: center !important; padding: 12px 8px !important; font-size: 13px !important; }
    .modal { margin: 10px !important; width: calc(100% - 20px) !important; max-height: calc(100vh - 20px) !important; }
    .grid-2-cols { grid-template-columns: 1fr !important; gap: 16px !important; }
  }
`;

const DISPOSICIONES = [
  { value: "Pending", label: "Pendiente", bg: "#FEF3C7", color: "#B45309", borderColor: "#FDE68A" },
  { value: "Pendiente", label: "Pendiente", bg: "#FEF3C7", color: "#B45309", borderColor: "#FDE68A" },
  { value: "Approved", label: "Aprobada", bg: "#D1FAE5", color: "#065F46", borderColor: "#A7F3D0" },
  { value: "APROBADO", label: "Aprobada", bg: "#D1FAE5", color: "#065F46", borderColor: "#A7F3D0" },
  { value: "Rejected", label: "Rechazada", bg: "#FEE2E2", color: "#991B1B", borderColor: "#FECACA" },
  { value: "RECHAZADO", label: "Rechazada", bg: "#FEE2E2", color: "#991B1B", borderColor: "#FECACA" },
  { value: "Liberado", label: "Liberado", bg: "#D1FAE5", color: "#065F46", borderColor: "#A7F3D0" },
  { value: "Rework", label: "Reproceso", bg: "#EDE9FE", color: "#5B21B6", borderColor: "#DDD6FE" },
];

const TIPOS_DEFECTOS = [
  "Dimensional", "Visual/Acabado", "Material", "Funcional", "Otro"
];

function BadgeDisposicion({ disposition }) {
  const d = DISPOSICIONES.find(x => x.value === disposition) || DISPOSICIONES[0];
  return (
    <span className="badge" style={{ background: d.bg, color: d.color, borderColor: d.borderColor }}>
      {d.label}
    </span>
  );
}

const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("es-MX", { day: "2-digit", month: "numeric", hour: "2-digit", minute: "2-digit" });
};

const fmtDateShort = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "numeric" });
};

const normalizeState = (v) => (v || "").toString().trim().toUpperCase();

const getItemState = (item) => normalizeState(item?.status || item?.disposition);

const isPendingState = (state) => ["PENDING", "PENDIENTE"].includes(state);
const isApprovedState = (state) => ["APPROVED", "APROBADO", "LIBERADO"].includes(state);
const isRejectedState = (state) => ["REJECTED", "RECHAZADO", "NO RETRABAJADO"].includes(state);

const isScrapDefectRecord = (item) => {
  const dt = normalizeState(item?.defect_type);
  return !!dt && dt !== "N/A" && dt !== "NA";
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "20px 24px", flex: 1, minWidth: 150 }}>
      <div className="label" style={{ marginBottom: 12 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: G.text, letterSpacing: "-0.01em" }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 13, fontWeight: 600, color: color || G.muted, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Component ──────────────────────────────────────────────────────
function Dashboard({ data, t }) {
  const tasaAprobacion = data.approvedRate || "0.0";
  const tasaRechazo = data.rejectedRate || "0.0";

  return (
    <div>
      <div className="dashboard-stats" style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label={t.totalInspections} value={data.totalPieces} sub={t.piezas} />
        <StatCard label={t.pendingInspections} value={data.pending} sub={t.porRevisar} color={G.amber} />
        <StatCard label={t.approvedPieces} value={data.approvedPieces} sub={t.piezas} color={G.green} />
        <StatCard label={t.rejectedPieces} value={data.rejectedPieces} sub={t.piezas} color={G.red} />
        <StatCard label={t.totalScrap} value={data.totalScrap} sub={t.piezas} color={G.red} />
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: G.text }}>{t.qualityIndicators}</div>
        <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: G.muted }}>{t.approvalRate}</span>
              <span style={{ fontWeight: 700, color: G.green }}>{tasaAprobacion}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, overflow: "hidden" }}>
              <div style={{ width: `${tasaAprobacion}%`, height: "100%", background: G.green, borderRadius: 10, transition: 'width 1s ease' }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: G.muted }}>{t.rejectionRate}</span>
              <span style={{ fontWeight: 700, color: G.red }}>{tasaRechazo}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, overflow: "hidden" }}>
              <div style={{ width: `${tasaRechazo}%`, height: "100%", background: G.red, borderRadius: 10, transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ListaInspecciones Component ──────────────────────────────────────────────
function ListaInspecciones({ scrap, onInspeccionar, onRefresh, loading, t, title, isReadOnly = false, onDelete }) {
  const [q, setQ] = useState("");
  const [dispFilter, setDispFilter] = useState("Todos");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = scrap.filter(s => {
    const statusVal = s.status || s.disposition;
    const matchQ = !q ||
      s.order?.order_number?.toLowerCase().includes(q.toLowerCase()) ||
      s.order?.part_numbers?.part_number?.toLowerCase().includes(q.toLowerCase()) ||
      s.operator_name?.toLowerCase().includes(q.toLowerCase());
    
    let matchDisp = true;
    if (dispFilter !== "Todos") {
      const validGroupValues = DISPOSICIONES.filter(dx => dx.label === dispFilter).map(dx => dx.value);
      matchDisp = (statusVal === dispFilter || validGroupValues.includes(statusVal));
    }
    
    return matchQ && matchDisp;
  });

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const pages = Math.ceil(filtered.length / perPage);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {title && <h3 style={{ marginBottom: 18, fontSize: 18, fontWeight: 700, color: G.text, letterSpacing: '-0.01em' }}>{title}</h3>}
      
      <div className="card toolbar" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div className="toolbar-search" style={{ position: 'relative', flex: '1 1 250px' }}>
          <input 
            value={q} 
            onChange={e => { setQ(e.target.value); setPage(1); }} 
            placeholder={t.search + "..."} 
            style={{ paddingLeft: '38px', width: '100%' }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: G.subtle, fontSize: '16px' }}>🔍</span>
        </div>
        
        {!isReadOnly && (
          <select value={dispFilter} onChange={e => { setDispFilter(e.target.value); setPage(1); }} style={{ width: '100%', maxWidth: '180px', flex: '1 1 auto' }}>
            <option>Todos</option>
            {Array.from(new Set(DISPOSICIONES.map(d => d.label))).map(label => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        )}
        
        <div className="toolbar-actions" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ color: G.muted, fontSize: 13, fontWeight: 500 }}>
            <span style={{ fontWeight: 700, color: G.text }}>{filtered.length}</span> {t.parts}
          </span>
          <button className="btn-ghost" onClick={onRefresh} title={t.refresh}>
            <span style={{ fontSize: '15px' }}>↻</span> {t.refresh}
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ minWidth: '1000px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>{t.date}</th>
                <th>{t.orders}</th>
                <th>{t.partNumber}</th>
                <th>{t.operation}</th>
                <th style={{ textAlign: "center", width: '60px' }}>SEQ</th>
                <th style={{ textAlign: "right", width: '90px' }}>{t.scrapQty}</th>
                <th>{t.defectType}</th>
                <th style={{ width: '110px' }}>Lote</th>
                <th>{t.operator}</th>
                <th style={{ width: '130px' }}>{t.disposition}</th>
                <th style={{ textAlign: "center", width: '130px' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: 80, color: G.muted }}>
                  <div style={{ marginBottom: 12 }}>⌛</div>
                  Cargando datos...
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: 80, color: G.muted }}>
                  <div style={{ marginBottom: 12 }}>📂</div>
                  {t.noData}
                </td></tr>
              ) : (
                paged.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: G.muted, fontSize: 13, fontWeight: 500 }}>{fmtDateShort(s.created_at)}</td>
                    <td><span style={{ color: G.accent, fontWeight: 700, fontSize: 14 }}>{s.order?.order_number}</span></td>
                    <td>
                      <span style={{ 
                        background: G.accentDim, 
                        color: G.accent, 
                        padding: "4px 10px", 
                        borderRadius: "6px", 
                        fontSize: "12px", 
                        fontWeight: 700,
                        border: `1px solid ${G.accent}22`
                      }}>
                        {s.order?.part_numbers?.part_number}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{s.routing?.operation_name}</span></td>
                    <td style={{ textAlign: "center", color: G.muted, fontWeight: 700 }}>{s.routing?.sequence}</td>
                    <td style={{ textAlign: "right", fontSize: 16, fontWeight: 800, color: G.red }}>{s.quantity}</td>
                    <td>
                      <span style={{ 
                        fontSize: 12.5, 
                        color: s.defect_type ? G.amber : G.muted, 
                        fontWeight: 600,
                        background: s.defect_type ? `${G.amber}11` : 'transparent',
                        padding: s.defect_type ? '2px 8px' : '0',
                        borderRadius: '4px'
                      }}>
                        {s.defect_type || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ 
                        fontSize: 12, 
                        color: G.red, 
                        fontWeight: 700,
                        padding: "2px 0"
                      }}>
                        {s.lot_number || "—"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: "6px", 
                          background: G.purpleDim, 
                          color: G.purple,
                          fontSize: 11, 
                          fontWeight: 700,
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          border: `1px solid ${G.purple}22`
                        }}>
                          {(s.operator_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{s.operator_name}</span>
                      </div>
                    </td>
                    <td><BadgeDisposicion disposition={s.status || s.disposition} /></td>
                    <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {/* Solo mostrar botón si puede inspeccionar O es la pestaña de pendientes */}
                      {!isReadOnly && (
                        <button 
                          className="btn-primary" 
                          style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, flex: 1, textTransform: 'uppercase' }} 
                          onClick={() => onInspeccionar(s)}
                        >
                          {t.inspect}
                        </button>
                      )}

                      {/* Botón de eliminar solo para admin/calidad */}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(s)}
                          style={{ 
                            background: G.redDim, 
                            color: G.red, 
                            padding: '8px', 
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            flex: '0 0 32px'
                           }}
                          title="Eliminar Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div style={{ 
            display: "flex", 
            gap: 12, 
            alignItems: "center", 
            justifyContent: "flex-end", 
            padding: "16px 20px", 
            background: "#F8FAFC",
            borderTop: `1px solid ${G.border}`
          }}>
            <span style={{ color: G.muted, fontSize: 13, fontWeight: 500 }}>
              <span style={{ color: G.text, fontWeight: 700 }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}</span> {t.of} <span style={{ color: G.text, fontWeight: 700 }}>{filtered.length}</span>
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                className="btn-ghost" 
                style={{ padding: "6px 12px", minWidth: '40px' }} 
                onClick={() => setPage(Math.max(1, page - 1))} 
                disabled={page === 1}
              >
                ‹
              </button>
              <button 
                className="btn-ghost" 
                style={{ padding: "6px 12px", minWidth: '40px' }} 
                onClick={() => setPage(Math.min(pages, page + 1))} 
                disabled={page === pages}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ModalInspeccion Component ──────────────────────────────────────────────────
function ModalInspeccion({ item, onClose, onGuardar, t, session, isReadOnly = false }) {
  // Ensure the defect from production is in our options list
  const currentDefect = item.defect_type || "";
  const displayDefectos = Array.from(new Set([...TIPOS_DEFECTOS, currentDefect])).filter(Boolean);

  const [form, setForm] = useState({
    piezas_revisadas: item.quantity || 0,
    piezas_aprobadas: 0,
    piezas_rechazadas: item.quantity || 0,
    defecto: currentDefect,
    calidad_comentario: "",
  });
  const [disposicion, setDisposicion] = useState(item.status || item.disposition || "Pending");
  const [saving, setSaving] = useState(false);

  const totalPiezas = parseInt(form.piezas_aprobadas || 0) + parseInt(form.piezas_rechazadas || 0);
  const validacionError = totalPiezas > parseInt(form.piezas_revisadas || 0)
    ? "La suma de aprobadas + rechazadas no puede exceder las revisadas"
    : null;

  const handleAprobadasChange = (val) => {
    const numVal = parseInt(val) || 0;
    const rev = parseInt(form.piezas_revisadas) || 0;
    setForm(prev => ({
      ...prev,
      piezas_aprobadas: numVal,
      piezas_rechazadas: Math.max(0, rev - numVal)
    }));
  };

  const handleRechazadasChange = (val) => {
    const numVal = parseInt(val) || 0;
    const rev = parseInt(form.piezas_revisadas) || 0;
    setForm(prev => ({
      ...prev,
      piezas_rechazadas: numVal,
      piezas_aprobadas: Math.max(0, rev - numVal)
    }));
  };

  const handleGuardar = async () => {
    if (validacionError) {
      alert(validacionError);
      return;
    }
    setSaving(true);
    try {
      await onGuardar(item.id, {
        disposition: disposicion,
        defect_type: form.defecto,
        defect_notes: form.calidad_comentario,
        piezas_revisadas: parseInt(form.piezas_revisadas),
        piezas_aprobadas: parseInt(form.piezas_aprobadas),
        piezas_rechazadas: parseInt(form.piezas_rechazadas),
      });
      onClose();
    } catch (err) {
      console.error('Error guardando inspección:', err);
    } finally {
      setSaving(false);
    }
  };

  const tasaRechazo = form.piezas_revisadas > 0
    ? ((form.piezas_rechazadas / form.piezas_revisadas) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 700, padding: 0 }}>
        
        {/* Header */}
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', padding: '24px 32px', borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: G.accent }}></div>
               <span style={{ fontWeight: 800, fontSize: 20, color: G.text, letterSpacing: '-0.02em' }}>{t.qualityInspection}</span>
             </div>
             <button 
              className="btn-ghost" 
              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%', background: 'transparent', border: 'none', color: G.muted, fontSize: '18px' }} 
              onClick={onClose}
             >
              ✕
             </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              <div>
                <span className="label">Identificación de Orden</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
                  <span style={{ color: G.accent, fontSize: '16px', fontWeight: 700 }}>{item.order?.order_number || "—"}</span>
                  <span style={{ color: G.border, fontSize: '14px' }}>|</span>
                  <span style={{ color: G.muted, fontSize: '13px', fontWeight: 600 }}>{item.order?.part_numbers?.part_number || "—"}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span className="label">{t.operation || "Operación"}</span>
                  <div style={{ color: G.text, fontSize: '13px', fontWeight: 700 }}>
                    {item.routing?.operation_name || item.operation_name || "—"}
                    {item.routing?.sequence ? (
                      <span style={{ color: G.muted, fontWeight: 600 }}> (SEQ {item.routing.sequence})</span>
                    ) : null}
                  </div>
                </div>
              </div>
             <div style={{ textAlign: 'right' }}>
               <span className="label">Lote / Secuencia</span>
               <div style={{ marginTop: 4 }}>
                <span className="badge" style={{ background: G.redDim, color: G.red, borderColor: '#FECACA', fontSize: '13px', fontWeight: 800 }}>{item.lot_number || "SIN LOTE"}</span>
               </div>
             </div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          {/* Quantities Section */}
          <div style={{ background: 'rgba(10, 11, 16, 0.4)', borderRadius: '12px', padding: '24px', border: `1px solid ${G.border}`, marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label className="label">{t.piecesReviewed || "PIEZAS REVISADAS"}</label>
                <input type="number" readOnly value={form.piezas_revisadas} style={{ background: 'rgba(255, 255, 255, 0.03)', border: `1px solid ${G.border}`, color: G.muted, fontWeight: 700, fontSize: '18px' }} />
              </div>
              <div>
                <label className="label" style={{ color: G.green }}>{t.approvedPieces || "PIEZAS APROBADAS"}</label>
                <input type="number" value={form.piezas_aprobadas} onChange={e => handleAprobadasChange(e.target.value)} style={{ border: `1px solid ${G.green}44`, fontSize: '18px', color: G.green, fontWeight: 800, background: 'rgba(10, 11, 16, 0.4)' }} />
              </div>
              <div>
                <label className="label" style={{ color: G.red }}>{t.rejectedPieces || "PIEZAS RECHAZADAS"}</label>
                <input 
                  type="number" 
                  value={form.piezas_rechazadas} 
                  onChange={e => handleRechazadasChange(e.target.value)} 
                  disabled={isReadOnly}
                  style={{ border: `1px solid ${G.red}44`, fontSize: '18px', color: G.red, fontWeight: 800, background: 'rgba(10, 11, 16, 0.4)' }} 
                />
              </div>
            </div>
            
            {validacionError && (
              <div className="alert alert-error">
                <span>⚠</span> {validacionError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: `1px solid ${G.border}` }}>
               <span style={{ fontSize: '13.5px', color: G.muted, fontWeight: 500 }}>Tasa proyectada de rechazo</span>
               <span style={{ fontWeight: 800, fontSize: '20px', color: parseFloat(tasaRechazo) > 5 ? G.red : G.green }}>{tasaRechazo}%</span>
            </div>
          </div>

          {/* Defect Section */}
          <div style={{ marginBottom: '24px' }}>
             <label className="label">{t.defectTypeRequired?.toUpperCase() || "DESCRIPCIÓN DEL DEFECTO"}</label>
             <select 
               value={form.defecto} 
               onChange={e => setForm({ ...form, defecto: e.target.value })} 
               disabled={isReadOnly}
               style={{ height: '44px', fontWeight: 600 }}
             >
               <option value="">-- {t.selectOption || "Seleccionar..."} --</option>
               {displayDefectos.map(d => <option key={d} value={d}>{d}</option>)}
             </select>
          </div>

          {/* Comments Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div>
              <label className="label">Comentarios Producción</label>
              <textarea 
                value={item.defect_comment || "Sin comentarios."} 
                readOnly 
                rows={4}
                style={{ background: 'rgba(255, 255, 255, 0.03)', color: G.muted, resize: 'none', border: `1px solid ${G.border}`, fontSize: '13px', lineHeight: '1.6' }}
              />
            </div>
            <div>
              <label className="label">Comentarios Calidad</label>
              <textarea 
                value={form.calidad_comentario} 
                onChange={e => setForm({ ...form, calidad_comentario: e.target.value })} 
                disabled={isReadOnly}
                placeholder={isReadOnly ? "Sin comentarios..." : "Observaciones adicionales de calidad..."} 
                rows={4}
                style={{ resize: 'none', fontSize: '13px', lineHeight: '1.6' }}
              />
            </div>
          </div>

          {/* Disposition */}
          {!isReadOnly && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <button 
                onClick={() => setDisposicion("Approved")} 
                style={{ 
                  flex: 1, 
                  padding: '16px', 
                  background: disposicion === "Approved" ? G.green : 'transparent', 
                  color: disposicion === "Approved" ? "#fff" : G.green, 
                  border: `2px solid ${G.green}`, 
                  fontSize: '15px',
                  fontWeight: 800
                }}
              >
                {t.approve || "APROBAR"}
              </button>
              <button 
                onClick={() => setDisposicion("Rejected")} 
                style={{ 
                  flex: 1, 
                  padding: '16px', 
                  background: disposicion === "Rejected" ? G.red : 'transparent', 
                  color: disposicion === "Rejected" ? "#fff" : G.red, 
                  border: `2px solid ${G.red}`, 
                  fontSize: '15px',
                  fontWeight: 800
                }}
              >
                {t.reject || "RECHAZAR"}
              </button>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button className="btn-ghost" onClick={onClose} style={{ padding: '12px 32px' }}>{t.close}</button>
            {!isReadOnly && (
              <button className="btn-primary" onClick={handleGuardar} disabled={saving || validacionError} style={{ padding: '12px 48px', minWidth: '180px' }}>
                {saving ? "..." : t.save || "GUARDAR RESULTADO"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── ReporteScrap Component ───────────────────────────────────────────────────
function ReporteScrap({ scrap, onRefresh, loading, t, onDelete }) {
  const [q, setQ] = useState("");

  const filtered = scrap.filter(s =>
    !q ||
    s.order?.order_number?.toLowerCase().includes(q.toLowerCase()) ||
    s.order?.part_numbers?.part_number?.toLowerCase().includes(q.toLowerCase()) ||
    s.operator_name?.toLowerCase().includes(q.toLowerCase()) ||
    s.defect_type?.toLowerCase().includes(q.toLowerCase())
  );

  const stats = {
    totalScrap: scrap
      .filter(s => isRejectedState(getItemState(s)) && isScrapDefectRecord(s))
      .reduce((a, s) => a + (Number(s.quantity) || 0), 0),
    items: scrap.length,
    pendingPieces: scrap
      .filter(s => isPendingState(getItemState(s)))
      .reduce((a, s) => a + (Number(s.quantity) || 0), 0),
    approvedPieces: scrap
      .filter(s => isApprovedState(getItemState(s)))
      .reduce((a, s) => a + (Number(s.quantity) || 0), 0),
    rejectedPieces: scrap
      .filter(s => isRejectedState(getItemState(s)))
      .reduce((a, s) => a + (Number(s.quantity) || 0), 0),
  };

  // Agrupar defectos
  const defectosPorTipo = filtered.reduce((acc, s) => {
    const tipo = s.defect_type || "Sin clasificar";
    acc[tipo] = (acc[tipo] || 0) + (Number(s.quantity) || 0);
    return acc;
  }, {});

  const topDefectos = Object.entries(defectosPorTipo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 28 }}>
        <div className="card" style={{ padding: 24, borderLeft: `4px solid ${G.red}` }}>
          <div className="label" style={{ marginBottom: 12 }}>Total Scrap</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: G.red, letterSpacing: '-0.02em' }}>{stats.totalScrap}</div>
        </div>
        <div className="card" style={{ padding: 24, borderLeft: `4px solid ${G.amber}` }}>
          <div className="label" style={{ marginBottom: 12 }}>Pendientes</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: G.amber, letterSpacing: '-0.02em' }}>{stats.pendingPieces}</div>
        </div>
        <div className="card" style={{ padding: 24, borderLeft: `4px solid ${G.green}` }}>
          <div className="label" style={{ marginBottom: 12 }}>Total Aprobado</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: G.green, letterSpacing: '-0.02em' }}>{stats.approvedPieces}</div>
        </div>
        <div className="card" style={{ padding: 24, borderLeft: `4px solid ${G.accent}` }}>
          <div className="label" style={{ marginBottom: 12 }}>Total Rechazado</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: G.accent, letterSpacing: '-0.02em' }}>{stats.rejectedPieces}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: 24 }}>
        {/* Tabla de Scrap */}
        <div>
          <div className="card" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: 'relative', flex: '0 1 300px' }}>
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                placeholder={t.search + "..."} 
                style={{ paddingLeft: '38px' }}
              />
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: G.subtle, fontSize: '15px' }}>🔍</span>
            </div>
            <span style={{ marginLeft: "auto", color: G.muted, fontSize: 13, fontWeight: 500 }}>
              <span style={{ fontWeight: 700, color: G.text }}>{filtered.length}</span> registros
            </span>
            <button className="btn-ghost" onClick={onRefresh}>↻ {t.refresh}</button>
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>{t.date}</th>
                    <th>{t.orders}</th>
                    <th>{t.partNumber}</th>
                    <th style={{ textAlign: "center", width: '60px' }}>OP</th>
                    <th style={{ textAlign: "right", width: '90px' }}>{t.scrapQty}</th>
                    <th>{t.defectType}</th>
                    <th style={{ width: '110px' }}>Lote</th>
                    <th>{t.operator}</th>
                    <th style={{ width: '120px' }}>{t.disposition}</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} style={{ textAlign: "center", padding: 80, color: G.muted }}>⌛ Cargando...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: "center", padding: 80, color: G.muted }}>📂 {t.noData}</td></tr>
                  ) : (
                    filtered.map(s => (
                      <tr key={s.id}>
                        <td style={{ color: G.muted, fontSize: 13 }}>{fmtDateShort(s.created_at)}</td>
                        <td><span style={{ color: G.accent, fontWeight: 700 }}>{s.order?.order_number || s.order_number}</span></td>
                        <td>
                          <span style={{ background: G.accentDim, color: G.accent, padding: "3px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                            {s.order?.part_numbers?.part_number || s.part_number}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{s.routing?.operation_name || s.operation_name}</td>
                        <td style={{ textAlign: "right", fontSize: 15, fontWeight: 800, color: G.red }}>{s.quantity}</td>
                        <td>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: G.amber, background: `${G.amber}11`, padding: '2px 8px', borderRadius: '4px' }}>
                            {s.defect_type}
                          </span>
                        </td>
                        <td><span className="mono" style={{ fontSize: 12, color: G.red, fontWeight: 700 }}>{s.lot_number || "—"}</span></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: 4, background: G.purpleDim, color: G.purple, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {(s.operator_name || "?").charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13 }}>{s.operator_name}</span>
                          </div>
                        </td>
                        <td><BadgeDisposicion disposition={s.status || s.disposition} /></td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => onDelete && onDelete(s)}
                            style={{ 
                              background: G.redDim, 
                              color: G.red, 
                              padding: '6px', 
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none'
                             }}
                            title="Eliminar Registro"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Defects Panel */}
        <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 24, color: G.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📊</span> Defectos por Tipo
          </div>
          {topDefectos.length === 0 ? (
            <div style={{ color: G.muted, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>No hay defectos registrados</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {topDefectos.map(([tipo, cantidad], i) => (
                <div key={tipo} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "12px 14px", 
                  borderRadius: '8px',
                  background: i === 0 ? G.redDim : 'transparent',
                  border: i === 0 ? `1px solid ${G.red}44` : '1px solid transparent'
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: [G.red, G.amber, G.purple, G.accent, G.green][i % 5] }} />
                    <span style={{ fontSize: 14, color: G.text, fontWeight: i === 0 ? 700 : 500 }}>{tipo}</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: G.red }}>{cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QualityInspections({ session, userRole, onSignOut, embedded = false }) {
  const { lang, setLang, t } = useLanguage();
  const [tab, setTab] = useState("dashboard");
  const [scrap, setScrap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isMockData, setIsMockData] = useState(false);
  const [alert, setAlert] = useState(null);

  // Determinar si el usuario tiene permiso para realizar inspecciones
  const canInspect = ["admin", "calidad"].includes(userRole);
  const isReadOnly = !canInspect;

  const langConfig = {
    es: { label: "ES", locale: "es-MX" },
    en: { label: "EN", locale: "en-US" },
    zh: { label: "中", locale: "zh-CN" }
  };

  const headerStyle = embedded
    ? { display: 'none' }
    : {};

  const tabsStyle = embedded
    ? { padding: '0 16px' }
    : { padding: '0 28px' };

  const contentStyle = embedded
    ? { padding: '20px 16px' }
    : { padding: '28px' };

  const TABS = [
    { id: "dashboard", label: t.dashboard, icon: "◫" },
    { id: "inspecciones", label: "Pendientes por Inspección", icon: "⊡" },
    { id: "aprobadas", label: "Aprobadas por Calidad", icon: "✓" },
    { id: "rechazadas", label: "Rechazadas por Calidad", icon: "✕" },
    { id: "reporte", label: t.scrapReport || "Reporte Scrap", icon: "⚠" },
  ];

  // MOCK_SCRAP removed for production

  const fetchScrap = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('production_scrap')
        .select(`
          *,
          order:production_orders(order_number, part_numbers(part_number, description)),
          routing:production_routing(operation_name, sequence)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setScrap(data || []);
      setIsMockData(false);
    } catch (error) {
      console.warn('Error loading from Supabase:', error);
      setScrap([]);
      setIsMockData(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScrap();
  }, []);

  const handleInspeccionar = (item) => {
    setSelectedItem(item);
  };

  const handleQuickAction = async (id, disposition) => {

    const { error } = await supabase
      .from('production_scrap')
      .update({ disposition })
      .eq('id', id);

    if (error) {
      console.error('Error en quick action:', error);
      setAlert({ type: 'error', message: 'Error al actualizar: ' + error.message });
      fetchScrap();
    } else {
      setScrap(prev => prev.map(s => s.id === id ? { ...s, disposition } : s));
      setAlert({ type: 'success', message: 'Disposición actualizada' });
    }
    setTimeout(() => setAlert(null), 2000);
  };

  const handleGuardarInspeccion = async (id, updates) => {
    const item = scrap.find(s => s.id === id);
    if (!item) {
      setAlert({ type: 'error', message: 'No se encontró el registro de scrap' });
      return;
    }

    // Map English status to DB-compliant Spanish values based on check constraint
    const dbStatusMap = {
      'Approved': 'APROBADO',
      'Rejected': 'RECHAZADO',
      'Pending': 'Pendiente'
    };
    const dbStatus = dbStatusMap[updates.disposition] || updates.disposition;

    try {
      // 1. Update the status and comments in production_scrap
      const { error: scrapError } = await supabase
        .from('production_scrap')
        .update({
          status: dbStatus, 
          defect_type: updates.defect_type,
          defect_comment: updates.defect_notes 
        })
        .eq('id', id);

      if (scrapError) throw scrapError;

      // 2. IF APPROVED: Return the pieces to WIP balance
      if (updates.disposition === 'Approved') {
        const qtyToReturn = parseInt(updates.piezas_aprobadas);
        if (qtyToReturn > 0) {
          const { error: wipError } = await supabase.rpc('fn_return_scrap_to_wip', {
            p_scrap_id: id,
            p_quantity: qtyToReturn
          });
          if (wipError) console.error('Error al retornar a WIP:', wipError.message);
        }
      }

      // 3. Create inspection record for audit
      if (session?.user?.id) {
        const { error: inspError } = await supabase
          .from('inspecciones')
          .insert({
            inspector_id: session.user.id,
            piezas_revisadas: updates.piezas_revisadas,
            piezas_aprobadas: updates.piezas_aprobadas,
            piezas_rechazadas: updates.piezas_rechazadas,
            punto_control: item.routing?.operation_name || "—",
            orden_produccion_id: item.order?.order_number || item.order_number || "—",
            codigo_defecto: updates.defect_type,
            comentarios: updates.defect_notes,
            estado_inspeccion: updates.disposition,
            created_at: new Date().toISOString()
          });

        if (inspError) {
          console.warn('No se pudo crear registro de inspección:', inspError.message);
        }
      }

      // 4. Update local state and UI
      setScrap(prev => prev.map(s => s.id === id ? { ...s, ...updates, status: dbStatus } : s));
      setAlert({ type: 'success', message: 'Inspección guardada y WIP actualizado' });
      setTimeout(() => setAlert(null), 2000);
      fetchScrap(); // Refresh full data
      
    } catch (err) {
      console.error('Error fatal en inspección:', err);
      setAlert({ type: 'error', message: 'Fallo al procesar: ' + err.message });
    }
  };

  const handleCreateInspection = async (scrapId, inspectionData) => {

    const { error } = await supabase
      .from('inspecciones')
      .insert({
        scrap_id: scrapId,
        inspector_id: session?.user?.id,
        piezas_revisadas: inspectionData.piezas_revisadas,
        piezas_aprobadas: inspectionData.piezas_aprobadas,
        piezas_rechazadas: inspectionData.piezas_rechazadas,
        fecha_inspeccion: new Date().toISOString().split('T')[0],
      });

    if (!error) {
      // Update scrap disposition
      await supabase
        .from('production_scrap')
        .update({ disposition: "Approved" })
        .eq('id', scrapId);

      fetchScrap();
    }
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleDeleteScrap = (item) => {
    setItemToDelete(item);
  };

  const confirmDeleteScrap = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;

    const { data, error } = await supabase
      .from('production_scrap')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error al eliminar scrap:', error);
      setAlert({ type: 'error', message: 'Error al eliminar: ' + error.message });
    } else if (!data || data.length === 0) {
      console.error('Violación de políticas / Sin permisos:', id);
      setAlert({ type: 'error', message: 'No tienes los permisos necesarios para borrar este registro o ya fue eliminado.' });
    } else {
      setScrap(prev => prev.filter(s => s.id !== id));
      setAlert({ type: 'success', message: 'Registro eliminado correctamente' });
    }
    setTimeout(() => setAlert(null), 3000);
    setItemToDelete(null);
  };

  const stats = {
    total: scrap.length,
    totalPieces: scrap.reduce((a, s) => a + (Number(s.quantity) || 0), 0),
    pending: scrap.filter(s => isPendingState(getItemState(s))).length,
    approved: scrap.filter(s => isApprovedState(getItemState(s))).length,
    rejected: scrap.filter(s => isRejectedState(getItemState(s))).length,
    
    // Piece-based counts for more accurate industrial reporting
    approvedPieces: scrap
      .filter(s => isApprovedState(getItemState(s)))
      .reduce((a, s) => a + (Number(s.quantity) || 0), 0),
    rejectedPieces: scrap
      .filter(s => isRejectedState(getItemState(s)))
      .reduce((a, s) => a + (Number(s.quantity) || 0), 0),
    
    // Scrap real: solo cuando Calidad lo manda a Rechazo (y excluye registros FQC tipo N/A)
    totalScrap: scrap
      .filter(s => isRejectedState(getItemState(s)) && isScrapDefectRecord(s))
      .reduce((a, s) => a + (Number(s.quantity) || 0), 0),
  };

  // Add the computed rates for easy access in sub-components
  stats.approvedRate = stats.totalPieces > 0 ? ((stats.approvedPieces / stats.totalPieces) * 100).toFixed(1) : "0.0";
  stats.rejectedRate = stats.totalPieces > 0 ? ((stats.rejectedPieces / stats.totalPieces) * 100).toFixed(1) : "0.0";

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        
        {/* Navegación de Pestañas */}
        <div className="tabs-nav" style={{ padding: "0 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TABS.map(tb => {
            const isActive = tab === tb.id;
            return (
              <button 
                key={tb.id} 
                onClick={() => setTab(tb.id)} 
                style={{ 
                  background: "transparent", 
                  color: isActive ? G.accent : G.muted, 
                  border: "none", 
                  borderBottom: isActive ? `3px solid ${G.accent}` : "3px solid transparent", 
                  padding: "16px 20px", 
                  fontSize: 14, 
                  fontWeight: isActive ? 700 : 500, 
                  borderRadius: 0, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 10
                }}
              >
                <span style={{ fontSize: '18px', opacity: isActive ? 1 : 0.6 }}>{tb.icon}</span>
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* Área de Contenido */}
        <div style={{ padding: embedded ? '24px 16px' : '32px 28px', maxWidth: '1600px', margin: '0 auto' }}>
          {tab === "dashboard" && <Dashboard data={stats} t={t} />}
          
          {tab === "inspecciones" && (
            <ListaInspecciones
               scrap={scrap.filter(s => isPendingState(getItemState(s)))}
              onInspeccionar={handleInspeccionar}
              onRefresh={fetchScrap}
              loading={loading}
              t={t}
              title="Inspecciones Pendientes"
              isReadOnly={isReadOnly}
              onDelete={canInspect ? handleDeleteScrap : null}
            />
          )}

          {tab === "aprobadas" && (
            <ListaInspecciones
               scrap={scrap.filter(s => isApprovedState(getItemState(s)))}
              onInspeccionar={handleInspeccionar}
              onRefresh={fetchScrap}
              loading={loading}
              t={t}
              title="Piezas Aprobadas por Calidad"
              isReadOnly={isReadOnly}
              onDelete={canInspect ? handleDeleteScrap : null}
            />
          )}

          {tab === "rechazadas" && (
            <ListaInspecciones
               scrap={scrap.filter(s => isRejectedState(getItemState(s)))}
              onInspeccionar={handleInspeccionar}
              onRefresh={fetchScrap}
              loading={loading}
              t={t}
              title="Piezas Rechazadas por Calidad"
              isReadOnly={isReadOnly}
              onDelete={canInspect ? handleDeleteScrap : null}
            />
          )}

          {tab === "reporte" && (
            <ReporteScrap 
              scrap={scrap} 
              onRefresh={fetchScrap}
              loading={loading}
              t={t}
              onDelete={canInspect ? handleDeleteScrap : null}
            />
          )}
        </div>

        {/* Modal de Inspección */}
        {selectedItem && (
          <ModalInspeccion 
            item={selectedItem} 
            onClose={handleCloseModal} 
            onGuardar={handleGuardarInspeccion}
            t={t}
            session={session}
            isReadOnly={isReadOnly || tab !== "inspecciones"}
          />
        )}

        {/* Modal Flotante Elegante para Confirmar Eliminación */}
        {itemToDelete && (
          <div className="modal-overlay" onClick={() => setItemToDelete(null)} style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ background: '#111827', width: '400px', borderRadius: '16px', padding: '36px 32px', textAlign: 'center', border: '1px solid #1f2937', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={36} strokeWidth={2} />
                </div>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F9FAFB', marginBottom: '16px', letterSpacing: '-0.01em' }}>¿Eliminar Orden?</h2>
              
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: '1.6', marginBottom: '36px' }}>
                ¿Seguro que deseas eliminar el reporte ligado a la orden <strong style={{ color: '#E5E7EB', fontWeight: 700 }}>{itemToDelete.order?.order_number || itemToDelete.order_number || itemToDelete.id.split('-')[0]}</strong>? Esta acción es irreversible y eliminará el historial asociado.
              </p>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={confirmDeleteScrap}
                  style={{ flex: 1, background: '#EF4444', color: '#FFFFFF', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}
                  onMouseEnter={e => { e.target.style.background = '#DC2626'; e.target.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.target.style.background = '#EF4444'; e.target.style.transform = 'translateY(0)'; }}
                  onMouseDown={e => e.target.style.transform = 'translateY(1px)'}
                >
                  Sí, Eliminar
                </button>
                <button 
                  onClick={() => setItemToDelete(null)}
                  style={{ flex: 1, background: '#F3F4F6', color: '#111827', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.target.style.background = '#E5E7EB'; e.target.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.target.style.background = '#F3F4F6'; e.target.style.transform = 'translateY(0)'; }}
                  onMouseDown={e => e.target.style.transform = 'translateY(1px)'}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
