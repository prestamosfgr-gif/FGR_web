import React from 'react';
import logoImg from '../assets/FGR_OFICIAL.png';
import { 
  LayoutDashboard, 
  Users, 
  Banknote, 
  CalendarClock, 
  AlertTriangle,
  CalendarDays,
  Wallet,
  Receipt, 
  FileText, 
  History,
  Calculator, 
  LogOut, 
  ShieldCheck,
  UserCheck,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, onOpenSimulador, isOpen, onClose }) {
  const userRole = user?.rol?.toString()?.toLowerCase() || 'admin';
  const isAdmin = userRole === 'admin' || userRole === '1';
  const menuItems = isAdmin ? [
    { 
      id: 'usuarios', 
      label: 'Gestión de Prestamistas', 
      icon: Users 
    },
    { 
      id: 'auditoria', 
      label: 'Auditoría & Trazabilidad', 
      icon: History 
    }
  ] : [
    { 
      id: 'dashboard', 
      label: 'Dashboard General', 
      icon: LayoutDashboard 
    },
    { 
      id: 'clientes', 
      label: 'Mis Clientes', 
      icon: Users 
    },
    { 
      id: 'prestamos', 
      label: 'Préstamos', 
      icon: Banknote 
    },
    { 
      id: 'cuotas', 
      label: 'Cuotas & Cobranzas', 
      icon: CalendarClock 
    },
    { 
      id: 'cartera-vencida', 
      label: 'Cartera Vencida (Mora)', 
      icon: AlertTriangle, 
      highlight: true 
    },
    { 
      id: 'calendario', 
      label: 'Calendario de Cobros', 
      icon: CalendarDays 
    },
    { 
      id: 'caja', 
      label: 'Mi Caja Diaria', 
      icon: Wallet 
    },
    { 
      id: 'pagos', 
      label: 'Historial de Pagos', 
      icon: Receipt 
    },
    { 
      id: 'reportes', 
      label: 'Reportes & Exportar', 
      icon: FileText 
    }
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose(); // Cerrar menú móvil al seleccionar opción
  };

  return (
    <>
      {/* Backdrop overlay para móvil */}
      {isOpen && (
        <div 
          className="sidebar-mobile-backdrop"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="brand-header">
          <div className="brand-identity">
            <img src={logoImg} alt="FGR Préstamos & Cobranzas" className="brand-logo-img" />
            <div className="brand-text">
              <div className="brand-title">FGR</div>
              <div className="brand-subtitle">Préstamos & Cobranzas</div>
            </div>
          </div>
          {/* Botón para cerrar drawer en móvil */}
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">
            <X size={22} />
          </button>
        </div>

        <nav className="nav-menu" style={{ overflowY: 'auto', paddingRight: '4px' }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectTab(item.id)}
                style={item.highlight && !isActive ? { color: '#f87171' } : {}}
              >
                <Icon size={19} color={item.highlight && !isActive ? '#f87171' : undefined} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {!isAdmin && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--sidebar-border)' }}>
              <button
                className="btn sidebar-sim-btn"
                onClick={() => {
                  onOpenSimulador();
                  if (onClose) onClose();
                }}
                
              >
                <Calculator size={18} />
                <span>Simulador Express</span>
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
          <div className="user-profile-badge">
            <div className="user-avatar">
              {user?.nombresApellidos ? user.nombresApellidos.charAt(0) : 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.nombresApellidos || user?.nombreUsuario || 'Usuario FGR'}</div>
              <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} />
                {user?.rol || 'Admin'}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="sidebar-logout-btn"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
