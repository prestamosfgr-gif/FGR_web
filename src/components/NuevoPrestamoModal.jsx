import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Banknote, Edit3, User, DollarSign, Percent, Calendar, FileText, AlertCircle, Info, Search, ChevronDown, Check } from 'lucide-react';
import { clientesApi, prestamosApi } from '../services/api';
import { extractApiErrorDetails } from '../services/errorHandler';

export default function NuevoPrestamoModal({ isOpen, onClose, initialData = null, prestamoToEdit = null, onPrestamoCreado, onPrestamoActualizado }) {
  const isEditing = Boolean(prestamoToEdit);
  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState({
    clienteId: '',
    montoDispersado: '',
    tasaInteres: '',
    tipoInteres: 'Mensual',
    modalidadPago: 'Mensual',
    numeroCuotas: 1,
    fechaDesembolso: new Date().toISOString().split('T')[0],
    fechaPrimerPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    observaciones: '',
    estado: 'EnCurso'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Estados para el buscador de cliente
  const [clienteSearch, setClienteSearch] = useState('');
  const [isClienteDropdownOpen, setIsClienteDropdownOpen] = useState(false);
  const [isSearchingCliente, setIsSearchingCliente] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const clienteDropdownRef = useRef(null);
  const listContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadClientes();
      setIsSearchingCliente(false);
      setClienteSearch('');
      setError('');
      setFieldErrors({});
      if (prestamoToEdit) {
        setFormData({
          clienteId: prestamoToEdit.clienteId || '',
          montoDispersado: prestamoToEdit.montoDispersado !== undefined ? prestamoToEdit.montoDispersado : '',
          tasaInteres: prestamoToEdit.tasaInteres !== undefined ? prestamoToEdit.tasaInteres : '',
          tipoInteres: prestamoToEdit.tipoInteres || 'Mensual',
          modalidadPago: prestamoToEdit.modalidadPago || 'Mensual',
          numeroCuotas: prestamoToEdit.numeroCuotas || 1,
          fechaDesembolso: prestamoToEdit.fechaDesembolso ? prestamoToEdit.fechaDesembolso.split('T')[0] : new Date().toISOString().split('T')[0],
          fechaPrimerPago: prestamoToEdit.fechaPrimerPago ? prestamoToEdit.fechaPrimerPago.split('T')[0] : new Date().toISOString().split('T')[0],
          observaciones: prestamoToEdit.observaciones || '',
          estado: prestamoToEdit.estado || 'EnCurso'
        });
      } else if (initialData) {
        setFormData(prev => ({ ...prev, ...initialData }));
      } else {
        setFormData({
          clienteId: '',
          montoDispersado: '',
          tasaInteres: '',
          tipoInteres: 'Mensual',
          modalidadPago: 'Mensual',
          numeroCuotas: 1,
          fechaDesembolso: new Date().toISOString().split('T')[0],
          fechaPrimerPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          observaciones: '',
          estado: 'EnCurso'
        });
      }
    }
  }, [isOpen, initialData, prestamoToEdit]);

  // Cerrar desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setIsClienteDropdownOpen(false);
        if (formData.clienteId) {
          setIsSearchingCliente(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [formData.clienteId]);

  const loadClientes = async () => {
    try {
      const data = await clientesApi.getClientes('', 'Activo');
      setClientes(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const clienteSeleccionado = useMemo(() => {
    return clientes.find(c => String(c.id) === String(formData.clienteId)) || null;
  }, [clientes, formData.clienteId]);

  const clientesFiltrados = useMemo(() => {
    if (!clienteSearch.trim()) return clientes;
    const term = clienteSearch.trim().toLowerCase();
    return clientes.filter(c => {
      const nombre = (c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`).toLowerCase();
      const dni = (c.dni || '').toLowerCase();
      const tel = (c.telefono || '').toLowerCase();
      return nombre.includes(term) || dni.includes(term) || tel.includes(term);
    });
  }, [clientes, clienteSearch]);

  // Reset highlight al cambiar lista filtrada
  useEffect(() => {
    setHighlightedIndex(0);
  }, [clientesFiltrados.length, clienteSearch]);

  // Auto-scroll del elemento seleccionado con el teclado
  useEffect(() => {
    if (isClienteDropdownOpen && listContainerRef.current) {
      const items = listContainerRef.current.children;
      if (items && items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isClienteDropdownOpen]);

  const handleSelectCliente = (c) => {
    handleInputChange('clienteId', c.id);
    setClienteSearch('');
    setIsClienteDropdownOpen(false);
    setIsSearchingCliente(false);
  };

  const handleStartSearching = () => {
    setIsSearchingCliente(true);
    setClienteSearch('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      setIsClienteDropdownOpen(true);
    }, 50);
  };

  const handleInputKeyDown = (e) => {
    if (!isClienteDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsClienteDropdownOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (clientesFiltrados.length > 0) {
        setHighlightedIndex(prev => (prev < clientesFiltrados.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (clientesFiltrados.length > 0) {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : clientesFiltrados.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault(); // Evita que se envíe el formulario
      if (clientesFiltrados.length > 0 && highlightedIndex >= 0 && highlightedIndex < clientesFiltrados.length) {
        handleSelectCliente(clientesFiltrados[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsClienteDropdownOpen(false);
      if (formData.clienteId) {
        setIsSearchingCliente(false);
      }
    }
  };

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};

    if (!formData.clienteId) {
      errors.clienteId = 'Debe seleccionar un "Cliente Titular" obligatorio.';
    }

    const monto = parseFloat(formData.montoDispersado);
    if (isNaN(monto) || monto <= 0) {
      errors.montoDispersado = 'El "Monto Desembolsado" debe ser un número válido.';
    } else if (monto < 500) {
      errors.montoDispersado = 'El monto mínimo a prestar es de S/. 500.00.';
    } else if (monto % 500 !== 0) {
      errors.montoDispersado = `El monto debe ser en múltiplos de S/. 500 (ej. 500, 1000, 1500, 2000...). No se permite S/. ${monto}.`;
    }

    const tasa = parseFloat(formData.tasaInteres);
    if (isNaN(tasa) || tasa < 0) {
      errors.tasaInteres = 'La "Tasa de Interés" no puede ser negativa.';
    }

    if (formData.fechaDesembolso && formData.fechaPrimerPago) {
      const d1 = new Date(formData.fechaDesembolso);
      const d2 = new Date(formData.fechaPrimerPago);
      if (d2 < d1) {
        errors.fechaPrimerPago = 'La "Fecha Primer Pago" no puede ser anterior a la "Fecha de Desembolso".';
      }
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
      if (isEditing) {
        const updatePayload = {
          montoDispersado: parseFloat(formData.montoDispersado),
          tasaInteres: parseFloat(formData.tasaInteres),
          fechaDesembolso: formData.fechaDesembolso ? new Date(formData.fechaDesembolso).toISOString() : new Date().toISOString(),
          fechaPrimerPago: formData.fechaPrimerPago ? new Date(formData.fechaPrimerPago).toISOString() : new Date().toISOString(),
          observaciones: formData.observaciones ? formData.observaciones.trim() : '',
          estado: formData.estado || 'EnCurso'
        };

        const actualizado = await prestamosApi.updatePrestamo(prestamoToEdit.id, updatePayload);
        if (onPrestamoActualizado) onPrestamoActualizado(actualizado);
        if (onPrestamoCreado) onPrestamoCreado(actualizado);
        onClose();
      } else {
        const payload = {
          clienteId: parseInt(formData.clienteId),
          montoDispersado: parseFloat(formData.montoDispersado),
          tasaInteres: parseFloat(formData.tasaInteres),
          tipoInteres: 'Mensual',
          modalidadPago: 'Mensual',
          numeroCuotas: 1, // Abierto / Mensual
          fechaDesembolso: formData.fechaDesembolso ? new Date(formData.fechaDesembolso).toISOString() : new Date().toISOString(),
          fechaPrimerPago: formData.fechaPrimerPago ? new Date(formData.fechaPrimerPago).toISOString() : new Date().toISOString(),
          observaciones: formData.observaciones ? formData.observaciones.trim() : ''
        };

        const nuevo = await prestamosApi.createPrestamo(payload);
        if (onPrestamoCreado) onPrestamoCreado(nuevo);
        onClose();
      }
    } catch (err) {
      console.error('Error al procesar préstamo:', err);
      const details = extractApiErrorDetails(err, isEditing ? 'Error al actualizar el préstamo.' : 'Error al registrar el préstamo en el servidor.');
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

  // Cálculos en vivo
  const montoNum = parseFloat(formData.montoDispersado) || 0;
  const tasaNum = parseFloat(formData.tasaInteres) || 0;
  const interesMensualCalculado = Math.round((montoNum * (tasaNum / 100)) * 100) / 100;
  const esMontoValido = montoNum >= 500 && montoNum % 500 === 0;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isEditing ? (
              <>
                <Edit3 className="text-primary" size={22} />
                Editar Préstamo #{prestamoToEdit.id}
              </>
            ) : (
              <>
                <Banknote className="text-primary" size={22} />
                Aprobar y Desembolsar Préstamo (Plazo Abierto)
              </>
            )}
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
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

            {/* Buscador y Selector de Cliente */}
            <div className="field-group" style={{ marginBottom: '1.25rem' }} ref={clienteDropdownRef}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ color: fieldErrors.clienteId ? '#dc2626' : undefined, fontWeight: 600, margin: 0 }}>
                  Cliente Titular *
                </label>
                {clienteSeleccionado && !isSearchingCliente && (
                  <span style={{ fontSize: '0.75rem', color: '#9A7412', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={14} /> Cliente Seleccionado
                  </span>
                )}
              </div>

              {clienteSeleccionado && !isSearchingCliente ? (
                <div
                  onClick={handleStartSearching}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.95rem',
                    background: '#ffffff',
                    border: '1.5px solid #9A7412',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(201, 154, 46, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    gap: '0.75rem'
                  }}
                  title="Haga clic para cambiar o buscar otro cliente"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#7A5A0C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#9A7412';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(201, 154, 46, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#9A7412'
                    }}>
                      <User size={18} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontWeight: 700,
                        color: '#0f172a',
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {clienteSeleccionado.nombreCompleto || `${clienteSeleccionado.nombres || ''} ${clienteSeleccionado.apellidos || ''}`.trim()}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          background: '#f1f5f9',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          color: '#334155'
                        }}>
                          DNI: {clienteSeleccionado.dni}
                        </span>

                        {clienteSeleccionado.telefono && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Tel: {clienteSeleccionado.telefono}
                          </span>
                        )}

                        {clienteSeleccionado.estadoCrediticio && (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: clienteSeleccionado.estadoCrediticio === 'Bloqueado' ? '#fee2e2' : clienteSeleccionado.estadoCrediticio === 'En mora' ? '#fef3c7' : '#dcfce7',
                            color: clienteSeleccionado.estadoCrediticio === 'Bloqueado' ? '#dc2626' : clienteSeleccionado.estadoCrediticio === 'En mora' ? '#b45309' : '#15803d'
                          }}>
                            {clienteSeleccionado.estadoCrediticio}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartSearching();
                    }}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', flexShrink: 0 }}
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User
                      size={16}
                      color={fieldErrors.clienteId ? '#dc2626' : '#9A7412'}
                      style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none', zIndex: 2 }}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="form-input"
                      placeholder="Escriba DNI o Nombre para buscar cliente..."
                      value={clienteSearch}
                      onChange={(e) => {
                        setClienteSearch(e.target.value);
                        setIsClienteDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsClienteDropdownOpen(true);
                      }}
                      onKeyDown={handleInputKeyDown}
                      style={{
                        paddingLeft: '2.5rem',
                        paddingRight: '2.5rem',
                        backgroundColor: '#ffffff',
                        ...(fieldErrors.clienteId ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {})
                      }}
                    />
                    {clienteSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setClienteSearch('');
                          setIsClienteDropdownOpen(true);
                          searchInputRef.current?.focus();
                        }}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px',
                          zIndex: 2
                        }}
                        title="Limpiar búsqueda"
                      >
                        <X size={15} />
                      </button>
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          pointerEvents: 'none',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          zIndex: 2
                        }}
                      >
                        <ChevronDown
                          size={16}
                          style={{
                            transform: isClienteDropdownOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Dropdown flotante con resultados filtrados */}
                  {isClienteDropdownOpen && (
                    <div
                      ref={listContainerRef}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        maxHeight: '230px',
                        overflowY: 'auto',
                        padding: '4px'
                      }}
                    >
                      {clientesFiltrados.length === 0 ? (
                        <div style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                          No se encontraron clientes activos que coincidan con "{clienteSearch}".
                        </div>
                      ) : (
                        clientesFiltrados.map((c, idx) => {
                          const isSelected = String(c.id) === String(formData.clienteId);
                          const isHighlighted = idx === highlightedIndex;
                          const nom = c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`.trim();
                          return (
                            <div
                              key={c.id}
                              onClick={() => handleSelectCliente(c)}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              style={{
                                padding: '0.65rem 0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: isHighlighted 
                                  ? 'rgba(201, 154, 46, 0.12)' 
                                  : (isSelected ? 'rgba(201, 154, 46, 0.05)' : 'transparent'),
                                borderRadius: '6px',
                                marginBottom: '2px',
                                border: isHighlighted ? '1px solid rgba(201, 154, 46, 0.3)' : '1px solid transparent',
                                transition: 'background 0.1s ease, border-color 0.1s ease'
                              }}
                            >
                              <div>
                                <div style={{ 
                                  fontWeight: isHighlighted || isSelected ? 700 : 600, 
                                  color: isHighlighted || isSelected ? '#9A7412' : '#1e293b', 
                                  fontSize: '0.9rem' 
                                }}>
                                  {nom}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '0.75rem', color: '#64748b' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>DNI: {c.dni}</span>
                                  {c.telefono && <span>• Tel: {c.telefono}</span>}
                                  {c.estadoCrediticio && (
                                    <span style={{
                                      color: c.estadoCrediticio === 'Bloqueado' ? '#dc2626' : c.estadoCrediticio === 'En mora' ? '#d97706' : '#15803d',
                                      fontWeight: 600
                                    }}>
                                      • {c.estadoCrediticio}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && <Check size={16} color="#9A7412" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              {fieldErrors.clienteId && (
                <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                  ❌ {fieldErrors.clienteId}
                </span>
              )}
            </div>

            {/* Monto del Préstamo */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                Monto del Préstamo (Mínimo S/. 500, en múltiplos de S/. 500):
              </label>

              <div className="input-group">
                <DollarSign size={16} color={fieldErrors.montoDispersado ? '#dc2626' : undefined} />
                <input
                  type="number"
                  className="form-input"
                  value={formData.montoDispersado}
                  onChange={(e) => handleInputChange('montoDispersado', e.target.value)}
                  step="500"
                  min="500"
                  placeholder="Ej. 500, 1000, 1500, 2000..."
                  style={fieldErrors.montoDispersado ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {}}
                  required
                />
              </div>
              {fieldErrors.montoDispersado ? (
                <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                  ❌ {fieldErrors.montoDispersado}
                </span>
              ) : !esMontoValido && montoNum > 0 ? (
                <span style={{ color: '#d97706', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                  ⚠️ Recuerda: El monto debe ser mínimo S/. 500 y en múltiplos de S/. 500 (ej. 500, 1000, 1500, 2000...).
                </span>
              ) : null}
            </div>

            <div className="form-grid">
              <div className="field-group">
                <label style={{ color: fieldErrors.tasaInteres ? '#dc2626' : undefined, fontWeight: 500 }}>
                  Tasa de Interés Mensual (%) *
                </label>
                <div className="input-group">
                  <Percent size={16} color={fieldErrors.tasaInteres ? '#dc2626' : undefined} />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ej. 10"
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
                  Plazo Abierto
                </div>
              </div>

              <div className="field-group">
                <label>Fecha de Desembolso</label>
                <div className="input-group">
                  <Calendar size={16} />
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fechaDesembolso}
                    onChange={(e) => handleInputChange('fechaDesembolso', e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label style={{ color: fieldErrors.fechaPrimerPago ? '#dc2626' : undefined, fontWeight: 500 }}>
                  Fecha de Primer Cobro de Interés
                </label>
                <div className="input-group">
                  <Calendar size={16} color={fieldErrors.fechaPrimerPago ? '#dc2626' : undefined} />
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fechaPrimerPago}
                    onChange={(e) => handleInputChange('fechaPrimerPago', e.target.value)}
                    style={fieldErrors.fechaPrimerPago ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {}}
                  />
                </div>
                {fieldErrors.fechaPrimerPago && (
                  <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    ❌ {fieldErrors.fechaPrimerPago}
                  </span>
                )}
              </div>
            </div>

            {/* Tarjeta Resumen Financiero en Vivo */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(201, 154, 46, 0.08), rgba(201, 154, 46, 0.02))',
              border: '1.5px solid rgba(201, 154, 46, 0.25)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginTop: '1.25rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Resumen de la Operación
                </span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(201, 154, 46, 0.15)', color: 'var(--primary)', fontWeight: 700 }}>
                  Sin fecha límite de capital
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capital a Entregar:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    S/. {montoNum > 0 ? montoNum.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interés Mensual a Cobrar:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    S/. {interesMensualCalculado > 0 ? interesMensualCalculado.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                  {montoNum > 0 && tasaNum > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({tasaNum}% de S/. {montoNum})</div>
                  )}
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
                  {montoNum > 0 && tasaNum > 0 ? (
                    <>
                      El cliente abonará <strong>S/. {interesMensualCalculado.toFixed(2)}</strong> de interés cada mes. 
                      Podrá devolver el capital cuando lo decida, ya sea en su totalidad o mediante abonos en múltiplos de <strong>S/. 500</strong>, reduciendo el interés del mes siguiente.
                    </>
                  ) : (
                    <>
                      Ingrese el cliente, monto y tasa de interés para calcular la operación en tiempo real.
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Observaciones */}
            <div className="field-group" style={{ marginTop: '1.15rem' }}>
              <label style={{ color: fieldErrors.observaciones ? '#dc2626' : undefined, fontWeight: 600 }}>
                Observaciones del Desembolso
              </label>
              <div style={{ position: 'relative' }}>
                <FileText 
                  size={18} 
                  color={fieldErrors.observaciones ? '#dc2626' : '#64748b'} 
                  style={{ position: 'absolute', left: '0.85rem', top: '0.85rem', pointerEvents: 'none', zIndex: 1 }}
                />
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Detalles sobre entrega en efectivo, cuenta bancaria, garantías o condiciones especiales acordadas con el cliente..."
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  style={{
                    minHeight: '125px',
                    paddingLeft: '2.6rem',
                    paddingTop: '0.75rem',
                    paddingRight: '0.85rem',
                    paddingBottom: '0.75rem',
                    lineHeight: '1.5',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    ...(fieldErrors.observaciones ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {})
                  }}
                />
              </div>
            </div>

            {/* Estado del préstamo (en caso de edición) */}
            {isEditing && (
              <div className="field-group" style={{ marginTop: '1rem' }}>
                <label style={{ fontWeight: 500 }}>Estado del Préstamo</label>
                <select
                  className="form-select no-icon"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                >
                  <option value="EnCurso">En Curso</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Vencido">Vencido</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (isEditing ? 'Guardando...' : 'Registrando...') : (isEditing ? 'Guardar Cambios' : 'Desembolsar Préstamo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
