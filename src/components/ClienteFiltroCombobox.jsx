import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, X, ChevronDown, Check } from 'lucide-react';

// Normaliza texto para buscar sin importar mayúsculas ni tildes ("Víctor" = "victor")
const normalizar = (t) =>
  String(t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Filtro de cliente con búsqueda escribiendo (DNI o nombre), igual al selector de "Cliente Titular".
 *
 * Props:
 *  - opciones: [{ value, nombre, dni, telefono? }]
 *  - value: valor seleccionado ('' = todos)
 *  - onChange(value)
 *  - placeholder, minWidth
 */
export default function ClienteFiltroCombobox({
  opciones = [],
  value = '',
  onChange,
  placeholder = 'Escriba DNI o Nombre para filtrar...',
  minWidth = '260px',
  disabled = false
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [resaltado, setResaltado] = useState(0);
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  const seleccionado = opciones.find(o => String(o.value) === String(value));

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
        setTexto('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtradas = useMemo(() => {
    const q = normalizar(texto.trim());
    if (!q) return opciones;
    return opciones.filter(o => normalizar(o.nombre).includes(q) || String(o.dni || '').includes(q));
  }, [opciones, texto]);

  // Opción 0 = "Todos los clientes" (solo cuando no se está escribiendo)
  const items = texto.trim() ? filtradas : [{ value: '', nombre: `Todos los clientes (${opciones.length})`, todos: true }, ...filtradas];

  useEffect(() => { setResaltado(0); }, [texto, abierto]);

  // Mantener visible la opción resaltada al usar las flechas
  useEffect(() => {
    const el = listaRef.current?.children?.[resaltado];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [resaltado]);

  const elegir = (item) => {
    onChange?.(item ? String(item.value) : '');
    setTexto('');
    setAbierto(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setResaltado(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setResaltado(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (abierto && items[resaltado]) elegir(items[resaltado]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setTexto('');
    }
  };

  // Cuando está cerrado se muestra el cliente elegido; al abrir se escribe para buscar
  const valorInput = abierto ? texto : (seleccionado ? `${seleccionado.nombre}${seleccionado.dni ? ` — DNI ${seleccionado.dni}` : ''}` : '');

  return (
    <div ref={contenedorRef} style={{ position: 'relative', minWidth, flex: '1 1 auto' }}>
      <div className="input-group">
        <User size={16} color="#9A7412" style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none', zIndex: 2 }} />
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          placeholder={seleccionado ? valorInput : (abierto ? placeholder : `Todos los clientes (${opciones.length})`)}
          value={valorInput}
          disabled={disabled}
          onFocus={() => setAbierto(true)}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); }}
          onKeyDown={onKeyDown}
          aria-label="Filtrar por cliente"
          aria-expanded={abierto}
          role="combobox"
          style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', backgroundColor: '#ffffff' }}
        />
        {value ? (
          <button
            type="button"
            className="input-clear-btn"
            onClick={() => elegir(null)}
            title="Quitar filtro de cliente"
            aria-label="Quitar filtro de cliente"
            style={{ zIndex: 2 }}
          >
            <X size={14} />
          </button>
        ) : (
          <div style={{ position: 'absolute', right: '0.75rem', pointerEvents: 'none', color: '#94a3b8', display: 'flex', zIndex: 2 }}>
            <ChevronDown size={16} style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </div>
        )}
      </div>

      {abierto && (
        <div
          ref={listaRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: '300px',
            zIndex: 9999,
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '4px'
          }}
        >
          {items.length === 0 ? (
            <div style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              No se encontraron clientes que coincidan con "{texto}".
            </div>
          ) : (
            items.map((o, idx) => {
              const esSeleccionado = String(o.value) === String(value);
              const esResaltado = idx === resaltado;
              return (
                <div
                  key={o.todos ? '__todos' : o.value}
                  role="option"
                  aria-selected={esSeleccionado}
                  onMouseDown={(e) => { e.preventDefault(); elegir(o); }}
                  onMouseEnter={() => setResaltado(idx)}
                  style={{
                    padding: '0.6rem 0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    background: esResaltado ? 'rgba(201, 154, 46, 0.12)' : esSeleccionado ? 'rgba(201, 154, 46, 0.05)' : 'transparent',
                    border: esResaltado ? '1px solid rgba(201, 154, 46, 0.3)' : '1px solid transparent',
                    borderRadius: '6px',
                    marginBottom: '2px'
                  }}
                >
                  <div>
                    <div style={{
                      fontWeight: esResaltado || esSeleccionado || o.todos ? 700 : 600,
                      color: esResaltado || esSeleccionado ? '#9A7412' : 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}>
                      {o.nombre}
                    </div>
                    {!o.todos && (o.dni || o.telefono) && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '2px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {o.dni && <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>DNI: {o.dni}</span>}
                        {o.telefono && <span>• Tel: {o.telefono}</span>}
                      </div>
                    )}
                  </div>
                  {esSeleccionado && <Check size={16} color="#9A7412" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
