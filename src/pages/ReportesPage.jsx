import React, { useState } from 'react';
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
  HandCoins
} from 'lucide-react';
import { reportesApi, clientesApi, prestamosApi, pagosApi, cuotasApi, cajaApi, auditoriaApi } from '../services/api';
import ToastNotification from '../components/ToastNotification';

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
          'Estado': p.estado || ''
        }));
    }
    case 'clientes':
      return data.map(c => ({
        'DNI': c.dni || '',
        'Cliente': nombreDe(c),
        'Teléfono': c.telefono || '',
        'Correo': c.correo || '',
        'Dirección': c.direccion || '',
        'Estado': c.estado || '',
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
        'Estado': p.estado || '',
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
        'Estado': c.estado || ''
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

export default function ReportesPage() {
  const [downloading, setDownloading] = useState('');
  const [notification, setNotification] = useState(null);

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
