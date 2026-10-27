import React, { useState, useEffect } from 'react';
import { Receipt, Search, Plus, CreditCard, Calendar, Printer, RefreshCw, Pencil, Trash2, X, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { pagosApi } from '../services/api';
import ReciboPagoModal from '../components/ReciboPagoModal';
import ToastNotification from '../components/ToastNotification';

export default function PagosPage({ onNuevoPago }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [selectedPagoRecibo, setSelectedPagoRecibo] = useState(null);
  const [notification, setNotification] = useState(null);

  // -- Eliminar --
  const [pagoAEliminar, setPagoAEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // -- Editar --
  const [pagoAEditar, setPagoAEditar] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPagos(); }, []);

  const loadPagos = async () => {
    setLoading(true);
    try {
      const data = await pagosApi.getPagos();
      setPagos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = pagos.filter(p =>
    p.clienteNombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    p.nombreCliente?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    p.numeroOperacion?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    p.prestamoId.toString().includes(filtroTexto)
  );

  // ── ELIMINAR ─────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!pagoAEliminar) return;
    setDeleting(true);
    try {
      await pagosApi.deletePago(pagoAEliminar.id);
      setPagos(prev => prev.filter(p => p.id !== pagoAEliminar.id));
      setNotification({ type: 'success', message: `Pago ${pagoAEliminar.numeroOperacion} eliminado correctamente.` });
      setPagoAEliminar(null);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'No se pudo eliminar el pago. Intente nuevamente.' });
    } finally {
      setDeleting(false);
    }
  };

  // ── EDITAR ────────────────────────────────────────────────────
  const openEdit = (pg) => {
    setPagoAEditar(pg);
    setEditForm({
      monto:           pg.monto ?? '',
      montoInteres:    pg.montoInteres ?? '',
      montoCapital:    pg.montoCapital ?? '',
      metodoPago:      pg.metodoPago ?? 'Efectivo',
      numeroOperacion: pg.numeroOperacion ?? '',
      observaciones:   pg.observaciones ?? '',
    });
  };

  const handleEditSave = async () => {
    if (!pagoAEditar) return;
    setSaving(true);
    try {
      const payload = {
        ...pagoAEditar,
        monto:           parseFloat(editForm.monto) || 0,
        montoInteres:    parseFloat(editForm.montoInteres) || 0,
        montoCapital:    parseFloat(editForm.montoCapital) || 0,
        metodoPago:      editForm.metodoPago,
        numeroOperacion: editForm.numeroOperacion.trim(),
        observaciones:   editForm.observaciones.trim(),
      };
      const updated = await pagosApi.updatePago(pagoAEditar.id, payload);
      setPagos(prev => prev.map(p => p.id === pagoAEditar.id ? { ...p, ...payload, ...updated } : p));
      setNotification({ type: 'success', message: `Pago ${editForm.numeroOperacion} actualizado correctamente.` });
      setPagoAEditar(null);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'No se pudo actualizar el pago. Intente nuevamente.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-body">
      <ToastNotification notification={notification} onClose={() => setNotification(null)} />

      <div className="card-panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title">
            <Receipt className="text-primary" size={22} />
            Historial Transaccional de Cobros &amp; Recibos ({pagos.length})
          </div>

          <div className="search-filter-bar">
            <div className="input-group">
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por Operación, Cliente o Préstamo..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
            </div>

            <button className="btn btn-secondary" onClick={loadPagos} title="Actualizar Datos" disabled={loading} style={{ padding: '0.5rem' }}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            <button className="btn btn-primary" onClick={onNuevoPago}>
              <Plus size={16} />
              Registrar Cobro
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Recibo / Operación</th>
                <th>Fecha y Hora</th>
                <th>Préstamo #</th>
                <th>Cliente</th>
                <th>Monto Recibido</th>
                <th>Método de Pago</th>
                <th>Observaciones</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Cargando pagos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se registraron cobros con los términos ingresados.
                  </td>
                </tr>
              ) : (
                filtered.map((pg) => (
                  <tr key={pg.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {pg.numeroOperacion}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
                        <Calendar size={13} className="text-muted" />
                        {pg.fechaPago}
                      </div>
                    </td>
                    <td><strong>Préstamo #{pg.prestamoId}</strong></td>
                    <td>{pg.nombreCliente || pg.clienteNombre}</td>
                    <td style={{ fontSize: '1rem', fontWeight: 800, color: '#9A7412', whiteSpace: 'nowrap' }}>
                      S/. {parseFloat(pg.monto).toFixed(2)}
                      {(parseFloat(pg.montoCapital || 0) > 0 || parseFloat(pg.montoInteres || 0) > 0) && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {parseFloat(pg.montoInteres || 0) > 0 && `Int: S/. ${parseFloat(pg.montoInteres).toFixed(2)} `}
                          {parseFloat(pg.montoCapital || 0) > 0 && `| Cap: S/. ${parseFloat(pg.montoCapital).toFixed(2)}`}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-activo" style={{ background: 'rgba(59,130,246,0.12)', color: '#2563eb', borderColor: 'rgba(59,130,246,0.3)' }}>
                        <CreditCard size={12} />
                        {pg.metodoPago}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', fontSize: '0.82rem' }}>{pg.observaciones || 'Sin notas'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {/* Recibo */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedPagoRecibo(pg)}
                          title="Ver e Imprimir Comprobante"
                        >
                          <Printer size={14} />
                        </button>
                        {/* Editar */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(pg)}
                          title="Editar Pago"
                          style={{ color: '#2563eb' }}
                        >
                          <Pencil size={14} />
                        </button>
                        {/* Eliminar */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPagoAEliminar(pg)}
                          title="Eliminar Pago"
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Ver Recibo ── */}
      <ReciboPagoModal
        isOpen={Boolean(selectedPagoRecibo)}
        onClose={() => setSelectedPagoRecibo(null)}
        pago={selectedPagoRecibo}
      />

      {/* ── Modal Confirmar Eliminar ── */}
      {pagoAEliminar && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                <AlertTriangle size={20} /> Eliminar Pago
              </h3>
              <button className="modal-close-btn" onClick={() => setPagoAEliminar(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.75rem' }}>
                ¿Está seguro que desea eliminar el pago <strong>{pagoAEliminar.numeroOperacion}</strong>?
              </p>
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', color: '#dc2626' }}>
                ⚠️ Esta acción <strong>no se puede deshacer</strong>. El registro quedará eliminado permanentemente.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPagoAEliminar(null)} disabled={deleting}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Pago ── */}
      {pagoAEditar && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil size={20} className="text-primary" /> Editar Pago
              </h3>
              <button className="modal-close-btn" onClick={() => setPagoAEditar(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="field-group">
                  <label>Monto Total (S/.)</label>
                  <div className="input-group">
                    <DollarSign size={16} />
                    <input
                      type="number" className="form-input" step="any" min="0"
                      value={editForm.monto}
                      onChange={e => setEditForm(f => ({ ...f, monto: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label>Método de Pago</label>
                  <select className="form-select no-icon" value={editForm.metodoPago} onChange={e => setEditForm(f => ({ ...f, metodoPago: e.target.value }))}>
                    <option value="Efectivo">Efectivo (Ventanilla)</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Tarjeta">Tarjeta / POS</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Monto Interés (S/.)</label>
                  <div className="input-group">
                    <DollarSign size={16} />
                    <input
                      type="number" className="form-input" step="any" min="0"
                      value={editForm.montoInteres}
                      onChange={e => setEditForm(f => ({ ...f, montoInteres: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label>Abono a Capital (S/.)</label>
                  <div className="input-group">
                    <DollarSign size={16} />
                    <input
                      type="number" className="form-input" step="any" min="0"
                      value={editForm.montoCapital}
                      onChange={e => setEditForm(f => ({ ...f, montoCapital: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: '1rem' }}>
                <label>N° Operación / Voucher</label>
                <input
                  type="text" className="form-input"
                  value={editForm.numeroOperacion}
                  onChange={e => setEditForm(f => ({ ...f, numeroOperacion: e.target.value }))}
                />
              </div>

              <div className="field-group">
                <label>Observaciones</label>
                <div className="input-group">
                  <FileText size={16} />
                  <textarea
                    className="form-textarea" rows="3"
                    value={editForm.observaciones}
                    onChange={e => setEditForm(f => ({ ...f, observaciones: e.target.value }))}
                    style={{ paddingLeft: '2.6rem' }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPagoAEditar(null)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleEditSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
