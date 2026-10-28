import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Users, 
  Banknote, 
  Receipt, 
  AlertTriangle, 
  TrendingUp, 
  Wallet, 
  History,
  CheckCircle2,
  HandCoins,
  User
} from 'lucide-react';
import { reportesApi, clientesApi, prestamosApi, pagosApi, cuotasApi, cajaApi, auditoriaApi } from '../services/api';
import ToastNotification from '../components/ToastNotification';
import ClienteFiltroCombobox from '../components/ClienteFiltroCombobox';

// ── Formato de valores para los reportes ──────────────────────────────
const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
};

// Fechas elegidas en calendario (desembolso, vencimiento): se toma el día tal cual, sin desfase de zona horaria
const fechaDia = (v) => {
  if (!v) return '';
  const s = String(v).slice(0, 10);
  const [y, m, d] = s.split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(v);
};

// Instantes reales (pagos, registros): se muestran en la hora local de Perú
const fechaHora = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};

// Estado legible: 'EnCurso' se muestra como 'En curso'
const estadoTxt = (e) => (e === 'EnCurso' ? 'En curso' : (e || ''));

const nombreDe = (o) => o.nombreCliente || o.clienteNombre || o.nombreCompleto || `${o.nombres || ''} ${o.apellidos || ''}`.trim();

// Convierte los datos de la API en filas con columnas claras y en español.
// Encabezados con "(S/.)" se suman en TOTALES; "(%)" se muestran como porcentaje.
const construirFilas = (tipo, data, extra = {}) => {
  switch (tipo) {
    case 'prestamos-cliente': {
      const telefonos = new Map((extra.clientes || []).map(c => [c.id, c.telefono]));
      return [...data]
        .sort((a, b) => nombreDe(a).localeCompare(nombreDe(b), 'es') || String(a.fechaDesembolso).localeCompare(String(b.fechaDesembolso)))
        .map(p => ({
          'Cliente': nombreDe(p),
          'DNI': p.dniCliente || '',
          'Teléfono': telefonos.get(p.clienteId) || '',
          'N° Préstamo': p.id,
          'Fecha del Préstamo': fechaDia(p.fechaDesembolso),
          'Monto Prestado (S/.)': num(p.montoDispersado),
          'Tasa Mensual (%)': num(p.tasaInteres),
          'Interés Mensual (S/.)': num(p.interesMensualActual ?? (p.montoDispersado * p.tasaInteres / 100)),
          'Interés Cobrado (S/.)': num(p.totalInteresPagado),
          'Capital Pendiente (S/.)': num(p.saldoCapital),
          'Estado': estadoTxt(p.estado)
        }));
    }
    case 'clientes':
      return data.map(c => ({
        'DNI': c.dni || '',
        'Cliente': nombreDe(c),
        'Teléfono': c.telefono || '',
        'Correo': c.correo || '',
        'Dirección': c.direccion || '',
        'Estado': estadoTxt(c.estado),
        'Estado Crediticio': c.estadoCrediticio || '',
        'Score': c.scoreCrediticio || '',
        'N° Préstamos': c.totalPrestamos ?? 0,
        'Deuda Actual (S/.)': num(c.deudaTotal),
        'Fecha de Registro': fechaHora(c.fechaRegistro)
      }));
    case 'prestamos':
      return data.map(p => ({
        'N° Préstamo': p.id,
        'Cliente': nombreDe(p),
        'DNI': p.dniCliente || '',
        'Fecha del Préstamo': fechaDia(p.fechaDesembolso),
        'Monto Prestado (S/.)': num(p.montoDispersado),
        'Tasa Mensual (%)': num(p.tasaInteres),
        'Interés Mensual (S/.)': num(p.interesMensualActual),
        'Interés Cobrado (S/.)': num(p.totalInteresPagado),
        'Capital Amortizado (S/.)': num(p.totalCapitalAmortizado),
        'Capital Pendiente (S/.)': num(p.saldoCapital),
        'Deuda Total (S/.)': num(p.saldoPendienteTotal),
        'Estado': estadoTxt(p.estado),
        'Registrado por': p.creadoPorUsuario || ''
      }));
    case 'pagos':
      return data.map(p => ({
        'Operación': p.numeroOperacion || '',
        'Fecha y Hora': fechaHora(p.fechaPago),
        'N° Préstamo': p.prestamoId,
        'Cliente': nombreDe(p),
        'DNI': p.dniCliente || '',
        'Monto Recibido (S/.)': num(p.monto),
        'Interés (S/.)': num(p.montoInteres),
        'Capital (S/.)': num(p.montoCapital),
        'Método de Pago': p.metodoPago || '',
        'Observaciones': p.observaciones || '',
        'Cobrado por': p.usuarioNombre || ''
      }));
    case 'cuotas-vencidas':
    case 'cuotas-por-vencer':
      return data.map(c => ({
        'N° Préstamo': c.prestamoId,
        'N° Cuota': c.numeroCuota,
        'Cliente': nombreDe(c),
        'DNI': c.dniCliente || '',
        'Fecha de Vencimiento': fechaDia(c.fechaVencimiento),
        'Monto de la Cuota (S/.)': num(c.montoCuota),
        'Pagado (S/.)': num(c.montoPagado),
        'Por Cobrar (S/.)': num(c.saldoPendiente ?? c.montoCuota),
        'Días de Atraso': c.diasAtraso ?? 0,
        'Estado': estadoTxt(c.estado)
      }));
    case 'caja':
      return data.map(m => ({
        'Fecha y Hora': m.fecha || '',
        'Tipo': m.tipo || '',
        'Categoría': m.categoria || '',
        'Concepto': m.concepto || '',
        'Método': m.metodoPago || '',
        // Ingresos y egresos en columnas separadas para que los totales tengan sentido
        'Ingreso (S/.)': m.tipo === 'Ingreso' ? num(m.monto) : '',
        'Egreso (S/.)': m.tipo === 'Egreso' ? num(m.monto) : '',
        'Apertura / Cierre': (m.tipo === 'Apertura' || m.tipo === 'Cierre') ? `S/. ${num(m.monto).toFixed(2)}` : '',
        'Responsable': m.usuario || ''
      }));
    case 'auditoria':
      return data.map(a => ({
        'Fecha y Hora': a.fecha || '',
        'Usuario': a.usuario || '',
        'Módulo': a.modulo || '',
        'Acción': a.accion || '',
        'Detalle': a.detalle || '',
        'Tipo': a.tipo || ''
      }));
    default:
      return data;
  }
};

