import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Scissors, 
  TrendingUp, 
  TrendingDown, 
  User, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Percent, 
  Calculator, 
  LogOut, 
  HelpCircle,
  Sliders,
  ShieldCheck,
  Package,
  Wallet
} from 'lucide-react';
import { formatCOP, formatDateReadable, formatTime12, getTodayStr } from '../utils/helpers';

export default function BarberoPortal({ barbero, onLogout }) {
  const [tab, setTab] = useState('citas'); // 'citas', 'balance', 'calculadora'
  const [citas, setCitas] = useState([]);
  const [balance, setBalance] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('todas'); // 'todas', 'hoy'

  // Calculadora personal del barbero (para saber cuánto gana haciendo X cortes)
  const [precioCortePromedio, setPrecioCortePromedio] = useState('25000');
  const [cortesDiaSimulados, setCortesDiaSimulados] = useState('6');
  const [diasTrabajoMes, setDiasTrabajoMes] = useState('26');
  const [metaGananciaPersonal, setMetaGananciaPersonal] = useState('2000000');

  useEffect(() => {
    cargarDatos();
  }, [filtroFecha]);

  async function cargarDatos() {
    setCargando(true);
    try {
      let urlCitas = `/api/barbero-portal/citas?barbero_id=${barbero.id}`;
      if (filtroFecha === 'hoy') {
        urlCitas += `&fecha=${getTodayStr()}`;
      }

      const [resC, resB] = await Promise.all([
        fetch(urlCitas),
        fetch(`/api/barbero-portal/balance?barbero_id=${barbero.id}`)
      ]);

      const dataC = await resC.json();
      const dataB = await resB.json();

      setCitas(dataC);
      setBalance(dataB);
    } catch (err) {
      console.error('Error cargando portal del barbero:', err);
    } finally {
      setCargando(false);
    }
  }

  // Cálculos de la calculadora personal del barbero
  const miComision = barbero.porcentaje_comision || 50;
  const numPrecio = Number(precioCortePromedio) || 0;
  const gananciaPorCorte = Math.round(numPrecio * (miComision / 100));
  const numCortesDia = Number(cortesDiaSimulados) || 0;
  const numDias = Number(diasTrabajoMes) || 0;
  const totalCortesMes = Math.round(numCortesDia * numDias);
  const miGananciaMensualSimulada = totalCortesMes * gananciaPorCorte;

  // Calculadora inversa personal: Para ganar $X, ¿cuántos cortes debo hacer al día?
  const numMeta = Number(metaGananciaPersonal) || 0;
  const cortesMesNecesarios = gananciaPorCorte > 0 ? Math.ceil(numMeta / gananciaPorCorte) : 0;
  const cortesDiaNecesarios = numDias > 0 ? (cortesMesNecesarios / numDias).toFixed(1) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 animate-fadeIn">
      
      {/* Barra de Bienvenida del Barbero */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={barbero.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&h=150&fit=crop&crop=faces'}
            alt={barbero.nombre}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 font-sans">
                Hola, {barbero.nombre}
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                Tu Comisión: {miComision}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Panel personal de trabajo • Consulta tus turnos asignados, utilidad ganada y proyecta tus metas.
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors self-start md:self-auto border border-slate-200 hover:border-rose-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Pestañas de Navegación del Barbero */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'citas', label: 'Mis Citas Asignadas', icon: Calendar, badge: citas.length },
          { id: 'balance', label: 'Mi Utilidad & Pagos', icon: DollarSign },
          { id: 'calculadora', label: 'Mi Calculadora de Ganancias', icon: Calculator, badge: 'Proyección' }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. MIS CITAS ASIGNADAS (SIN DATOS SENSIBLES) */}
      {/* ======================================================== */}
      {tab === 'citas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Turnos Asignados a tu Silla
              </h4>
              <p className="text-xs text-slate-500">
                Por protección y privacidad, solo visualizas el nombre de pila del cliente, el horario y el servicio contratado.
              </p>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setFiltroFecha('todas')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filtroFecha === 'todas' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFiltroFecha('hoy')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filtroFecha === 'hoy' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Solo Hoy
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs">Cargando tus citas...</p>
            </div>
          ) : citas.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-slate-800 font-bold text-sm">No tienes turnos programados en este momento</h4>
              <p className="text-slate-500 text-xs mt-1">Cuando la administración o un cliente agende en tu horario, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {citas.map((c) => {
                const isCompletada = c.estado === 'completada';
                const isCancelada = c.estado === 'cancelada';
                const miGananciaCita = Math.round((c.precio_cobrado || 0) * (miComision / 100));

                return (
                  <div 
                    key={c.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCompletada
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isCancelada
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Horario y Estado */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                          {formatTime12(c.hora_inicio)} - {formatTime12(c.hora_fin)}
                        </span>

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCompletada 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isCancelada 
                            ? 'bg-slate-100 text-slate-600' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {c.estado}
                        </span>
                      </div>

                      {/* Nombre del Cliente (PRIVADO: SIN TELÉFONO) */}
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{c.cliente_nombre}</span>
                      </h4>

                      <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                        <p className="flex items-center gap-2">
                          <Scissors className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-slate-800">{c.servicio_nombre}</span>
                          <span className="text-slate-400 text-[11px]">({c.duracion_minutos} min)</span>
                        </p>

                        <p className="text-slate-500 text-[11px]">
                          Fecha: <strong className="text-slate-800 font-medium">{c.fecha}</strong>
                        </p>

                        {c.notas && (
                          <p className="text-slate-600 text-[11px] italic bg-slate-50 p-2 rounded-lg mt-1 border border-slate-200">
                            "{c.notas}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ganancia que le corresponde al barbero por este corte */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Tu utilidad ({miComision}%):
                      </span>
                      <span className="text-sm font-extrabold text-emerald-600 font-mono">
                        {formatCOP(miGananciaCita)}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MI UTILIDAD & PAGOS (SOLO FINANZAS PROPIAS) */}
      {/* ======================================================== */}
      {tab === 'balance' && balance && (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Resumen de tus Ganancias y Liquidaciones
            </h4>
            <p className="text-xs text-slate-500">
              Aquí puedes auditar exactamente cuánto has generado, cuánto te ha liquidado la administración y qué tienes pendiente por cobrar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Ganado por el Barbero */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Tu Ganancia Total
              </span>
              <span className="text-2xl font-black text-emerald-600 font-sans block">
                {formatCOP(balance.ganancia_total_barbero)}
              </span>
              <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2">
                Correspondiente al {miComision}% de tus servicios y comisiones de productos.
              </p>
            </div>

            {/* Total Ya Pagado / Liquidado */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Ya Cobrado
              </span>
              <span className="text-2xl font-black text-blue-600 font-sans block">
                {formatCOP(balance.total_ya_cobrado)}
              </span>
              <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2">
                Dinero entregado en liquidaciones anteriores.
              </p>
            </div>

            {/* Pendiente por Cobrar */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Pendiente por Liquidar
              </span>
              <span className="text-2xl font-black text-amber-600 font-sans block">
                {formatCOP(balance.pendiente_por_cobrar)}
              </span>
              <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2">
                {balance.servicios_pendientes_count} cortes listos para tu próximo pago.
              </p>
            </div>

            {/* Total Cortes Atendidos */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Cortes Completados
              </span>
              <span className="text-2xl font-black text-slate-900 font-sans block">
                {balance.total_servicios} cortes
              </span>
              <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2">
                Servicios cobrados exitosamente.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CALCULADORA PERSONAL DE RENTABILIDAD DEL BARBERO */}
      {/* ======================================================== */}
      {tab === 'calculadora' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block">
                Simulador de Metas e Ingresos
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Calcula cuánto dinero puedes ganar al mes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Con tu comisión actual del <strong className="text-blue-600">{miComision}%</strong>, cada corte promedio te deja una ganancia neta de <strong className="text-emerald-600">{formatCOP(gananciaPorCorte)}</strong> para ti.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Parámetros de Simulación */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tus Parámetros de Trabajo
                </h5>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Precio promedio del corte
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={precioCortePromedio}
                    onChange={(e) => setPrecioCortePromedio(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Cortes que planeas hacer al día
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cortesDiaSimulados}
                    onChange={(e) => setCortesDiaSimulados(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Días que trabajas en el mes
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={diasTrabajoMes}
                    onChange={(e) => setDiasTrabajoMes(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500 text-center"
                  />
                </div>
              </div>

              {/* Resultado de la Simulación */}
              <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200 p-6 rounded-2xl">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest block">
                    Tu Ganancia Proyectada al Mes
                  </span>
                  <h4 className="text-3xl sm:text-4xl font-black text-slate-900 font-sans mt-2">
                    {formatCOP(miGananciaMensualSimulada)}
                  </h4>
                  <p className="text-xs text-slate-600 mt-2">
                    Haciendo <strong className="text-blue-700">{cortesDiaSimulados} cortes diarios</strong> durante {diasTrabajoMes} días laborales (total de {totalCortesMes} cortes al mes).
                  </p>
                </div>

                {/* Calculadora Inversa: ¿Cuánto quieres ganar? */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <h6 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                        ¿Tienes una meta de dinero en mente?
                      </h6>
                      <span className="text-xs text-slate-500">
                        Escribe cuánto dinero quieres llevarte a tu casa este mes:
                      </span>
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={metaGananciaPersonal}
                      onChange={(e) => setMetaGananciaPersonal(e.target.value.replace(/[^0-9]/g, ''))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-emerald-600 font-black text-sm text-right w-36 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <p className="text-xs text-slate-700">
                    💡 Para alcanzar tu meta de <strong className="text-emerald-600">{formatCOP(numMeta)}</strong>, necesitas completar <strong className="text-slate-900">{cortesMesNecesarios} cortes al mes</strong>. Esto equivale a una meta diaria de <strong className="text-blue-700 text-sm">{cortesDiaNecesarios} cortes por día</strong>.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
