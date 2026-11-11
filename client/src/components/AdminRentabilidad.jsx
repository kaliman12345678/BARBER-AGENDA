import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Scissors, 
  Users, 
  Target, 
  Calendar, 
  Sliders, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight,
  HelpCircle,
  BarChart3,
  Flame
} from 'lucide-react';
import { formatCOP } from '../utils/helpers';

export default function AdminRentabilidad({ barberos = [] }) {
  const [cargando, setCargando] = useState(false);

  // Datos reales del mes actual desde el servidor
  const [metricasReales, setMetricasReales] = useState({
    citas_mes_actual: 0,
    ingresos_mes_actual: 0,
    costos_fijos_mensuales: 1200000,
    barberos_activos_count: 2,
    comision_promedio: 50,
    precio_promedio_corte: 25000
  });

  // Parámetros interactivos del simulador (manejados como string para permitir borrar completamente)
  const [costosFijos, setCostosFijos] = useState('1200000'); // Arriendo, servicios, etc.
  const [precioCorte, setPrecioCorte] = useState('25000');
  const [porcentajeComision, setPorcentajeComision] = useState(50);
  const [numBarberos, setNumBarberos] = useState('2');
  const [diasMes, setDiasMes] = useState('26'); // Lunes a Sábado típicamente
  const [margenProductos, setMargenProductos] = useState('150000'); // Utilidad extra por ceras/aceites

  // Meta personalizada de ganancia neta
  const [metaGananciaDeseada, setMetaGananciaDeseada] = useState('2500000');

  // Slider para simular ritmo diario actual
  const [ritmoDiarioPorBarbero, setRitmoDiarioPorBarbero] = useState(6);

  useEffect(() => {
    cargarMetricasReales();
  }, []);

  async function cargarMetricasReales() {
    setCargando(true);
    try {
      const res = await fetch('/api/reportes/rentabilidad-stats');
      const data = await res.json();
      setMetricasReales(data);

      if (data.costos_fijos_mensuales > 0) setCostosFijos(String(data.costos_fijos_mensuales));
      if (data.precio_promedio_corte > 0) setPrecioCorte(String(data.precio_promedio_corte));
      if (data.comision_promedio > 0) setPorcentajeComision(Number(data.comision_promedio));
      if (data.barberos_activos_count > 0) setNumBarberos(String(data.barberos_activos_count));
    } catch (err) {
      console.error('Error cargando stats de rentabilidad:', err);
    } finally {
      setCargando(false);
    }
  }

  // ==========================================
  // CÁLCULOS MATEMÁTICOS DE PUNTO DE EQUILIBRIO
  // ==========================================
  const numCostosFijos = Number(costosFijos) || 0;
  const numPrecioCorte = Number(precioCorte) || 0;
  const numNumBarberos = Math.max(1, Number(numBarberos) || 1);
  const numDiasMes = Math.max(1, Number(diasMes) || 1);
  const numMargenProductos = Number(margenProductos) || 0;
  const numMetaGanancia = Number(metaGananciaDeseada) || 0;

  // Margen que le queda a la barbería por cada corte realizado
  const margenPorCorte = Math.max(1, numPrecioCorte * (1 - (porcentajeComision / 100)));

  // Costos fijos netos que deben cubrir los servicios de corte (descontando ganancia de productos)
  const costosFijosACubrir = Math.max(0, numCostosFijos - numMargenProductos);

  // Cortes mensuales necesarios para no perder dinero (Punto de Equilibrio)
  const cortesEquilibrioMes = Math.ceil(costosFijosACubrir / margenPorCorte);

  // Cortes diarios totales necesarios en la barbería
  const cortesEquilibrioDiaTotal = (cortesEquilibrioMes / numDiasMes).toFixed(1);

  // Cortes diarios que debe hacer CADA barbero para estar en equilibrio
  const cortesEquilibrioDiaPorBarbero = (cortesEquilibrioMes / (numDiasMes * numNumBarberos)).toFixed(1);

  // Facturación bruta mínima mensual para equilibrio
  const facturacionBrutaEquilibrio = cortesEquilibrioMes * numPrecioCorte;

  // ==========================================
  // TERMÓMETRO ACTUAL: ¿DÓNDE ESTÁ HOY LA BARBERÍA?
  // ==========================================
  const cortesActuales = metricasReales.citas_mes_actual || 0;
  const porcentajeEquilibrioAlcanzado = Math.min(100, Math.round((cortesActuales / Math.max(1, cortesEquilibrioMes)) * 100));
  const cortesFaltantesParaEquilibrio = Math.max(0, cortesEquilibrioMes - cortesActuales);
  const margenFaltanteCOP = cortesFaltantesParaEquilibrio * margenPorCorte;

  // Ganancia neta real actual del mes según cortes realizados
  const gananciaNetaActualMes = (cortesActuales * margenPorCorte) + numMargenProductos - numCostosFijos;

  // ==========================================
  // SIMULACIÓN DE ESCENARIOS (PESIMISTA, EQUILIBRIO, RENTABLE)
  // ==========================================
  function getSemaforoInfo(resultadoNeto, margenNetoPct) {
    if (resultadoNeto < -50000) {
      return {
        nivel: 'rojo',
        label: '🔴 Zona Roja: Déficit Crítico',
        sublabel: 'Pérdida mensual por falta de volumen',
        badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        cardBorder: 'border-rose-500/50',
        textColor: 'text-rose-400',
        diagnostico: 'No alcanza a cubrir arriendo ni costos operativos. Requiere promociones activas o mayor volumen de clientes.'
      };
    } else if (resultadoNeto <= 100000) {
      return {
        nivel: 'amarillo',
        label: '🟡 Zona Amarilla: Punto de Equilibrio',
        sublabel: 'Gastos 100% cubiertos (Punto Cero)',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        cardBorder: 'border-amber-500/50',
        textColor: 'text-amber-400',
        diagnostico: 'Todos los gastos del local están saldados. Cada cliente extra a partir de aquí es ganancia neta pura para el dueño.'
      };
    } else if (numMetaGanancia > 0 && resultadoNeto >= numMetaGanancia) {
      return {
        nivel: 'azul',
        label: '💎 Zona Excelente: Meta Alcanzada',
        sublabel: 'Superávit superior a tu meta deseada',
        badge: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
        cardBorder: 'border-sky-500/50',
        textColor: 'text-sky-400',
        diagnostico: '¡Objetivo superado! Negocio con alto flujo de caja positivo y excelente margen neto para reinvertir o retirar.'
      };
    } else {
      return {
        nivel: 'verde',
        label: '🟢 Zona Verde: Rentable',
        sublabel: `Margen neto libre: ${margenNetoPct}%`,
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        cardBorder: 'border-emerald-500/50',
        textColor: 'text-emerald-400',
        diagnostico: 'Negocio en rentabilidad positiva. Flujo de caja favorable y ganancias estables para el dueño.'
      };
    }
  }

  function calcularEscenarioPorCortes(cortesMesTotal) {
    const cortesMes = Math.max(0, Math.round(cortesMesTotal));
    const cortesDiaPorBarbero = (cortesMes / (numDiasMes * numNumBarberos)).toFixed(1);
    const facturacion = cortesMes * numPrecioCorte;
    const comisiones = Math.round(facturacion * (porcentajeComision / 100));
    const margenServicios = facturacion - comisiones;
    const resultadoNeto = Math.round(margenServicios + numMargenProductos - numCostosFijos);
    const margenNetoPct = facturacion > 0 ? Math.round((resultadoNeto / facturacion) * 100) : 0;

    return {
      cortesDiaPorBarbero,
      cortesMes,
      facturacion,
      comisiones,
      costosFijos: numCostosFijos,
      resultadoNeto,
      margenNetoPct,
      semaforo: getSemaforoInfo(resultadoNeto, margenNetoPct)
    };
  }

  function calcularEscenario(cortesDiaPorBarbero) {
    const cortesMes = Math.round(cortesDiaPorBarbero * numNumBarberos * numDiasMes);
    return calcularEscenarioPorCortes(cortesMes);
  }

  // Escenario interactivo según el slider
  const escenarioSimulado = calcularEscenario(ritmoDiarioPorBarbero);

  // Escenario 1: Pesimista (65% de cortes de equilibrio -> Déficit real)
  const cortesPesimistaMes = Math.max(1, Math.round(cortesEquilibrioMes * 0.65));
  const escenarioPesimista = calcularEscenarioPorCortes(cortesPesimistaMes);

  // Escenario 2: Equilibrio Matemático Exacto (100% de cortes)
  const escenarioEquilibrio = calcularEscenarioPorCortes(cortesEquilibrioMes);

  // Escenario 3: Rentable / Superávit (140% de cortes)
  const cortesRentableMes = Math.max(cortesEquilibrioMes + 1, Math.round(cortesEquilibrioMes * 1.4));
  const escenarioRentable = calcularEscenarioPorCortes(cortesRentableMes);

  // Semáforo del mes actual real
  const semaforoMesActual = getSemaforoInfo(gananciaNetaActualMes, 0);

  // ==========================================
  // CALCULADORA INVERSA (META DE GANANCIA)
  // ==========================================
  // Para ganar X libre: Margen total necesario = Costos fijos + Meta - Margen productos
  const margenTotalNecesarioParaMeta = Math.max(0, numCostosFijos + numMetaGanancia - numMargenProductos);
  const cortesNecesariosParaMeta = Math.ceil(margenTotalNecesarioParaMeta / margenPorCorte);
  const cortesDiaPorBarberoParaMeta = (cortesNecesariosParaMeta / (numDiasMes * numNumBarberos)).toFixed(1);
  const facturacionMeta = cortesNecesariosParaMeta * numPrecioCorte;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Encabezado */}
      <div className="border-b border-slate-800 pb-5">
        <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          Calculadora de Rentabilidad & Proyección Financiera
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Descubre tu Punto de Equilibrio exacto, en qué estado se encuentra la barbería hoy, qué debes sumar para no perder dinero y simula escenarios de ganancia o pérdida.
        </p>
      </div>

      {/* ======================================================== */}
      {/* 1. TERMÓMETRO REAL DEL MES ACTUAL */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              1. Estado Real de Este Mes (Termómetro de Supervivencia)
            </span>
            <h4 className="text-2xl font-bold text-white font-serif mt-1">
              {cortesActuales} cortes realizados <span className="text-slate-400 text-sm font-sans font-normal">de {cortesEquilibrioMes} necesarios para equilibrio</span>
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${semaforoMesActual.badge}`}>
              {semaforoMesActual.label}
            </span>
          </div>
        </div>

        {/* Barra de Progreso hacia el Punto de Equilibrio */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Progreso para cubrir todos los costos:</span>
            <span className={cortesActuales >= cortesEquilibrioMes ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {porcentajeEquilibrioAlcanzado}% del Punto de Equilibrio
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                cortesActuales >= cortesEquilibrioMes
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(4, porcentajeEquilibrioAlcanzado))}%` }}
            ></div>
          </div>
        </div>

        {/* Diagnóstico en Texto Claro */}
        <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
          cortesActuales >= cortesEquilibrioMes
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {cortesActuales >= cortesEquilibrioMes ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold mb-0.5">¡Punto de equilibrio superado!</strong>
                <span>
                  Todos los costos operativos fijos del mes ({formatCOP(costosFijos)}) ya están cubiertos. 
                  Llevas una ganancia neta estimada de <strong className="text-white underline">{formatCOP(gananciaNetaActualMes)}</strong>. A partir de aquí, cada nuevo corte deja un margen limpio de <strong>{formatCOP(margenPorCorte)}</strong> a la barbería.
                </span>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold mb-0.5">Aún no se cubren los costos fijos del mes</strong>
                <span>
                  Faltan exactamente <strong className="text-white underline">{cortesFaltantesParaEquilibrio} cortes</strong> (equivalentes a <strong className="text-white">{formatCOP(margenFaltanteCOP)}</strong> de margen) para llegar al punto de equilibrio y no perder dinero este mes.
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PARÁMETROS DEL NEGOCIO & CÁLCULO DE EQUILIBRIO */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Parámetros Editables */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              Parámetros del Local
            </h4>
            <span className="text-[10px] text-slate-500">Editables</span>
          </div>

          {/* Costos Fijos Mensuales */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
              Costos Fijos del Mes (Arriendo, Luz, Agua)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={costosFijos}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setCostosFijos(val);
                }}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">COP</span>
            </div>
          </div>

          {/* Precio Promedio por Servicio */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
              Precio Promedio por Corte
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={precioCorte}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPrecioCorte(val);
                }}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">COP</span>
            </div>
          </div>

          {/* % Promedio Pagado al Barbero */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">
                % Promedio al Barbero
              </label>
              <span className="text-xs font-black text-amber-400">{porcentajeComision}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="70"
              step="5"
              value={porcentajeComision}
              onChange={(e) => setPorcentajeComision(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Barbero: {porcentajeComision}%</span>
              <span>Barbería: {100 - porcentajeComision}%</span>
            </div>
          </div>

          {/* Barberos Activos y Días Laborales */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Barberos Activos
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={numBarberos}
                onChange={(e) => setNumBarberos(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Días de Trabajo/Mes
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={diasMes}
                onChange={(e) => setDiasMes(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="26"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm text-center"
              />
            </div>
          </div>

          {/* Ganancia por productos */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
              Ganancia mensual por Productos (Ceras/Tienda)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={margenProductos}
                onChange={(e) => setMargenProductos(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">COP</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjetas del Punto de Equilibrio Matemático */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              Fórmula de Supervivencia: Punto de Equilibrio
            </span>
            <h4 className="text-xl font-bold text-white font-serif">
              ¿Cuánto debe sumar la barbería para no perder dinero?
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Con un margen de <strong className="text-white">{formatCOP(margenPorCorte)}</strong> por corte ({100 - porcentajeComision}% para la barbería):
            </p>

            {/* 3 Métricas Clave de Equilibrio */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Cortes Mínimos al Mes
                </span>
                <span className="text-3xl font-black text-amber-400 font-serif block mt-1">
                  {cortesEquilibrioMes}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Facturación: {formatCOP(facturacionBrutaEquilibrio)}
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Cortes Totales por Día
                </span>
                <span className="text-3xl font-black text-white font-serif block mt-1">
                  {cortesEquilibrioDiaTotal}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Entre todo el equipo ({diasMes} días)
                </span>
              </div>

              <div className="bg-slate-950/80 border border-amber-500/40 p-4 rounded-2xl bg-amber-500/5">
                <span className="text-[10px] font-bold text-amber-300 uppercase block">
                  Meta Diaria por Barbero
                </span>
                <span className="text-3xl font-black text-amber-400 font-serif block mt-1">
                  {cortesEquilibrioDiaPorBarbero}
                </span>
                <span className="text-[10px] text-amber-300/80 mt-1 block">
                  Cortes/día que debe hacer c/u
                </span>
              </div>

            </div>
          </div>

          {/* Calculadora Inversa: ¿Cuánto quieres ganar? */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <h5 className="font-bold text-white text-sm font-serif flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Meta de Ganancia Libre para el Dueño
                </h5>
                <span className="text-xs text-slate-400">
                  ¿Cuánto dinero limpio deseas llevarte a tu bolsillo al mes?
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={metaGananciaDeseada}
                  onChange={(e) => setMetaGananciaDeseada(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-emerald-400 font-black text-sm text-right w-40 focus:outline-none focus:border-emerald-400"
                />
                <span className="text-xs text-slate-400 font-bold">COP</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">
                  Plan de Acción para lograr {formatCOP(metaGananciaDeseada)} netos:
                </span>
                <span>
                  Tu equipo de <strong className="text-amber-400">{numBarberos} barberos</strong> debe atender un total de <strong className="text-white">{cortesNecesariosParaMeta} cortes al mes</strong>. 
                  Esto significa que cada barbero debe realizar un promedio de <strong className="text-emerald-400 text-sm">{cortesDiaPorBarberoParaMeta} cortes diarios</strong> para alcanzar tu meta después de pagar todos los gastos y comisiones.
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. MATRIZ DE ESCENARIOS: ¿EN QUÉ ESCENARIO GANO O PIERDO? */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            3. Matriz de Escenarios Interactivos: ¿Gano o Pierdo Dinero?
          </h4>
          <p className="text-xs text-slate-400">
            Compara los resultados financieros según el ritmo de clientes atendidos al día por cada barbero.
          </p>
        </div>

        {/* 3 Escenarios Predefinidos en Tarjetas con Semáforo Dinámico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* ESCENARIO 1: PESIMISTA (DÉFICIT / PÉRDIDAS) */}
          <div className={`bg-slate-900 border ${escenarioPesimista.semaforo.cardBorder} rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between transition-all`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full ${escenarioPesimista.semaforo.badge} text-[10px] font-black uppercase tracking-wider border`}>
                  {escenarioPesimista.semaforo.label}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {escenarioPesimista.cortesDiaPorBarbero} cortes/día c/u
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Resultado Neto para el Dueño:</span>
                <span className={`text-2xl font-black font-serif ${escenarioPesimista.semaforo.textColor}`}>
                  {escenarioPesimista.resultadoNeto > 0 ? '+' : ''}{formatCOP(escenarioPesimista.resultadoNeto)}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                  {escenarioPesimista.semaforo.sublabel}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Cortes del mes:</span>
                  <span className="text-slate-200 font-bold">{escenarioPesimista.cortesMes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Facturado bruto:</span>
                  <span className="text-slate-200 font-bold">{formatCOP(escenarioPesimista.facturacion)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisiones barberos ({porcentajeComision}%):</span>
                  <span className="text-slate-200">{formatCOP(escenarioPesimista.comisiones)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costos fijos local:</span>
                  <span className="text-slate-200">{formatCOP(escenarioPesimista.costosFijos)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              💡 <em>Diagnóstico:</em> {escenarioPesimista.semaforo.diagnostico}
            </div>
          </div>

          {/* ESCENARIO 2: EQUILIBRIO (GASTOS CUBIERTOS) */}
          <div className={`bg-slate-900 border ${escenarioEquilibrio.semaforo.cardBorder} rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between transition-all`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full ${escenarioEquilibrio.semaforo.badge} text-[10px] font-black uppercase tracking-wider border`}>
                  {escenarioEquilibrio.semaforo.label}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {escenarioEquilibrio.cortesDiaPorBarbero} cortes/día c/u
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Resultado Neto para el Dueño:</span>
                <span className={`text-2xl font-black font-serif ${escenarioEquilibrio.semaforo.textColor}`}>
                  {escenarioEquilibrio.resultadoNeto > 0 ? '+' : ''}{formatCOP(escenarioEquilibrio.resultadoNeto)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {escenarioEquilibrio.semaforo.sublabel}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Cortes del mes:</span>
                  <span className="text-slate-200 font-bold">{escenarioEquilibrio.cortesMes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Facturado bruto:</span>
                  <span className="text-slate-200 font-bold">{formatCOP(escenarioEquilibrio.facturacion)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisiones barberos ({porcentajeComision}%):</span>
                  <span className="text-slate-200">{formatCOP(escenarioEquilibrio.comisiones)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costos fijos local:</span>
                  <span className="text-slate-200">{formatCOP(escenarioEquilibrio.costosFijos)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              ⚖️ <em>Diagnóstico:</em> {escenarioEquilibrio.semaforo.diagnostico}
            </div>
          </div>

          {/* ESCENARIO 3: RENTABLE / META (SUPERÁVIT) */}
          <div className={`bg-slate-900 border ${escenarioRentable.semaforo.cardBorder} rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between transition-all`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full ${escenarioRentable.semaforo.badge} text-[10px] font-black uppercase tracking-wider border`}>
                  {escenarioRentable.semaforo.label}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {escenarioRentable.cortesDiaPorBarbero} cortes/día c/u
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Resultado Neto para el Dueño:</span>
                <span className={`text-2xl font-black font-serif ${escenarioRentable.semaforo.textColor}`}>
                  +{formatCOP(escenarioRentable.resultadoNeto)}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                  {escenarioRentable.semaforo.sublabel}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Cortes del mes:</span>
                  <span className="text-slate-200 font-bold">{escenarioRentable.cortesMes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Facturado bruto:</span>
                  <span className="text-slate-200 font-bold">{formatCOP(escenarioRentable.facturacion)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisiones barberos ({porcentajeComision}%):</span>
                  <span className="text-slate-200">{formatCOP(escenarioRentable.comisiones)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costos fijos local:</span>
                  <span className="text-slate-200">{formatCOP(escenarioRentable.costosFijos)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              🚀 <em>Diagnóstico:</em> {escenarioRentable.semaforo.diagnostico}
            </div>
          </div>

        </div>

        {/* Simulador Manual con Slider Libre y Semáforo en Tiempo Real */}
        <div className={`bg-slate-900 border ${escenarioSimulado.semaforo.cardBorder} rounded-3xl p-6 shadow-xl mt-6 transition-all`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-bold text-white text-sm font-serif flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Simulador Dinámico Personalizado
                </h5>
                <span className={`px-2.5 py-0.5 rounded-full ${escenarioSimulado.semaforo.badge} text-[10px] font-black uppercase tracking-wider border`}>
                  {escenarioSimulado.semaforo.label}
                </span>
              </div>
              <span className="text-xs text-slate-400 block mt-0.5">
                Mueve el control para ver en tiempo real cómo cambia el semáforo y la utilidad:
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">Ritmo elegido:</span>
              <span className="text-lg font-black text-amber-400 font-serif">
                {ritmoDiarioPorBarbero} cortes / día
              </span>
              <span className="text-[10px] text-slate-500">por barbero</span>
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={ritmoDiarioPorBarbero}
            onChange={(e) => setRitmoDiarioPorBarbero(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg mb-4"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Total cortes al mes:</span>
              <span className="text-lg font-black text-white">{escenarioSimulado.cortesMes} turnos</span>
            </div>
            <div>
              <span className="text-slate-500 block">Facturación bruta:</span>
              <span className="text-lg font-black text-slate-200">{formatCOP(escenarioSimulado.facturacion)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Comisiones del equipo:</span>
              <span className="text-lg font-black text-amber-400">{formatCOP(escenarioSimulado.comisiones)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Ganancia Neta Dueño:</span>
              <span className={`text-xl font-black font-serif ${escenarioSimulado.semaforo.textColor}`}>
                {escenarioSimulado.resultadoNeto >= 0 ? '+' : ''}{formatCOP(escenarioSimulado.resultadoNeto)}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
