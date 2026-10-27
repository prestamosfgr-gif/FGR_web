import React, { useState, useEffect } from 'react';
import { X, RefreshCw, DollarSign, Calendar, Calculator, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { prestamosApi } from '../services/api';
import { extractApiErrorDetails } from '../services/errorHandler';

export default function RefinanciarModal({ isOpen, onClose, prestamo, onRefinanciado }) {
  const [formData, setFormData] = useState({
    nuevoMonto: '',
    tasaInteres: '',
    modalidadPago: 'Mensual',
    numeroCuotas: 1,
    fechaPrimerPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen && prestamo) {
      setFormData({
        nuevoMonto: '',
        tasaInteres: '',
        modalidadPago: 'Mensual',
        numeroCuotas: 1,
        fechaPrimerPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        observaciones: ''
      });
      setError('');
      setFieldErrors({});
    }
  }, [isOpen, prestamo]);

  if (!isOpen || !prestamo) return null;

  const saldoActual = prestamo.saldoPendienteTotal !== undefined ? prestamo.saldoPendienteTotal : (prestamo.saldoPendiente || 0);
  const nuevoMontoNum = parseFloat(formData.nuevoMonto) || 0;
  const tasaNum = parseFloat(formData.tasaInteres) || 0;
  const dineroNetoAEntregar = nuevoMontoNum > saldoActual ? nuevoMontoNum - saldoActual : 0;
  const interesMensualCalculado = nuevoMontoNum > 0 && tasaNum > 0 ? (nuevoMontoNum * (tasaNum / 100)) : 0;
  const nombreCliente = prestamo.nombreCliente || prestamo.clienteNombre || 'Cliente';

  const validateForm = () => {
    const errors = {};

    const montoVal = parseFloat(formData.nuevoMonto);
    if (formData.nuevoMonto === '' || isNaN(montoVal) || montoVal <= 0) {
      errors.nuevoMonto = 'Ingrese el nuevo monto total solicitado.';
    } else if (montoVal < saldoActual) {
      errors.nuevoMonto = `El "Nuevo Monto" (S/. ${montoVal.toFixed(2)}) debe ser mayor o igual al saldo adeudado (S/. ${saldoActual.toFixed(2)}).`;
    }

    const tasa = parseFloat(formData.tasaInteres);
    if (formData.tasaInteres === '' || isNaN(tasa) || tasa < 0) {
      errors.tasaInteres = 'Ingrese una tasa de interés válida.';
    }

    if (!formData.fechaPrimerPago) {
      errors.fechaPrimerPago = 'La fecha de primer cobro de interés es obligatoria.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      const firstErrorKey = Object.keys(validationErrors)[0];
      setError(`⚠️ Error en campo: ${validationErrors[firstErrorKey]}`);
      return;
    }

    setLoading(true);

    try {
      const nuevoPrestamo = await prestamosApi.refinanciarPrestamo({
        prestamoIdAnterior: prestamo.id,
        nuevoMontoDispersado: nuevoMontoNum,
        tasaInteres: tasaNum,
        modalidadPago: 'Mensual',
        numeroCuotas: 1,
        fechaPrimerPago: formData.fechaPrimerPago,
        observaciones: formData.observaciones
      });

      if (onRefinanciado) onRefinanciado(nuevoPrestamo);
      onClose();
    } catch (err) {
      console.error(err);
      const details = extractApiErrorDetails(err, 'Error al procesar el refinanciamiento en el servidor.');
      setError(details.message);
      setFieldErrors(details.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field] || fieldErrors[field.toLowerCase()]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        delete next[field.toLowerCase()];
        return next;
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw className="text-primary" size={22} />
            Renovación & Refinanciamiento de Préstamo
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {error && (
              <div style={{
                padding: '0.85rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#dc2626',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                whiteSpace: 'pre-line',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{error}</div>
              </div>
            )}

            {/* Banner Informativo Estado Actual */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLIENTE TITULAR</span>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{nombreCliente}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Préstamo Anterior: #{prestamo.id}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SALDO ADEUDADO ACTUAL</span>
                <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1.2rem' }}>
                  S/. {parseFloat(saldoActual).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Se liquidará automáticamente</div>
              </div>

              <div style={{ background: '#FBF6E6', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #EAD69A' }}>
                <span style={{ fontSize: '0.75rem', color: '#7A5A0C', fontWeight: 700 }}>DINERO NETO A ENTREGAR</span>
                <div style={{ fontWeight: 800, color: '#9A7412', fontSize: '1.25rem' }}>
                  S/. {dineroNetoAEntregar.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7A5A0C' }}>Efectivo libre para el cliente</div>
              </div>
            </div>

            {/* Formulario de Nuevo Préstamo */}
            <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
              <div className="field-group">
                <label style={{ color: fieldErrors.nuevoMonto ? '#dc2626' : undefined, fontWeight: 500 }}>
                  Nuevo Monto Total Solicitado (S/.) *
                </label>
                <div className="input-group">
                  <DollarSign size={16} color={fieldErrors.nuevoMonto ? '#dc2626' : undefined} />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.nuevoMonto}
                    onChange={(e) => handleInputChange('nuevoMonto', e.target.value)}
                    min={saldoActual}
                    step="any"
                    style={fieldErrors.nuevoMonto ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {}}
                    required
                  />
                </div>
                {fieldErrors.nuevoMonto ? (
                  <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    ❌ {fieldErrors.nuevoMonto}
                  </span>
                ) : (
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Mínimo S/. {parseFloat(saldoActual).toFixed(2)} (Saldo deudor actual)
                  </small>
                )}
              </div>

              <div className="field-group">
                <label style={{ color: fieldErrors.tasaInteres ? '#dc2626' : undefined, fontWeight: 500 }}>
                  Tasa de Interés Mensual (%) *
                </label>
                <div className="input-group">
                  <Calculator size={16} color={fieldErrors.tasaInteres ? '#dc2626' : undefined} />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={formData.tasaInteres}
                    onChange={(e) => handleInputChange('tasaInteres', e.target.value)}
                    step="any"
                    min="0"
                    style={fieldErrors.tasaInteres ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {}}
                    required
                  />
                </div>
                {fieldErrors.tasaInteres && (
                  <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    ❌ {fieldErrors.tasaInteres}
                  </span>
                )}
              </div>

              <div className="field-group">
                <label>Modalidad de Devolución</label>
                <div style={{
                  padding: '0.65rem 0.85rem',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  fontWeight: 600
                }}>
                  Plazo Abierto (Interés Mensual)
                </div>
              </div>

              <div className="field-group">
                <label style={{ color: fieldErrors.fechaPrimerPago ? '#dc2626' : undefined, fontWeight: 500 }}>
                  Fecha de Primer Cobro de Interés *
                </label>
                <div className="input-group">
                  <Calendar size={16} color={fieldErrors.fechaPrimerPago ? '#dc2626' : undefined} />
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fechaPrimerPago}
                    onChange={(e) => handleInputChange('fechaPrimerPago', e.target.value)}
                    style={fieldErrors.fechaPrimerPago ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {}}
                    required
                  />
                </div>
                {fieldErrors.fechaPrimerPago && (
                  <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    ❌ {fieldErrors.fechaPrimerPago}
                  </span>
                )}
              </div>
            </div>

            <div className="field-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: fieldErrors.observaciones ? '#dc2626' : undefined, fontWeight: 500 }}>
                Observaciones del Refinanciamiento
              </label>
              <input
                type="text"
                className="form-input no-icon"
                placeholder="Motivo de la renovación..."
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                style={fieldErrors.observaciones ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {}}
              />
              {fieldErrors.observaciones && (
                <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                  ❌ {fieldErrors.observaciones}
                </span>
              )}
            </div>

            {/* Tarjeta Resumen Financiero en Vivo - Plazo Abierto */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(201, 154, 46, 0.08), rgba(201, 154, 46, 0.02))',
              border: '1.5px solid rgba(201, 154, 46, 0.25)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Resumen de la Renovación
                </span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(201, 154, 46, 0.15)', color: 'var(--primary)', fontWeight: 700 }}>
                  Sin cuotas • Tiempo ilimitado
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nuevo Capital Total:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    S/. {nuevoMontoNum > 0 ? nuevoMontoNum.toFixed(2) : '0.00'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interés Mensual a Cobrar:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    S/. {interesMensualCalculado > 0 ? interesMensualCalculado.toFixed(2) : '0.00'}
                  </div>
                  {nuevoMontoNum > 0 && tasaNum > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({tasaNum}% de S/. {nuevoMontoNum.toFixed(2)})</div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dinero Neto a Entregar:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9A7412' }}>
                    S/. {dineroNetoAEntregar.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9A7412' }}>Efectivo libre en mano</div>
                </div>
              </div>
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(201, 154, 46, 0.15)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px'
              }}>
                <Info size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {nuevoMontoNum > 0 && tasaNum > 0 ? (
                    <>
                      El cliente abonará <strong>S/. {interesMensualCalculado.toFixed(2)}</strong> de interés cada mes. 
                      Podrá cancelar o amortizar el capital <strong>en cualquier momento cuando lo desee</strong> sin límite de tiempo ni cuotas prefijadas.
                    </>
                  ) : (
                    <>
                      Ingrese el nuevo monto y la tasa de interés para previsualizar el interés mensual y el neto a entregar.
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <RefreshCw size={16} />
              {loading ? 'Procesando...' : 'Aprobar y Refinanciar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
