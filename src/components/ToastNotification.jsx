import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast Notification Banner
 * 
 * Props:
 * - notification: { type: 'success' | 'error' | 'warning' | 'info', message: string, id?: string } | null
 * - onClose: () => void
 * - autoCloseTime?: number (default: 4000ms)
 */
export default function ToastNotification({ notification, onClose, autoCloseTime = 4000 }) {
  useEffect(() => {
    if (notification && autoCloseTime > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [notification, autoCloseTime, onClose]);

  if (!notification || !notification.message) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      bg: 'rgba(236, 253, 245, 0.98)',
      border: '#EAD69A',
      color: '#5E450A',
      iconColor: '#9A7412'
    },
    error: {
      icon: AlertCircle,
      bg: 'rgba(254, 242, 242, 0.98)',
      border: '#fecaca',
      color: '#991b1b',
      iconColor: '#dc2626'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'rgba(255, 251, 235, 0.98)',
      border: '#fde68a',
      color: '#92400e',
      iconColor: '#d97706'
    },
    info: {
      icon: Info,
      bg: 'rgba(238, 242, 255, 0.98)',
      border: '#c7d2fe',
      color: '#3730a3',
      iconColor: '#4f46e5'
    }
  };

  const config = typeConfig[notification.type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        minWidth: '320px',
        maxWidth: '460px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '12px',
        padding: '0.85rem 1.15rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        backdropFilter: 'blur(8px)',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <IconComponent size={20} color={config.iconColor} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.88rem', fontWeight: 500, color: config.color, lineHeight: 1.4 }}>
          {notification.message}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: config.color,
          opacity: 0.7,
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          flexShrink: 0
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        <X size={16} />
      </button>
    </div>
  );
}
