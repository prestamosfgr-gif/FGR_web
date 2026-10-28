import apiClient from './apiClient';

// --- HELPER WHATSAPP ---
export const getWhatsAppLink = (telefono, mensaje) => {
  if (!telefono) return null;
  const numLimpio = telefono.replace(/\D/g, '');
  const numFinal = numLimpio.length === 9 ? `51${numLimpio}` : numLimpio;
  return `https://wa.me/${numFinal}?text=${encodeURIComponent(mensaje)}`;
};

// --- AUTH API ---
export const authApi = {
  login: async (username, password) => {
    const res = await apiClient.post('/api/Auth/login', { username, password });
    if (res.data && res.data.token) {
      localStorage.setItem('fgr_token', res.data.token);
    }
    return res.data;
  },

  register: async (userData) => {
    const res = await apiClient.post('/api/Auth/register', userData);
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get('/api/Auth/me');
    return res.data;
  }
};

// --- CLIENTES API ---
export const clientesApi = {
  getClientes: async (busqueda = '', estado = '') => {
    const params = {};
    if (busqueda && busqueda.trim() !== '') {
      params.busqueda = busqueda.trim();
    }
    if (estado && estado.trim() !== '') {
      params.estado = estado.trim();
    }
    const res = await apiClient.get('/api/Clientes', { params });
    return res.data;
  },

  getClienteById: async (id) => {
    const res = await apiClient.get(`/api/Clientes/${id}`);
    return res.data;
  },

  createCliente: async (clienteData) => {
    const res = await apiClient.post('/api/Clientes', clienteData);
    return res.data;
  },

  updateCliente: async (id, clienteData) => {
    const res = await apiClient.put(`/api/Clientes/${id}`, clienteData);
    return res.data;
  },

  deleteCliente: async (id) => {
    try {
      const res = await apiClient.delete(`/api/Clientes/${id}`);
      return res.data;
    } catch (err) {
      if (err.response && (err.response.status === 405 || err.response.status === 404)) {
        // En ASP.NET Core la baja de cliente se gestiona mediante actualización de estado a Inactivo
        const res = await apiClient.patch(`/api/Clientes/${id}/estado`, null, { params: { nuevoEstado: 'Inactivo' } });
        return res.data;
      }
      throw err;
    }
  },

  getHistorialCliente: async (id) => {
    const res = await apiClient.get(`/api/Clientes/${id}/historial`);
    return res.data;
  },

  patchEstadoCliente: async (id, nuevoEstado) => {
    const res = await apiClient.patch(`/api/Clientes/${id}/estado`, null, { params: { nuevoEstado } });
    return res.data;
  },

  patchScoreCrediticio: async (id, { estadoCrediticio, scoreCrediticio, motivo }) => {
    const res = await apiClient.patch(`/api/Clientes/${id}/score`, { estadoCrediticio, scoreCrediticio, motivo });
    return res.data;
  }
};

// --- PRESTAMOS API ---
export const prestamosApi = {
  simularPrestamo: async (simData) => {
    const res = await apiClient.post('/api/Prestamos/simular', simData);
    return res.data;
  },

  getPrestamos: async (clienteId = null, estado = '', cobradorId = null) => {
    const params = {};
    if (clienteId) params.clienteId = clienteId;
    if (cobradorId) params.cobradorId = cobradorId;
    if (estado && estado.trim() !== '') params.estado = estado.trim();
    const res = await apiClient.get('/api/Prestamos', { params });
    return res.data;
  },

  getPrestamoById: async (id) => {
    const res = await apiClient.get(`/api/Prestamos/${id}`);
    return res.data;
  },

  createPrestamo: async (prestamoData) => {
    const res = await apiClient.post('/api/Prestamos', prestamoData);
    return res.data;
  },

  updatePrestamo: async (id, prestamoData) => {
    const res = await apiClient.put(`/api/Prestamos/${id}`, prestamoData);
    return res.data;
  },

  deletePrestamo: async (id) => {
    const res = await apiClient.delete(`/api/Prestamos/${id}`);
    return res.data;
  },

  refinanciarPrestamo: async (data) => {
    const res = await apiClient.post(`/api/Prestamos/${data.prestamoIdAnterior}/refinanciar`, data);
    return res.data;
  },

  cancelarPrestamo: async (id) => {
    const res = await apiClient.patch(`/api/Prestamos/${id}/cancelar`);
    return res.data;
  }
};

