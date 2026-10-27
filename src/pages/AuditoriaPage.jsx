import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  FileText,
  User,
  RefreshCw
} from 'lucide-react';
import { auditoriaApi } from '../services/api';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduloFiltro, setModuloFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditoriaApi.getLogs();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logsFiltrados = logs.filter(l => {
    const matchModulo = !moduloFiltro || l.modulo === moduloFiltro;
    const q = busqueda.toLowerCase();
    const matchSearch = l.detalle?.toLowerCase().includes(q) ||
      l.accion?.toLowerCase().includes(q) ||
      l.usuario?.toLowerCase().includes(q);
    return matchModulo && matchSearch;
  });

  return (
    <div className="content-body">
      <div className="card-panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title">
            <History className="text-primary" size={22} />
            Historial de Auditoría & Trazabilidad ({logs.length})
          </div>

          <div className="search-filter-bar">
            <div className="input-group">
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por usuario, acción o detalle..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <select
              className="form-select no-icon"
              value={moduloFiltro}
              onChange={(e) => setModuloFiltro(e.target.value)}
            >
              <option value="">Todos los Módulos</option>
              <option value="Clientes">Clientes</option>
              <option value="Préstamos">Préstamos</option>
              <option value="Pagos">Pagos & Recibos</option>
              <option value="Caja Diaria">Caja Diaria</option>
            </select>

            <button className="btn btn-secondary" onClick={loadLogs} title="Actualizar Datos" disabled={loading} style={{ padding: '0.5rem' }}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Registro cronológico inmutable de todas las operaciones realizadas por los operadores y administradores en el sistema.
        </p>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Detalle de la Operación</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Cargando registros de auditoría...</td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron registros de auditoría con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((l) => {
                  let badgeBg = 'rgba(201, 154, 46, 0.12)';
                  let badgeColor = '#9A7412';
                  if (l.tipo === 'warning') {
                    badgeBg = 'rgba(245, 158, 11, 0.15)';
                    badgeColor = '#d97706';
                  } else if (l.tipo === 'danger') {
                    badgeBg = 'rgba(220, 38, 38, 0.15)';
                    badgeColor = '#dc2626';
                  } else if (l.tipo === 'info') {
                    badgeBg = 'rgba(37, 99, 235, 0.12)';
                    badgeColor = '#2563eb';
                  }

                  return (
                    <tr key={l.id}>
                      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {l.fecha}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                          <User size={14} className="text-muted" />
                          {l.usuario}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{l.modulo}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="badge" style={{ background: badgeBg, color: badgeColor, borderColor: 'transparent', fontWeight: 700 }}>
                          {l.accion}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {l.detalle}
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
