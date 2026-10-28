import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Banknote, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Calculator, 
  ArrowUpRight, 
  Clock,
  Wallet,
  CalendarCheck,
  ShieldAlert,
  FileSpreadsheet,
  Filter,
  Shield
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardApi, cuotasApi, clientesApi, prestamosApi, cajaApi, usuariosApi, pagosApi } from '../services/api';

// ── Utilidades para la gráfica de recaudación ─────────────────────────
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const claveDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const inicioSemana = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // lunes
  return x;
};

const PERIODOS = [
  { id: 'diario', label: 'Diario', descripcion: 'Últimos 14 días' },
  { id: 'semanal', label: 'Semanal', descripcion: 'Últimas 8 semanas' },
  { id: 'mensual', label: 'Mensual', descripcion: 'Últimos 12 meses' },
  { id: '6meses', label: '6 meses', descripcion: 'Últimos 6 meses' }
];

// Agrupa los pagos (fecha en hora local) según el periodo elegido
const construirSerieRecaudacion = (pagos, periodo) => {
  const hoy = new Date();
  const buckets = [];

  if (periodo === 'diario') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      buckets.push({ clave: claveDia(d), mes: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, ingresos: 0 });
    }
  } else if (periodo === 'semanal') {
    const lunesActual = inicioSemana(hoy);
    for (let i = 7; i >= 0; i--) {
      const d = new Date(lunesActual.getFullYear(), lunesActual.getMonth(), lunesActual.getDate() - i * 7);
      buckets.push({ clave: claveDia(d), mes: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, ingresos: 0 });
    }
  } else {
    const cantidad = periodo === 'mensual' ? 12 : 6;
    for (let i = cantidad - 1; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const etiqueta = cantidad === 12 ? `${MESES_CORTOS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : MESES_CORTOS[d.getMonth()];
      buckets.push({ clave: `${d.getFullYear()}-${d.getMonth()}`, mes: etiqueta, ingresos: 0 });
    }
  }

  const indice = new Map(buckets.map((b, i) => [b.clave, i]));
  (pagos || []).forEach(p => {
    const fecha = new Date(p.fechaPago);
    if (isNaN(fecha)) return;
    let clave;
    if (periodo === 'diario') clave = claveDia(fecha);
    else if (periodo === 'semanal') clave = claveDia(inicioSemana(fecha));
    else clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
    const i = indice.get(clave);
    if (i !== undefined) buckets[i].ingresos += parseFloat(p.monto) || 0;
  });

  return buckets.map(b => ({ ...b, ingresos: Math.round(b.ingresos * 100) / 100 }));
};

// Estados de préstamo para la gráfica circular
const ESTADOS_PRESTAMO = [
  { key: 'EnCurso', name: 'En curso', color: '#9A7412' },
  { key: 'Vencido', name: 'Vencido', color: '#dc2626' },
  { key: 'Pagado', name: 'Pagado', color: '#16a34a' },
  { key: 'Cancelado', name: 'Cancelado', color: '#94a3b8' },
  { key: 'Pendiente', name: 'Pendiente', color: '#2563eb' }
];

export default function DashboardPage({ 
  user,
  onOpenSimulador, 
  onNuevoCliente, 
  onNuevoPrestamo, 
  onNuevoPago,
  onNavigateTab,
  refreshTrigger
}) {
  const [kpis, setKpis] = useState(null);
  const [graficos, setGraficos] = useState(null);
  const [cuotasVencidas, setCuotasVencidas] = useState([]);
  const [clientesCount, setClientesCount] = useState(0);
  const [prestamosCount, setPrestamosCount] = useState(0);
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [periodo, setPeriodo] = useState('6meses');
  const [loading, setLoading] = useState(true);

  // Prestamista / Rol filter
  const userRole = user?.rol?.toString()?.toLowerCase() || 'admin';
  const isAdmin = userRole === 'admin' || userRole === '1';

  const [cobradoresList, setCobradoresList] = useState([]);
  const [selectedCobradorId, setSelectedCobradorId] = useState('');

  useEffect(() => {
    if (isAdmin) {
      usuariosApi.getAll().then(data => {
        setCobradoresList(data || []);
      }).catch(err => console.warn('Error cargando lista de cobradores:', err));
    }
  }, [isAdmin, refreshTrigger]);

  useEffect(() => {
    loadDashboard(selectedCobradorId ? parseInt(selectedCobradorId) : null);
  }, [selectedCobradorId, refreshTrigger]);

  const loadDashboard = async (cobradorId = null) => {
    setLoading(true);
    try {
      const [kpiData, grafData, vencidasData, clientesList, prestamosList, cajaData, pagosList] = await Promise.all([
        dashboardApi.getKPIs(cobradorId).catch(() => null),
        dashboardApi.getGraficos(cobradorId).catch(() => null),
        cuotasApi.getCuotasVencidas(cobradorId).catch(() => []),
        clientesApi.getClientes('', 'Activo', cobradorId).catch(() => []),
        prestamosApi.getPrestamos(null, '', cobradorId).catch(() => []),
        cajaApi.getEstadoCaja().catch(() => null),
        pagosApi.getPagos(null, null, cobradorId).catch(() => [])
      ]);

      setKpis(kpiData);
      setGraficos(grafData);
      setCuotasVencidas(vencidasData || []);
      setClientesCount(Array.isArray(clientesList) ? clientesList.length : 0);
      const listaPrestamos = Array.isArray(prestamosList) ? prestamosList : [];
      setPrestamos(listaPrestamos);
      setPrestamosCount(listaPrestamos.filter(p => p.estado === 'EnCurso' || p.estado === 'Vencido').length);
      setPagos(Array.isArray(pagosList) ? pagosList : []);
      setEstadoCaja(cajaData);
    } catch (err) {
      console.error('Error cargando Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalClientes = kpis?.clientesActivos ?? kpis?.totalClientesActivos ?? clientesCount;
  const totalPrestamosActivos = kpis?.totalPrestamosActivos ?? prestamosCount;
  const dineroPrestado = kpis?.dineroPrestado ?? kpis?.montoTotalDispersado ?? 0;
  const dineroRecuperado = kpis?.dineroRecuperado ?? kpis?.montoTotalCobrado ?? 0;
  const cuotasVencidasCant = kpis?.cuotasVencidasCount ?? cuotasVencidas.length ?? 0;
  const montoVencido = kpis?.montoVencido ?? cuotasVencidas.reduce((sum, c) => sum + (c.montoCuota || 0), 0);
  const MESES_DEFAULT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Recaudación según el periodo elegido (diario / semanal / mensual / 6 meses)
  const barChartData = useMemo(() => construirSerieRecaudacion(pagos, periodo), [pagos, periodo]);
  const totalPeriodo = barChartData.reduce((s, d) => s + d.ingresos, 0);
  const periodoActual = PERIODOS.find(p => p.id === periodo);

  // Distribución real por estado de cada préstamo, con porcentaje
  const totalPrestamosGrafica = prestamos.length;
  const pieChartData = ESTADOS_PRESTAMO
    .map(e => {
      const value = prestamos.filter(p => p.estado === e.key).length;
      return { ...e, value, porcentaje: totalPrestamosGrafica > 0 ? (value / totalPrestamosGrafica) * 100 : 0 };
    })
    .filter(d => d.value > 0);
  const fmtPct = (n) => `${n.toLocaleString('es-PE', { maximumFractionDigits: 1 })}%`;

  return (
    <div className="content-body">
      {/* Selector de Ruta / Cobrador para Admin o Badge para Cobrador */}
      {isAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Consolidado y Supervisión de Rutas</h3>
              <p className="text-xs text-slate-500">Selecciona una ruta específica o consulta el consolidado general de la empresa.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCobradorId}
              onChange={(e) => setSelectedCobradorId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">🌐 Todas las Rutas (Consolidado General)</option>
              {cobradoresList.map(c => (
                <option key={c.id} value={c.id}>
                  👤 Ruta: {c.nombresApellidos || c.nombreUsuario} (@{c.nombreUsuario})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-6 shadow-xs">
          <h3 className="text-base font-bold text-emerald-900 mb-1">
            {user?.nombresApellidos || user?.nombreUsuario}
          </h3>
          <p className="text-xs text-emerald-700">
            Mostrando tus clientes, préstamos y metas para hoy.
          </p>
        </div>
      )}

      {/* Top Banner KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon emerald">
            <Users size={24} />
          </div>
          <div className="kpi-info">
            <h4>Clientes Activos</h4>
            <div className="kpi-value">{loading ? '...' : totalClientes}</div>
            <div className="kpi-subtext">Titulares en sistema</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blue">
            <Banknote size={24} />
          </div>
          <div className="kpi-info">
            <h4>Préstamos Activos</h4>
            <div className="kpi-value">{loading ? '...' : totalPrestamosActivos}</div>
            <div className="kpi-subtext">Operaciones vigentes</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon gold">
            <DollarSign size={24} />
          </div>
          <div className="kpi-info">
            <h4>Dinero Desembolsado</h4>
            <div className="kpi-value">S/. {loading ? '...' : dineroPrestado.toLocaleString()}</div>
            <div className="kpi-subtext">Capital total colocado</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-info">
            <h4>Total Recaudado</h4>
            <div className="kpi-value text-primary">S/. {loading ? '...' : dineroRecuperado.toLocaleString()}</div>
            <div className="kpi-subtext">Capital + Intereses cobrados</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: cuotasVencidasCant > 0 ? '4px solid #dc2626' : undefined }}>
          <div className="kpi-icon red">
            <ShieldAlert size={24} />
          </div>
          <div className="kpi-info">
            <h4>Cartera en Riesgo</h4>
            <div className="kpi-value" style={{ color: '#dc2626' }}>
              S/. {loading ? '...' : montoVencido.toFixed(2)}
            </div>
            <div className="kpi-subtext">{cuotasVencidasCant} cuotas con atraso</div>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="card-panel" style={{ padding: '1.25rem' }}>
        <div className="panel-header" style={{ marginBottom: '1rem' }}>
          <div className="panel-title" style={{ fontSize: '1.05rem' }}>Centro de Operaciones Rápidas</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={onNuevoPago} style={{ justifyContent: 'center' }}>
            <DollarSign size={16} />
            Registrar Cobro
          </button>

          <button className="btn btn-secondary" onClick={onNuevoPrestamo} style={{ justifyContent: 'center' }}>
            <Banknote size={16} />
            Nuevo Préstamo
          </button>

          <button className="btn btn-secondary" onClick={onNuevoCliente} style={{ justifyContent: 'center' }}>
            <Users size={16} />
            Nuevo Cliente
          </button>

          <button className="btn btn-secondary" onClick={onOpenSimulador} style={{ justifyContent: 'center' }}>
            <Calculator size={16} />
            Simulador Express
          </button>

          {onNavigateTab && (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => onNavigateTab('cartera-vencida')} 
                style={{ justifyContent: 'center', color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)' }}
              >
                <AlertTriangle size={16} />
                Cartera Vencida
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => onNavigateTab('caja')} 
                style={{ justifyContent: 'center', color: '#9A7412', borderColor: 'rgba(201, 154, 46, 0.3)' }}
              >
                <Wallet size={16} />
                Caja Diaria
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => onNavigateTab('calendario')} 
                style={{ justifyContent: 'center', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)' }}
              >
                <CalendarCheck size={16} />
                Calendario
              </button>
            </>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
        {/* Recaudación Mensual Bar Chart */}
        <div className="card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <div className="panel-title" style={{ fontSize: '1.05rem' }}>Recaudación de Cobros (S/.)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {periodoActual?.descripcion} · Total: <strong style={{ color: 'var(--primary)' }}>S/. {totalPeriodo.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            </div>
            <div className="tab-switcher" role="tablist" aria-label="Periodo de la gráfica">
              {PERIODOS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={periodo === p.id}
                  className={`tab-switcher-btn ${periodo === p.id ? 'active-primary' : ''}`}
                  onClick={() => setPeriodo(p.id)}
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.76rem' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.85rem' }}>
                Cargando datos...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={barChartData}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                >
                  <XAxis 
                    dataKey="mes" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    interval={periodo === 'diario' || periodo === 'mensual' ? 'preserveStartEnd' : 0}
                    minTickGap={4}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '0.82rem' }}
                    formatter={(val) => [`S/. ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Cobrado']}
                    labelFormatter={(label) => (periodo === 'semanal' ? `Semana del ${label}` : label)}
                  />
                  <Bar dataKey="ingresos" fill="#9A7412" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Estado de Cartera Pie Chart */}
        <div className="card-panel">
          <div className="panel-title" style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
            Distribución del Estado de Préstamos
          </div>
          <div style={{ width: '100%', height: 260 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.85rem' }}>
                Cargando datos...
              </div>
            ) : totalPrestamosGrafica > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={pieChartData.length > 1 ? 4 : 0}
                    dataKey="value"
                    nameKey="name"
                    label={({ porcentaje }) => fmtPct(porcentaje)}
                    labelLine={false}
                  >
                    {pieChartData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.82rem' }}
                    formatter={(value, name, item) => [`${value} ${value === 1 ? 'préstamo' : 'préstamos'} (${fmtPct(item?.payload?.porcentaje || 0)})`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '0.78rem' }}
                    formatter={(value, entry) => `${value}: ${fmtPct(entry?.payload?.porcentaje || 0)} (${entry?.payload?.value ?? 0})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem' }}>
                  <Banknote size={22} style={{ color: '#94a3b8' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Sin Préstamos Registrados</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>La gráfica se generará al registrar créditos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