// --- CUOTAS API ---
export const cuotasApi = {
  getCuotasByPrestamo: async (prestamoId) => {
    const res = await apiClient.get(`/api/Cuotas/prestamo/${prestamoId}`);
    return res.data;
  },

  getCuotasVencidas: async () => {
    const res = await apiClient.get('/api/Cuotas/vencidas');
    return res.data;
  },

  getCuotasPorVencer: async (dias = 7) => {
    const res = await apiClient.get('/api/Cuotas/por-vencer', { params: { dias } });
    return res.data;
  },

  getAllCuotas: async () => {
    const res = await apiClient.get('/api/Cuotas');
    return res.data;
  }
};

// --- PAGOS API ---
export const pagosApi = {
  createPago: async (pagoData) => {
    const res = await apiClient.post('/api/Pagos', pagoData);
    return res.data;
  },

  getPagos: async (prestamoId = null, clienteId = null, cobradorId = null) => {
    const params = {};
    if (prestamoId) params.prestamoId = prestamoId;
    if (cobradorId) params.cobradorId = cobradorId;
    if (clienteId) params.clienteId = clienteId;
    const res = await apiClient.get('/api/Pagos', { params });
    return res.data;
  },

  getPagoById: async (id) => {
    const res = await apiClient.get(`/api/Pagos/${id}`);
    return res.data;
  },

  updatePago: async (id, pagoData) => {
    const res = await apiClient.put(`/api/Pagos/${id}`, pagoData);
    return res.data;
  },

  deletePago: async (id) => {
    const res = await apiClient.delete(`/api/Pagos/${id}`);
    return res.data;
  }
};

// --- CAJA DIARIA API ---
export const cajaApi = {
  getEstadoCaja: async () => {
    const res = await apiClient.get('/api/Caja/estado');
    return res.data;
  },

  getMovimientos: async () => {
    const res = await apiClient.get('/api/Caja/movimientos');
    return res.data;
  },

  abrirCaja: async (montoInicial) => {
    const res = await apiClient.post('/api/Caja/apertura', { montoApertura: parseFloat(montoInicial || 0) });
    return res.data;
  },

  cerrarCaja: async () => {
    const res = await apiClient.post('/api/Caja/cierre');
    return res.data;
  },

  registrarMovimiento: async (data) => {
    const res = await apiClient.post('/api/Caja/movimiento', {
      ...data,
      monto: parseFloat(data.monto || 0)
    });
    return res.data;
  },

  updateMovimiento: async (id, data) => {
    const res = await apiClient.put(`/api/Caja/movimiento/${id}`, {
      ...data,
      monto: parseFloat(data.monto || 0)
    });
    return res.data;
  },

  deleteMovimiento: async (id) => {
    const res = await apiClient.delete(`/api/Caja/movimiento/${id}`);
    return res.data;
  }
};

// --- AUDITORIA API ---
export const auditoriaApi = {
  getLogs: async () => {
    const res = await apiClient.get('/api/Auditoria');
    return res.data;
  },

  registrarLog: async (modulo, accion, detalle, tipo = 'info') => {
    const res = await apiClient.post('/api/Auditoria', { modulo, accion, detalle, tipo });
    return res.data;
  }
};

// --- DASHBOARD API ---
export const dashboardApi = {
  getKPIs: async (cobradorId = null) => {
    const url = cobradorId ? `/api/Dashboard/kpis?cobradorId=${cobradorId}` : '/api/Dashboard/kpis';
    const res = await apiClient.get(url);
    return res.data;
  },

  getGraficos: async (cobradorId = null) => {
    const url = cobradorId ? `/api/Dashboard/graficos?cobradorId=${cobradorId}` : '/api/Dashboard/graficos';
    const res = await apiClient.get(url);
    return res.data;
  }
};

