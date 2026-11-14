import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Percent, 
  Calendar, 
  User, 
  FileText, 
  Printer, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  History, 
  Scissors,
  ArrowRight,
  TrendingUp,
  Receipt,
  HandCoins,
  ShoppingBag,
  Wallet,
  Wrench,
  CheckSquare,
  Square
} from 'lucide-react';
import { formatCOP, formatDateReadable, formatTime12, getTodayStr } from '../utils/helpers';
import AdminPrestamosColaboradores from './AdminPrestamosColaboradores';

export default function AdminLiquidaciones({ barberos, shopConfig }) {
  // Pestañas internas: 'calcular' o 'historial'
  const [tab, setTab] = useState('calcular');

  // Filtros de cálculo
  const [barberoId, setBarberoId] = useState(barberos[0]?.id || '');
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(getTodayStr());

  // Estado del cálculo
  const [calculando, setCalculando] = useState(false);
  const [resultadoPreview, setResultadoPreview] = useState(null);
  const [errorPreview, setErrorPreview] = useState('');

  // Ajustes de liquidación
  const [porcentaje, setPorcentaje] = useState(50);
  const [deduccionesManuales, setDeduccionesManuales] = useState(0);
  const [deduccionesPrestamos, setDeduccionesPrestamos] = useState({});
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notasLiquidacion, setNotasLiquidacion] = useState('');

  // Estado de guardado
  const [guardando, setGuardando] = useState(false);
  const [comprobanteGenerado, setComprobanteGenerado] = useState(null);

  // Historial
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [detalleHistorial, setDetalleHistorial] = useState(null);

  // Actualizar barbero seleccionado si cambian los barberos
  useEffect(() => {
    if (barberos.length > 0 && !barberoId) {
      setBarberoId(barberos[0].id);
      setPorcentaje(barberos[0].porcentaje_comision || 50);
    }
  }, [barberos]);

  // Cuando cambia el barbero seleccionado en el combo, actualizar el % por defecto de ese barbero
  function handleCambioBarbero(id) {
    setBarberoId(id);
    const b = barberos.find(item => String(item.id) === String(id));
    if (b) {
      setPorcentaje(b.porcentaje_comision || 50);
    }
    setResultadoPreview(null);
    setDeduccionesPrestamos({});
    setDeduccionesManuales(0);
    setComprobanteGenerado(null);
    setMensajePorcentajeFijo('');
  }

  const barberoSeleccionado = barberos.find(b => String(b.id) === String(barberoId));
  const [guardandoPorcentajeFijo, setGuardandoPorcentajeFijo] = useState(false);
  const [mensajePorcentajeFijo, setMensajePorcentajeFijo] = useState('');

  async function guardarPorcentajePorDefecto() {
    if (!barberoId || !porcentaje) return;
    setGuardandoPorcentajeFijo(true);
    setMensajePorcentajeFijo('');
    try {
      const res = await fetch(`/api/barberos/${barberoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ porcentaje_comision: Number(porcentaje) })
      });
      if (res.ok) {
        setMensajePorcentajeFijo(`✓ Guardado: ${porcentaje}% es ahora el porcentaje individual fijo.`);
        if (barberoSeleccionado) barberoSeleccionado.porcentaje_comision = Number(porcentaje);
        setTimeout(() => setMensajePorcentajeFijo(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGuardandoPorcentajeFijo(false);
    }
  }

  // Preajustes de rango de fechas
  function aplicarRango(tipo) {
    const hoy = new Date();
    const hoyStr = getTodayStr();

    if (tipo === 'hoy') {
      setFechaInicio(hoyStr);
      setFechaFin(hoyStr);
    } else if (tipo === 'semana') {
      const d = new Date(hoy);
      const diaSem = d.getDay(); // 0 Dom, 1 Lun
      const diff = d.getDate() - diaSem + (diaSem === 0 ? -6 : 1); // Lunes
      const lunes = new Date(d.setDate(diff));
      const domingo = new Date(d.setDate(diff + 6));
      setFechaInicio(lunes.toISOString().split('T')[0]);
      setFechaFin(domingo.toISOString().split('T')[0]);
    } else if (tipo === 'mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
      setFechaInicio(primerDia);
      setFechaFin(ultimoDia);
    } else if (tipo === 'todas') {
      setFechaInicio('2020-01-01');
      setFechaFin('2099-12-31');
    }
  }

  // Calcular citas pendientes de liquidación
  async function handleCalcular() {
    if (!barberoId) {
      setErrorPreview('Por favor selecciona un barbero');
      return;
    }

    setCalculando(true);
    setErrorPreview('');
    setResultadoPreview(null);
    setComprobanteGenerado(null);

    const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';

    try {
      const esTodas = (fechaInicio === '2020-01-01' && fechaFin === '2099-12-31') ? '&todas=1' : '';
      const res = await fetch(`/api/liquidaciones/preview?barbero_id=${barberoId}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&porcentaje=${porcentaje}&b=${encodeURIComponent(slug)}${esTodas}`, {
        headers: { 'x-barberia-slug': slug }
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorPreview(data.error || 'Error al calcular liquidación');
        return;
      }

      setResultadoPreview(data);
      if (data.porcentaje_aplicado !== undefined) {
        setPorcentaje(data.porcentaje_aplicado);
      }

      // Inicializar deducciones automáticas para préstamos y adelantos activos
      const prestamosMap = {};
      if (Array.isArray(data.prestamos_activos)) {
        data.prestamos_activos.forEach(p => {
          const cuotaSugerida = Math.min(Number(p.valor_cuota || 0), Number(p.saldo_pendiente || 0));
          prestamosMap[p.id] = {
            seleccionado: true,
            monto: cuotaSugerida,
            prestamo: p
          };
        });
      }
      setDeduccionesPrestamos(prestamosMap);
      setDeduccionesManuales(0);
    } catch (err) {
      setErrorPreview('Error al conectar con el servidor');
    } finally {
      setCalculando(false);
    }
  }

  // Cálculos dinámicos con porcentaje o deducciones ajustadas
  const subtotalBruto = resultadoPreview?.total_bruto || 0;
  const totalPropinas = resultadoPreview?.total_propinas || 0;
  const comisionServicios = Math.round(subtotalBruto * (Number(porcentaje) / 100));
  const comisionProductos = resultadoPreview?.total_comision_productos || 0;
  // Propinas son 100% del colaborador (sin retención del local)
  const comisionCalculada = comisionServicios + comisionProductos + totalPropinas;

  // Deducciones totales: Préstamos amortizados seleccionados + Otras deducciones
  const totalDeduccionesPrestamos = Object.values(deduccionesPrestamos).reduce(
    (sum, item) => item.seleccionado ? sum + Number(item.monto || 0) : sum,
    0
  );
  const totalDeducciones = totalDeduccionesPrestamos + Number(deduccionesManuales || 0);
  const totalNetoAPagar = Math.max(0, comisionCalculada - totalDeducciones);
  const margenBarberia = resultadoPreview?.margen_barberia !== undefined 
    ? resultadoPreview.margen_barberia 
    : (subtotalBruto - comisionServicios);

  // Registrar y Guardar Liquidación
  async function handleGuardarLiquidacion() {
    const citasIds = resultadoPreview?.citas?.map(c => c.id) || [];
    const ventasIds = resultadoPreview?.ventas_productos?.map(v => v.id) || [];

    if (citasIds.length === 0 && ventasIds.length === 0) return;

    setGuardando(true);
    const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';

    const prestamosAmortizados = Object.entries(deduccionesPrestamos)
      .filter(([_, item]) => item.seleccionado && Number(item.monto) > 0)
      .map(([id, item]) => ({
        prestamo_id: id,
        monto: Number(item.monto),
        tipo: item.prestamo?.tipo,
        descripcion: item.prestamo?.descripcion,
        saldo_restante_estimado: Math.max(0, Number(item.prestamo?.saldo_pendiente || 0) - Number(item.monto))
      }));

    try {
      const res = await fetch(`/api/liquidaciones?b=${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-barberia-slug': slug
        },
        body: JSON.stringify({
          barbero_id: barberoId,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          porcentaje_aplicado: Number(porcentaje),
          deducciones: totalDeducciones,
          metodo_pago: metodoPago,
          notas: notasLiquidacion,
          citas_ids: citasIds,
          ventas_ids: ventasIds,
          prestamos_amortizados: prestamosAmortizados
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al guardar la liquidación');
        return;
      }

      // Preparar el comprobante final
      setComprobanteGenerado({
        id: data.id,
        barbero: resultadoPreview.barbero,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        total_servicios: resultadoPreview.citas.length,
        total_bruto: subtotalBruto,
        total_propinas: totalPropinas,
        porcentaje: Number(porcentaje),
        monto_comision: comisionCalculada,
        comision_servicios: comisionServicios,
        comision_productos: comisionProductos,
        deducciones: totalDeducciones,
        deducciones_prestamos: prestamosAmortizados,
        deducciones_manuales: Number(deduccionesManuales || 0),
        total_pagado: totalNetoAPagar,
        margen_barberia: margenBarberia,
        metodo_pago: metodoPago,
        citas: resultadoPreview.citas,
        ventas_productos: resultadoPreview.ventas_productos || [],
        fecha_emision: new Date().toLocaleString('es-CO')
      });

      setResultadoPreview(null);
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setGuardando(false);
    }
  }

  // Cargar historial
  async function cargarHistorial() {
    setCargandoHistorial(true);
    const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';
    try {
      const res = await fetch(`/api/liquidaciones?b=${encodeURIComponent(slug)}`, {
        headers: { 'x-barberia-slug': slug }
      });
      const data = await res.json();
      setHistorial(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoHistorial(false);
    }
  }

  // Ver detalle histórico
  async function verDetalleHistorial(id) {
    const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';
    try {
      const res = await fetch(`/api/liquidaciones/${id}?b=${encodeURIComponent(slug)}`, {
        headers: { 'x-barberia-slug': slug }
      });
      const data = await res.json();
      setDetalleHistorial(data);
    } catch (err) {
      console.error(err);
    }
  }

  // Compartir por WhatsApp
  function compartirWhatsApp(comprobante) {
    const telefono = (comprobante.barbero?.telefono || comprobante.barbero_telefono || '').replace(/[^0-9]/g, '');
    const propinasMsg = Number(comprobante.total_propinas || 0) > 0 
      ? `🎁 Propinas Clientes (100%): ${formatCOP(comprobante.total_propinas)}\n`
      : '';
    
    const prestamosList = comprobante.deducciones_prestamos || comprobante.abonos_prestamos || [];
    let prestamosMsg = '';
    if (prestamosList.length > 0) {
      prestamosMsg = `\n📋 *Detalle Deducción de Préstamos / Adelantos:*\n` + prestamosList.map(p => {
        const desc = p.descripcion ? ` (${p.descripcion})` : '';
        const abono = formatCOP(p.monto || p.monto_abonado || 0);
        const saldo = p.saldo_restante !== undefined 
          ? ` [Saldo Rest: ${formatCOP(p.saldo_restante)}]` 
          : (p.saldo_restante_estimado !== undefined ? ` [Saldo Rest: ${formatCOP(p.saldo_restante_estimado)}]` : '');
        return ` • ${p.tipo ? p.tipo.toUpperCase() : 'CUOTA'}${desc}: -${abono}${saldo}`;
      }).join('\n') + `\n`;
    }

    const mensaje = encodeURIComponent(
      `💈 *COMPROBANTE DE PAGO Y LIQUIDACIÓN*\n` +
      `Barbería: *${shopConfig?.nombre_barberia || 'The Barber Club'}*\n` +
      `Barbero: *${comprobante.barbero?.nombre || comprobante.barbero_nombre}*\n` +
      `Período: ${comprobante.fecha_inicio} al ${comprobante.fecha_fin}\n\n` +
      `✂️ Servicios Realizados: ${comprobante.total_servicios}\n` +
      `💰 Total Facturado: ${formatCOP(comprobante.total_bruto)}\n` +
      `📊 Comisión Servicios (${comprobante.porcentaje || comprobante.porcentaje_aplicado}%): ${formatCOP(comprobante.comision_servicios || Math.round((comprobante.total_bruto || 0) * ((comprobante.porcentaje || comprobante.porcentaje_aplicado || 50) / 100)))}\n` +
      propinasMsg +
      `📉 Deducciones/Adelantos: -${formatCOP(comprobante.deducciones)}\n` +
      prestamosMsg +
      `\n💵 *TOTAL NETO PAGADO: ${formatCOP(comprobante.total_pagado)}*\n` +
      `Método: ${comprobante.metodo_pago}\n\n` +
      `¡Gracias por tu excelente trabajo!`
    );
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  }

  return (
    <div className="space-y-6">
      
      {/* Selector de pestañas */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-400" />
            Plantilla de Pagos por Porcentaje a Barberos
          </h3>
          <p className="text-xs text-slate-400">
            Calcula automáticamente las comisiones generadas por los turnos completados y gestiona préstamos y deducciones.
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setTab('calcular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'calcular' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Nueva Liquidación
          </button>
          <button
            onClick={() => setTab('prestamos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'prestamos' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Adelantos & Préstamos</span>
          </button>
          <button
            onClick={() => {
              setTab('historial');
              cargarHistorial();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'historial' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de Pagos</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA: CALCULAR Y LIQUIDAR */}
      {/* ========================================================= */}
      {tab === 'calcular' && !comprobanteGenerado && (
        <div className="space-y-6">
          
          {/* Panel de Filtros para Cálculo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Barbero */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                  Seleccionar Barbero *
                </label>
                <select
                  value={barberoId}
                  onChange={(e) => handleCambioBarbero(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  {barberos.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} (Base: {b.porcentaje_comision}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha Inicio */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                  Fecha Inicio *
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                  Fecha Fin *
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Porcentaje Libre Escrito por el Dueño */}
              <div>
                <label className="block text-xs font-semibold text-amber-400 uppercase mb-1.5 flex items-center justify-between">
                  <span>% Porcentaje a Pagar *</span>
                  <span className="text-[10px] text-slate-500 font-normal">Escribe el %</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                    placeholder="Ej. 50"
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-amber-400 font-black text-base focus:outline-none focus:border-amber-400 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-sm">%</span>
                </div>

                {/* Botón para guardar como porcentaje fijo de este barbero */}
                {barberoSeleccionado && Number(porcentaje) !== barberoSeleccionado.porcentaje_comision && (
                  <button
                    type="button"
                    onClick={guardarPorcentajePorDefecto}
                    disabled={guardandoPorcentajeFijo}
                    className="mt-1.5 text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>💾 Guardar {porcentaje}% como comisión fija de {barberoSeleccionado.nombre}</span>
                  </button>
                )}
                {mensajePorcentajeFijo && (
                  <p className="mt-1 text-[10px] text-emerald-400 font-medium">
                    {mensajePorcentajeFijo}
                  </p>
                )}
              </div>

            </div>

            {/* Accesos rápidos de rango */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Períodos rápidos:</span>
                <button
                  type="button"
                  onClick={() => aplicarRango('hoy')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => aplicarRango('semana')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Esta Semana
                </button>
                <button
                  type="button"
                  onClick={() => aplicarRango('mes')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Este Mes
                </button>
                <button
                  type="button"
                  onClick={() => aplicarRango('todas')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-xs"
                  title="Cargar todas las citas completadas pendientes de liquidar sin importar la fecha"
                >
                  ⚡ Citas sin Liquidar
                </button>
              </div>

              <button
                onClick={handleCalcular}
                disabled={calculando}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CalculatorIcon className="w-4 h-4" />
                <span>{calculando ? 'Calculando...' : 'Auditar y Calcular Comisión'}</span>
              </button>
            </div>
          </div>

          {errorPreview && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorPreview}</span>
            </div>
          )}

          {/* VISTA PREVIA DEL DESGLOSE Y PLANTILLA */}
          {resultadoPreview && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Tarjetas de Métricas de la Liquidación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Servicios Atendidos
                  </span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {resultadoPreview.total_servicios} cortes
                  </span>
                  <span className="text-[11px] text-slate-500">Citas sin liquidar</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Facturado Bruto
                  </span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {formatCOP(subtotalBruto)}
                  </span>
                  <span className="text-[11px] text-slate-500">Recaudado en el local</span>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block flex items-center justify-between">
                    <span>Propinas</span>
                    <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-300">100% Barbero</span>
                  </span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {formatCOP(totalPropinas)}
                  </span>
                  <span className="text-[11px] text-emerald-300/70">Sin retención del local</span>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                    Comisión Total ({porcentaje}%)
                  </span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">
                    {formatCOP(comisionCalculada)}
                  </span>
                  <span className="text-[11px] text-amber-300/70">Servicios + Propinas</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                    Margen Barbería
                  </span>
                  <span className="text-2xl font-black text-sky-400 mt-1 block">
                    {formatCOP(margenBarberia)}
                  </span>
                  <span className="text-[11px] text-slate-500">Retención del negocio</span>
                </div>
              </div>

              {/* Si no hay citas completadas */}
              {resultadoPreview.total_servicios === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-amber-400 mb-2" />
                  <p className="font-bold text-white text-base">No hay turnos completados pendientes de pago</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Este barbero no tiene citas marcadas como "Completada" en este rango de fechas, o ya fueron liquidadas con anterioridad.
                  </p>
                </div>
              ) : (
                <>
                  {/* TABLA DETALLADA DE CADA CORTE / SERVICIO */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-amber-400" />
                      Desglose de Servicios Realizados
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Fecha / Hora</th>
                            <th className="py-2.5 px-3 font-semibold">Cliente</th>
                            <th className="py-2.5 px-3 font-semibold">Servicio</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Valor Servicio</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Propina (100%)</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Comisión Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {resultadoPreview.citas.map((cita) => {
                            const comisionCorte = Math.round((cita.precio_cobrado || 0) * (Number(porcentaje) / 100));
                            const propinaCita = Number(cita.propina || 0);
                            const totalBarberoCita = comisionCorte + propinaCita;
                            return (
                              <tr key={cita.id} className="hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                                  {cita.fecha} • {formatTime12(cita.hora_inicio)}
                                </td>
                                <td className="py-2.5 px-3 text-white font-medium">
                                  {cita.cliente_nombre}
                                </td>
                                <td className="py-2.5 px-3 text-slate-300">
                                  {cita.servicio_nombre}
                                </td>
                                <td className="py-2.5 px-3 text-right text-white font-semibold whitespace-nowrap">
                                  {formatCOP(cita.precio_cobrado)}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  {propinaCita > 0 ? (
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                      +{formatCOP(propinaCita)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 font-mono">$0</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right text-amber-400 font-bold whitespace-nowrap">
                                  {formatCOP(totalBarberoCita)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* FORMULARIO DE AJUSTE Y CIERRE DE PAGO */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
                    <h4 className="text-base font-bold text-white font-serif mb-4 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-amber-400" />
                      Plantilla de Liquidación Final
                    </h4>

                    {/* SECCIÓN DE DEDUCCIÓN DE ADELANTOS / PRÉSTAMOS ACTIVOS */}
                    {resultadoPreview?.prestamos_activos && resultadoPreview.prestamos_activos.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-amber-500/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <HandCoins className="w-5 h-5 text-amber-400" />
                            <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                              Cuotas de Adelantos / Préstamos Activos
                            </h5>
                          </div>
                          <span className="text-[11px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {resultadoPreview.prestamos_activos.length} crédito{resultadoPreview.prestamos_activos.length > 1 ? 's' : ''} pendiente{resultadoPreview.prestamos_activos.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">
                          Selecciona las cuotas que se amortizarán automáticamente en esta liquidación. Puedes ajustar el valor de la cuota según lo acordado con el colaborador.
                        </p>

                        <div className="space-y-2.5">
                          {resultadoPreview.prestamos_activos.map((prestamo) => {
                            const itemState = deduccionesPrestamos[prestamo.id] || { seleccionado: false, monto: 0 };
                            const cuotaSugerida = Math.min(Number(prestamo.valor_cuota || 0), Number(prestamo.saldo_pendiente || 0));
                            return (
                              <div 
                                key={prestamo.id} 
                                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                  itemState.seleccionado 
                                    ? 'bg-amber-500/10 border-amber-500/40' 
                                    : 'bg-slate-900/60 border-slate-800 opacity-60'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeduccionesPrestamos(prev => ({
                                        ...prev,
                                        [prestamo.id]: {
                                          ...prev[prestamo.id],
                                          seleccionado: !prev[prestamo.id]?.seleccionado,
                                          monto: prev[prestamo.id]?.seleccionado ? 0 : cuotaSugerida,
                                          prestamo
                                        }
                                      }));
                                    }}
                                    className="mt-0.5 text-amber-400 hover:text-amber-300 transition-colors"
                                  >
                                    {itemState.seleccionado ? (
                                      <CheckSquare className="w-5 h-5 text-amber-400" />
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-500" />
                                    )}
                                  </button>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-white">
                                        {prestamo.descripcion || 'Sin descripción'}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                        {prestamo.tipo === 'adelanto_dinero' && '💵 Adelanto Nómina'}
                                        {prestamo.tipo === 'prestamo_dinero' && '🏦 Préstamo'}
                                        {prestamo.tipo === 'productos_local' && '🧴 Prod. Local'}
                                        {prestamo.tipo === 'herramientas' && '✂️ Herramientas'}
                                        {!['adelanto_dinero','prestamo_dinero','productos_local','herramientas'].includes(prestamo.tipo) && prestamo.tipo}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      Cuota {Number(prestamo.cuotas_pagadas || 0) + 1} de {prestamo.numero_cuotas} • Saldo pendiente actual: <span className="font-semibold text-rose-400">{formatCOP(prestamo.saldo_pendiente)}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  <span className="text-[11px] text-slate-400 whitespace-nowrap">Descontar en liq:</span>
                                  <div className="relative w-36">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max={prestamo.saldo_pendiente}
                                      step="1000"
                                      disabled={!itemState.seleccionado}
                                      value={itemState.monto}
                                      onChange={(e) => {
                                        const val = Math.max(0, Math.min(Number(prestamo.saldo_pendiente), Number(e.target.value) || 0));
                                        setDeduccionesPrestamos(prev => ({
                                          ...prev,
                                          [prestamo.id]: {
                                            ...prev[prestamo.id],
                                            monto: val,
                                            prestamo
                                          }
                                        }));
                                      }}
                                      className="w-full bg-slate-950 border border-amber-500/40 rounded-lg pl-6 pr-2 py-1.5 text-xs font-bold text-amber-400 focus:outline-none disabled:opacity-40 disabled:border-slate-800"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                      <div>
                        <label className="block text-xs font-semibold text-amber-400 uppercase mb-1">
                          Porcentaje de Comisión (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={porcentaje}
                          onChange={(e) => setPorcentaje(e.target.value)}
                          className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-amber-400 font-extrabold text-base focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">Configurado por el admin</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-rose-400 uppercase mb-1">
                          Otras Deducciones Manuales (COP)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="0"
                          value={deduccionesManuales}
                          onChange={(e) => setDeduccionesManuales(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-rose-400 font-bold text-base focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">Sanciones, daños o anticipos manuales</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                          Método de Pago
                        </label>
                        <select
                          value={metodoPago}
                          onChange={(e) => setMetodoPago(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none"
                        >
                          <option value="Efectivo">Efectivo en caja</option>
                          <option value="Transferencia Bancaria / Nequi">Transferencia / Nequi</option>
                          <option value="Daviplata">Daviplata</option>
                        </select>
                      </div>
                    </div>

                    {/* Resumen del Neto a Pagar */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                      <div>
                        <span className="text-xs text-slate-400">Total a entregar al Barbero:</span>
                        <div className="text-2xl sm:text-3xl font-black text-amber-400 font-serif">
                          {formatCOP(totalNetoAPagar)}
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 text-left sm:text-right space-y-0.5">
                        <p>Bruto Comisión: <span className="text-white font-semibold">{formatCOP(comisionCalculada)}</span></p>
                        {totalDeduccionesPrestamos > 0 && (
                          <p>Cuotas Préstamos: <span className="text-amber-400 font-semibold">-{formatCOP(totalDeduccionesPrestamos)}</span></p>
                        )}
                        {Number(deduccionesManuales || 0) > 0 && (
                          <p>Otras deducciones: <span className="text-rose-400 font-semibold">-{formatCOP(deduccionesManuales)}</span></p>
                        )}
                        <p className="border-t border-slate-800 pt-0.5 font-bold text-rose-400">
                          Total Deducciones: -{formatCOP(totalDeducciones)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                        Notas de la liquidación (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Pago correspondiente a la primera quincena de octubre..."
                        value={notasLiquidacion}
                        onChange={(e) => setNotasLiquidacion(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleGuardarLiquidacion}
                      disabled={guardando}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>{guardando ? 'Guardando...' : 'Registrar Pago y Generar Comprobante'}</span>
                    </button>
                  </div>
                </>
              )}

            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA DEL COMPROBANTE GENERADO (IMPRIMIBLE / COMPARTIBLE) */}
      {/* ========================================================= */}
      {comprobanteGenerado && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex items-center justify-between no-print">
            <button
              onClick={() => {
                setComprobanteGenerado(null);
                setResultadoPreview(null);
              }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
            >
              ← Realizar otra liquidación
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                onClick={() => compartirWhatsApp(comprobanteGenerado)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar al Barbero por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Plantilla física del comprobante */}
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl print:bg-white print:text-black print:border-black">
            
            {/* Encabezado Comprobante */}
            <div className="border-b border-slate-800 pb-5 mb-5 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  RECIBO DE LIQUIDACIÓN DE COMISIÓN
                </span>
                <h3 className="text-2xl font-black text-white font-serif mt-0.5 print:text-black">
                  {shopConfig?.nombre_barberia || 'The Barber Club'}
                </h3>
                <p className="text-xs text-slate-400 print:text-gray-600">
                  {shopConfig?.direccion_barberia || 'Calle Principal # 10 - 20'} • Tel: {shopConfig?.telefono_barberia}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-400">
                  N° LIQ-{String(comprobanteGenerado.id).padStart(5, '0')}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Fecha: {comprobanteGenerado.fecha_emision}
                </p>
              </div>
            </div>

            {/* Datos del Barbero y Período */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-5 bg-slate-950/50 p-4 rounded-xl border border-slate-800 print:border-gray-300">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Barbero:</span>
                <span className="text-sm font-bold text-white print:text-black">{comprobanteGenerado.barbero.nombre}</span>
                <p className="text-slate-400 mt-0.5">{comprobanteGenerado.barbero.telefono}</p>
              </div>
              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Período Liquidado:</span>
                <span className="text-sm font-semibold text-white print:text-black">
                  {comprobanteGenerado.fecha_inicio} al {comprobanteGenerado.fecha_fin}
                </span>
                <p className="text-slate-400 mt-0.5">Método: {comprobanteGenerado.metodo_pago}</p>
              </div>
            </div>

            {/* Resumen de Valores */}
            <div className="space-y-2.5 text-xs border-b border-slate-800 pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Total de servicios realizados:</span>
                <span className="font-semibold text-white print:text-black">{comprobanteGenerado.total_servicios} cortes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total facturado bruto:</span>
                <span className="font-semibold text-white print:text-black">{formatCOP(comprobanteGenerado.total_bruto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Porcentaje de comisión acordado:</span>
                <span className="font-bold text-amber-400 print:text-black">{comprobanteGenerado.porcentaje}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Comisión bruta:</span>
                <span className="font-bold text-white print:text-black">{formatCOP(comprobanteGenerado.monto_comision)}</span>
              </div>
              {Number(comprobanteGenerado.total_propinas || 0) > 0 && (
                <div className="flex justify-between text-emerald-400 print:text-black">
                  <span>🎁 Propinas voluntarias (100% Barbero):</span>
                  <span className="font-bold">+{formatCOP(comprobanteGenerado.total_propinas)}</span>
                </div>
              )}
              {comprobanteGenerado.deducciones > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Total Deducciones / Anticipos:</span>
                  <span>-{formatCOP(comprobanteGenerado.deducciones)}</span>
                </div>
              )}
              {Array.isArray(comprobanteGenerado.deducciones_prestamos) && comprobanteGenerado.deducciones_prestamos.length > 0 && (
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 space-y-1 my-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Abonos a Préstamos / Adelantos en esta liq:
                  </span>
                  {comprobanteGenerado.deducciones_prestamos.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                      <span>• {p.descripcion || p.tipo || 'Préstamo'}:</span>
                      <span className="font-semibold text-rose-400">-{formatCOP(p.monto)}</span>
                    </div>
                  ))}
                  {Number(comprobanteGenerado.deducciones_manuales || 0) > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>• Otras deducciones:</span>
                      <span className="font-semibold text-rose-400">-{formatCOP(comprobanteGenerado.deducciones_manuales)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total Neto a Pagar */}
            <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6 print:border-black print:bg-gray-100">
              <span className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Total Neto Pagado:
              </span>
              <span className="text-2xl font-black text-amber-400 font-serif print:text-black">
                {formatCOP(comprobanteGenerado.total_pagado)}
              </span>
            </div>

            {/* Firmas */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
              <div className="border-t border-slate-700 pt-2 print:border-black">
                <p className="font-semibold text-white print:text-black">{comprobanteGenerado.barbero.nombre}</p>
                <p className="text-[10px]">Firma del Barbero</p>
              </div>
              <div className="border-t border-slate-700 pt-2 print:border-black">
                <p className="font-semibold text-white print:text-black">Administración</p>
                <p className="text-[10px]">Firma / Sello Barbería</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA: GESTIÓN DE ADELANTOS Y PRÉSTAMOS */}
      {/* ========================================================= */}
      {tab === 'prestamos' && (
        <AdminPrestamosColaboradores 
          barberos={barberos} 
          shopConfig={shopConfig} 
          onActualizar={cargarHistorial} 
        />
      )}

      {/* ========================================================= */}
      {/* PESTAÑA: HISTORIAL DE LIQUIDACIONES */}
      {/* ========================================================= */}
      {tab === 'historial' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            {cargandoHistorial ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Cargando historial de pagos...
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No se han registrado liquidaciones aún.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Fecha Pago</th>
                      <th className="py-3 px-4 font-semibold">Barbero</th>
                      <th className="py-3 px-4 font-semibold">Período</th>
                      <th className="py-3 px-4 font-semibold">Servicios</th>
                      <th className="py-3 px-4 font-semibold">Comisión</th>
                      <th className="py-3 px-4 font-semibold text-right">Neto Pagado</th>
                      <th className="py-3 px-4 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {historial.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                          {item.fecha_pago?.split(' ')[0]}
                        </td>
                        <td className="py-3.5 px-4 text-white font-bold whitespace-nowrap">
                          {item.barbero_nombre}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {item.fecha_inicio} al {item.fecha_fin}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {item.total_servicios} cortes
                        </td>
                        <td className="py-3.5 px-4 text-amber-400 font-semibold">
                          {item.porcentaje_aplicado}%
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-400 font-extrabold whitespace-nowrap text-sm">
                          {formatCOP(item.total_pagado)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => verDetalleHistorial(item.id)}
                            className="text-amber-400 hover:text-amber-300 font-bold text-xs"
                          >
                            Ver Recibo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de Detalle Histórico */}
          {detalleHistorial && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-400" />
                    <span>Recibo de Liquidación N° {detalleHistorial.id}</span>
                  </h4>
                  <button
                    onClick={() => setDetalleHistorial(null)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    ✕ Cerrar
                  </button>
                </div>

                <div className="space-y-3 text-xs mb-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <p><span className="text-slate-400">Barbero:</span> <strong className="text-white text-sm">{detalleHistorial.barbero_nombre || detalleHistorial.barbero?.nombre}</strong></p>
                  <p><span className="text-slate-400">Período:</span> {detalleHistorial.fecha_inicio} al {detalleHistorial.fecha_fin}</p>
                  <p><span className="text-slate-400">Fecha de Pago:</span> {detalleHistorial.fecha_pago}</p>
                  <p><span className="text-slate-400">Método de Pago:</span> <span className="font-bold text-blue-400">{detalleHistorial.metodo_pago || 'Efectivo'}</span></p>
                  <p><span className="text-slate-400">Servicios Realizados:</span> {detalleHistorial.total_servicios} cortes</p>
                  <p><span className="text-slate-400">Total Facturado Bruto:</span> {formatCOP(detalleHistorial.total_bruto)}</p>
                  <p><span className="text-slate-400">Comisión Aplicada:</span> {detalleHistorial.porcentaje_aplicado}%</p>
                  {Number(detalleHistorial.total_propinas || 0) > 0 && (
                    <p className="text-emerald-400"><span className="text-slate-400">🎁 Propinas Clientes (100%):</span> +{formatCOP(detalleHistorial.total_propinas)}</p>
                  )}
                  {Number(detalleHistorial.deducciones || 0) > 0 && (
                    <p className="text-rose-400"><span className="text-slate-400">Deducciones / Anticipos:</span> -{formatCOP(detalleHistorial.deducciones)}</p>
                  )}
                  <p className="text-base font-black text-emerald-400 pt-2 border-t border-slate-800">
                    Neto Pagado al Barbero: {formatCOP(detalleHistorial.total_pagado)}
                  </p>
                </div>

                {Array.isArray(detalleHistorial.citas) && detalleHistorial.citas.length > 0 && (
                  <div className="border-t border-slate-800 pt-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Cortes y Servicios Incluidos ({detalleHistorial.citas.length}):
                    </span>
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                      {detalleHistorial.citas.map(c => (
                        <div key={c.id} className="py-1.5 flex justify-between items-center">
                          <span className="text-slate-300">{c.fecha} • {c.cliente_nombre} <span className="text-slate-500">({c.servicio_nombre})</span></span>
                          <span className="font-semibold text-white">{formatCOP(c.precio_cobrado)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(detalleHistorial.abonos_prestamos) && detalleHistorial.abonos_prestamos.length > 0 && (
                  <div className="border-t border-slate-800 pt-3">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <HandCoins className="w-4 h-4" />
                      Abonos a Préstamos Realizados ({detalleHistorial.abonos_prestamos.length}):
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {detalleHistorial.abonos_prestamos.map((abono) => (
                        <div key={abono.id} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between items-center">
                          <div>
                            <span className="text-white font-medium block">
                              {abono.descripcion || abono.tipo || 'Préstamo'} (Cuota #{abono.numero_cuota})
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Saldo anterior: {formatCOP(abono.saldo_anterior)} ➔ Restante: {formatCOP(abono.saldo_restante)}
                            </span>
                          </div>
                          <span className="font-bold text-rose-400">-{formatCOP(abono.monto_abonado)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      compartirWhatsApp({
                        ...detalleHistorial,
                        barbero: detalleHistorial.barbero || { nombre: detalleHistorial.barbero_nombre, telefono: detalleHistorial.barbero_telefono }
                      });
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Reenviar a WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setDetalleHistorial(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

function CalculatorIcon(props) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  );
}