// ── Estado de cuenta individual: hojas del Excel de un solo cliente ─────────
const construirEstadoCuenta = (historial) => {
  const c = historial?.cliente || {};
  const prestamos = historial?.prestamos || [];
  const pagos = historial?.pagos || [];
  const nombre = nombreDe(c);

  const activos = prestamos.filter(p => p.estado === 'EnCurso' || p.estado === 'Vencido');
  const totalPrestado = prestamos.reduce((s, p) => s + num(p.montoDispersado), 0);
  const totalCobrado = pagos.reduce((s, p) => s + num(p.monto), 0);
  const interesCobrado = pagos.reduce((s, p) => s + num(p.montoInteres), 0);
  const capitalPendiente = activos.reduce((s, p) => s + num(p.saldoCapital), 0);
  const deudaTotal = activos.reduce((s, p) => s + num(p.saldoPendienteTotal), 0);
  const soles = (v) => `S/. ${num(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const resumen = [
    { 'Dato': 'Cliente', 'Valor': nombre },
    { 'Dato': 'DNI', 'Valor': c.dni || '' },
    { 'Dato': 'Teléfono', 'Valor': c.telefono || '' },
    { 'Dato': 'Dirección', 'Valor': c.direccion || '' },
    { 'Dato': 'Correo', 'Valor': c.correo || '' },
    { 'Dato': 'Estado del cliente', 'Valor': c.estado || '' },
    { 'Dato': 'Estado crediticio', 'Valor': `${c.estadoCrediticio || ''}${c.scoreCrediticio ? ` (${c.scoreCrediticio})` : ''}` },
    { 'Dato': 'Cliente desde', 'Valor': fechaHora(c.fechaRegistro) },
    { 'Dato': 'Préstamos otorgados', 'Valor': String(prestamos.length) },
    { 'Dato': 'Préstamos activos', 'Valor': String(activos.length) },
    { 'Dato': 'Total prestado', 'Valor': soles(totalPrestado) },
    { 'Dato': 'Total cobrado', 'Valor': soles(totalCobrado) },
    { 'Dato': 'Interés cobrado', 'Valor': soles(interesCobrado) },
    { 'Dato': 'Capital pendiente', 'Valor': soles(capitalPendiente) },
    { 'Dato': 'Deuda total actual', 'Valor': soles(deudaTotal) },
  ];

  const filasPrestamos = prestamos.map(p => ({
    'N° Préstamo': p.id,
    'Fecha del Préstamo': fechaDia(p.fechaDesembolso),
    'Monto Prestado (S/.)': num(p.montoDispersado),
    'Tasa Mensual (%)': num(p.tasaInteres),
    'Interés Mensual (S/.)': num(num(p.saldoCapital) * num(p.tasaInteres) / 100),
    'Interés Cobrado (S/.)': num(p.totalInteresPagado),
    'Capital Pendiente (S/.)': num(p.saldoCapital),
    'Deuda Total (S/.)': num(p.saldoPendienteTotal),
    'Estado': estadoTxt(p.estado)
  }));

  const filasPagos = [...pagos]
    .sort((a, b) => String(b.fechaPago).localeCompare(String(a.fechaPago)))
    .map(p => ({
      'Operación': p.numeroOperacion || '',
      'Fecha y Hora': fechaHora(p.fechaPago),
      'N° Préstamo': p.prestamoId,
      'Monto Recibido (S/.)': num(p.monto),
      'Interés (S/.)': num(p.montoInteres),
      'Capital (S/.)': num(p.montoCapital),
      'Método de Pago': p.metodoPago || '',
      'Observaciones': p.observaciones || '',
      'Cobrado por': p.usuarioNombre || ''
    }));

  const filasCuotas = prestamos.flatMap(p => (p.cuotas || []).map(cu => ({
    'N° Préstamo': p.id,
    'N° Cuota': cu.numeroCuota,
    'Fecha de Vencimiento': fechaDia(cu.fechaVencimiento),
    'Monto de la Cuota (S/.)': num(cu.montoCuota),
    'Pagado (S/.)': num(cu.montoPagado),
    'Por Cobrar (S/.)': num(cu.saldoPendiente),
    'Días de Atraso': cu.diasAtraso ?? 0,
    'Estado': estadoTxt(cu.estado)
  })));

  return {
    nombre,
    hojas: [
      { nombre: 'Resumen', titulo: `Estado de Cuenta — ${nombre}`, datos: resumen },
      { nombre: 'Préstamos', titulo: `Préstamos — ${nombre}`, datos: filasPrestamos },
      { nombre: 'Pagos', titulo: `Pagos realizados — ${nombre}`, datos: filasPagos },
      { nombre: 'Cuotas', titulo: `Cronograma de cuotas — ${nombre}`, datos: filasCuotas },
    ]
  };
};

export default function ReportesPage() {
  const [downloading, setDownloading] = useState('');
  const [notification, setNotification] = useState(null);

  // Reporte individual por cliente
  const [clientes, setClientes] = useState([]);
  const [clienteIndividual, setClienteIndividual] = useState('');
  const [generandoIndividual, setGenerandoIndividual] = useState(false);

  useEffect(() => {
    clientesApi.getClientes()
      .then(data => setClientes(data || []))
      .catch(err => console.warn('No se pudo cargar la lista de clientes:', err));
  }, []);

  const handleExportIndividual = async () => {
    if (!clienteIndividual) {
      setNotification({ type: 'warning', message: 'Seleccione un cliente para generar su estado de cuenta.' });
      return;
    }
    setGenerandoIndividual(true);
    try {
      const historial = await clientesApi.getHistorialCliente(clienteIndividual);
      const { nombre, hojas } = construirEstadoCuenta(historial);
      const archivo = `Estado_de_Cuenta_${nombre.replace(/[^\p{L}\p{N}]+/gu, '_')}`;
      await reportesApi.exportarExcelHojas(archivo, hojas);
      setNotification({ type: 'success', message: `Estado de cuenta de ${nombre} descargado con éxito.` });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: err?.response?.data?.mensaje || 'No se pudo generar el estado de cuenta del cliente.' });
    } finally {
      setGenerandoIndividual(false);
    }
  };

  const handleExport = async (tipo, formato) => {
    setDownloading(`${tipo}-${formato}`);
    try {
      let data = [];
      let filename = `Reporte_${tipo}`;

      let extra = {};

      if (tipo === 'prestamos-cliente') {
        const [prestamos, clientes] = await Promise.all([
          prestamosApi.getPrestamos(),
          clientesApi.getClientes().catch(() => [])
        ]);
        data = prestamos;
        extra = { clientes: clientes || [] };
        filename = 'Reporte_Prestamos_por_Cliente_FGR';
      } else if (tipo === 'clientes') {
        data = await clientesApi.getClientes();
        filename = 'Reporte_Clientes_Scoring_FGR';
      } else if (tipo === 'prestamos') {
        data = await prestamosApi.getPrestamos();
        filename = 'Reporte_Prestamos_General_FGR';
      } else if (tipo === 'pagos') {
        data = await pagosApi.getPagos();
        filename = 'Reporte_Transacciones_Pagos_FGR';
      } else if (tipo === 'cuotas-vencidas') {
        data = await cuotasApi.getCuotasVencidas();
        filename = 'Reporte_Cartera_Vencida_FGR';
      } else if (tipo === 'cuotas-por-vencer') {
        data = await cuotasApi.getCuotasPorVencer(7);
        filename = 'Reporte_Cronograma_Cobros_7Dias_FGR';
      } else if (tipo === 'caja') {
        data = await cajaApi.getMovimientos();
        filename = 'Reporte_Movimientos_Caja_Diaria_FGR';
      } else if (tipo === 'auditoria') {
        data = await auditoriaApi.getLogs();
        filename = 'Reporte_Trazabilidad_Auditoria_FGR';
      }

      if (!data || data.length === 0) {
        setNotification({ type: 'warning', message: 'No se encontraron registros para exportar en esta categoría.' });
        return;
      }

      data = construirFilas(tipo, data, extra);

      if (formato === 'pdf') {
        window.print();
        setNotification({ type: 'success', message: 'Vista previa de impresión generada.' });
      } else if (formato === 'excel') {
        await reportesApi.exportarExcel(filename, data);
        setNotification({ type: 'success', message: `Excel "${filename}.xlsx" descargado con éxito.` });
      } else if (formato === 'csv') {
        reportesApi.exportarCSV(filename, data);
        setNotification({ type: 'success', message: `CSV "${filename}.csv" descargado con éxito.` });
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Ocurrió un error al generar el reporte solicitado.' });
    } finally {
      setDownloading('');
    }
  };

  const reportesConfig = [
    {
      id: 'prestamos-cliente',
      title: 'Préstamos por Cliente',
      desc: 'Datos de cada cliente con la fecha en que se le dio el préstamo, el monto prestado y el interés mensual y cobrado.',
      icon: HandCoins,
      color: '#9A7412',
      badge: 'Nuevo'
    },
    {
      id: 'cuotas-vencidas',
      title: 'Cartera Vencida & Antigüedad de Deuda',
      desc: 'Detalle de cuotas impagas, días de atraso y clientes en riesgo.',
      icon: AlertTriangle,
      color: '#dc2626',
      badge: 'Prioridad Crítica'
    },
    {
      id: 'caja',
      title: 'Arqueo & Flujo de Caja Diaria',
      desc: 'Historial de aperturas, cierres, cobros en efectivo, cobros digitales y egresos operativos.',
      icon: Wallet,
      color: '#9A7412',
      badge: 'Control Financiero'
    },
    {
      id: 'clientes',
      title: 'Padrón de Clientes & Calificación (Scoring)',
      desc: 'Exportación completa con DNI, teléfonos, historial de crédito, score y límites asignados.',
      icon: Users,
      color: '#2563eb'
    },
    {
      id: 'prestamos',
      title: 'Consolidado General de Préstamos',
      desc: 'Capital dispersado, tasas de interés, número de cuotas, saldo deudor y rentabilidad.',
      icon: Banknote,
      color: '#C99A2E'
    },
    {
      id: 'pagos',
      title: 'Historial Transaccional de Pagos & Recibos',
      desc: 'Detalle de ingresos por ventanilla, Yape, Plin y transferencias con números de voucher.',
      icon: Receipt,
      color: '#7c3aed'
    },
    {
      id: 'cuotas-por-vencer',
      title: 'Proyección de Cobranza (Próximos 7 Días)',
      desc: 'Cronograma detallado de cuotas que vencen próximamente para optimizar rutas de cobro.',
      icon: TrendingUp,
      color: '#d97706'
    },
    {
      id: 'auditoria',
      title: 'Registro de Auditoría & Trazabilidad',
      desc: 'Historial de todas las operaciones realizadas por los operadores para control interno.',
      icon: History,
      color: '#475569'
    }
  ];

  return (
    <div className="content-body">
      <ToastNotification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      <div className="card-panel">
        <div className="panel-header">
          <div className="panel-title">
            <FileSpreadsheet className="text-primary" size={22} />
            Centro de Reportes & Exportación de Datos
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Genere descargas instantáneas en Excel (.xlsx) y CSV para análisis contable, auditoría y control de cartera.
        </p>

        {/* Reporte individual por cliente */}
        <div style={{
          border: '1px solid rgba(201, 154, 46, 0.4)',
          background: 'linear-gradient(135deg, rgba(201, 154, 46, 0.10), rgba(201, 154, 46, 0.02))',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.4rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 300px' }}>
            <div className="kpi-icon" style={{ background: 'var(--black)', color: 'var(--gold-300)' }}>
              <User size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Estado de Cuenta Individual</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Excel de un solo cliente con su resumen, préstamos (fecha, monto e interés), pagos realizados y cronograma de cuotas.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flex: '1 1 380px', flexWrap: 'wrap' }}>
            <ClienteFiltroCombobox
              opciones={clientes.map(c => ({
                value: c.id,
                nombre: nombreDe(c),
                dni: c.dni || '',
                telefono: c.telefono || ''
              }))}
              value={clienteIndividual}
              onChange={setClienteIndividual}
              placeholder="Escriba DNI o Nombre del cliente..."
              minWidth="240px"
            />
            <button
              className="btn btn-primary"
              onClick={handleExportIndividual}
              disabled={generandoIndividual || !clienteIndividual}
              title={clienteIndividual ? 'Descargar estado de cuenta en Excel' : 'Primero seleccione un cliente'}
            >
              <FileSpreadsheet size={16} />
              {generandoIndividual ? 'Generando...' : 'Descargar Excel'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {reportesConfig.map((rep) => {
            const Icon = rep.icon;
            const isExpExcel = downloading === `${rep.id}-excel`;
            const isExpCsv = downloading === `${rep.id}-csv`;
            return (
              <div 
                key={rep.id} 
                className="kpi-card" 
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', padding: '1.4rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div className="kpi-icon" style={{ background: `${rep.color}15`, color: rep.color }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{rep.title}</h3>
                    </div>
                  </div>
                  {rep.badge && (
                    <span className="badge" style={{ fontSize: '0.7rem', background: `${rep.color}15`, color: rep.color, borderColor: 'transparent' }}>
                      {rep.badge}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                  {rep.desc}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: 'auto' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1 }}
                    onClick={() => handleExport(rep.id, 'excel')}
                    disabled={isExpExcel}
                  >
                    <FileSpreadsheet size={14} style={{ color: '#9A7412' }} />
                    {isExpExcel ? '...' : 'Excel'}
                  </button>

                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1 }}
                    onClick={() => handleExport(rep.id, 'csv')}
                    disabled={isExpCsv}
                  >
                    <Download size={14} style={{ color: '#2563eb' }} />
                    {isExpCsv ? '...' : 'CSV'}
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
