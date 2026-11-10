import React, { useState } from 'react';
import { Calendar, Search, X, ChevronDown, Filter } from 'lucide-react';
import { getTodayStr } from '../utils/helpers';

export default function DateRangeFilter({
  filtroTiempo,
  setFiltroTiempo,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  busqueda,
  setBusqueda,
  onBuscar,
  placeholder = 'Buscar cliente por nombre o teléfono...',
  mostrarBuscador = true,
  className = ''
}) {
  const [mostrarCalendario, setMostrarCalendario] = useState(filtroTiempo === 'rango');

  // Calcular fechas de acceso rápido
  function handleSeleccionarFiltro(tipo) {
    setFiltroTiempo(tipo);
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    if (tipo === 'hoy') {
      setFechaDesde(hoyStr);
      setFechaHasta(hoyStr);
      setMostrarCalendario(false);
    } else if (tipo === 'ayer') {
      const ayer = new Date(Date.now() - 86400000);
      const ayerStr = ayer.toISOString().split('T')[0];
      setFechaDesde(ayerStr);
      setFechaHasta(ayerStr);
      setMostrarCalendario(false);
    } else if (tipo === '7d') {
      const hace7 = new Date(Date.now() - 7 * 86400000);
      setFechaDesde(hace7.toISOString().split('T')[0]);
      setFechaHasta(hoyStr);
      setMostrarCalendario(false);
    } else if (tipo === 'rango') {
      setMostrarCalendario(true);
    } else if (tipo === 'todas') {
      setFechaDesde('');
      setFechaHasta('');
      setMostrarCalendario(false);
    }
  }

  return (
    <div className={`space-y-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs ${className}`}>
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* BOTONES RÁPIDOS DE FECHA */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: 'ayer', label: 'Ayer' },
            { id: '7d', label: '7 días' },
            { id: 'rango', label: 'Escoge rango en calendario' },
            { id: 'todas', label: 'Todas' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleSeleccionarFiltro(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filtroTiempo === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {f.id === 'rango' && <Calendar className="w-3.5 h-3.5" />}
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* MOTOR DE BÚSQUEDA */}
        {mostrarBuscador && (
          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={placeholder}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && onBuscar) onBuscar(); }}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => { setBusqueda(''); if (onBuscar) setTimeout(onBuscar, 50); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </div>

      {/* SELECTOR DE RANGO DESPLEGABLE EN CALENDARIO */}
      {mostrarCalendario && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-fadeIn text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Rango:</span>
          </span>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-semibold">Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="p-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-semibold">Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="p-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {onBuscar && (
            <button
              type="button"
              onClick={onBuscar}
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Aplicar Rango
            </button>
          )}
        </div>
      )}
    </div>
  );
}
