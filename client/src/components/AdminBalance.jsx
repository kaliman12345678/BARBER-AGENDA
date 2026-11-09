import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Scissors, 
  Users, 
  Calendar, 
  Wallet, 
  Package, 
  Percent, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Filter,
  Sparkles,
  PieChart,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { formatCOP, getTodayStr } from '../utils/helpers';
import BarberoRecordModal from './BarberoRecordModal';

export default function AdminBalance() {
  const [balance, setBalance] = useState({
    total_ingresos: 0,
    total_ingresos_servicios: 0,
    total_ventas_productos: 0,
    total_ingresos_extras: 0,
    total_servicios: 0,
    total_comisiones_pagadas: 0,
    total_costos_operativos: 0,
    margen_barberia: 0,
    ganancia_neta: 0,
    barberos_detalle: []
  });
  const [cargando, setCargando] = useState(false);
  const [filtroRango, setFiltroRango] = useState('mes'); // 'hoy', 'semana', 'mes', 'todo', 'personalizado'
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [barberoSeleccionadoId, setBarberoSeleccionadoId] = useState(null);

  useEffect(() => {
    aplicarPreset('mes');
  }, []);

  function aplicarPreset(tipo) {
    setFiltroRango(tipo);
    const hoy = new Date();
    const hoyStr = getTodayStr();

    if (tipo === 'hoy') {
      setFechaDesde(hoyStr);
      setFechaHasta(hoyStr);
      cargarBalance(hoyStr, hoyStr);
    } else if (tipo === 'semana') {
      const d = new Date(hoy);
      const diaSem = d.getDay(); // 0 Dom, 1 Lun
      const diff = d.getDate() - diaSem + (diaSem === 0 ? -6 : 1);
      const lunes = new Date(d.setDate(diff)).toISOString().split('T')[0];
      const domingo = new Date(d.setDate(diff + 6)).toISOString().split('T')[0];
      setFechaDesde(lunes);
      setFechaHasta(domingo);
      cargarBalance(lunes, domingo);
    } else if (tipo === 'mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
      setFechaDesde(primerDia);
      setFechaHasta(ultimoDia);
      cargarBalance(primerDia, ultimoDia);
    } else if (tipo === 'todo') {
      setFechaDesde('');
      setFechaHasta('');
      cargarBalance('', '');
    }
  }

  async function cargarBalance(desde = fechaDesde, hasta = fechaHasta) {
    setCargando(true);
    try {
      let url = '/api/reportes/balance';
      if (desde && hasta) {
        url += `?desde=${desde}&hasta=${hasta}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setBalance(data);
    } catch (err) {
      console.error('Error cargando balance:', err);
    } finally {
      setCargando(false);
    }
  }

  function handleFiltrarPersonalizado(e) {
    e.preventDefault();
    if (fechaDesde && fechaHasta) {
      setFiltroRango('personalizado');
      cargarBalance(fechaDesde, fechaHasta);
    }
  }

  const barberosDetalle = balance.barberos_detalle || [];

  return (
    <div className="space-y-7">
      
      {/* Cabecera y Filtros de Fechas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            Balance General & Rendimiento por Barbero
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Consulta consolidada de ingresos, cuánto se le pagó a cada barbero de manera independiente y cuánto le quedó a la barbería.
          </p>
        </div>

        {/* Botones de período */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: 'semana', label: 'Esta Semana' },
            { id: 'mes', label: 'Este Mes' },
            { id: 'todo', label: 'Histórico Total' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => aplicarPreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filtroRango === p.id 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selector Personalizado */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <form onSubmit={handleFiltrarPersonalizado} className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-400" />
            Rango Específico:
          </span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
          />
          <span className="text-slate-500">al</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg border border-slate-700 transition-colors"
          >
            Filtrar
          </button>
        </form>

        <div className="text-slate-400 text-[11px]">
          Mostrando datos: <strong className="text-white">{fechaDesde || 'Inicio'}</strong> hasta <strong className="text-white">{fechaHasta || 'Hoy'}</strong>
        </div>
      </div>

      {cargando ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Consolidando balance general y métricas independientes...
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* ======================================================== */}
          {/* SECCIÓN 1: RESUMEN FINANCIERO GLOBAL DE LA BARBERÍA */}
          {/* ======================================================== */}
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              1. Resumen Consolidado del Negocio
            </h4>

            {/* Tarjeta Principal: Ganancia Neta */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl relative overflow-hidden mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                    Beneficio Neto Limpio de la Barbería
                  </span>
                  <h4 className={`text-3xl sm:text-4xl font-black font-serif mt-1 ${
                    balance.ganancia_neta >= 0 ? 'text-white' : 'text-rose-400'
                  }`}>
                    {formatCOP(balance.ganancia_neta)}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Dinero real que le queda libre a la barbería tras restar el pago de comisiones a los barberos y los costos operativos fijos del local.
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-xs space-y-1 sm:text-right flex-shrink-0">
                  <span className="text-slate-400 block font-medium">Cortes realizados:</span>
                  <span className="text-2xl font-black text-amber-400">{balance.total_servicios} turnos</span>
                </div>
              </div>
            </div>

            {/* Tarjetas de Desglose Global */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Ingresos Brutos */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">
                    Ingresos Brutos
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-400 font-serif block">
                  {formatCOP(balance.total_ingresos)}
                </span>
                <div className="mt-2 text-[11px] text-slate-400 space-y-0.5 border-t border-slate-800 pt-2">
                  <div className="flex justify-between">
                    <span>Servicios:</span>
                    <span className="text-slate-200 font-bold">{formatCOP(balance.total_ingresos_servicios)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Productos:</span>
                    <span className="text-slate-200 font-bold">{formatCOP(balance.total_ventas_productos)}</span>
                  </div>
                  {balance.total_ingresos_extras > 0 && (
                    <div className="flex justify-between">
                      <span>Caja extras:</span>
                      <span className="text-slate-200 font-bold">{formatCOP(balance.total_ingresos_extras)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Pagado a Barberos */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">
                    Pagado a Barberos
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Scissors className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-amber-400 font-serif block">
                  {formatCOP(balance.total_comisiones_pagadas)}
                </span>
                <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-800 pt-2">
                  Total cancelado mediante liquidaciones por porcentajes pactados.
                </p>
              </div>

              {/* Costos Operativos */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">
                    Costos del Local
                  </span>
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-rose-400 font-serif block">
                  {formatCOP(balance.total_costos_operativos)}
                </span>
                <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-800 pt-2">
                  Arriendos, luz, agua, productos y mantenimiento.
                </p>
              </div>

              {/* Margen Bruto Barbería */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">
                    Margen para Barbería
                  </span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-blue-400 font-serif block">
                  {formatCOP(balance.margen_barberia)}
                </span>
                <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-800 pt-2">
                  Ingresos brutos menos comisiones pagadas a barberos.
                </p>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* SECCIÓN 2: DESGLOSE INDEPENDIENTE POR CADA BARBERO */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  2. Balance Independiente por Barbero (Cuánto cobró y cuánto dejó al negocio)
                </h4>
                <p className="text-xs text-slate-400">
                  Desglose exacto de lo recaudado por cada barbero, lo que se le pagó por comisión y el margen neto que le quedó a la barbería.
                </p>
              </div>
            </div>

            {barberosDetalle.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                No hay barberos registrados en el sistema.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {barberosDetalle.map((b) => (
                  <div 
                    key={b.id} 
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all space-y-4"
                  >
                    {/* Encabezado del Barbero */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=120&h=120&fit=crop&crop=faces'}
                          alt={b.nombre}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/30"
                        />
                        <div>
                          <h5 className="font-bold text-white text-base font-serif flex items-center gap-2">
                            {b.nombre}
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                              Comisión {b.porcentaje_comision}%
                            </span>
                          </h5>
                          <span className="text-xs text-slate-400">
                            {b.servicios_realizados} turnos realizados • {b.ventas_productos_count} productos vendidos
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Total Facturado
                        </span>
                        <span className="text-lg font-black text-white font-serif">
                          {formatCOP(b.total_bruto_generado)}
                        </span>
                      </div>
                    </div>

                    {/* Comparativa: Lo que ganó el barbero vs Lo que le quedó a la barbería */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Cuánto se le pagó / corresponde al barbero */}
                      <div className="bg-slate-950/80 border border-amber-500/20 p-3.5 rounded-2xl">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                          <Scissors className="w-3.5 h-3.5" />
                          Pagado al Barbero
                        </span>
                        <div className="mt-1">
                          <span className="text-xl font-black text-amber-400 font-serif block">
                            {formatCOP(b.total_ganado_barbero)}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {b.total_pagado_liquidaciones > 0 ? (
                              <span>Liquidado: {formatCOP(b.total_pagado_liquidaciones)}</span>
                            ) : (
                              <span>Pendiente: {formatCOP(b.comisiones_pendientes)}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Cuánto le quedó a la barbería */}
                      <div className="bg-slate-950/80 border border-emerald-500/20 p-3.5 rounded-2xl">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" />
                          Le Quedó a la Barbería
                        </span>
                        <div className="mt-1">
                          <span className="text-xl font-black text-emerald-400 font-serif block">
                            {formatCOP(b.retenido_barberia)}
                          </span>
                          <span className="text-[10px] text-emerald-400/80 font-semibold block mt-0.5">
                            Margen negocio: {b.porcentaje_retenido_barberia}%
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Barra Visual de Distribución */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
                        <span>Barbero: {100 - b.porcentaje_retenido_barberia}%</span>
                        <span>Barbería: {b.porcentaje_retenido_barberia}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-amber-500 h-full transition-all duration-500"
                          style={{ width: `${Math.max(5, 100 - b.porcentaje_retenido_barberia)}%` }}
                          title={`Barbero: ${formatCOP(b.total_ganado_barbero)}`}
                        ></div>
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${Math.max(5, b.porcentaje_retenido_barberia)}%` }}
                          title={`Barbería: ${formatCOP(b.retenido_barberia)}`}
                        ></div>
                      </div>
                    </div>

                    {/* Detalle en línea */}
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span>Cortes: <strong className="text-slate-200">{formatCOP(b.total_bruto_servicios)}</strong></span>
                      <span>Productos: <strong className="text-slate-200">{formatCOP(b.total_bruto_productos)}</strong></span>
                      {b.comisiones_pendientes > 0 && (
                        <span className="text-amber-400 font-semibold">
                          Por liquidar: {formatCOP(b.comisiones_pendientes)}
                        </span>
                      )}
                    </div>

                    {/* Botón para ver todo lo que ha pasado con el empleado (Récord & Historial) */}
                    <button
                      type="button"
                      onClick={() => setBarberoSeleccionadoId(b.id)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 hover:border-amber-500/40 transition-all shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Expediente & Récord Completo</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </button>

                  </div>
                ))}
              </div>
            )}

            {/* Tabla Consolidada Comparativa */}
            {barberosDetalle.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl mt-6">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                    Tabla Comparativa de Liquidación y Retención por Barbero
                  </h5>
                  <span className="text-[11px] text-slate-400">
                    Haz clic en cualquier barbero para ver su récord completo
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-950/60 font-semibold">
                        <th className="py-3 px-4">Barbero</th>
                        <th className="py-3 px-4 text-center">% Comisión</th>
                        <th className="py-3 px-4 text-center">Cortes</th>
                        <th className="py-3 px-4 text-right">Facturado Bruto</th>
                        <th className="py-3 px-4 text-right text-amber-400">Total Pagado</th>
                        <th className="py-3 px-4 text-right text-emerald-400">Le Quedó a Barbería</th>
                        <th className="py-3 px-4 text-center">Retención</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {barberosDetalle.map((b) => (
                        <tr 
                          key={b.id} 
                          onClick={() => setBarberoSeleccionadoId(b.id)}
                          className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 text-white font-bold flex items-center gap-2">
                            <span>{b.nombre}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-amber-400 font-bold">
                            {b.porcentaje_comision}%
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {b.servicios_realizados}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-200">
                            {formatCOP(b.total_bruto_generado)}
                          </td>
                          <td className="py-3 px-4 text-right text-amber-400 font-bold">
                            {formatCOP(b.total_ganado_barbero)}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-black">
                            {formatCOP(b.retenido_barberia)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                              {b.porcentaje_retenido_barberia}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[11px] font-bold text-amber-400 hover:underline">
                              Ver Récord →
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Modal de Expediente y Récord Completo del Barbero */}
      {barberoSeleccionadoId && (
        <BarberoRecordModal
          barberoId={barberoSeleccionadoId}
          esBarbero={false}
          onClose={() => setBarberoSeleccionadoId(null)}
        />
      )}

    </div>
  );
}
