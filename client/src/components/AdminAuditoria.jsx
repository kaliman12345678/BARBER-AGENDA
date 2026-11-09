import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  User, 
  Filter, 
  Clock, 
  ShieldCheck, 
  Search, 
  RotateCcw, 
  Activity,
  ArrowRight,
  FileText,
  DollarSign,
  Tag,
  Scissors
} from 'lucide-react';
import { formatDateReadable, formatTime12, getTodayStr } from '../utils/helpers';

export default function AdminAuditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarAuditoria();
  }, [filtroTipo, fechaDesde, fechaHasta]);

  async function cargarAuditoria() {
    setCargando(true);
    try {
      let url = '/api/auditoria?limite=300';
      if (filtroTipo) url += `&tipo=${filtroTipo}`;
      if (fechaDesde && fechaHasta) url += `&desde=${fechaDesde}&hasta=${fechaHasta}`;
      const res = await fetch(url);
      const data = await res.json();
      setRegistros(data);
    } catch (err) {
      console.error('Error cargando auditoría:', err);
    } finally {
      setCargando(false);
    }
  }

  const tiposEventos = [
    { id: '', label: 'Todos los Eventos' },
    { id: 'CITA_CREADA', label: 'Citas Nuevas' },
    { id: 'CITA_REASIGNADA', label: 'Citas Reasignadas' },
    { id: 'CITA_ESTADO', label: 'Cambios de Estado' },
    { id: 'VENTA_PRODUCTO', label: 'Ventas de Tienda' },
    { id: 'COSTO_REGISTRADO', label: 'Movimientos de Caja' },
    { id: 'LIQUIDACION', label: 'Liquidaciones de Pago' }
  ];

  const registrosFiltrados = registros.filter(r => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      r.descripcion?.toLowerCase().includes(term) ||
      r.tipo_evento?.toLowerCase().includes(term) ||
      r.usuario?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-sans flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Registro Total de Auditoría & Trazabilidad
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico exhaustivo e inmutable de todos los movimientos: citas creadas, reasignadas, ventas de productos, liquidaciones y cambios de estado.
          </p>
        </div>

        <button
          onClick={cargarAuditoria}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all self-start md:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-blue-600' : ''}`} />
          <span>Actualizar Historial</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Tipo de evento */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Tipo de Evento
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500"
            >
              {tiposEventos.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Buscador de texto */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Buscar en descripción
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre, barbero, cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

        </div>
      </div>

      {/* Lista de Registros de Auditoría */}
      {cargando ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-medium">Consultando historial inmutable...</p>
        </div>
      ) : registrosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="text-slate-800 font-bold text-sm">No hay registros con los filtros seleccionados</h4>
          <p className="text-slate-500 text-xs mt-1">Los movimientos generados en la app se registran aquí de manera permanente.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {registrosFiltrados.map((r) => {
              const isCitaCreada = r.tipo_evento === 'CITA_CREADA';
              const isReasignada = r.tipo_evento === 'CITA_REASIGNADA';
              const isEstado = r.tipo_evento === 'CITA_ESTADO';
              const isVenta = r.tipo_evento === 'VENTA_PRODUCTO';
              const isLiquidacion = r.tipo_evento === 'LIQUIDACION';

              return (
                <div key={r.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isReasignada
                        ? 'bg-amber-100 text-amber-700'
                        : isCitaCreada
                        ? 'bg-blue-100 text-blue-700'
                        : isEstado
                        ? 'bg-emerald-100 text-emerald-700'
                        : isVenta
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isReasignada ? <Scissors className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isReasignada
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : isCitaCreada
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : isEstado
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {r.tipo_evento}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          Por: <strong className="text-slate-700 font-semibold">{r.usuario}</strong>
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 font-medium break-words">
                        {r.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 text-[11px] text-slate-400">
                    <span className="block font-semibold text-slate-700 font-mono">
                      {r.fecha_hora?.split(' ')[1] || ''}
                    </span>
                    <span className="block text-[10px]">
                      {r.fecha_hora?.split(' ')[0] || ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
