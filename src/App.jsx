import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import PrestamosPage from './pages/PrestamosPage';
import CuotasCobranzaPage from './pages/CuotasCobranzaPage';
import CarteraVencidaPage from './pages/CarteraVencidaPage';
import CalendarioPage from './pages/CalendarioPage';
import CajaDiariaPage from './pages/CajaDiariaPage';
import PagosPage from './pages/PagosPage';
import ReportesPage from './pages/ReportesPage';
import AuditoriaPage from './pages/AuditoriaPage';
import UsuariosPage from './pages/UsuariosPage';
import LoginPage from './pages/LoginPage';

import SimuladorModal from './components/SimuladorModal';
import NuevoClienteModal from './components/NuevoClienteModal';
import NuevoPrestamoModal from './components/NuevoPrestamoModal';
import NuevoPagoModal from './components/NuevoPagoModal';
import ReciboPagoModal from './components/ReciboPagoModal';
import RefinanciarModal from './components/RefinanciarModal';
import ConfirmLogoutModal from './components/ConfirmLogoutModal';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fgr_user');
    const token = localStorage.getItem('fgr_token');
    return (saved && token) ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('fgr_active_tab');
    if (savedTab) return savedTab;

    const saved = localStorage.getItem('fgr_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        const role = u?.rol?.toString()?.toLowerCase();
        if (role === 'admin' || role === '1') return 'usuarios';
      } catch (e) {}
    }
    return 'dashboard';
  });

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('fgr_active_tab', activeTab);
    }
  }, [activeTab]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Sidebar contraído (solo íconos) en escritorio; se recuerda entre sesiones
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('fgr_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('fgr_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // almacenamiento no disponible: solo se mantiene en memoria
      }
      return next;
    });
  };
  const [highlightId, setHighlightId] = useState(null);

  const handleNavigateTab = (tab, options = {}) => {
    setActiveTab(tab);
    localStorage.setItem('fgr_active_tab', tab);
    setHighlightId(options.highlightPrestamoId || options.highlightCuotaId || null);
  };

  // Modales
  const [isSimuladorOpen, setIsSimuladorOpen] = useState(false);
  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false);
  const [isNuevoPrestamoOpen, setIsNuevoPrestamoOpen] = useState(false);
  const [isNuevoPagoOpen, setIsNuevoPagoOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Modal de Recibo / Ticket
  const [reciboData, setReciboData] = useState(null);
  const [isReciboOpen, setIsReciboOpen] = useState(false);

  // Modal de Refinanciamiento
  const [prestamoARefinanciar, setPrestamoARefinanciar] = useState(null);
  const [isRefinanciarOpen, setIsRefinanciarOpen] = useState(false);

  // Datos para cobro / préstamo
  const [prestamoInitialData, setPrestamoInitialData] = useState(null);
  const [cuotaInitialData, setCuotaInitialData] = useState(null);

  // Trigger para recargar vistas automáticamente en segundo plano tras crear/editar datos
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handleDataChanged = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('fgr_user', JSON.stringify(userData));
    const role = userData?.rol?.toString()?.toLowerCase();
    const defaultTab = (role === 'admin' || role === '1') ? 'usuarios' : 'dashboard';
    const initialTab = localStorage.getItem('fgr_active_tab') || defaultTab;
    setActiveTab(initialTab);
  };

  const handleLogout = () => {
    localStorage.removeItem('fgr_token');
    localStorage.removeItem('fgr_user');
    localStorage.removeItem('fgr_active_tab');
    setUser(null);
    setIsLogoutModalOpen(false);
  };

  const handleCobrarCuota = (cuota) => {
    setCuotaInitialData(cuota);
    setIsNuevoPagoOpen(true);
  };

  const handleRefinanciar = (prestamo) => {
    setPrestamoARefinanciar(prestamo);
    setIsRefinanciarOpen(true);
  };

  const handlePagoRegistrado = (pagoResult) => {
    setReciboData(pagoResult);
    setIsReciboOpen(true);
  };

  const handleProcederPrestamoDesdeSimulador = (simData) => {
    setPrestamoInitialData(simData);
    setIsNuevoPrestamoOpen(true);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Dashboard General', subtitle: '' };
      case 'usuarios':
        return { title: 'Gestión de Prestamistas (SaaS)', subtitle: 'Administración de cuentas independientes, suscripciones y accesos.' };
      case 'clientes':
        return { title: 'Gestión de Clientes & Scoring', subtitle: 'Padrón de clientes, calificación crediticia y expedientes.' };
      case 'prestamos':
        return { title: 'Gestión de Préstamos', subtitle: 'Cartera de créditos otorgados, cronogramas y refinanciaciones.' };
      case 'cuotas':
        return { title: 'Cuotas & Cobranzas', subtitle: 'Control de vencimientos programados y alertas.' };
      case 'cartera-vencida':
        return { title: 'Cartera Vencida & Mora (Aging)', subtitle: 'Gestión de clientes morosos, cálculo de penalidades y cobranza.' };
      case 'calendario':
        return { title: 'Calendario de Cobranzas', subtitle: 'Visualización interactiva de vencimientos y recaudaciones diarias.' };
      case 'caja':
        return { title: 'Control de Caja Diaria', subtitle: 'Aperturas, cierres, cobros en efectivo/digital y egresos operativos.' };
      case 'pagos':
        return { title: 'Historial de Pagos & Recibos', subtitle: 'Registro transaccional de cobros y emisión de tickets.' };
      case 'reportes':
        return { title: 'Centro de Reportes & Exportación', subtitle: 'Exportación masiva de datos en Excel, CSV y PDF.' };
      case 'auditoria':
        return { title: 'Auditoría & Trazabilidad', subtitle: 'Historial de operaciones y cambios realizados en el sistema.' };
      default:
        return { title: 'Sistema FGR', subtitle: 'Gestión de Préstamos y Cobranzas' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(t) => handleNavigateTab(t)}
        user={user}
        onLogout={() => setIsLogoutModalOpen(true)}
        onOpenSimulador={() => setIsSimuladorOpen(true)}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <main className="main-content">
        <TopHeader
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          user={user}
          onNuevoCliente={() => setIsNuevoClienteOpen(true)}
          onNuevoPrestamo={() => {
            setPrestamoInitialData(null);
            setIsNuevoPrestamoOpen(true);
          }}
          onNuevoPago={() => {
            setCuotaInitialData(null);
            setIsNuevoPagoOpen(true);
          }}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />

        <ErrorBoundary key={`${activeTab}_${refreshTrigger}`} onReset={() => setActiveTab('dashboard')}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              user={user}
              refreshTrigger={refreshTrigger}
              onOpenSimulador={() => setIsSimuladorOpen(true)}
              onNuevoCliente={() => setIsNuevoClienteOpen(true)}
              onNuevoPrestamo={() => setIsNuevoPrestamoOpen(true)}
              onNuevoPago={() => setIsNuevoPagoOpen(true)}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'usuarios' && (
            <UsuariosPage />
          )}

          {activeTab === 'clientes' && (
            <ClientesPage
              refreshTrigger={refreshTrigger}
              onNuevoCliente={() => setIsNuevoClienteOpen(true)}
            />
          )}

          {activeTab === 'prestamos' && (
            <PrestamosPage
              refreshTrigger={refreshTrigger}
              highlightPrestamoId={highlightId}
              onNuevoPrestamo={() => setIsNuevoPrestamoOpen(true)}
              onOpenSimulador={() => setIsSimuladorOpen(true)}
              onCobrarCuota={handleCobrarCuota}
              onRefinanciar={handleRefinanciar}
            />
          )}

          {activeTab === 'cuotas' && (
            <CuotasCobranzaPage
              refreshTrigger={refreshTrigger}
              onCobrarCuota={handleCobrarCuota}
            />
          )}

          {activeTab === 'cartera-vencida' && (
            <CarteraVencidaPage
              highlightCuotaId={highlightId}
              onCobrarCuota={handleCobrarCuota}
              onRefinanciar={handleRefinanciar}
            />
          )}

          {activeTab === 'calendario' && (
            <CalendarioPage
              onCobrarCuota={handleCobrarCuota}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'caja' && (
            <CajaDiariaPage />
          )}

          {activeTab === 'pagos' && (
            <PagosPage
              onNuevoPago={() => setIsNuevoPagoOpen(true)}
            />
          )}

          {activeTab === 'reportes' && (
            <ReportesPage />
          )}

          {activeTab === 'auditoria' && (
            <AuditoriaPage />
          )}
        </ErrorBoundary>
      </main>

      {/* Modales Globales */}
      <SimuladorModal
        isOpen={isSimuladorOpen}
        onClose={() => setIsSimuladorOpen(false)}
        onProcederPrestamo={handleProcederPrestamoDesdeSimulador}
      />

      <NuevoClienteModal
        isOpen={isNuevoClienteOpen}
        onClose={() => setIsNuevoClienteOpen(false)}
        onClienteCreado={() => {
          handleDataChanged();
        }}
      />

      <NuevoPrestamoModal
        isOpen={isNuevoPrestamoOpen}
        onClose={() => setIsNuevoPrestamoOpen(false)}
        initialData={prestamoInitialData}
        onPrestamoCreado={() => {
          handleDataChanged();
        }}
      />

      <NuevoPagoModal
        isOpen={isNuevoPagoOpen}
        onClose={() => setIsNuevoPagoOpen(false)}
        initialCuota={cuotaInitialData}
        onPagoRegistrado={(res) => {
          handlePagoRegistrado(res);
          handleDataChanged();
        }}
      />

      <ReciboPagoModal
        isOpen={isReciboOpen}
        onClose={() => setIsReciboOpen(false)}
        pago={reciboData}
      />

      <RefinanciarModal
        isOpen={isRefinanciarOpen}
        onClose={() => setIsRefinanciarOpen(false)}
        prestamo={prestamoARefinanciar}
        onRefinanciado={() => {
          handleDataChanged();
          setActiveTab('prestamos');
        }}
      />

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