// --- USUARIOS & COBRADORES API ---
export const usuariosApi = {
  getAll: async () => {
    const res = await apiClient.get('/api/Usuarios');
    return res.data;
  },

  getById: async (id) => {
    const res = await apiClient.get(`/api/Usuarios/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await apiClient.post('/api/Usuarios', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.put(`/api/Usuarios/${id}`, data);
    return res.data;
  },

  toggleStatus: async (id) => {
    const res = await apiClient.patch(`/api/Usuarios/${id}/estado`);
    return res.data;
  }
};

// ── Construye una hoja de Excel con el diseño FGR (título, subtítulo, encabezados, filas y totales) ──
const crearHojaReporte = (XLSXStyle, nombreArchivo, datosJson) => {
    const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const headers = Object.keys(datosJson[0]);
    const numCols = headers.length;

    // ── Paleta de colores ──────────────────────────────────────
    const COLOR_BRAND_DARK  = '0A0A0A'; // negro FGR (fila título)
    const COLOR_BRAND_MID   = '141414';
    const COLOR_HEADER_BG   = '1C1B18'; // encabezado columnas
    const COLOR_ACCENT      = 'A67C1A'; // dorado (subtítulo)
    const COLOR_ROW_ALT     = 'FBF6E6'; // fila par (marfil dorado)
    const COLOR_ROW_NORMAL  = 'FFFFFF'; // fila impar
    const COLOR_BORDER      = 'D9CFB4'; // bordes suaves
    const COLOR_TOTAL_BG    = 'F5E9C4'; // fila totales
    const COLOR_TEXT_HEADER = 'F5E9C4'; // texto claro dorado sobre negro
    const COLOR_TEXT_DARK   = '17140E';
    const COLOR_TEXT_MUTED  = '5C5546';

    // ── Helpers de estilos ────────────────────────────────────
    const borderThin = { style: 'thin', color: { rgb: COLOR_BORDER } };
    const borderMedium = { style: 'medium', color: { rgb: COLOR_BRAND_DARK } };
    const allBorders = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
    const outerBorder = { top: borderMedium, bottom: borderMedium, left: borderMedium, right: borderMedium };

    const cellStyle = (overrides = {}) => ({
      font:      { name: 'Calibri', sz: 11, color: { rgb: COLOR_TEXT_DARK }, ...overrides.font },
      alignment: { vertical: 'center', wrapText: false, ...overrides.alignment },
      border:    overrides.border || allBorders,
      fill:      overrides.fill || { fgColor: { rgb: COLOR_ROW_NORMAL }, patternType: 'solid' },
      numFmt:    overrides.numFmt || 'General',
    });

    // ── Detección de tipo de columna ──────────────────────────
    // Las columnas se identifican por su encabezado (ReportesPage arma filas con nombres claros):
    //   "(S/.)" = dinero (se suma en TOTALES) · "(%)" = porcentaje · "N°", "Días", "Cantidad" = número sin total.
    // Las fechas llegan ya formateadas como texto y DNI/teléfonos se mantienen como texto (conservan ceros iniciales).
    const isCurrencyCol = (key) => /\(S\/\.?\)/i.test(key);
    const isPercentCol  = (key) => /\(%\)/.test(key);
    const isNumberCol   = (key) => /^(N°|Días|Cantidad)/i.test(key);
    const isDateCol     = () => false;

    // ── Construir array de celdas (fila 0 = título, fila 1 = subtítulo, fila 2 = encabezados, fila 3+ = datos) ──
    const TITLE_ROW  = 0;
    const SUB_ROW    = 1;
    const HEADER_ROW = 2;
    const DATA_START = 3;

    const ws = {};

    // Fila 0 — Título del reporte (merged)
    const titleCell = {
      v: nombreArchivo.replace(/_/g, ' ').replace(/FGR$/, '— FGR Finanzas'),
      t: 's',
      s: {
        font:      { name: 'Calibri', sz: 16, bold: true, color: { rgb: COLOR_TEXT_HEADER } },
        fill:      { fgColor: { rgb: COLOR_BRAND_DARK }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border:    outerBorder,
      },
    };
    ws[XLSXStyle.utils.encode_cell({ r: TITLE_ROW, c: 0 })] = titleCell;
    for (let c = 1; c < numCols; c++) {
      ws[XLSXStyle.utils.encode_cell({ r: TITLE_ROW, c })] = {
        v: '', t: 's',
        s: { fill: { fgColor: { rgb: COLOR_BRAND_DARK }, patternType: 'solid' }, border: outerBorder },
      };
    }

    // Fila 1 — Subtítulo con fecha y total de registros
    const subCell = {
      v: `Generado el ${fecha}  ·  ${datosJson.length} registros`,
      t: 's',
      s: {
        font:      { name: 'Calibri', sz: 10, italic: true, color: { rgb: COLOR_TEXT_HEADER } },
        fill:      { fgColor: { rgb: COLOR_ACCENT }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border:    allBorders,
      },
    };
    ws[XLSXStyle.utils.encode_cell({ r: SUB_ROW, c: 0 })] = subCell;
    for (let c = 1; c < numCols; c++) {
      ws[XLSXStyle.utils.encode_cell({ r: SUB_ROW, c })] = {
        v: '', t: 's',
        s: { fill: { fgColor: { rgb: COLOR_ACCENT }, patternType: 'solid' }, border: allBorders },
      };
    }

    // Fila 2 — Encabezados de columna
    headers.forEach((h, c) => {
      ws[XLSXStyle.utils.encode_cell({ r: HEADER_ROW, c })] = {
        v: h,
        t: 's',
        s: {
          font:      { name: 'Calibri', sz: 11, bold: true, color: { rgb: COLOR_TEXT_HEADER } },
          fill:      { fgColor: { rgb: COLOR_HEADER_BG }, patternType: 'solid' },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top:    borderMedium,
            bottom: borderMedium,
            left:   borderThin,
            right:  borderThin,
          },
        },
      };
    });

    // Filas de datos
    let totals = {}; // acumular totales para columnas numéricas
    headers.forEach(h => { if (isCurrencyCol(h)) totals[h] = 0; });

    datosJson.forEach((row, r) => {
      const isEven = r % 2 === 0;
      const rowFill = { fgColor: { rgb: isEven ? COLOR_ROW_ALT : COLOR_ROW_NORMAL }, patternType: 'solid' };

      headers.forEach((h, c) => {
        const raw = row[h];
        let val = raw ?? '';
        let cellType = 's';
        let numFmt = 'General';
        let align = { vertical: 'center', horizontal: 'left' };

        if (isCurrencyCol(h) && raw !== null && raw !== undefined && raw !== '') {
          const num = parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
          if (!isNaN(num)) {
            val = num;
            cellType = 'n';
            numFmt = '"S/."#,##0.00';
            align.horizontal = 'right';
            totals[h] = (totals[h] || 0) + num;
          }
        } else if (isPercentCol(h) && raw !== null && raw !== undefined && raw !== '') {
          const num = parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
          if (!isNaN(num)) {
            val = num / 100;
            cellType = 'n';
            numFmt = '0.00%';
            align.horizontal = 'right';
          }
        } else if (isDateCol(h) && raw && String(raw).match(/^\d{4}-\d{2}-\d{2}/)) {
          val = new Date(raw).toLocaleDateString('es-PE');
          cellType = 's';
          align.horizontal = 'center';
        } else if (isNumberCol(h) && raw !== null && raw !== undefined) {
          const num = parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
          if (!isNaN(num)) {
            val = num;
            cellType = 'n';
            numFmt = '#,##0';
            align.horizontal = 'center';
          }
        } else {
          align.horizontal = 'left';
        }

        ws[XLSXStyle.utils.encode_cell({ r: DATA_START + r, c })] = {
          v: val, t: cellType,
          s: cellStyle({ fill: rowFill, numFmt, alignment: align }),
        };
      });
    });

    // Fila de Totales (solo si hay columnas monetarias)
    const hasTotals = Object.values(totals).some(v => v !== 0);
    const TOTAL_ROW = DATA_START + datosJson.length;
    if (hasTotals) {
      headers.forEach((h, c) => {
        const isFirst = c === 0;
        const hasTot = totals[h] !== undefined && totals[h] !== 0;
        ws[XLSXStyle.utils.encode_cell({ r: TOTAL_ROW, c })] = {
          v: isFirst ? 'TOTALES' : (hasTot ? totals[h] : ''),
          t: (hasTot && !isFirst) ? 'n' : 's',
          s: {
            font:      { name: 'Calibri', sz: 11, bold: true, color: { rgb: COLOR_BRAND_DARK } },
            fill:      { fgColor: { rgb: COLOR_TOTAL_BG }, patternType: 'solid' },
            alignment: { vertical: 'center', horizontal: hasTot ? 'right' : (isFirst ? 'left' : 'center') },
            border: {
              top:    borderMedium,
              bottom: borderMedium,
              left:   borderThin,
              right:  borderThin,
            },
            numFmt: (hasTot && !isFirst) ? '"S/."#,##0.00' : 'General',
          },
        };
      });
    }

    // ── Metadata de la hoja ───────────────────────────────────
    const lastRow = hasTotals ? TOTAL_ROW : DATA_START + datosJson.length - 1;
    ws['!ref'] = XLSXStyle.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: numCols - 1 });

    // Anchos de columna automáticos (con mínimo y máximo)
    ws['!cols'] = headers.map(h => {
      const maxDataLen = Math.max(...datosJson.map(r => String(r[h] ?? '').length));
      const wch = Math.min(Math.max(h.length + 2, maxDataLen + 2, 12), 40);
      return { wch };
    });

    // Altura de filas especiales
    ws['!rows'] = [
      { hpt: 36 }, // título
      { hpt: 18 }, // subtítulo
      { hpt: 24 }, // encabezados
    ];

    // Merge del título y subtítulo (combinar celdas A1:última col)
    ws['!merges'] = [
      { s: { r: TITLE_ROW, c: 0 }, e: { r: TITLE_ROW, c: numCols - 1 } },
      { s: { r: SUB_ROW,   c: 0 }, e: { r: SUB_ROW,   c: numCols - 1 } },
    ];

    // Fila congelada: congelar las 3 primeras filas + primera columna
    ws['!freeze'] = { xSplit: 0, ySplit: HEADER_ROW + 1 };

    return ws;
};

// --- REPORTES API ---
export const reportesApi = {
  getDownloadUrl: (endpoint) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://fgr-backend-oficial-xyjo.onrender.com';
    return `${baseUrl}/api/Reportes/${endpoint}`;
  },

  exportarExcel: async (nombreArchivo, datosJson) => {
    if (!datosJson || datosJson.length === 0) {
      console.warn('No hay datos para exportar en este reporte.');
      return false;
    }

    const XLSXStyle = await import('xlsx-js-style');
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    const ws = crearHojaReporte(XLSXStyle, nombreArchivo, datosJson);

    const wb = XLSXStyle.utils.book_new();
    wb.Props = {
      Title: nombreArchivo,
      Subject: 'Reporte FGR Finanzas',
      Author: 'Sistema FGR',
      CreatedDate: new Date(),
    };
    XLSXStyle.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSXStyle.writeFile(wb, `${nombreArchivo}_${fechaArchivo}.xlsx`);
    return true;
  },

  /**
   * Excel con varias hojas (p. ej. estado de cuenta individual de un cliente).
   * hojas: [{ nombre: 'Préstamos', titulo: 'Préstamos de Juan Pérez', datos: [...] }]
   */
  exportarExcelHojas: async (nombreArchivo, hojas) => {
    if (!hojas || hojas.length === 0) return false;

    const XLSXStyle = await import('xlsx-js-style');
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    const wb = XLSXStyle.utils.book_new();
    wb.Props = {
      Title: nombreArchivo,
      Subject: 'Reporte FGR Finanzas',
      Author: 'Sistema FGR',
      CreatedDate: new Date(),
    };

    hojas.forEach((hoja) => {
      const datos = hoja.datos && hoja.datos.length > 0 ? hoja.datos : [{ 'Información': 'Sin registros' }];
      const ws = crearHojaReporte(XLSXStyle, hoja.titulo || hoja.nombre, datos);
      // Excel limita el nombre de la hoja a 31 caracteres y no admite : \ / ? * [ ]
      const nombreHoja = String(hoja.nombre || 'Hoja').replace(/[:\\/?*[\]]/g, '').slice(0, 31);
      XLSXStyle.utils.book_append_sheet(wb, ws, nombreHoja);
    });

    XLSXStyle.writeFile(wb, `${nombreArchivo}_${fechaArchivo}.xlsx`);
    return true;
  },

  exportarCSV: (nombreArchivo, datosJson) => {
    if (!datosJson || datosJson.length === 0) {
      console.warn('No hay datos para exportar en este reporte.');
      return false;
    }
    const headers = Object.keys(datosJson[0]).join(';');
    const rows = datosJson.map(obj =>
      Object.values(obj).map(v => `"${v !== undefined && v !== null ? String(v).replace(/"/g, '""') : ''}"`).join(';')
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  },

  // Alias por retrocompatibilidad (se mantiene como CSV)
  exportarSimulado: (nombreArchivo, datosJson) => {
    return reportesApi.exportarCSV(nombreArchivo, datosJson);
  }
};
