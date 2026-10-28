import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, UserPlus, Eye, Phone, MapPin, MessageSquare, ShieldAlert, ShieldCheck, Filter, RefreshCw, Edit, Trash2, AlertCircle, X } from 'lucide-react';
import { clientesApi, getWhatsAppLink } from '../services/api';
import DetalleClienteModal from '../components/DetalleClienteModal';
import NuevoClienteModal from '../components/NuevoClienteModal';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';

export default function ClientesPage({ onNuevoCliente, refreshTrigger }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [scoreFiltro, setScoreFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modales
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  // Edición
  const [editingCliente, setEditingCliente] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Eliminación
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [notification, setNotification] = useState(null);

  // Carga inicial y por cambio de estado o refreshTrigger
  useEffect(() => {
    loadClientes(clientes.length === 0);
  }, [estadoFiltro, refreshTrigger]);

  const loadClientes = async (showFullLoading = false) => {
    if (showFullLoading) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const data = await clientesApi.getClientes('', estadoFiltro);
      setClientes(data || []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleVerDetalle = (c) => {
    setSelectedCliente(c);
    setIsDetalleOpen(true);
  };

  const handleEditarCliente = (c) => {
    setEditingCliente(c);
    setIsEditOpen(true);
  };

  const handleConfirmEliminar = (c) => {
    setClienteAEliminar(c);
    setIsDeleteOpen(true);
  };

  const handleEjecutarEliminar = async () => {
    if (!clienteAEliminar) return;
    setIsDeleting(true);
    try {
      await clientesApi.deleteCliente(clienteAEliminar.id);
      setNotification({
        type: 'success',
        message: `Cliente "${clienteAEliminar.nombres || clienteAEliminar.nombreCompleto}" desactivado/eliminado correctamente.`
      });
      setClientes(prev => prev.map(c => c.id === clienteAEliminar.id ? { ...c, estado: 'Inactivo' } : c));
      setIsDeleteOpen(false);
      setClienteAEliminar(null);
      loadClientes(false);
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      const errMsg = err?.response?.data?.mensaje || err?.message || 'No se pudo completar la eliminación del cliente.';
      setNotification({ type: 'error', message: errMsg });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWhatsAppDirecto = (c) => {
    const nombre = c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`.trim();
    const mensaje = `Hola ${nombre}, le saludamos de *FGR Préstamos*. ¿En qué podemos ayudarle el día de hoy?`;
    const url = getWhatsAppLink(c.telefono, mensaje);
    if (url) {
      window.open(url, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
    }
  };

  // Filtrado instantáneo y ultra fluido en memoria (0ms de latencia, sin recargas de tabla)
  const clientesFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();

    return clientes.filter((c) => {
      // Filtro por Estado
      if (estadoFiltro && c.estado !== estadoFiltro) {
        return false;
      }

      // Filtro por Score
      if (scoreFiltro && (c.estadoCrediticio || 'Al día') !== scoreFiltro) {
        return false;
      }

      // Filtro por Búsqueda de texto o números
      if (term) {
        const dni = (c.dni || '').toLowerCase();
        const nombre = (c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`).toLowerCase();
        const telefono = (c.telefono || '').toLowerCase();
        const direccion = (c.direccion || '').toLowerCase();
        const correo = (c.correo || '').toLowerCase();

        return (
          dni.includes(term) ||
          nombre.includes(term) ||
          telefono.includes(term) ||
          direccion.includes(term) ||
          correo.includes(term)
        );
      }

      return true;
    });
  }, [clientes, busqueda, estadoFiltro, scoreFiltro]);

  return (
    <div className="content-body">
      <div className="card-panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title">Directorio de Clientes & Scoring ({clientesFiltrados.length})</div>

          <div className="search-filter-bar">
            <div className="input-group" style={{ position: 'relative' }}>
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por DNI, Nombres o Teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ paddingRight: busqueda ? '2.25rem' : undefined }}
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                  className="input-clear-btn"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              className="form-select no-icon"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>

            <select
              className="form-select no-icon"
              value={scoreFiltro}
              onChange={(e) => setScoreFiltro(e.target.value)}
            >
              <option value="">Score Crediticio (Todos)</option>
              <option value="Al día">🟢 Al día (A / B)</option>
              <option value="En mora">🟡 En mora (C)</option>
              <option value="Bloqueado">🔴 Bloqueado (D)</option>
            </select>

            <button
              className="btn btn-secondary"
              onClick={() => loadClientes(false)}
              title="Actualizar Datos"
              disabled={loading || isRefreshing}
              style={{ padding: '0.5rem' }}
            >
              <RefreshCw size={18} className={loading || isRefreshing ? 'animate-spin' : ''} />
            </button>

            <button className="btn btn-primary" onClick={onNuevoCliente}>
              <UserPlus size={16} />
              Nuevo Cliente
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombres y Apellidos</th>
                <th>Contacto & WhatsApp</th>
                <th>Dirección</th>
                <th>Score Crediticio</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Cargando clientes de la API...</td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron clientes registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c) => {
                  const nombreMostrar = c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`.trim() || '---';
                  const score = c.estadoCrediticio || 'Al día';
                  const scoreBadge = score === 'Bloqueado' ? 'badge-inactivo' : score === 'En mora' ? 'badge-pendiente' : 'badge-activo';

                  return (
                    <tr key={c.id}>
                      <td><strong>{c.dni}</strong></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{nombreMostrar}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reg: {c.fechaRegistro}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} className="text-muted" />
                          <span>{c.telefono || '---'}</span>
                          {c.telefono && (
                            <button
                              onClick={() => handleWhatsAppDirecto(c)}
                              title="Abrir chat de WhatsApp"
                              style={{
                                background: 'rgba(201, 154, 46, 0.1)',
                                border: '1px solid rgba(201, 154, 46, 0.3)',
                                borderRadius: '4px',
                                color: '#9A7412',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <MessageSquare size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <MapPin size={13} className="text-muted" />
                          {c.direccion || '---'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${scoreBadge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {score === 'Bloqueado' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                          {score} ({c.scoreCrediticio || 'A'})
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${c.estado?.toLowerCase()}`}>{c.estado}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'nowrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleVerDetalle(c)}
                            title="Ver Expediente Completo"
                            style={{ padding: '0.35rem 0.55rem' }}
                          >
                            <Eye size={13} />
                            <span>Ver</span>
                          </button>

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEditarCliente(c)}
                            title="Editar Datos del Cliente"
                            style={{ color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)', padding: '0.35rem 0.55rem' }}
                          >
                            <Edit size={13} />
                            <span>Editar</span>
                          </button>

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleConfirmEliminar(c)}
                            title="Eliminar Cliente"
                            style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)', padding: '0.35rem 0.55rem' }}
                          >
                            <Trash2 size={13} />
                            <span>Eliminar</span>
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

      {/* Modal de Detalle / Expediente */}
      <DetalleClienteModal
        isOpen={isDetalleOpen}
        onClose={() => setIsDetalleOpen(false)}
        cliente={selectedCliente}
        onActualizar={loadClientes}
      />

      {/* Modal de Editar Cliente */}
      <NuevoClienteModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingCliente(null);
        }}
        clienteToEdit={editingCliente}
        onClienteCreado={(actualizado) => {
          if (actualizado && actualizado.id) {
            setClientes(prev => prev.map(c => c.id === actualizado.id ? { ...c, ...actualizado } : c));
          }
          loadClientes();
          setNotification({ type: 'success', message: 'Datos del cliente actualizados correctamente.' });
        }}
      />

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setClienteAEliminar(null);
        }}
        onConfirm={handleEjecutarEliminar}
        title="¿Eliminar Cliente?"
        message={`¿Estás seguro de que deseas eliminar permanentemente a "${clienteAEliminar?.nombres || clienteAEliminar?.nombreCompleto || 'este cliente'}" (DNI: ${clienteAEliminar?.dni})? Esta acción no se puede deshacer.`}
        type="danger"
        confirmText="Sí, Eliminar"
        isLoading={isDeleting}
      />

      {/* Toast de Notificaciones */}
      {notification && (
        <ToastNotification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
