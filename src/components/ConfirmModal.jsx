import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info, X, Lock, Trash2, HelpCircle } from 'lucide-react';

/**
 * Modern, beautiful confirmation modal to replace window.confirm()
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onConfirm: () => void
 * - title: string
 * - message: string | React.ReactNode
 * - confirmText?: string (default: 'Confirmar')
 * - cancelText?: string (default: 'Cancelar')
 * - type?: 'danger' | 'warning' | 'primary' | 'success' (default: 'warning')
 * - isLoading?: boolean
 * - highlightText?: string (optional highlighted badge or amount)
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  isLoading = false,
  highlightText
}) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertCircle,
      iconBg: 'rgba(239, 68, 68, 0.12)',
      iconColor: '#dc2626',
      btnClass: 'btn btn-danger',
      badgeBg: '#fef2f2',
      badgeColor: '#dc2626'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'rgba(245, 158, 11, 0.12)',
      iconColor: '#d97706',
      btnClass: 'btn btn-primary',
      badgeBg: '#fffbeb',
      badgeColor: '#b45309'
    },
    primary: {
      icon: HelpCircle,
      iconBg: 'rgba(79, 70, 229, 0.12)',
      iconColor: '#4f46e5',
      btnClass: 'btn btn-primary',
      badgeBg: '#eef2ff',
      badgeColor: '#4f46e5'
    },
    success: {
      icon: CheckCircle,
      iconBg: 'rgba(201, 154, 46, 0.12)',
      iconColor: '#9A7412',
      btnClass: 'btn btn-success',
      badgeBg: '#FBF6E6',
      badgeColor: '#9A7412'
    }
  };

  const config = typeConfig[type] || typeConfig.warning;
  const IconComponent = config.icon;

  return (
    <div className="modal-overlay" style={{ animation: 'fadeIn 0.15s ease-out' }}>
      <div 
        className="modal-container" 
        style={{ 
          maxWidth: '440px',
          padding: '0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          background: '#ffffff'
        }}
      >
        {/* Header con botón cerrar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem 0.5rem',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: config.iconBg,
              color: config.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconComponent size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {title}
              </h3>
            </div>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            disabled={isLoading}
            style={{ padding: '4px', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '0.75rem 1.5rem 1.25rem' }}>
          {typeof message === 'string' ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              {message}
            </p>
          ) : (
            message
          )}

          {highlightText && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: config.badgeBg,
              color: config.badgeColor,
              fontWeight: 600,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${config.badgeColor}25`
            }}>
              {highlightText}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
            style={{ minWidth: '100px' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={config.btnClass}
            onClick={onConfirm}
            disabled={isLoading}
            style={{ minWidth: '120px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }}></div>
                <span>Procesando...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
