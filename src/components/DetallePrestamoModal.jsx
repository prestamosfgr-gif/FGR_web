import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Banknote, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  RefreshCw, 
  AlertCircle,
  TrendingDown,
  Receipt,
  Printer
} from 'lucide-react';
import { cuotasApi, prestamosApi, pagosApi } from '../services/api';
import ConfirmModal from './ConfirmModal';
import ReciboPagoModal from './ReciboPagoModal';

export default function DetallePrestamoModal({ isOpen, onClose, prestamo, onCobrarCuota, onRefinanciar, onActualizar }) {
  const [cuotas, setCuotas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('cuotas'); // 'cuotas' | 'amortizaciones' | 'todos'
  const [selectedPagoRecibo, setSelectedPagoRecibo] = useState(null);
  const [isConfirmCancelarOpen, setIsConfirmCancelarOpen] = useState(false);
  const [isCancelando, setIsCancelando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && prestamo) {
      setErrorMsg('');
      setActiveTab('cuotas');
      loadData();
    }
  }, [isOpen, prestamo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cuotasData, pagosData] = await Promise.all([
        cuotasApi.getCuotasByPrestamo(prestamo.id).catch(err => {
          console.error(err);
          return [];
        }),
        pagosApi.getPagos(prestamo.id).catch(err => {
          console.error(err);
          return [];
        })
      ]);
      const sortedCuotas = (cuotasData || []).slice().sort((a, b) => (b.numeroCuota || 0) - (a.numeroCuota || 0));
      const sortedPagos = (pagosData || []).slice().sort((a, b) => new Date(b.fechaPago || 0) - new Date(a.fechaPago || 0) || (b.id || 0) - (a.id || 0));
      setCuotas(sortedCuotas);
      setPagos(sortedPagos);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron cargar los datos del préstamo.');
    } finally {
      setLoading(false);
    }
  };

  const amortizaciones = useMemo(() => {
    return (pagos || []).filter(p => parseFloat(p.montoCapital || 0) > 0);
  }, [pagos]);

  const totalAmortizadoReal = useMemo(() => {
    return amortizaciones.reduce((acc, a) => acc + parseFloat(a.montoCapital || 0), 0);
  }, [amortizaciones]);

  const handleConfirmCancelar = async () => {
    setIsCancelando(true);
    try {
      await prestamosApi.cancelarPrestamo(prestamo.id);
      setIsConfirmCancelarOpen(false);
      if (onActualizar) onActualizar();
      onClose();
    } catch (err) {
      setErrorMsg('Error al cancelar el préstamo. Verifique que no tenga pagos consolidados.');
    } finally {
      setIsCancelando(false);
    }
  };

  const handleRefinanciar = () => {
    if (onRefinanciar) {
      onRefinanciar(prestamo);
      onClose();
    }
  };

  if (!isOpen || !prestamo) return null;

  const nombreCliente = prestamo.clienteNombre || prestamo.nombreCliente || 'Cliente';
  const saldoPendiente = prestamo.saldoPendienteTotal !== undefined ? prestamo.saldoPendienteTotal : (prestamo.saldoPendiente !== undefined ? prestamo.saldoPendiente : 0);
  const saldoCapVigente = prestamo.saldoCapital !== undefined ? prestamo.saldoCapital : prestamo.montoDispersado;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-container" style={{ maxWidth: '920px' }}>
          <div className="modal-header">
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Banknote className="text-primary" size={22} />
                Préstamo #{prestamo.id} - {nombreCliente}
              </h3>
              {(() => {
                const esCompletado = prestamo.estado === 'Pagado' || (parseFloat(saldoCapVigente || 0) <= 0 && prestamo.estado !== 'Cancelado');
                const texto = esCompletado ? 'Completado' : prestamo.estado === 'EnCurso' ? 'En Curso' : prestamo.estado;
                const badgeClass = esCompletado ? 'badge-completado' : `badge-${prestamo.estado?.toLowerCase()}`;
                return (
                  <span className={`badge ${badgeClass}`} style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {esCompletado && <CheckCircle size={13} />}
                    {texto}
                  </span>
                );
              })()}
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            {errorMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#dc2626',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {(prestamo.estado === 'Pagado' || (parseFloat(saldoCapVigente || 0) <= 0 && prestamo.estado !== 'Cancelado')) && (
              <div style={{
                padding: '0.65rem 1rem',
                background: 'rgba(201, 154, 46, 0.1)',
                border: '1px solid rgba(201, 154, 46, 0.3)',
                borderRadius: '8px',
                color: '#9A7412',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600
              }}>
                <CheckCircle size={18} />
                <span>¡Préstamo Completado! El capital ha sido amortizado en su totalidad y no registra saldo pendiente.</span>
              </div>
            )}

            {/* Summary Cards - 4 en una sola línea */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
              gap: '0.75rem', 
              marginBottom: '1.25rem' 
            }}>
              <div className="kpi-card" style={{ padding: '0.75rem 0.85rem' }}>
                <div className="kpi-info">
                  <h4 style={{ fontSize: '0.75rem' }}>Capital Inicial</h4>
                  <div className="kpi-value" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
                    S/. {parseFloat(prestamo.montoDispersado).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Desembolso original</div>
                </div>
              </div>

              <div className="kpi-card" style={{ padding: '0.75rem 0.85rem' }}>
                <div className="kpi-info">
                  <h4 style={{ fontSize: '0.75rem' }}>Saldo Capital Vigente</h4>
                  <div className="kpi-value" style={{ fontSize: '1.2rem', color: '#1e40af', whiteSpace: 'nowrap' }}>
                    S/. {parseFloat(saldoCapVigente).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Capital pendiente</div>
                </div>
              </div>

              <div className="kpi-card" style={{ padding: '0.75rem 0.85rem' }}>
                <div className="kpi-info">
                  <h4 style={{ fontSize: '0.75rem' }}>Interés Mensual Actual</h4>
                  <div className="kpi-value" style={{ fontSize: '1.2rem', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                    S/. {parseFloat(prestamo.interesMensualActual || (saldoCapVigente * (prestamo.tasaInteres / 100)) || 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({prestamo.tasaInteres}% sobre saldo)</div>
                </div>
              </div>

              <div className="kpi-card" style={{ padding: '0.75rem 0.85rem' }}>
                <div className="kpi-info">
                  <h4 style={{ fontSize: '0.75rem' }}>Capital Amortizado</h4>
                  <div className="kpi-value" style={{ fontSize: '1.2rem', color: '#16a34a', whiteSpace: 'nowrap' }}>
                    S/. {Math.max(totalAmortizadoReal, parseFloat(prestamo.montoDispersado || 0) - parseFloat(saldoCapVigente)).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {amortizaciones.length} abono(s)
                  </div>
                </div>
              </div>
            </div>

            {/* Pestañas de Navegación: Cuotas vs Amortizaciones vs Todos */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.85rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.65rem'
            }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('cuotas')}
                  className="btn btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    background: activeTab === 'cuotas' ? 'var(--primary)' : '#f1f5f9',
                    color: activeTab === 'cuotas' ? '#ffffff' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Calendar size={14} />
                  <span>Cuotas de Interés</span>
                  <span style={{
                    background: activeTab === 'cuotas' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.72rem'
                  }}>
                    {cuotas.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('amortizaciones')}
                  className="btn btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    background: activeTab === 'amortizaciones' ? '#16a34a' : '#f1f5f9',
                    color: activeTab === 'amortizaciones' ? '#ffffff' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <TrendingDown size={14} />
                  <span>Amortizaciones a Capital</span>
                  <span style={{
                    background: activeTab === 'amortizaciones' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.72rem'
                  }}>
                    {amortizaciones.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('todos')}
                  className="btn btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    background: activeTab === 'todos' ? '#2563eb' : '#f1f5f9',
                    color: activeTab === 'todos' ? '#ffffff' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Receipt size={14} />
                  <span>Todos los Pagos ({pagos.length})</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Cuotas Mensuales de Interés */}
            {activeTab === 'cuotas' && (
              <div className="table-responsive" style={{ maxHeight: '280px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>N° Período</th>
                      <th>Vencimiento</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Interés del Mes</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Monto Pagado</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Saldo Interés</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem' }}>Cargando cuotas...</td>
                      </tr>
                    ) : cuotas.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No hay cuotas registradas.</td>
                      </tr>
                    ) : (
                      cuotas.map(c => (
                        <tr key={c.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>Mes #{c.numeroCuota}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{c.fechaVencimiento?.split('T')[0] || c.fechaVencimiento}</td>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>S/. {parseFloat(c.montoCuota).toFixed(2)}</td>
                          <td style={{ whiteSpace: 'nowrap', color: '#16a34a' }}>S/. {parseFloat(c.montoPagado || 0).toFixed(2)}</td>
                          <td style={{ whiteSpace: 'nowrap', color: parseFloat(c.saldoPendiente || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                            S/. {parseFloat(c.saldoPendiente || 0).toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge badge-${c.estado?.toLowerCase()}`}>
                              {c.estado === 'Pagado' && <CheckCircle size={12} />}
                              {c.estado === 'Vencido' && <AlertTriangle size={12} />}
                              {c.estado === 'Pendiente' && <Clock size={12} />}
                              {c.estado}
                            </span>
                          </td>
                          <td>
                            {c.estado !== 'Pagado' && prestamo.estado !== 'Cancelado' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  if (onCobrarCuota) {
                                    onCobrarCuota({ ...c, prestamoId: prestamo.id });
                                    onClose();
                                  }
                                }}
                              >
                                <DollarSign size={14} />
                                Cobrar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Amortizaciones a Capital */}
            {activeTab === 'amortizaciones' && (
              <div className="table-responsive" style={{ maxHeight: '280px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Recibo / Operación</th>
                      <th>Fecha y Hora</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Capital Amortizado</th>
                      <th>Método de Pago</th>
                      <th>Observaciones</th>
                      <th>Comprobante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>Cargando amortizaciones...</td>
                      </tr>
                    ) : amortizaciones.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No se han registrado abonos directos a capital en este préstamo todavía.
                        </td>
                      </tr>
                    ) : (
                      amortizaciones.map(a => (
                        <tr key={a.id}>
                          <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                            {a.numeroOperacion || `REC-${a.id}`}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                            {a.fechaPago ? a.fechaPago.split('.')[0].replace('T', ' ') : '---'}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 800, color: '#16a34a', fontSize: '1.05rem' }}>
                            S/. {parseFloat(a.montoCapital).toFixed(2)}
                          </td>
                          <td>
                            <span className="badge badge-activo" style={{ background: 'rgba(59,130,246,0.12)', color: '#2563eb' }}>
                              {a.metodoPago || 'Efectivo'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {a.observaciones || 'Abono directo a capital'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedPagoRecibo(a)}
                              title="Ver Comprobante"
                            >
                              <Printer size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: Todos los Pagos / Historial Completo */}
            {activeTab === 'todos' && (
              <div className="table-responsive" style={{ maxHeight: '280px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Recibo</th>
                      <th>Fecha</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Total Cobrado</th>
                      <th style={{ whiteSpace: 'nowrap' }}>A Interés</th>
                      <th style={{ whiteSpace: 'nowrap' }}>A Capital</th>
                      <th>Método</th>
                      <th>Comprobante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem' }}>Cargando historial de pagos...</td>
                      </tr>
                    ) : pagos.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No se han registrado pagos para este préstamo.
                        </td>
                      </tr>
                    ) : (
                      pagos.map(p => (
                        <tr key={p.id}>
                          <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                            {p.numeroOperacion || `REC-${p.id}`}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                            {p.fechaPago ? p.fechaPago.split('T')[0] : '---'}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 800, color: 'var(--text-main)' }}>
                            S/. {parseFloat(p.monto).toFixed(2)}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--primary)', fontWeight: 600 }}>
                            S/. {parseFloat(p.montoInteres || 0).toFixed(2)}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', color: '#16a34a', fontWeight: 700 }}>
                            S/. {parseFloat(p.montoCapital || 0).toFixed(2)}
                          </td>
                          <td>
                            <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                              {p.metodoPago || 'Efectivo'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedPagoRecibo(p)}
                              title="Ver Comprobante"
                            >
                              <Printer size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <div>
              {prestamo.estado !== 'Cancelado' && prestamo.estado !== 'Pagado' && (
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setIsConfirmCancelarOpen(true)} 
                  style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)' }}
                >
                  <XCircle size={16} />
                  Cancelar Préstamo
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(prestamo.estado === 'EnCurso' || prestamo.estado === 'Vencido') && (
                <button className="btn btn-secondary" onClick={handleRefinanciar} style={{ color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)' }}>
                  <RefreshCw size={16} />
                  Refinanciar Préstamo
                </button>
              )}

              <button className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ver Comprobante / Recibo Modal */}
      {selectedPagoRecibo && (
        <ReciboPagoModal
          isOpen={Boolean(selectedPagoRecibo)}
          onClose={() => setSelectedPagoRecibo(null)}
          pago={selectedPagoRecibo}
        />
      )}

      {/* Confirmación estilizada para Cancelar Préstamo */}
      <ConfirmModal
        isOpen={isConfirmCancelarOpen}
        onClose={() => setIsConfirmCancelarOpen(false)}
        onConfirm={handleConfirmCancelar}
        title="¿Cancelar este Préstamo?"
        type="danger"
        confirmText="Sí, Cancelar Préstamo"
        cancelText="Volver"
        isLoading={isCancelando}
        message={`¿Está seguro de cancelar el préstamo #${prestamo.id} de ${nombreCliente}? Esta acción cambiará el estado a Cancelado.`}
        highlightText={`Saldo pendiente: S/. ${parseFloat(saldoPendiente).toFixed(2)}`}
      />
    </>
  );
}
