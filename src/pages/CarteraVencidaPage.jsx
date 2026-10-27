import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Phone, 
  MessageSquare, 
  RefreshCw, 
  ShieldAlert, 
  Search, 
  Filter,
  User,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { cuotasApi, prestamosApi, getWhatsAppLink } from '../services/api';
import ToastNotification from '../components/ToastNotification';

export default function CarteraVencidaPage({ onCobrarCuota, onRefinanciar, highlightCuotaId }) {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agingFiltro, setAgingFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [notification, setNotification] = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const highlightTimer = useRef(null);

  useEffect(() => {
    loadCuotasVencidas();
  }, []);

  useEffect(() => {
    if (highlightCuotaId && !loading && cuotas.length > 0) {
      setActiveHighlight(highlightCuotaId);
      setTimeout(() => {
        const el = document.getElementById(`cuota-vencida-row-${highlightCuotaId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setActiveHighlight(null), 6000);
    }
    return () => { if (highlightTimer.current) clearTimeout(highlightTimer.current); };
  }, [highlightCuotaId, loading, cuotas]);

  const loadCuotasVencidas = async () => {
    setLoading(true);
    try {
      const data = await cuotasApi.getCuotasVencidas();
      setCuotas(data || []);
    } catch (err) {
      console.error('Error cargando cuotas vencidas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado por Aging y Búsqueda
  const cuotasFiltradas = cuotas.filter(c => {
    const dias = c.diasAtraso || 0;
    let matchAging = true;
    if (agingFiltro === '1-7') matchAging = dias >= 1 && dias <= 7;
    else if (agingFiltro === '8-15') matchAging = dias >= 8 && dias <= 15;
    else if (agingFiltro === '16-30') matchAging = dias >= 16 && dias <= 30;
    else if (agingFiltro === '+30') matchAging = dias > 30;

    const nombre = (c.nombreCliente || c.clienteNombre || '').toLowerCase();
    const dni = (c.dniCliente || c.clienteDni || '').toLowerCase();
    const q = busqueda.toLowerCase();
    const matchSearch = nombre.includes(q) || dni.includes(q) || c.prestamoId?.toString().includes(q);

    return matchAging && matchSearch;
  });

  // Métricas Totales
  const totalCapitalVencido = cuotas.reduce((sum, c) => sum + (parseFloat(c.montoCuota) || 0), 0);
  const totalInteresMora = cuotas.reduce((sum, c) => sum + (parseFloat(c.interesMoratorio) || 0), 0);
  const totalDeudaEnRiesgo = totalCapitalVencido + totalInteresMora;
  const clientesUnicosMorosos = new Set(cuotas.map(c => c.dniCliente || c.nombreCliente)).size;

  const handleWhatsAppCobranza = (cuota) => {
    const nombre = cuota.nombreCliente || cuota.clienteNombre || 'Estimado(a) Cliente';
    const dias = cuota.diasAtraso || 1;
    const monto = (parseFloat(cuota.montoCuota) + parseFloat(cuota.interesMoratorio || 0)).toFixed(2);
    
    let mensaje = '';
    if (dias <= 7) {
      mensaje = `Estimado(a) ${nombre}, le saludamos de *FGR Préstamos*. Le recordamos que su cuota #${cuota.numeroCuota} (Préstamo #${cuota.prestamoId}) presenta ${dias} día(s) de atraso por un total de *S/. ${monto}*. Por favor agradecemos regularizar su pago hoy para evitar recargos adicionales.`;
    } else if (dias <= 15) {
      mensaje = `Estimado(a) ${nombre}, de *FGR Préstamos*. Su cuota #${cuota.numeroCuota} tiene *${dias} días de vencida* con mora acumulada. El monto a pagar es de *S/. ${monto}*. Evite el reporte negativo en su calificación crediticia. ¿A qué hora nos confirma su abono?`;
    } else {
      mensaje = `URGENTE: ${nombre}, su crédito #${cuota.prestamoId} en *FGR Préstamos* tiene más de *${dias} días de morosidad* (Deuda: S/. ${monto}). Su expediente pasará a estado BLOQUEADO y cobranza externa. Comuníquese de inmediato para coordinar una refinanciación o liquidación.`;
    }

    const url = getWhatsAppLink(cuota.telefonoCliente, mensaje);
    if (url) {
      window.open(url, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
    }
  };

  const handleRefinanciarClick = async (cuota) => {
    try {
      const p = await prestamosApi.getPrestamoById(cuota.prestamoId);
      if (p && onRefinanciar) {
        onRefinanciar(p);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'No se pudieron cargar los datos del préstamo para refinanciación.' });
    }
  };

  return (
    <div className="content-body">
      <ToastNotification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />
      {/* Banner de KPIs de Mora */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon red">
            <ShieldAlert size={24} />
          </div>
          <div className="kpi-info">
            <h4>Total Cartera en Riesgo</h4>
            <div className="kpi-value" style={{ color: '#dc2626' }}>
              S/. {loading ? '...' : totalDeudaEnRiesgo.toFixed(2)}
            </div>
            <div className="kpi-subtext">Capital + Mora acumulada</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon gold">
            <DollarSign size={24} />
          </div>
          <div className="kpi-info">
            <h4>Capital Vencido</h4>
            <div className="kpi-value">S/. {loading ? '...' : totalCapitalVencido.toFixed(2)}</div>
            <div className="kpi-subtext">Cuotas puras impagas</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple">
            <TrendingDown size={24} />
          </div>
          <div className="kpi-info">
            <h4>Intereses Moratorios</h4>
            <div className="kpi-value" style={{ color: '#7c3aed' }}>
              S/. {loading ? '...' : totalInteresMora.toFixed(2)}
            </div>
            <div className="kpi-subtext">Penalidades por mora</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blue">
            <User size={24} />
          </div>
          <div className="kpi-info">
            <h4>Clientes en Mora</h4>
            <div className="kpi-value">{loading ? '...' : clientesUnicosMorosos}</div>
            <div className="kpi-subtext">Titulares con retraso</div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="card-panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title">
            <AlertTriangle className="text-primary" size={22} style={{ color: '#dc2626' }} />
            Gestión de Cartera Vencida & Antigüedad de Mora (Aging)
          </div>

          <div className="search-filter-bar">
            <div className="input-group">
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar moroso por DNI o Nombres..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary" onClick={loadCuotasVencidas} title="Actualizar Datos" disabled={loading} style={{ padding: '0.5rem' }}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filtros de Aging (Antigüedad de Mora) */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <button
            className={`btn btn-sm ${agingFiltro === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAgingFiltro('todos')}
          >
            Todos ({cuotas.length})
          </button>
          <button
            className={`btn btn-sm ${agingFiltro === '1-7' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAgingFiltro('1-7')}
            style={agingFiltro === '1-7' ? { background: '#f59e0b', borderColor: '#f59e0b' } : {}}
          >
            1 a 7 días (Mora Leve)
          </button>
          <button
            className={`btn btn-sm ${agingFiltro === '8-15' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAgingFiltro('8-15')}
            style={agingFiltro === '8-15' ? { background: '#ea580c', borderColor: '#ea580c' } : {}}
          >
            8 a 15 días (Mora Moderada)
          </button>
          <button
            className={`btn btn-sm ${agingFiltro === '16-30' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAgingFiltro('16-30')}
            style={agingFiltro === '16-30' ? { background: '#dc2626', borderColor: '#dc2626' } : {}}
          >
            16 a 30 días (Mora Grave)
          </button>
          <button
            className={`btn btn-sm ${agingFiltro === '+30' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAgingFiltro('+30')}
            style={agingFiltro === '+30' ? { background: '#7f1d1d', borderColor: '#7f1d1d' } : {}}
          >
            +30 días (Crítica / Legal)
          </button>
        </div>

        {/* Tabla de Cartera Vencida */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Cliente Titular</th>
                <th>Operación</th>
                <th>Vencimiento</th>
                <th>Atraso</th>
                <th style={{ whiteSpace: 'nowrap' }}>Cuota Original</th>
                <th style={{ whiteSpace: 'nowrap' }}>Mora Recargo</th>
                <th style={{ whiteSpace: 'nowrap' }}>Total a Cobrar</th>
                <th>Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Calculando mora y antigüedad de cartera...</td>
                </tr>
              ) : cuotasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    🎉 ¡Excelente! No existen cuotas en mora bajo los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                cuotasFiltradas.map((c) => {
                  const nombre = c.nombreCliente || c.clienteNombre || '---';
                  const dni = c.dniCliente || c.clienteDni || '';
                  const totalCobrar = (parseFloat(c.montoCuota || 0) + parseFloat(c.interesMoratorio || 0)).toFixed(2);
                  const dias = c.diasAtraso || 0;

                  const isHighlighted = activeHighlight != null && activeHighlight == c.id;

                  return (
                    <tr 
                      key={c.id} 
                      id={`cuota-vencida-row-${c.id}`}
                      className={isHighlighted ? 'highlighted-row' : ''}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{nombre}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>DNI: {dni}</span>
                          {c.telefonoCliente && (
                            <>
                              <span>•</span>
                              <span>Tel: {c.telefonoCliente}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div><strong>Préstamo #{c.prestamoId}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cuota #{c.numeroCuota}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {c.fechaVencimiento?.split('T')[0] || c.fechaVencimiento}
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: dias > 30 ? 'rgba(127, 29, 29, 0.15)' : dias > 15 ? 'rgba(220, 38, 38, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: dias > 30 ? '#7f1d1d' : dias > 15 ? '#dc2626' : '#d97706',
                          borderColor: 'transparent',
                          fontWeight: 700
                        }}>
                          {dias} días
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                        S/. {parseFloat(c.montoCuota).toFixed(2)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: '#7c3aed', fontWeight: 700 }}>
                        + S/. {parseFloat(c.interesMoratorio || 0).toFixed(2)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: '#dc2626', fontWeight: 800, fontSize: '1.05rem' }}>
                        S/. {totalCobrar}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleWhatsAppCobranza(c)}
                            title="Enviar mensaje de cobranza por WhatsApp"
                            style={{ color: '#9A7412', borderColor: 'rgba(201, 154, 46, 0.3)', background: 'rgba(201, 154, 46, 0.08)', padding: '0.35rem 0.55rem' }}
                          >
                            <MessageSquare size={14} />
                            WhatsApp
                          </button>

                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => onCobrarCuota({ ...c, montoCuota: totalCobrar })}
                            title="Cobrar esta cuota con recargo de mora"
                            style={{ padding: '0.35rem 0.65rem' }}
                          >
                            <DollarSign size={14} />
                            Cobrar
                          </button>

                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleRefinanciarClick(c)}
                            title="Refinanciar / Reestructurar deuda"
                            style={{ padding: '0.35rem 0.55rem', color: '#2563eb' }}
                          >
                            <RefreshCw size={13} />
                            Refinanciar
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
    </div>
  );
}
