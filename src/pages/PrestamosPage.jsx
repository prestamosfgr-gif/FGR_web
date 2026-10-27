import React, { useState, useEffect, useRef } from 'react';
import { Search, Banknote, Eye, Edit, Trash2, Calculator, Calendar, DollarSign, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { prestamosApi } from '../services/api';
import DetallePrestamoModal from '../components/DetallePrestamoModal';
import NuevoPrestamoModal from '../components/NuevoPrestamoModal';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';

export default function PrestamosPage({ onNuevoPrestamo, onOpenSimulador, onCobrarCuota, onRefinanciar, highlightPrestamoId, refreshTrigger }) {
  const [prestamos, setPrestamos] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Detalle Modal
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  // Edit Modal
  const [prestamoAEditar, setPrestamoAEditar] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Delete Modal
  const [prestamoAEliminar, setPrestamoAEliminar] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Toast
  const [toast, setToast] = useState(null);

  const [activeHighlight, setActiveHighlight] = useState(null);
  const highlightTimer = useRef(null);

  useEffect(() => {
    loadPrestamos();
  }, [estadoFiltro, refreshTrigger]);

  useEffect(() => {
    if (highlightPrestamoId && !loading && prestamos.length > 0) {
      setActiveHighlight(highlightPrestamoId);
      setTimeout(() => {
        const el = document.getElementById(`prestamo-row-${highlightPrestamoId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setActiveHighlight(null), 6000);
    }
    return () => { if (highlightTimer.current) clearTimeout(highlightTimer.current); };
  }, [highlightPrestamoId, loading, prestamos]);

  const loadPrestamos = async () => {
    setLoading(true);
    try {
      const data = await prestamosApi.getPrestamos(null, estadoFiltro);
      setPrestamos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerCronograma = (p) => {
    setSelectedPrestamo(p);
    setIsDetalleOpen(true);
  };

  const handleEditar = (p) => {
    setPrestamoAEditar(p);
    setIsEditOpen(true);
  };

  const handleEliminar = (p) => {
    setPrestamoAEliminar(p);
    setDeleteError('');
    setIsDeleteOpen(true);
  };

  const handleConfirmEliminar = async () => {
    if (!prestamoAEliminar) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      await prestamosApi.deletePrestamo(prestamoAEliminar.id);
      setPrestamos(prev => prev.filter(p => p.id !== prestamoAEliminar.id));
      setIsDeleteOpen(false);
      const eliminadoId = prestamoAEliminar.id;
      setPrestamoAEliminar(null);
      setToast({
        type: 'success',
        message: `Préstamo #${eliminadoId} eliminado exitosamente.`
      });
      loadPrestamos();
    } catch (err) {
      console.error('Error al eliminar préstamo:', err);
      const errorMsg = err.response?.data?.mensaje || err.response?.data?.message || 'No se pudo eliminar el préstamo. Verifique que no tenga pagos registrados.';
      setDeleteError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrestamoGuardado = (updated) => {
    setToast({
      type: 'success',
      message: `Préstamo #${updated.id} actualizado exitosamente.`
    });
    loadPrestamos();
  };

  return (
    <div className="content-body">
      <ToastNotification notification={toast} onClose={() => setToast(null)} />

      <div className="card-panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title">Cartera de Préstamos ({prestamos.length})</div>

          <div className="search-filter-bar">
            <select
              className="form-select no-icon"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="EnCurso">En Curso</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Vencido">Vencidos</option>
              <option value="Pagado">Completados</option>
              <option value="Cancelado">Cancelados</option>
            </select>

            <button className="btn btn-secondary" onClick={loadPrestamos} title="Actualizar Datos" disabled={loading} style={{ padding: '0.5rem' }}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            <button className="btn btn-secondary" onClick={onOpenSimulador}>
              <Calculator size={16} />
              Simular Préstamo
            </button>

            <button className="btn btn-primary" onClick={onNuevoPrestamo}>
              <Banknote size={16} />
              Nuevo Préstamo
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Préstamo #</th>
                <th>Cliente Titular</th>
                <th style={{ whiteSpace: 'nowrap' }}>Capital Inicial</th>
                <th style={{ whiteSpace: 'nowrap' }}>Saldo Capital</th>
                <th>Tasa / Interés Mensual</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Cargando préstamos de la API...</td>
                </tr>
              ) : prestamos.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay préstamos registrados con el estado seleccionado.
                  </td>
                </tr>
              ) : (
                prestamos.map((p) => {
                  const nombreCliente = p.nombreCliente || p.clienteNombre || (p.cliente ? `${p.cliente.nombres || ''} ${p.cliente.apellidos || ''}`.trim() : 'Sin Nombre');
                  const dniCliente = p.dniCliente || p.clienteDni || (p.cliente?.dni) || '';
                  const saldoCap = p.saldoCapital !== undefined ? p.saldoCapital : p.montoDispersado;
                  const interesMensual = p.interesMensualActual !== undefined ? p.interesMensualActual : Math.round((saldoCap * (p.tasaInteres / 100)) * 100) / 100;
                  
                  const isHighlighted = activeHighlight != null && activeHighlight == p.id;
                  return (
                    <tr 
                      key={p.id} 
                      id={`prestamo-row-${p.id}`}
                      className={isHighlighted ? 'highlighted-row' : ''}
                    >
                      <td style={{ whiteSpace: 'nowrap' }}><strong>Préstamo #{p.id}</strong></td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{nombreCliente}</div>
                        {dniCliente && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            DNI: {dniCliente}
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                        S/. {parseFloat(p.montoDispersado || 0).toFixed(2)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 700, color: saldoCap > 0 ? '#1e40af' : '#16a34a' }}>
                        S/. {parseFloat(saldoCap || 0).toFixed(2)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>S/. {parseFloat(interesMensual || 0).toFixed(2)}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({p.tasaInteres}%/mes)</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                        Plazo Abierto
                      </td>
                      <td>
                        {(() => {
                          const esCompletado = p.estado === 'Pagado' || (parseFloat(saldoCap || 0) <= 0 && p.estado !== 'Cancelado');
                          const texto = esCompletado ? 'Completado' : p.estado === 'EnCurso' ? 'En Curso' : p.estado;
                          const badgeClass = esCompletado ? 'badge-completado' : `badge-${p.estado?.toLowerCase()}`;
                          return (
                            <span className={`badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {esCompletado && <CheckCircle size={12} />}
                              {texto}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleVerCronograma(p)}
                            title="Ver Detalle"
                            style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEditar(p)}
                            title="Editar Préstamo"
                            style={{ color: '#9A7412', borderColor: 'rgba(201, 154, 46, 0.3)', padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Edit size={15} />
                          </button>

                          {(p.estado === 'EnCurso' || p.estado === 'Vencido') && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onRefinanciar && onRefinanciar(p)}
                              title="Refinanciar o Ampliar"
                              style={{ color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)', padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEliminar(p)}
                            title="Eliminar Préstamo"
                            style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)', padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      <DetallePrestamoModal
        isOpen={isDetalleOpen}
        onClose={() => setIsDetalleOpen(false)}
        prestamo={selectedPrestamo}
        onCobrarCuota={onCobrarCuota}
        onRefinanciar={onRefinanciar}
        onActualizar={loadPrestamos}
      />

      {/* Modal de Edición */}
      <NuevoPrestamoModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setPrestamoAEditar(null);
        }}
        prestamoToEdit={prestamoAEditar}
        onPrestamoActualizado={handlePrestamoGuardado}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
            setPrestamoAEliminar(null);
            setDeleteError('');
          }
        }}
        onConfirm={handleConfirmEliminar}
        title={prestamoAEliminar ? `¿Eliminar Préstamo #${prestamoAEliminar.id}?` : '¿Eliminar Préstamo?'}
        type="danger"
        confirmText="Sí, Eliminar Préstamo"
        cancelText="Cancelar"
        isLoading={isDeleting}
        message={
          <div>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              Esta acción eliminará permanentemente el préstamo y sus cuotas asociadas.
            </p>
            {deleteError && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.65rem 0.85rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{deleteError}</span>
              </div>
            )}
          </div>
        }
        highlightText={
          prestamoAEliminar
            ? `Cliente: ${prestamoAEliminar.nombreCliente || prestamoAEliminar.clienteNombre || 'Titular'} • Monto: S/. ${parseFloat(prestamoAEliminar.montoDispersado || 0).toFixed(2)}`
            : null
        }
      />
    </div>
  );
}
