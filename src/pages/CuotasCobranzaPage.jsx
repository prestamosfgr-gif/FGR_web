import React, { useState, useEffect } from 'react';
import { CalendarClock, AlertTriangle, Clock, DollarSign, MessageSquare, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cuotasApi, getWhatsAppLink } from '../services/api';

export default function CuotasCobranzaPage({ onCobrarCuota, refreshTrigger }) {
  const [tabActive, setTabActive] = useState('vencidas');
  const [cuotasVencidas, setCuotasVencidas] = useState([]);
  const [cuotasPorVencer, setCuotasPorVencer] = useState([]);
  const [diasFiltro, setDiasFiltro] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [diasFiltro, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vencidas, porVencer] = await Promise.all([
        cuotasApi.getCuotasVencidas().catch(() => []),
        cuotasApi.getCuotasPorVencer(diasFiltro).catch(() => [])
      ]);
      setCuotasVencidas(vencidas || []);
      setCuotasPorVencer(porVencer || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (c) => {
    const nombre = c.nombreCliente || c.clienteNombre || 'Cliente';
    const fecha = c.fechaVencimiento?.split('T')[0] || c.fechaVencimiento;
    const monto = parseFloat(c.montoCuota || 0).toFixed(2);
    
    let mensaje = '';
    if (c.estado === 'Vencido') {
      mensaje = `Hola ${nombre}, le saludamos de *FGR Préstamos*. Le recordamos que su cuota #${c.numeroCuota} (Préstamo #${c.prestamoId}) presenta atraso por un total de *S/. ${monto}*. Agradecemos confirmar su pago a la brevedad.`;
    } else {
      mensaje = `Hola ${nombre}, le recordamos de *FGR Préstamos* que su cuota #${c.numeroCuota} (Préstamo #${c.prestamoId}) por *S/. ${monto}* vence el *${fecha}*. ¡Muchas gracias por su puntualidad!`;
    }

    const url = getWhatsAppLink(c.telefonoCliente, mensaje);
    if (url) window.open(url, '_blank');
    else window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const currentList = tabActive === 'vencidas' ? cuotasVencidas : cuotasPorVencer;

  return (
    <div className="content-body">
      <div className="card-panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title">
            <CalendarClock className="text-primary" size={22} />
            Gestión de Cobranzas y Cuotas
          </div>

          <div className="tab-switcher-wrapper">
            <div className="tab-switcher">
              <button
                type="button"
                className={`tab-switcher-btn ${tabActive === 'vencidas' ? 'active-danger' : ''}`}
                onClick={() => setTabActive('vencidas')}
              >
                <AlertTriangle size={15} />
                <span>Vencidas ({cuotasVencidas.length})</span>
              </button>

              <button
                type="button"
                className={`tab-switcher-btn ${tabActive === 'por-vencer' ? 'active-primary' : ''}`}
                onClick={() => setTabActive('por-vencer')}
              >
                <Clock size={15} />
                <span>Por Vencer ({cuotasPorVencer.length})</span>
              </button>
            </div>

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={loadData} 
              title="Actualizar Datos" 
              disabled={loading} 
              style={{ padding: '0.55rem 0.7rem' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {tabActive === 'por-vencer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.5rem 0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mostrar cuotas a vencer en los próximos:</span>
            <select
              className="form-select no-icon"
              style={{ width: 'auto', minWidth: '110px' }}
              value={diasFiltro}
              onChange={(e) => setDiasFiltro(e.target.value)}
            >
              <option value="3">3 días</option>
              <option value="7">7 días</option>
              <option value="15">15 días</option>
              <option value="30">30 días</option>
            </select>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--primary)' }} />
            <p style={{ fontSize: '0.88rem' }}>Cargando información de cuotas...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', margin: '0.5rem 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FBF6E6', color: '#9A7412', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
              <CheckCircle2 size={26} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              {tabActive === 'vencidas' ? '¡Excelente! No hay cuotas vencidas' : 'No hay cuotas próximas a vencer'}
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              {tabActive === 'vencidas' 
                ? 'Todas las cuotas de tus clientes se encuentran puntuales y al día.' 
                : `No se registran vencimientos programados dentro del rango de los próximos ${diasFiltro} días.`}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Préstamo #</th>
                  <th>Cliente Titular</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Fecha Vencimiento</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Interés a Cobrar</th>
                  <th>Estado / Atraso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((c) => {
                  const nombreCliente = c.nombreCliente || c.clienteNombre || '---';
                  const dniCliente = c.dniCliente || c.clienteDni || '';
                  const fechaFormat = c.fechaVencimiento?.split('T')[0] || c.fechaVencimiento;
                  const montoTotal = parseFloat(c.montoCuota || 0).toFixed(2);

                  return (
                    <tr key={c.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>Mes #{c.numeroCuota}</td>
                      <td style={{ whiteSpace: 'nowrap' }}><strong>Préstamo #{c.prestamoId}</strong></td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{nombreCliente}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {dniCliente && `DNI: ${dniCliente}`} {c.telefonoCliente && `• Tel: ${c.telefonoCliente}`}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fechaFormat}</td>
                      <td style={{ fontSize: '1rem', fontWeight: 700, color: tabActive === 'vencidas' ? '#dc2626' : 'var(--primary)', whiteSpace: 'nowrap' }}>
                        S/. {parseFloat(c.montoCuota || 0).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge badge-${c.estado?.toLowerCase()}`}>
                          {c.diasAtraso > 0 ? `${c.diasAtraso} días atraso` : c.estado}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleWhatsApp(c)}
                            title="Enviar WhatsApp"
                            style={{ color: '#9A7412', borderColor: 'rgba(201, 154, 46, 0.3)', padding: '0.35rem 0.55rem' }}
                          >
                            <MessageSquare size={13} />
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onCobrarCuota({ ...c, montoCuota: montoTotal })}
                            style={{ padding: '0.35rem 0.65rem' }}
                          >
                            <DollarSign size={14} />
                            Cobrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
