import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Unlock, 
  PlusCircle, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Printer, 
  CheckCircle,
  X,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { cajaApi } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';

export default function CajaDiariaPage() {
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales internos
  const [isAperturaOpen, setIsAperturaOpen] = useState(false);
  const [isAbriendo, setIsAbriendo] = useState(false);
  // Bloqueo inmediato contra doble clic (el estado de React tarda un render en actualizarse)
  const enviandoRef = useRef(false);
  const [montoAperturaInput, setMontoAperturaInput] = useState(1000);
  
  const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
  const [nuevoMov, setNuevoMov] = useState({
    tipo: 'Egreso',
    categoria: 'Gasto Operativo',
    concepto: '',
    monto: '',
    metodoPago: 'Efectivo'
  });

  // Modal de confirmación para cierre de caja
  const [isConfirmCerrarOpen, setIsConfirmCerrarOpen] = useState(false);
  const [isCerrando, setIsCerrando] = useState(false);

  // Modales y estados para Editar y Eliminar Movimiento
  const [movAEliminar, setMovAEliminar] = useState(null);
  const [deletingMov, setDeletingMov] = useState(false);

  const [movAEditar, setMovAEditar] = useState(null);
  const [editMovForm, setEditMovForm] = useState({
    tipo: 'Egreso',
    categoria: 'Gasto Operativo',
    concepto: '',
    monto: '',
    metodoPago: 'Efectivo'
  });
  const [savingMov, setSavingMov] = useState(false);

  // Toast / Notificaciones estilizadas
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadCaja();
  }, []);

  const loadCaja = async () => {
    setLoading(true);
    try {
      const [estado, movs] = await Promise.all([
        cajaApi.getEstadoCaja().catch(err => {
          console.warn('Estado de caja no disponible:', err);
          return null;
        }),
        cajaApi.getMovimientos().catch(err => {
          console.warn('Movimientos no disponibles:', err);
          return [];
        })
      ]);
      setEstadoCaja(estado);
      setMovimientos(movs || []);
    } catch (err) {
      console.error('Error cargando caja:', err);
      setNotification({ type: 'error', message: err?.response?.data?.mensaje || 'No se pudo cargar la información de la caja.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setIsAbriendo(true);
    try {
      await cajaApi.abrirCaja(montoAperturaInput);
      setIsAperturaOpen(false);
      setNotification({ type: 'success', message: '¡Caja abierta exitosamente!' });
      loadCaja();
    } catch (err) {
      setNotification({ type: 'error', message: err?.response?.data?.mensaje || 'Error al abrir la caja diaria.' });
    } finally {
      enviandoRef.current = false;
      setIsAbriendo(false);
    }
  };

  const handleCerrarCajaConfirm = async () => {
    setIsCerrando(true);
    try {
      await cajaApi.cerrarCaja();
      setIsConfirmCerrarOpen(false);
      setNotification({ type: 'success', message: '¡Caja del día cerrada correctamente con arqueo final!' });
      loadCaja();
    } catch (err) {
      setNotification({ type: 'error', message: err?.response?.data?.mensaje || 'Error al cerrar la caja del día.' });
    } finally {
      setIsCerrando(false);
    }
  };

  const handleGuardarMovimiento = async (e) => {
    e.preventDefault();
    const montoVal = parseFloat(nuevoMov.monto);
    if (!nuevoMov.concepto || isNaN(montoVal) || montoVal <= 0) {
      setNotification({ type: 'warning', message: 'Por favor, ingrese un concepto y monto válido (mayor a 0).' });
      return;
    }

    if (enviandoRef.current) return;
    enviandoRef.current = true;
    try {
      await cajaApi.registrarMovimiento({ ...nuevoMov, monto: montoVal });
      setIsMovimientoOpen(false);
      setNuevoMov({
        tipo: 'Egreso',
        categoria: 'Gasto Operativo',
        concepto: '',
        monto: '',
        metodoPago: 'Efectivo'
      });
      setNotification({ type: 'success', message: 'Movimiento de caja registrado exitosamente.' });
      loadCaja();
    } catch (err) {
      setNotification({ type: 'error', message: err?.response?.data?.mensaje || 'Error al registrar el movimiento en caja.' });
    } finally {
      enviandoRef.current = false;
    }
  };

  // ── ACCIONES EDITAR / ELIMINAR MOVIMIENTO ───────────────────────
  const openEditMov = (m) => {
    setMovAEditar(m);
    setEditMovForm({
      tipo: m.tipo || 'Egreso',
      categoria: m.categoria || 'Gasto Operativo',
      concepto: m.concepto || '',
      monto: m.monto ?? '',
      metodoPago: m.metodoPago || 'Efectivo'
    });
  };

  const handleEditMovSave = async (e) => {
    if (e) e.preventDefault();
    if (!movAEditar) return;
    const montoVal = parseFloat(editMovForm.monto);
    if (!editMovForm.concepto || isNaN(montoVal) || montoVal <= 0) {
      setNotification({ type: 'warning', message: 'Por favor, ingrese un concepto y monto válido (mayor a 0).' });
      return;
    }

    setSavingMov(true);
    try {
      await cajaApi.updateMovimiento(movAEditar.id, {
        ...editMovForm,
        monto: montoVal
      });
      setNotification({ type: 'success', message: 'Movimiento de caja actualizado correctamente.' });
      setMovAEditar(null);
      loadCaja();
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: err?.response?.data?.mensaje || 'No se pudo actualizar el movimiento en caja.' });
    } finally {
      setSavingMov(false);
    }
  };

  const handleDeleteMovConfirm = async () => {
    if (!movAEliminar) return;
    setDeletingMov(true);
    try {
      await cajaApi.deleteMovimiento(movAEliminar.id);
      setNotification({ type: 'success', message: 'Movimiento de caja eliminado correctamente.' });
      setMovAEliminar(null);
      loadCaja();
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: err?.response?.data?.mensaje || 'No se pudo eliminar el movimiento en caja.' });
    } finally {
      setDeletingMov(false);
    }
  };

  const saldoEfectivo = (estadoCaja?.montoApertura || 0) + (estadoCaja?.ingresosEfectivo || 0) - (estadoCaja?.egresosPrestamos || 0) - (estadoCaja?.egresosGastos || 0);

  return (
    <div className="content-body">
      {/* Toast Notification */}
      <ToastNotification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      {/* Banner de Saldo y Métricas de Caja */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: estadoCaja?.cajaAbierta ? '4px solid #9A7412' : '4px solid #dc2626' }}>
          <div className="kpi-icon emerald">
            <Wallet size={24} />
          </div>
          <div className="kpi-info">
            <h4>Saldo Total en Caja</h4>
            <div className="kpi-value" style={{ color: 'var(--primary)', fontSize: '1.6rem' }}>
              S/. {loading ? '...' : (estadoCaja?.saldoTotalCaja || 0).toFixed(2)}
            </div>
            <div className="kpi-subtext">
              {estadoCaja?.cajaAbierta ? '🟢 Caja Abierta' : '🔴 Caja Cerrada'}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon gold">
            <DollarSign size={24} />
          </div>
          <div className="kpi-info">
            <h4>Efectivo en Mano (Billetes)</h4>
            <div className="kpi-value">
              S/. {loading ? '...' : saldoEfectivo.toFixed(2)}
            </div>
            <div className="kpi-subtext">Caja física de oficina</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blue">
            <CreditCard size={24} />
          </div>
          <div className="kpi-info">
            <h4>Ingresos Digitales</h4>
            <div className="kpi-value" style={{ color: '#2563eb' }}>
              S/. {loading ? '...' : (estadoCaja?.ingresosDigital || 0).toFixed(2)}
            </div>
            <div className="kpi-subtext">Yape / Plin / Bancos</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon red">
            <ArrowDownLeft size={24} />
          </div>
          <div className="kpi-info">
            <h4>Egresos y Gastos</h4>
            <div className="kpi-value" style={{ color: '#dc2626' }}>
              S/. {loading ? '...' : ((estadoCaja?.egresosPrestamos || 0) + (estadoCaja?.egresosGastos || 0)).toFixed(2)}
            </div>
            <div className="kpi-subtext">Desembolsos + Gastos</div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="card-panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title">
            <Wallet className="text-primary" size={22} />
            Movimientos y Arqueo de Caja Diaria
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={loadCaja} title="Actualizar Datos" disabled={loading} style={{ padding: '0.5rem' }}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            {estadoCaja?.cajaAbierta ? (
              <>
                <button className="btn btn-secondary" onClick={() => setIsMovimientoOpen(true)}>
                  <PlusCircle size={16} />
                  Ingreso / Gasto Extra
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsConfirmCerrarOpen(true)} 
                  style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)' }}
                >
                  <Lock size={16} />
                  Cerrar Caja del Día
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setIsAperturaOpen(true)}>
                <Unlock size={16} />
                Abrir Caja Diaria
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Movimientos de Caja */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Concepto / Descripción</th>
                <th>Método</th>
                <th style={{ whiteSpace: 'nowrap' }}>Monto (S/.)</th>
                <th>Responsable</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Cargando arqueo de caja...</td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay movimientos registrados en la caja.
                  </td>
                </tr>
              ) : (
                movimientos.map((m) => {
                  const esIngreso = m.tipo === 'Ingreso' || m.tipo === 'Apertura';
                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{m.fecha}</td>
                      <td>
                        <span className={`badge`} style={{
                          background: esIngreso ? 'rgba(201, 154, 46, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                          color: esIngreso ? '#9A7412' : '#dc2626',
                          borderColor: 'transparent',
                          fontWeight: 700
                        }}>
                          {esIngreso ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                          {m.tipo}
                        </span>
                      </td>
                      <td><strong>{m.categoria}</strong></td>
                      <td>{m.concepto}</td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {m.metodoPago}
                        </span>
                      </td>
                      <td style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: esIngreso ? '#9A7412' : '#dc2626',
                        whiteSpace: 'nowrap'
                      }}>
                        {esIngreso ? '+' : '-'} S/. {parseFloat(m.monto).toFixed(2)}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.usuario}</td>
                      <td style={{ textAlign: 'center' }}>
                        {m.tipo !== 'Apertura' && m.tipo !== 'Cierre' ? (
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditMov(m)}
                              title="Modificar Movimiento"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setMovAEliminar(m)}
                              title="Eliminar Movimiento"
                              style={{ color: '#dc2626' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmación Moderno para Cierre de Caja */}
      <ConfirmModal
        isOpen={isConfirmCerrarOpen}
        onClose={() => setIsConfirmCerrarOpen(false)}
        onConfirm={handleCerrarCajaConfirm}
        title="¿Cerrar la Caja del Día?"
        type="warning"
        confirmText="Sí, Cerrar Caja"
        cancelText="Volver"
        isLoading={isCerrando}
        message="Al cerrar la caja se consolidará el balance diario y se finalizará la sesión de arqueo. No podrás registrar nuevos cobros hasta que vuelvas a abrir la caja mañana."
        highlightText={`Saldo final a registrar: S/. ${(estadoCaja?.saldoTotalCaja || 0).toFixed(2)}`}
      />

      {/* Modal Apertura de Caja */}
      {isAperturaOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Unlock className="text-primary" size={20} />
                Apertura de Caja Diaria
              </h3>
              <button className="modal-close-btn" onClick={() => setIsAperturaOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAbrirCaja}>
              <div className="modal-body">
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Ingresa el monto de fondo inicial con el que comienzas las operaciones de hoy.
                </p>
                <div className="field-group">
                  <label>Monto Inicial en Efectivo (S/.) *</label>
                  <div className="input-group">
                    <DollarSign size={18} />
                    <input
                      type="number"
                      className="form-input"
                      value={montoAperturaInput}
                      onChange={(e) => setMontoAperturaInput(parseFloat(e.target.value) || 0)}
                      step="any"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAperturaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isAbriendo}>
                  {isAbriendo ? 'Abriendo...' : 'Confirmar Apertura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Movimiento Extra */}
      {isMovimientoOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle className="text-primary" size={20} />
                Registrar Movimiento Extra
              </h3>
              <button className="modal-close-btn" onClick={() => setIsMovimientoOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleGuardarMovimiento}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="field-group">
                    <label>Tipo de Movimiento</label>
                    <select
                      className="form-select no-icon"
                      value={nuevoMov.tipo}
                      onChange={(e) => setNuevoMov({ ...nuevoMov, tipo: e.target.value })}
                    >
                      <option value="Egreso">Egreso / Gasto (-)</option>
                      <option value="Ingreso">Ingreso Adicional (+)</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Categoría</label>
                    <select
                      className="form-select no-icon"
                      value={nuevoMov.categoria}
                      onChange={(e) => setNuevoMov({ ...nuevoMov, categoria: e.target.value })}
                    >
                      <option value="Gasto Operativo">Gasto Operativo (Gasolina, insumos)</option>
                      <option value="Inyección de Capital">Inyección de Capital</option>
                      <option value="Retiro de Ganancias">Retiro de Ganancias</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="field-group" style={{ marginBottom: '1rem' }}>
                  <label>Concepto / Detalle *</label>
                  <input
                    type="text"
                    className="form-input no-icon"
                    placeholder="Ej. Pago de combustible para cobranzas..."
                    value={nuevoMov.concepto}
                    onChange={(e) => setNuevoMov({ ...nuevoMov, concepto: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="field-group">
                    <label>Monto (S/.) *</label>
                    <div className="input-group">
                      <DollarSign size={16} />
                      <input
                        type="number"
                        className="form-input"
                        value={nuevoMov.monto}
                        onChange={(e) => setNuevoMov({ ...nuevoMov, monto: e.target.value })}
                        step="any"
                        min="0.01"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Método de Pago</label>
                    <select
                      className="form-select no-icon"
                      value={nuevoMov.metodoPago}
                      onChange={(e) => setNuevoMov({ ...nuevoMov, metodoPago: e.target.value })}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsMovimientoOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Movimiento */}
      {movAEliminar && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                <AlertTriangle size={20} /> Eliminar Movimiento
              </h3>
              <button className="modal-close-btn" onClick={() => setMovAEliminar(null)} disabled={deletingMov}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.75rem' }}>
                ¿Está seguro que desea eliminar este movimiento de <strong>{movAEliminar.categoria}</strong> por un monto de <strong>S/. {parseFloat(movAEliminar.monto).toFixed(2)}</strong>?
              </p>
              {movAEliminar.concepto && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Concepto: <em>"{movAEliminar.concepto}"</em>
                </p>
              )}
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', color: '#dc2626' }}>
                ⚠️ Esta acción <strong>no se puede deshacer</strong>. El balance de la caja se recalculará automáticamente.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMovAEliminar(null)} disabled={deletingMov}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDeleteMovConfirm}
                disabled={deletingMov}
              >
                {deletingMov ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modificar Movimiento */}
      {movAEditar && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil className="text-primary" size={20} />
                Modificar Movimiento
              </h3>
              <button className="modal-close-btn" onClick={() => setMovAEditar(null)} disabled={savingMov}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditMovSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="field-group">
                    <label>Tipo de Movimiento</label>
                    <select
                      className="form-select no-icon"
                      value={editMovForm.tipo}
                      onChange={(e) => setEditMovForm({ ...editMovForm, tipo: e.target.value })}
                    >
                      <option value="Egreso">Egreso / Gasto (-)</option>
                      <option value="Ingreso">Ingreso Adicional (+)</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Categoría</label>
                    <select
                      className="form-select no-icon"
                      value={editMovForm.categoria}
                      onChange={(e) => setEditMovForm({ ...editMovForm, categoria: e.target.value })}
                    >
                      {!['Gasto Operativo', 'Inyección de Capital', 'Retiro de Ganancias', 'Cobro de Cuota', 'Desembolso Préstamo', 'Otro'].includes(editMovForm.categoria) && (
                        <option value={editMovForm.categoria}>{editMovForm.categoria}</option>
                      )}
                      <option value="Gasto Operativo">Gasto Operativo (Gasolina, insumos)</option>
                      <option value="Inyección de Capital">Inyección de Capital</option>
                      <option value="Retiro de Ganancias">Retiro de Ganancias</option>
                      <option value="Cobro de Cuota">Cobro de Cuota</option>
                      <option value="Desembolso Préstamo">Desembolso Préstamo</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="field-group" style={{ marginBottom: '1rem' }}>
                  <label>Concepto / Detalle *</label>
                  <input
                    type="text"
                    className="form-input no-icon"
                    placeholder="Detalle o justificación..."
                    value={editMovForm.concepto}
                    onChange={(e) => setEditMovForm({ ...editMovForm, concepto: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="field-group">
                    <label>Monto (S/.) *</label>
                    <div className="input-group">
                      <DollarSign size={16} />
                      <input
                        type="number"
                        className="form-input"
                        value={editMovForm.monto}
                        onChange={(e) => setEditMovForm({ ...editMovForm, monto: e.target.value })}
                        step="any"
                        min="0.01"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Método de Pago</label>
                    <select
                      className="form-select no-icon"
                      value={editMovForm.metodoPago}
                      onChange={(e) => setEditMovForm({ ...editMovForm, metodoPago: e.target.value })}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setMovAEditar(null)} disabled={savingMov}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingMov}>
                  {savingMov ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
