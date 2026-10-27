import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Mail, CreditCard, Banknote, ToggleLeft, ShieldAlert, ShieldCheck, MessageSquare } from 'lucide-react';
import { clientesApi, getWhatsAppLink } from '../services/api';

export default function DetalleClienteModal({ isOpen, onClose, cliente, onActualizar }) {
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estadoCrediticioState, setEstadoCrediticioState] = useState('Al día');
  const [scoreCrediticioState, setScoreCrediticioState] = useState('A');

  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    if (isOpen && cliente) {
      setFeedbackMsg(null);
      setEstadoCrediticioState(cliente.estadoCrediticio || 'Al día');
      setScoreCrediticioState(cliente.scoreCrediticio || 'A');
      loadHistorial();
    }
  }, [isOpen, cliente]);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const data = await clientesApi.getHistorialCliente(cliente.id);
      setHistorial(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async () => {
    const nuevoEstado = cliente.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await clientesApi.patchEstadoCliente(cliente.id, nuevoEstado);
      if (onActualizar) onActualizar();
      onClose();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Error al cambiar el estado del cliente.' });
    }
  };

  const handleCambiarScore = async (nuevoEstadoCred) => {
    try {
      let nuevoScore = 'A';
      if (nuevoEstadoCred === 'En mora') nuevoScore = 'C';
      if (nuevoEstadoCred === 'Bloqueado') nuevoScore = 'D-';
      
      await clientesApi.patchScoreCrediticio(cliente.id, {
        estadoCrediticio: nuevoEstadoCred,
        scoreCrediticio: nuevoScore,
        motivo: `Actualización manual de calificación a ${nuevoEstadoCred}`
      });
      setEstadoCrediticioState(nuevoEstadoCred);
      setScoreCrediticioState(nuevoScore);
      setFeedbackMsg({ type: 'success', text: `Calificación actualizada a "${nuevoEstadoCred}" exitosamente.` });
      if (onActualizar) onActualizar();
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      console.error('Error al actualizar score crediticio:', err);
      const msg = err?.response?.data?.mensaje || err?.message || 'Error al actualizar calificación crediticia.';
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  const handleWhatsApp = () => {
    const nombre = cliente.nombreCompleto || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
    const mensaje = `Hola ${nombre}, le saludamos de *FGR Préstamos*.`;
    const url = getWhatsAppLink(cliente.telefono, mensaje);
    if (url) window.open(url, '_blank');
    else window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  if (!isOpen || !cliente) return null;

  const nombreCliente = cliente.nombreCompleto || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || 'Cliente';

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User className="text-primary" size={22} />
              {nombreCliente}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px' }}>
              <span className={`badge badge-${cliente.estado?.toLowerCase()}`}>
                {cliente.estado}
              </span>
              <span className="badge" style={{
                background: estadoCrediticioState === 'Bloqueado' ? '#fee2e2' : estadoCrediticioState === 'En mora' ? '#fef3c7' : '#dcfce7',
                color: estadoCrediticioState === 'Bloqueado' ? '#dc2626' : estadoCrediticioState === 'En mora' ? '#d97706' : '#15803d',
                borderColor: 'transparent',
                fontWeight: 700
              }}>
                {estadoCrediticioState === 'Bloqueado' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                Score: {estadoCrediticioState} ({scoreCrediticioState})
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {feedbackMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              background: feedbackMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(201, 154, 46, 0.1)',
              border: `1px solid ${feedbackMsg.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(201, 154, 46, 0.3)'}`,
              borderRadius: '8px',
              color: feedbackMsg.type === 'error' ? '#dc2626' : '#9A7412',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500
            }}>
              <span>{feedbackMsg.type === 'error' ? '⚠️' : '✅'} {feedbackMsg.text}</span>
            </div>
          )}

          {/* Info grid */}
          <div className="form-grid" style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DNI:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cliente.dni}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Teléfono:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cliente.telefono || 'Sin registrar'}</span>
                {cliente.telefono && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleWhatsApp}
                    style={{ padding: '1px 6px', color: '#9A7412', borderColor: 'rgba(201, 154, 46, 0.3)' }}
                    title="Enviar WhatsApp"
                  >
                    <MessageSquare size={12} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Correo:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cliente.correo || 'Sin registrar'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dirección:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cliente.direccion || 'Sin registrar'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contacto Emergencia:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cliente.contactoEmergencia || 'Sin registrar'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Límite de Crédito:</span>
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>S/. {parseFloat(cliente.limiteCredito || 3000).toFixed(2)}</div>
            </div>
          </div>

          {/* Calificación y Bloqueo de Seguridad */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.9rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>Calificación Crediticia del Cliente</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Controle si el cliente califica para nuevos desembolsos o si debe bloquearse</div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                className={`btn btn-sm ${estadoCrediticioState === 'Al día' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleCambiarScore('Al día')}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                Al día (Apto)
              </button>
              <button
                className={`btn btn-sm ${estadoCrediticioState === 'En mora' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleCambiarScore('En mora')}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: estadoCrediticioState === 'En mora' ? '#f59e0b' : undefined, borderColor: '#f59e0b' }}
              >
                En mora
              </button>
              <button
                className={`btn btn-sm ${estadoCrediticioState === 'Bloqueado' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleCambiarScore('Bloqueado')}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: estadoCrediticioState === 'Bloqueado' ? '#dc2626' : undefined, borderColor: '#dc2626' }}
              >
                Bloquear Cliente
              </button>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Banknote size={18} className="text-primary" />
            Historial de Préstamos del Cliente
          </h4>

          <div className="table-responsive" style={{ maxHeight: '220px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Préstamo #</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Capital Inicial</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Saldo Capital</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Interés Mes</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Interés Pendiente</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '1.25rem' }}>Cargando historial...</td>
                  </tr>
                ) : !historial?.prestamos || historial.prestamos.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)' }}>El cliente no posee préstamos registrados.</td>
                  </tr>
                ) : (
                  historial.prestamos.map(p => {
                    const saldoCap = p.saldoCapital !== undefined ? p.saldoCapital : p.montoDispersado;
                    const interesMes = p.interesMensualActual !== undefined 
                      ? p.interesMensualActual 
                      : (saldoCap * ((p.tasaInteres || 5) / 100));
                    return (
                      <tr key={p.id}>
                        <td style={{ whiteSpace: 'nowrap' }}><strong>Préstamo #{p.id}</strong></td>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>S/. {parseFloat(p.montoDispersado).toFixed(2)}</td>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 700, color: '#1e40af' }}>
                          S/. {parseFloat(saldoCap).toFixed(2)}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--primary)', fontWeight: 600 }}>
                          S/. {parseFloat(interesMes).toFixed(2)}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: (p.saldoPendienteTotal || 0) > 0 ? '#dc2626' : '#9A7412', fontWeight: 700 }}>
                          S/. {parseFloat(p.saldoPendienteTotal || 0).toFixed(2)}
                        </td>
                        <td>
                          {(() => {
                            const esCompletado = p.estado === 'Pagado' || (parseFloat(saldoCap || 0) <= 0 && p.estado !== 'Cancelado');
                            const texto = esCompletado ? 'Completado' : p.estado === 'EnCurso' ? 'En Curso' : p.estado;
                            const badgeClass = esCompletado ? 'badge-completado' : `badge-${p.estado?.toLowerCase()}`;
                            return (
                              <span className={`badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {esCompletado && <CheckCircle size={11} />}
                                {texto}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary btn-sm" onClick={toggleEstado}>
            <ToggleLeft size={16} />
            <span>Marcar como {cliente.estado === 'Activo' ? 'Inactivo' : 'Activo'}</span>
          </button>

          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
}
