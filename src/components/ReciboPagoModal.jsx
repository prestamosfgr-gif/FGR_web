import React from 'react';
import { X, Printer, Share2, CheckCircle, Receipt, Banknote, ShieldCheck } from 'lucide-react';
import { getWhatsAppLink } from '../services/api';

export default function ReciboPagoModal({ isOpen, onClose, pago }) {
  if (!isOpen || !pago) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const texto = `🧾 *COMPROBANTE DE PAGO - FGR PRÉSTAMOS*\n` +
      `----------------------------------------\n` +
      `*N° Recibo:* ${pago.numeroOperacion}\n` +
      `*Fecha:* ${pago.fechaPago}\n` +
      `*Cliente:* ${pago.nombreCliente || pago.clienteNombre}\n` +
      `*DNI:* ${pago.dniCliente || '---'}\n` +
      `----------------------------------------\n` +
      `*Préstamo:* #${pago.prestamoId}\n` +
      `*Cuota N°:* ${pago.numeroCuota || 1}\n` +
      `*Monto Abonado:* S/. ${parseFloat(pago.monto).toFixed(2)}\n` +
      `*Método de Pago:* ${pago.metodoPago || 'Efectivo'}\n` +
      `*Saldo Restante:* S/. ${parseFloat(pago.saldoRestantePrestamo || 0).toFixed(2)}\n` +
      `----------------------------------------\n` +
      `✅ _¡Gracias por su puntualidad y confianza!_`;

    const url = getWhatsAppLink(pago.telefonoCliente, texto);
    if (url) {
      window.open(url, '_blank');
    } else {
      // Si no tiene teléfono registrado, abrir WhatsApp web general
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <CheckCircle size={22} />
            Pago Registrado con Éxito
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
          {/* Voucher Printable Ticket */}
          <div className="printable-receipt" style={{
            background: '#ffffff',
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            fontFamily: 'monospace, var(--font-body)'
          }}>
            {/* Header Voucher */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Banknote size={20} color="#9A7412" />
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '1px' }}>FGR PRÉSTAMOS</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Sistema de Créditos & Cobranzas</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9A7412', marginTop: '0.4rem' }}>
                RECIBO N°: {pago.numeroOperacion}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Fecha: {pago.fechaPago}</div>
            </div>

            {/* Client info */}
            <div style={{ fontSize: '0.82rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Cliente:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{pago.nombreCliente || pago.clienteNombre}</span>
              </div>
              {pago.dniCliente && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>DNI:</span>
                  <span style={{ fontWeight: 600 }}>{pago.dniCliente}</span>
                </div>
              )}
              {pago.telefonoCliente && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Teléfono:</span>
                  <span>{pago.telefonoCliente}</span>
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '0.75rem 0', margin: '0.75rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.82rem' }}>
                <span>Préstamo / Operación:</span>
                <span style={{ fontWeight: 700 }}>Préstamo #{pago.prestamoId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.82rem' }}>
                <span>Método de Pago:</span>
                <span style={{ fontWeight: 600 }}>{pago.metodoPago || 'Efectivo'}</span>
              </div>
              {parseFloat(pago.montoInteres || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#64748b' }}>
                  <span>• Pago de Interés:</span>
                  <span>S/. {parseFloat(pago.montoInteres).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(pago.montoCapital || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                  <span>• Abono a Capital:</span>
                  <span>S/. {parseFloat(pago.montoCapital).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '1.15rem', fontWeight: 800, color: '#9A7412', paddingTop: '0.4rem', borderTop: '1px dotted #cbd5e1' }}>
                <span>TOTAL ABONADO:</span>
                <span>S/. {(parseFloat(pago.montoInteres || 0) + parseFloat(pago.montoCapital || 0)).toFixed(2)}</span>
              </div>
            </div>

            {/* Saldo Restante */}
            <div style={{ fontSize: '0.82rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              {pago.saldoCapitalRestante !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e40af', fontWeight: 700 }}>
                  <span>Saldo Capital Restante:</span>
                  <span>S/. {parseFloat(pago.saldoCapitalRestante).toFixed(2)}</span>
                </div>
              )}
              {pago.observaciones && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                  Nota: {pago.observaciones}
                </div>
              )}
            </div>

            {/* Footer Voucher */}
            <div style={{ textAlign: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#9A7412', fontWeight: 600 }}>
                <ShieldCheck size={14} />
                Comprobante Oficial Emitido
              </div>
              <div style={{ marginTop: '0.2rem' }}>¡Gracias por su puntualidad!</div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cerrar
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleShareWhatsApp} 
            style={{ flex: 1, color: '#9A7412', borderColor: 'rgba(201, 154, 46, 0.3)', background: 'rgba(201, 154, 46, 0.08)' }}
            title="Enviar recibo al cliente por WhatsApp"
          >
            <Share2 size={16} />
            Enviar WhatsApp
          </button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ flex: 1 }}>
            <Printer size={16} />
            Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
