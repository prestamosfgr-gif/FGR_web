import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  User,
  Phone,
  CalendarCheck,
  Eye
} from 'lucide-react';
import { cuotasApi, getWhatsAppLink } from '../services/api';
import ClienteFiltroCombobox from '../components/ClienteFiltroCombobox';

// Fecha "YYYY-MM-DD" según la hora local (Perú), no UTC: evita que después de las 7 p. m. marque el día siguiente
const fechaLocal = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Identificador del cliente de una cuota (DNI si existe, si no el nombre)
const claveCliente = (c) => c.dniCliente || c.clienteDni || c.nombreCliente || c.clienteNombre || '';

export default function CalendarioPage({ onCobrarCuota, onNavigateTab }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(fechaLocal());
  const [clienteFiltro, setClienteFiltro] = useState('');

  useEffect(() => {
    loadCuotas();
  }, []);

  const loadCuotas = async () => {
    setLoading(true);
    try {
      const data = await cuotasApi.getAllCuotas();
      setCuotas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(fechaLocal(today));
  };

  // Lista de clientes que tienen cuotas, ordenada alfabéticamente
  const clientesOpciones = useMemo(() => {
    const mapa = new Map();
    cuotas.forEach(c => {
      const clave = claveCliente(c);
      if (!clave || mapa.has(clave)) return;
      mapa.set(clave, {
        clave,
        nombre: c.nombreCliente || c.clienteNombre || 'Sin nombre',
        dni: c.dniCliente || c.clienteDni || ''
      });
    });
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [cuotas]);

  const cuotasFiltradas = clienteFiltro ? cuotas.filter(c => claveCliente(c) === clienteFiltro) : cuotas;

  // Al elegir un cliente, el calendario salta a su próximo vencimiento pendiente
  const handleFiltroCliente = (clave) => {
    setClienteFiltro(clave);
    if (!clave) return;

    const hoy = fechaLocal();
    const delCliente = cuotas
      .filter(c => claveCliente(c) === clave)
      .map(c => ({ ...c, fecha: c.fechaVencimiento?.split('T')[0] || c.fechaVencimiento }))
      .filter(c => c.fecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const pendientes = delCliente.filter(c => c.estado !== 'Pagado');
    const destino = pendientes.find(c => c.fecha >= hoy) || pendientes[0] || delCliente[delCliente.length - 1];
    if (destino) {
      const [y, m] = destino.fecha.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, 1));
      setSelectedDay(destino.fecha);
    }
  };

  const clienteSeleccionado = clientesOpciones.find(o => o.clave === clienteFiltro);
  const pendienteCliente = cuotasFiltradas
    .filter(c => c.estado !== 'Pagado')
    .reduce((sum, c) => sum + (parseFloat(c.saldoPendiente ?? c.montoCuota) || 0), 0);

  // Cálculos para la cuadrícula del calendario
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Domingo, 1 = Lunes, ...
  // Ajustar para empezar en Lunes (0 = Lunes, 6 = Domingo)
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Mapear cuotas por fecha "YYYY-MM-DD"
  const cuotasPorFecha = {};
  cuotasFiltradas.forEach(c => {
    const fecha = c.fechaVencimiento?.split('T')[0] || c.fechaVencimiento;
    if (!cuotasPorFecha[fecha]) {
      cuotasPorFecha[fecha] = [];
    }
    cuotasPorFecha[fecha].push(c);
  });

  const cuotasDelDiaSeleccionado = cuotasPorFecha[selectedDay] || [];
  const totalDiaCobrar = cuotasDelDiaSeleccionado.reduce((sum, c) => sum + (parseFloat(c.montoCuota) || 0), 0);
  const totalDiaCobrado = cuotasDelDiaSeleccionado.filter(c => c.estado === 'Pagado').reduce((sum, c) => sum + (parseFloat(c.montoCuota) || 0), 0);

  const handleWhatsApp = (c) => {
    const nombre = c.nombreCliente || c.clienteNombre || 'Cliente';
    const monto = parseFloat(c.montoCuota).toFixed(2);
    const mensaje = `Hola ${nombre}, le saludamos de *FGR Préstamos*. Le recordamos que su cuota #${c.numeroCuota} por *S/. ${monto}* tiene fecha programada para el día ${selectedDay}. Agradecemos su confirmación. ¡Muchas gracias!`;
    const url = getWhatsAppLink(c.telefonoCliente, mensaje);
    if (url) {
      window.open(url, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
    }
  };

  return (
    <div className="content-body">
      <div className="card-panel">
        {/* Header del Calendario */}
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarCheck className="text-primary" size={24} />
            <span>Calendario Interactivo de Cobranzas</span>
          </div>

          <div className="cal-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Filtro por cliente (escribiendo DNI o nombre) */}
            <div className="cal-filter" style={{ marginRight: '0.5rem' }}>
              <ClienteFiltroCombobox
                opciones={clientesOpciones.map(o => ({ value: o.clave, nombre: o.nombre, dni: o.dni }))}
                value={clienteFiltro}
                onChange={handleFiltroCliente}
                disabled={loading}
              />
            </div>

            <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </button>

            <span className="cal-month" style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: '170px', textAlign: 'center', color: 'var(--text-main)' }}>
              {monthNames[month]} {year}
            </span>

            <button className="btn btn-secondary btn-sm" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </button>

            <button className="btn btn-secondary btn-sm" onClick={handleToday} style={{ marginLeft: '0.5rem' }}>
              Hoy
            </button>
          </div>
        </div>

        {/* Resumen del cliente filtrado */}
        {clienteSeleccionado && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.7rem 1rem',
            marginBottom: '1rem',
            borderRadius: '10px',
            border: '1px solid rgba(201, 154, 46, 0.35)',
            background: 'rgba(201, 154, 46, 0.08)'
          }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
              Mostrando cuotas de <strong>{clienteSeleccionado.nombre}</strong>
              {clienteSeleccionado.dni && <span style={{ color: 'var(--text-muted)' }}> · DNI {clienteSeleccionado.dni}</span>}
              <span style={{ color: 'var(--text-muted)' }}> · {cuotasFiltradas.length} {cuotasFiltradas.length === 1 ? 'cuota' : 'cuotas'}</span>
              <span style={{ color: 'var(--text-muted)' }}> · Pendiente: </span>
              <strong style={{ color: 'var(--primary)' }}>S/. {pendienteCliente.toFixed(2)}</strong>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setClienteFiltro('')}>
              Ver todos los clientes
            </button>
          </div>
        )}

        {/* Calendar Grid Container */}
        <div className="cal-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '6px',
          background: '#f8fafc',
          padding: '0.75rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}>
          {/* Day Names */}
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
            <div key={i} className="cal-weekday" style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.35rem 0' }}>
              {d}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="cal-empty" style={{ minHeight: '85px', background: 'transparent' }} />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayCuotas = cuotasPorFecha[dateStr] || [];
            const isSelected = selectedDay === dateStr;
            const isToday = fechaLocal() === dateStr;
            
            const totalDia = dayCuotas.reduce((sum, c) => sum + (parseFloat(c.montoCuota) || 0), 0);
            const tieneVencidas = dayCuotas.some(c => c.estado === 'Vencido');
            const todasPagadas = dayCuotas.length > 0 && dayCuotas.every(c => c.estado === 'Pagado');

            return (
              <div
                key={dateStr}
                className="cal-day"
                onClick={() => setSelectedDay(dateStr)}
                style={{
                  minHeight: '85px',
                  background: isSelected ? 'rgba(201, 154, 46, 0.08)' : '#ffffff',
                  border: isSelected ? '2px solid var(--primary)' : isToday ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '0.45rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(201, 154, 46, 0.15)' : 'none'
                }}
              >
                <div className="cal-day-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="cal-day-num" style={{
                    fontWeight: isToday || isSelected ? 800 : 600,
                    fontSize: '0.85rem',
                    color: isToday ? '#2563eb' : 'var(--text-main)',
                    background: isToday ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                    padding: isToday ? '1px 6px' : '0',
                    borderRadius: '6px'
                  }}>
                    {dayNum}
                  </span>

                  {dayCuotas.length > 0 && (
                    <span className="cal-badge" style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: tieneVencidas ? '#fee2e2' : todasPagadas ? '#dcfce7' : '#e0f2fe',
                      color: tieneVencidas ? '#dc2626' : todasPagadas ? '#15803d' : '#0369a1',
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}>
                      {dayCuotas.length}<span className="cal-badge-word"> {dayCuotas.length === 1 ? 'cuota' : 'cuotas'}</span>
                    </span>
                  )}
                </div>

                {dayCuotas.length > 0 && (
                  <div style={{ marginTop: 'auto', paddingTop: '0.25rem' }}>
                    <div className="cal-amount-full" style={{ fontSize: '0.78rem', fontWeight: 800, color: tieneVencidas ? '#dc2626' : 'var(--primary)' }}>
                      S/. {totalDia.toFixed(2)}
                    </div>
                    {/* Versión compacta para celulares */}
                    <div className="cal-amount-short" style={{ display: 'none', fontWeight: 800, color: tieneVencidas ? '#dc2626' : 'var(--primary)' }}>
                      {totalDia >= 1000 ? `${(totalDia / 1000).toFixed(1)}k` : Math.round(totalDia)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Panel Detallado del Día Seleccionado */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Cronograma del Día: {selectedDay}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {cuotasDelDiaSeleccionado.length} operación(es) programadas
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Programado:</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  S/. {totalDiaCobrar.toFixed(2)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Cobrado:</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#9A7412' }}>
                  S/. {totalDiaCobrado.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Cuotas del Día */}
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Préstamo</th>
                  <th>N° Cuota</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuotasDelDiaSeleccionado.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--text-muted)' }}>
                      No hay vencimientos de cuotas programados para este día.
                    </td>
                  </tr>
                ) : (
                  cuotasDelDiaSeleccionado.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.nombreCliente || c.clienteNombre}</div>
                        {c.telefonoCliente && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Tel: {c.telefonoCliente}
                          </div>
                        )}
                      </td>
                      <td><strong>Préstamo #{c.prestamoId}</strong></td>
                      <td>Cuota #{c.numeroCuota}</td>
                      <td style={{ fontWeight: 800, color: c.estado === 'Pagado' ? '#9A7412' : '#0f172a', fontSize: '1rem' }}>
                        S/. {parseFloat(c.montoCuota).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge badge-${c.estado?.toLowerCase()}`}>
                          {c.estado}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleWhatsApp(c)}
                            title="Enviar recordatorio por WhatsApp"
                            style={{ color: '#9A7412', borderColor: 'rgba(201, 154, 46, 0.3)' }}
                          >
                            <MessageSquare size={14} />
                            WhatsApp
                          </button>

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (c.estado === 'Vencido') {
                                onNavigateTab('cartera-vencida', { highlightCuotaId: c.id });
                              } else {
                                onNavigateTab('prestamos', { highlightPrestamoId: c.prestamoId });
                              }
                            }}
                            title="Ver seguimiento de la operación"
                            style={{ color: '#475569', borderColor: '#cbd5e1' }}
                          >
                            <Eye size={14} />
                            Ver
                          </button>

                          {c.estado !== 'Pagado' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => onCobrarCuota(c)}
                            >
                              <DollarSign size={14} />
                              Cobrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
