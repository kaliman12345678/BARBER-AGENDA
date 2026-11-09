import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Scissors, 
  Percent, 
  CheckCircle2, 
  Clock, 
  Phone, 
  X, 
  Filter, 
  TrendingUp, 
  Wallet, 
  Package, 
  History, 
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Camera
} from 'lucide-react';
import { formatCOP, formatDateReadable, formatTime12 } from '../utils/helpers';

export default function BarberoRecordModal({ barberoId, esBarbero = false, onClose }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [subTab, setSubTab] = useState('citas'); // 'citas', 'liquidaciones', 'productos', 'galeria', 'auditoria'
  const [filtroEstado, setFiltroEstado] = useState('todas');

  useEffect(() => {
    cargarExpediente();
  }, [barberoId]);

  async function cargarExpediente() {
    setCargando(true);
    try {
      const url = `/api/barberos/${barberoId}/record${esBarbero ? '?es_barbero=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDatos(data);
      }
    } catch (err) {
      console.error('Error cargando récord de barbero:', err);
    } finally {
      setCargando(false);
    }
  }

  if (cargando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-slate-800">Cargando expediente y récord histórico...</p>
          <p className="text-xs text-slate-400 mt-1">Consolidando citas, liquidaciones y actividad del colaborador</p>
        </div>
      </div>
    );
  }

  if (!datos) return null;

  const { barbero, resumen, citas, liquidaciones, ventas_productos, publicaciones, auditoria } = datos;

  // Filtrar citas según estado seleccionado
  const citasFiltradas = filtroEstado === 'todas'
    ? citas
    : citas.filter(c => c.estado === filtroEstado);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Cabecera del Expediente */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <img
              src={barbero.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&h=150&fit=crop&crop=faces'}
              alt={barbero.nombre}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-sm flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 font-sans">
                  {barbero.nombre}
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {barbero.porcentaje_comision}% Comisión
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  barbero.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {barbero.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                {barbero.email && <span>✉️ {barbero.email}</span>}
                {barbero.telefono && <span>• 📞 {barbero.telefono}</span>}
                <span>• ⏰ {formatTime12(barbero.horario_inicio)} a {formatTime12(barbero.horario_fin)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Scrolleable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Métricas Resumen Vitalicio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Cortes Realizados
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-900 font-sans mt-0.5 block">
                {resumen.total_citas_completadas}
              </span>
              <span className="text-[11px] text-blue-600">
                de {resumen.total_citas_registradas} turnos totales
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Facturado en Cortes
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans mt-0.5 block">
                {formatCOP(resumen.total_bruto_servicios)}
              </span>
              <span className="text-[11px] text-slate-500">
                Valor bruto producido
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Comisiones Ganadas
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-800 font-sans mt-0.5 block">
                {formatCOP(resumen.total_ganado_vitalicio)}
              </span>
              <span className="text-[11px] text-emerald-600">
                Cortes + ventas de tienda
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Saldo Pendiente
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-900 font-sans mt-0.5 block">
                {formatCOP(resumen.saldo_pendiente_por_cobrar)}
              </span>
              <span className="text-[11px] text-amber-700">
                {formatCOP(resumen.total_liquidado_pagado)} ya pagado
              </span>
            </div>
          </div>

          {/* Selector de Pestañas de Detalle */}
          <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setSubTab('citas')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                subTab === 'citas'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Historial de Citas ({citas.length})</span>
            </button>

            <button
              onClick={() => setSubTab('liquidaciones')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                subTab === 'liquidaciones'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Pagos / Liquidaciones ({liquidaciones.length})</span>
            </button>

            <button
              onClick={() => setSubTab('productos')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                subTab === 'productos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Ventas Tienda ({ventas_productos.length})</span>
            </button>

            <button
              onClick={() => setSubTab('galeria')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                subTab === 'galeria'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Portafolio Galería ({publicaciones.length})</span>
            </button>

            {!esBarbero && (
              <button
                onClick={() => setSubTab('auditoria')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  subTab === 'auditoria'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Auditoría & Novedades ({auditoria.length})</span>
              </button>
            )}
          </div>

          {/* CONTENIDO 1: HISTORIAL DE CITAS */}
          {subTab === 'citas' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Registro de Turnos Asignados y Atendidos
                </span>
                <div className="flex gap-1 text-[11px]">
                  {['todas', 'completada', 'confirmada', 'cancelada'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFiltroEstado(st)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition-all ${
                        filtroEstado === st
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {citasFiltradas.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  No hay citas registradas con este filtro.
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                        <th className="py-2.5 px-3">Fecha & Hora</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        {!esBarbero && <th className="py-2.5 px-3">Teléfono</th>}
                        <th className="py-2.5 px-3">Servicio</th>
                        <th className="py-2.5 px-3 text-right">Cobrado</th>
                        <th className="py-2.5 px-3 text-right">Comisión Barbero</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {citasFiltradas.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                            {c.fecha} {formatTime12(c.hora_inicio)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {c.cliente_nombre}
                          </td>
                          {!esBarbero && (
                            <td className="py-2.5 px-3 text-slate-500">
                              {c.cliente_telefono || '-'}
                            </td>
                          )}
                          <td className="py-2.5 px-3 text-slate-700">
                            {c.servicio_nombre}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatCOP(c.precio_cobrado)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {formatCOP(c.comision_estimada)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              c.estado === 'completada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.estado === 'cancelada'
                                ? 'bg-slate-100 text-slate-500 line-through'
                                : c.estado === 'no_asistio'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {c.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO 2: HISTORIAL DE LIQUIDACIONES / PAGOS */}
          {subTab === 'liquidaciones' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Historial de Pagos y Liquidaciones de Comisiones
              </span>

              {liquidaciones.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  No hay pagos de liquidación registrados para este barbero aún.
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                        <th className="py-2.5 px-3">Fecha de Pago</th>
                        <th className="py-2.5 px-3">Período Liquidado</th>
                        <th className="py-2.5 px-3">Servicios</th>
                        <th className="py-2.5 px-3">Método</th>
                        <th className="py-2.5 px-3 text-right">Monto Pagado</th>
                        <th className="py-2.5 px-3">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liquidaciones.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                            {l.fecha_pago ? l.fecha_pago.split(' ')[0] : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {l.fecha_inicio} al {l.fecha_fin}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {l.total_servicios} cortes
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {l.metodo_pago || 'Efectivo'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700 text-sm whitespace-nowrap">
                            {formatCOP(l.total_pagado)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 italic text-[11px]">
                            {l.notas || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO 3: VENTAS DE PRODUCTOS */}
          {subTab === 'productos' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Comisiones por Venta de Productos en la Barbería
              </span>

              {ventas_productos.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  El barbero no tiene ventas de productos registradas.
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Producto</th>
                        <th className="py-2.5 px-3 text-center">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">Total Venta</th>
                        <th className="py-2.5 px-3 text-right">Comisión Ganada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ventas_productos.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-600">{v.fecha}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{v.producto_nombre}</td>
                          <td className="py-2.5 px-3 text-center font-bold">{v.cantidad}</td>
                          <td className="py-2.5 px-3 text-right text-slate-700">{formatCOP(v.total_venta)}</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600">{formatCOP(v.monto_comision)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO 4: PORTAFOLIO MULTIMEDIA */}
          {subTab === 'galeria' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Fotos y Trabajos de este Barbero en la Galería
              </span>

              {publicaciones.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  No hay fotos ni publicaciones subidas por este barbero aún.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {publicaciones.map((p) => (
                    <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <img src={p.url_media} alt={p.titulo} className="w-full h-36 object-cover" />
                      <div className="p-3">
                        <h5 className="font-bold text-xs text-slate-900 truncate">{p.titulo}</h5>
                        {p.descripcion && <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.descripcion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO 5: AUDITORÍA (SOLO ADMIN) */}
          {subTab === 'auditoria' && !esBarbero && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Historial de Eventos y Novedades del Barbero
              </span>

              {auditoria.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  No hay registros de auditoría asociados a este barbero.
                </p>
              ) : (
                <div className="space-y-2">
                  {auditoria.map((a) => (
                    <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start gap-2.5">
                      <History className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800">{a.descripcion}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{a.fecha_hora} • Por: {a.usuario}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span className="font-medium">
            Expediente consolidado de {barbero.nombre}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Cerrar Expediente
          </button>
        </div>

      </div>
    </div>
  );
}
