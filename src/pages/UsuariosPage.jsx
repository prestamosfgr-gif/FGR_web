import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  UserCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  User, 
  RefreshCw, 
  Edit3, 
  X,
  Building2, 
  Wallet
} from 'lucide-react';
import { usuariosApi } from '../services/api';
import { extractApiErrorDetails } from '../services/errorHandler';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('ALL');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombreUsuario: '',
    email: '',
    password: '',
    nombresApellidos: '',
    rol: 2 // 2 = Prestamista, 1 = Admin
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const cargarUsuarios = async () => {
    setIsLoading(true);
    try {
      const data = await usuariosApi.getAll();
      setUsuarios(data || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleOpenModal = (user = null) => {
    setFieldErrors({});
    setGeneralError('');
    if (user) {
      setEditingUser(user);
      setFormData({
        nombreUsuario: user.nombreUsuario || '',
        email: user.email || '',
        password: '',
        nombresApellidos: user.nombresApellidos || '',
        rol: user.rol || 2
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombreUsuario: '',
        email: '',
        password: '',
        nombresApellidos: '',
        rol: 2
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFieldErrors({});
    setGeneralError('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');

    // Validación básica
    const errors = {};
    if (!formData.nombresApellidos.trim()) errors.nombresApellidos = 'Los nombres y apellidos son requeridos';
    if (!editingUser) {
      if (!formData.nombreUsuario.trim()) errors.nombreUsuario = 'El nombre de usuario es obligatorio';
      if (!formData.password || formData.password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) errors.email = 'Ingrese un correo electrónico válido';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await usuariosApi.update(editingUser.id, {
          email: formData.email,
          nombresApellidos: formData.nombresApellidos,
          rol: parseInt(formData.rol),
          activo: editingUser.activo,
          newPassword: formData.password ? formData.password : undefined
        });
        setActionSuccess('Cuenta de prestamista actualizada correctamente');
      } else {
        await usuariosApi.create({
          nombreUsuario: formData.nombreUsuario,
          email: formData.email,
          password: formData.password,
          nombresApellidos: formData.nombresApellidos,
          rol: parseInt(formData.rol)
        });
        setActionSuccess('Nuevo prestamista registrado con éxito en la plataforma');
      }
      handleCloseModal();
      await cargarUsuarios();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      const errDetails = extractApiErrorDetails(err);
      setGeneralError(errDetails.message);
      if (errDetails.fieldErrors && Object.keys(errDetails.fieldErrors).length > 0) {
        setFieldErrors(errDetails.fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await usuariosApi.toggleStatus(user.id);
      setActionSuccess(`Acceso de @${user.nombreUsuario} actualizado`);
      await cargarUsuarios();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error cambiando estado:', err);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      u.nombresApellidos?.toLowerCase().includes(term) ||
      u.nombreUsuario?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term);
    
    if (filterRol === 'ALL') return matchesSearch;
    if (filterRol === 'ADMIN') return matchesSearch && (u.rol === 1 || u.rolNombre === 'Admin');
    if (filterRol === 'PRESTAMISTA') return matchesSearch && (u.rol === 2 || u.rolNombre === 'Prestamista');
    return matchesSearch;
  });

  // KPIs
  const totalPrestamistas = usuarios.filter(u => u.rol === 2 || u.rolNombre === 'Prestamista').length;
  const prestamistasActivos = usuarios.filter(u => (u.rol === 2 || u.rolNombre === 'Prestamista') && u.activo).length;
  const capitalColocadoGlobal = usuarios.reduce((sum, u) => sum + (u.montoTotalColocado || 0), 0);
  const recaudoTotalMes = usuarios.reduce((sum, u) => sum + (u.montoCobradoMes || 0), 0);

  return (
    <div className="content-body">
      {/* Alerta de éxito */}
      {actionSuccess && (
        <div style={{
          padding: '0.85rem 1.25rem',
          background: 'rgba(201, 154, 46, 0.1)',
          border: '1px solid rgba(201, 154, 46, 0.3)',
          borderRadius: '10px',
          color: '#7A5A0C',
          fontSize: '0.88rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <CheckCircle2 size={18} color="#9A7412" style={{ flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Banner KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue">
            <Users size={24} />
          </div>
          <div className="kpi-info">
            <h4>Total Prestamistas</h4>
            <div className="kpi-value">{isLoading ? '...' : totalPrestamistas}</div>
            <div className="kpi-subtext">Cuentas creadas</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon emerald">
            <UserCheck size={24} />
          </div>
          <div className="kpi-info">
            <h4>Cuentas Activas</h4>
            <div className="kpi-value">{isLoading ? '...' : prestamistasActivos}</div>
            <div className="kpi-subtext">Con acceso permitido</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon gold">
            <Wallet size={24} />
          </div>
          <div className="kpi-info">
            <h4>Capital Global Colocado</h4>
            <div className="kpi-value">S/. {isLoading ? '...' : capitalColocadoGlobal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
            <div className="kpi-subtext">En toda la plataforma</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple">
            <RefreshCw size={24} />
          </div>
          <div className="kpi-info">
            <h4>Recaudo Global Mes</h4>
            <div className="kpi-value">S/. {isLoading ? '...' : recaudoTotalMes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
            <div className="kpi-subtext">Cobranzas acumuladas</div>
          </div>
        </div>
      </div>

      {/* Card Panel Principal */}
      <div className="card-panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title">
            <Building2 size={20} className="text-primary" />
            Directorio de Prestamistas ({usuariosFiltrados.length})
          </div>

          <div className="search-filter-bar">
            <div className="input-group">
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por nombre, usuario o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select no-icon"
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
            >
              <option value="ALL">Todos los Usuarios</option>
              <option value="PRESTAMISTA">Solo Prestamistas</option>
              <option value="ADMIN">Solo Super Administradores</option>
            </select>

            <button className="btn btn-secondary" onClick={cargarUsuarios} title="Actualizar Datos" disabled={isLoading} style={{ padding: '0.5rem' }}>
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <UserPlus size={16} />
              Nuevo Prestamista
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Prestamista / Titular</th>
                <th>Tipo de Cuenta</th>
                <th>Padrón de Clientes</th>
                <th>Capital Colocado</th>
                <th>Recaudo Mes</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)', fontWeight: 500 }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Cargando cuentas de prestamistas...</span>
                    </div>
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No se encontraron prestamistas registrados con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const isAdmin = u.rol === 1 || u.rolNombre === 'Admin';
                  const initialLetter = u.nombresApellidos?.charAt(0)?.toUpperCase() || u.nombreUsuario?.charAt(0)?.toUpperCase() || 'P';
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: isAdmin ? 'rgba(124, 58, 237, 0.12)' : 'rgba(201, 154, 46, 0.12)',
                            color: isAdmin ? '#7c3aed' : '#9A7412',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            flexShrink: 0
                          }}>
                            {initialLetter}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {u.nombresApellidos || u.nombreUsuario}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              @{u.nombreUsuario} &bull; {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {isAdmin ? (
                          <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Shield size={12} />
                            Super Admin (SaaS)
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Wallet size={12} />
                            Prestamista
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {u.totalClientes || 0} clientes
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {u.totalPrestamosActivos || 0} préstamos activos
                        </div>
                      </td>

                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        S/. {(u.montoTotalColocado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>

                      <td style={{ fontWeight: 700, color: '#9A7412' }}>
                        S/. {(u.montoCobradoMes || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>

                      <td>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}
                          style={{ cursor: 'pointer', border: 'none', padding: '4px 10px' }}
                          title="Click para cambiar estado de acceso"
                        >
                          <span style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: u.activo ? '#9A7412' : '#dc2626',
                            display: 'inline-block',
                            marginRight: '5px'
                          }}></span>
                          {u.activo ? 'Activo' : 'Suspendido'}
                        </button>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.65rem' }}
                          title="Editar Datos / Cambiar Contraseña"
                        >
                          <Edit3 size={14} />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo / Editar Prestamista */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingUser ? (
                  <>
                    <Edit3 size={20} className="text-primary" />
                    Editar Cuenta de Prestamista
                  </>
                ) : (
                  <>
                    <UserPlus size={20} className="text-primary" />
                    Registrar Nuevo Prestamista
                  </>
                )}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body">
                {generalError && (
                  <div style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#dc2626',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <div>{generalError}</div>
                  </div>
                )}

                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="field-group">
                    <label style={{ color: fieldErrors.nombresApellidos ? '#dc2626' : undefined, fontWeight: 500 }}>
                      Nombres y Apellidos del Titular *
                    </label>
                    <div className="input-group">
                      <User size={16} color={fieldErrors.nombresApellidos ? '#dc2626' : undefined} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. Roberto Carlos Gómez"
                        value={formData.nombresApellidos}
                        onChange={(e) => handleInputChange('nombresApellidos', e.target.value)}
                        style={fieldErrors.nombresApellidos ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {}}
                        required
                      />
                    </div>
                    {fieldErrors.nombresApellidos && (
                      <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                        ❌ {fieldErrors.nombresApellidos}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="field-group">
                      <label style={{ color: fieldErrors.nombreUsuario ? '#dc2626' : undefined, fontWeight: 500 }}>
                        Usuario de Acceso (Login) *
                      </label>
                      <div className="input-group">
                        <User size={16} color={fieldErrors.nombreUsuario ? '#dc2626' : undefined} />
                        <input
                          type="text"
                          disabled={!!editingUser}
                          className="form-input"
                          placeholder="Ej. roberto_prestamos"
                          value={formData.nombreUsuario}
                          onChange={(e) => handleInputChange('nombreUsuario', e.target.value)}
                          style={{
                            ...(editingUser ? { background: '#f8fafc', color: 'var(--text-muted)', cursor: 'not-allowed' } : {}),
                            ...(fieldErrors.nombreUsuario ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {})
                          }}
                          required
                        />
                      </div>
                      {fieldErrors.nombreUsuario && (
                        <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                          ❌ {fieldErrors.nombreUsuario}
                        </span>
                      )}
                    </div>

                    <div className="field-group">
                      <label style={{ fontWeight: 500 }}>
                        Tipo de Cuenta *
                      </label>
                      <select
                        className="form-select no-icon"
                        value={formData.rol}
                        onChange={(e) => handleInputChange('rol', e.target.value)}
                      >
                        <option value={2}>Prestamista (Cuenta Privada)</option>
                        <option value={1}>Super Administrador (SaaS)</option>
                      </select>
                    </div>
                  </div>

                  <div className="field-group">
                    <label style={{ color: fieldErrors.email ? '#dc2626' : undefined, fontWeight: 500 }}>
                      Correo Electrónico *
                    </label>
                    <div className="input-group">
                      <Mail size={16} color={fieldErrors.email ? '#dc2626' : undefined} />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="roberto@prestamos.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        style={fieldErrors.email ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {}}
                        required
                      />
                    </div>
                    {fieldErrors.email && (
                      <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                        ❌ {fieldErrors.email}
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <label style={{ color: fieldErrors.password ? '#dc2626' : undefined, fontWeight: 500 }}>
                      {editingUser ? 'Nueva Contraseña (Dejar vacío para no cambiar)' : 'Contraseña de Acceso *'}
                    </label>
                    <div className="input-group">
                      <Lock size={16} color={fieldErrors.password ? '#dc2626' : undefined} />
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        style={fieldErrors.password ? { borderColor: '#ef4444', backgroundColor: 'rgba(254, 242, 242, 0.6)' } : {}}
                        required={!editingUser}
                      />
                    </div>
                    {fieldErrors.password && (
                      <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                        ❌ {fieldErrors.password}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingUser ? 'Guardar Cambios' : 'Crear Prestamista'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
