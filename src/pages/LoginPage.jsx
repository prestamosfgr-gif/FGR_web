import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { extractApiErrorDetails } from '../services/errorHandler';
import logoImg from '../assets/FGR_OFICIAL.png';

export default function LoginPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Campos de registro
  const [email, setEmail] = useState('');
  const [nombresApellidos, setNombresApellidos] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!username || !username.trim()) {
      errors.username = 'El campo "Usuario" es obligatorio.';
    }

    if (!password || !password.trim()) {
      errors.password = 'El campo "Contraseña" es obligatorio.';
    } else if (isRegister && password.length < 6) {
      errors.password = 'La "Contraseña" debe contener al menos 6 caracteres.';
    }

    if (isRegister) {
      if (!nombresApellidos || !nombresApellidos.trim()) {
        errors.nombresApellidos = 'El campo "Nombres y Apellidos" es obligatorio.';
      }
      if (!email || !email.trim()) {
        errors.email = 'El campo "Correo Electrónico" es obligatorio.';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          errors.email = 'El formato del "Correo Electrónico" no es válido.';
        }
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
      if (isRegister) {
        const res = await authApi.register({
          nombreUsuario: username.trim(),
          email: email.trim(),
          password,
          nombresApellidos: nombresApellidos.trim()
        });
        setSuccessMessage(res?.mensaje || '¡Usuario registrado exitosamente! Ya puedes iniciar sesión con tus credenciales.');
        setIsRegister(false);
        setPassword('');
      } else {
        // Petición real POST /api/Auth/login
        const data = await authApi.login(username.trim(), password);
        const userObj = data.user || {
          id: data.id,
          nombreUsuario: data.nombreUsuario || username.trim(),
          nombresApellidos: data.nombreCompleto || data.nombresApellidos || username.trim(),
          email: data.email,
          rol: data.rol || 'Admin'
        };
        onLoginSuccess(userObj);
      }
    } catch (err) {
      console.error('Error de autenticación API:', err);
      const details = extractApiErrorDetails(err, 'Credenciales inválidas o error de conexión con el servidor.');
      setError(details.message);
      setFieldErrors(details.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, setter, val) => {
    setter(val);
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
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-wrapper">
            <img src={logoImg} alt="FGR Préstamos & Cobranzas" className="auth-logo-img" />
          </div>
          <h2 className="auth-title">Préstamos & Cobranzas</h2>
          <div className="auth-divider"><span /></div>
        </div>

        {successMessage && (
          <div style={{
            padding: '0.85rem 1rem',
            background: 'rgba(201, 154, 46, 0.1)',
            border: '1px solid rgba(201, 154, 46, 0.3)',
            borderRadius: '8px',
            color: '#F0D070',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            fontWeight: 500
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{successMessage}</div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
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

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group" style={{ marginBottom: '1rem' }}>
            <label style={{ color: fieldErrors.username ? '#f87171' : undefined, fontWeight: 500 }}>
              Usuario *
            </label>
            <div className="input-group">
              <User size={16} color={fieldErrors.username ? '#f87171' : undefined} />
              <input
                type="text"
                className="form-input"
                placeholder="Ingrese su usuario o email"
                value={username}
                onChange={(e) => handleInputChange('username', setUsername, e.target.value)}
                style={fieldErrors.username ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' } : {}}
                required
              />
            </div>
            {fieldErrors.username && (
              <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                ❌ {fieldErrors.username}
              </span>
            )}
          </div>

          {isRegister && (
            <>
              <div className="field-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: fieldErrors.nombresApellidos ? '#f87171' : undefined, fontWeight: 500 }}>
                  Nombres y Apellidos *
                </label>
                <div className="input-group">
                  <User size={16} color={fieldErrors.nombresApellidos ? '#f87171' : undefined} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Carlos Mendoza"
                    value={nombresApellidos}
                    onChange={(e) => handleInputChange('nombresApellidos', setNombresApellidos, e.target.value)}
                    style={fieldErrors.nombresApellidos ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' } : {}}
                    required
                  />
                </div>
                {fieldErrors.nombresApellidos && (
                  <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    ❌ {fieldErrors.nombresApellidos}
                  </span>
                )}
              </div>

              <div className="field-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: fieldErrors.email ? '#f87171' : undefined, fontWeight: 500 }}>
                  Correo Electrónico *
                </label>
                <div className="input-group">
                  <Mail size={16} color={fieldErrors.email ? '#f87171' : undefined} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => handleInputChange('email', setEmail, e.target.value)}
                    style={fieldErrors.email ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' } : {}}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    ❌ {fieldErrors.email}
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                padding: '0.7rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(201, 154, 46, 0.3)',
                background: 'rgba(201, 154, 46, 0.08)',
                color: '#CFC6B0',
                fontSize: '0.78rem',
                lineHeight: 1.45
              }}>
                <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#E0B050' }} />
                <span>La cuenta se creará con rol <strong style={{ color: '#F0D070' }}>Prestamista</strong>. Los administradores solo pueden ser asignados por otro administrador.</span>
              </div>
            </>
          )}

          <div className="field-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: fieldErrors.password ? '#f87171' : undefined, fontWeight: 500 }}>
              Contraseña *
            </label>
            <div className="input-group">
              <Lock size={16} color={fieldErrors.password ? '#f87171' : undefined} />
              <input
                type="password"
                className="form-input"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => handleInputChange('password', setPassword, e.target.value)}
                style={fieldErrors.password ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' } : {}}
                required
              />
            </div>
            {fieldErrors.password && (
              <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                ❌ {fieldErrors.password}
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={loading}>
            <span>{loading ? 'Procesando...' : isRegister ? 'Registrar Usuario' : 'Ingresar al Sistema'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
