import * as XLSX from 'xlsx';

/**
 * Utilidad universal para exportar datos a libros de Microsoft Excel (.xlsx)
 * con soporte multi-hoja, tipado numérico y nombres de archivo limpios.
 *
 * @param {Object} params
 * @param {string} params.nombreArchivo - Nombre del archivo sin extensión (ej: 'Balance_Contable')
 * @param {Array<{nombreHoja: string, datos: Array<Object>}>} params.hojas - Hojas de cálculo con sus filas
 */
export function descargarExcelMultiHoja({ nombreArchivo = 'Reporte_EXAKTA', hojas = [] }) {
  try {
    const wb = XLSX.utils.book_new();

    hojas.forEach(({ nombreHoja = 'Datos', datos = [] }) => {
      // Limpiar nombre de hoja para cumplir límites de Excel (máx 31 caracteres, sin caracteres especiales)
      const nombreLimpio = String(nombreHoja).replace(/[:\\\/\?\*\[\]]/g, '').slice(0, 31) || 'Hoja1';

      if (!datos || datos.length === 0) {
        const wsVacia = XLSX.utils.aoa_to_sheet([['Sin datos registrados']]);
        XLSX.utils.book_append_sheet(wb, wsVacia, nombreLimpio);
        return;
      }

      // Convertir JSON a hoja de Excel
      const ws = XLSX.utils.json_to_sheet(datos);

      // Auto-calcular anchos de columnas
      const keys = Object.keys(datos[0] || {});
      const colWidths = keys.map(k => {
        let maxLen = k.length;
        datos.slice(0, 100).forEach(row => {
          const val = row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(50, Math.max(12, maxLen + 3)) };
      });
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, nombreLimpio);
    });

    const fechaHoy = new Date().toISOString().split('T')[0];
    const filename = `${nombreArchivo}_${fechaHoy}.xlsx`;

    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('Error generando archivo Excel:', error);
    // Fallback: intentar exportación a CSV
    return exportarCSVFallback(hojas[0]?.datos || [], nombreArchivo);
  }
}

/**
 * Exportador rápido de una sola hoja
 */
export function exportarAExcel({ nombreArchivo = 'Reporte', nombreHoja = 'Datos', datos = [] }) {
  return descargarExcelMultiHoja({
    nombreArchivo,
    hojas: [{ nombreHoja, datos }]
  });
}

/**
 * Fallback a CSV con UTF-8 BOM para soporte de tildes y caracteres en español
 */
function exportarCSVFallback(datos = [], nombreArchivo = 'Reporte') {
  if (!datos || datos.length === 0) {
    alert('No hay datos para exportar.');
    return false;
  }

  const headers = Object.keys(datos[0]);
  const rows = datos.map(row =>
    headers.map(h => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(';')
  );

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
