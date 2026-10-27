import React, { useState, useEffect } from 'react';
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
import { dashboardApi, cuotasApi, clientesApi, prestamosApi, cajaApi, usuariosApi } from '../services/api';

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
      const [kpiData, grafData, vencidasData, clientesList, prestamosList, cajaData] = await Promise.all([
        dashboardApi.getKPIs(cobradorId).catch(() => null),
        dashboardApi.getGraficos(cobradorId).catch(() => null),
        cuotasApi.getCuotasVencidas(cobradorId).catch(() => []),
        clientesApi.getClientes('', 'Activo', cobradorId).catch(() => []),
        prestamosApi.getPrestamos(null, 'EnCurso', cobradorId).catch(() => []),
        cajaApi.getEstadoCaja().catch(() => null)
      ]);

      setKpis(kpiData);
      setGraficos(grafData);
      setCuotasVencidas(vencidasData || []);
      setClientesCount(Array.isArray(clientesList) ? clientesList.length : 0);
      setPrestamosCount(Array.isArray(prestamosList) ? prestamosList.length : 0);
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
  const montoVencido = kpis?.montoVencido ?? cuotasVencidas.reduce((sum, c) => sum + (c.montoCuota || 0) + (c.interesMoratorio || 0), 0);
  const MESES_DEFAULT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const rawMonthlyData = graficos?.pagosPorMes || graficos?.ingresosMensuales || [];
  const barChartData = (rawMonthlyData.length > 0
    ? rawMonthlyData
    : MESES_DEFAULT.map(m => ({ mes: m, monto: 0 }))
  ).map(d => ({
    mes: d.mes,
    ingresos: d.monto !== undefined ? d.monto : (d.ingresos || 0)
  }));

  const pieChartData = graficos?.estadoPrestamos || [
    { name: "En Curso", value: totalPrestamosActivos || 0, color: "#9A7412" },
    { name: "Pendiente", value: 0, color: "#2563eb" },
    { name: "Pagado", value: 0, color: "#7c3aed" },
    { name: "Vencido", value: cuotasVencidasCant || 0, color: "#dc2626" }
  ];

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
                Gestión de Mora
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
          <div className="panel-title" style={{ marginBottom: '1rem', fontSize: '1.05rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Recaudación de Cobros (S/.)</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>Últimos 6 meses</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.85rem' }}>
                Cargando datos...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={barChartData.length > 6 ? barChartData.slice(-6) : barChartData}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                >
                  <XAxis 
                    dataKey="mes" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    interval={0}
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
            ) : (pieChartData.reduce((sum, item) => sum + (item.value || 0), 0) > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#9A7412'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.82rem' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
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
