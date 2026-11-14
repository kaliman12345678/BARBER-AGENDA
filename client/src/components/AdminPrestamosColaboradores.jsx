import React, { useState, useEffect } from 'react';
import { 
  HandCoins, 
  Wallet, 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  ShoppingBag, 
  Wrench, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  ArrowRight, 
  Check, 
  History, 
  X,
  FileText
} from 'lucide-react';
import { formatCOP, formatDateReadable, getTodayStr } from '../utils/helpers';

const TIPOS_PRESTAMO = [
  { id: 'adelanto_dinero', label: 'Adelanto de Nómina (Efectivo)', icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'prestamo_dinero', label: 'Préstamo Financiero Personal', icon: Wallet, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'productos_local', label: 'Productos del Local a Crédito', icon: ShoppingBag, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'herramientas', label: 'Herramientas / Insumos de Barbería', icon: Wrench, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
];

export default function AdminPrestamosColaboradores({ barberos = [], shopConfig, onActualizar }) {
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBarbero, setFiltroBarbero] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('activos');

  // Modales
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [prestamoAbono, setPrestamoAbono] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [notasAbono, setNotasAbono] = useState('');
  const [guardandoAbono, setGuardandoAbono] = useState(false);

  // Historial de abonos modal
  const [prestamoHistorial, setPrestamoHistorial] = useState(null);
  const [historialAbonos, setHistorialAbonos] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Formulario nuevo préstamo
  const [form, setForm] = useState({
    barbero_id: barberos[0]?.id || '',
    tipo: 'adelanto_dinero',
    descripcion: '',
    monto_total: '',
    numero_cuotas: 1,
    valor_cuota: '',
    fecha_prestamo: getTodayStr(),
    notas: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';

  useEffect(() => {
    cargarPrestamos();
  }, [filtroBarbero, filtroEstado, slug]);

  async function cargarPrestamos() {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      params.set('b', slug);
      if (filtroBarbero !== 'todos') params.set('barbero_id', filtroBarbero);
      if (filtroEstado !== 'todos') params.set('estado', filtroEstado);

      const res = await fetch(`/api/prestamos?${params.toString()}`, {
        headers: { 'x-barberia-slug': slug }
      });
      const data = await res.json();
      setPrestamos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando préstamos:', err);
    } finally {
      setCargando(false);
    }
  }

  // Manejar cambio en monto o número de cuotas para calcular valor cuota
  function handleCambioMontoOCuotas(monto, cuotas) {
    const m = Number(monto || 0);
    const c = Math.max(1, Number(cuotas || 1));
    const cuotaCalc = m > 0 ? Math.round(m / c) : '';
    setForm(prev => ({
      ...prev,
      monto_total: monto,
      numero_cuotas: c,
      valor_cuota: cuotaCalc
    }));
  }

  async function handleCrearPrestamo(e) {
    e.preventDefault();
    setErrorForm('');

    if (!form.barbero_id) {
      setErrorForm('Por favor selecciona el colaborador');
      return;
    }
    if (!form.monto_total || Number(form.monto_total) <= 0) {
      setErrorForm('Ingresa un monto válido mayor a 0');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`/api/prestamos?b=${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-barberia-slug': slug
        },
        body: JSON.stringify({
          barbero_id: form.barbero_id,
          tipo: form.tipo,
          descripcion: form.descripcion.trim(),
          monto_total: Number(form.monto_total),
          numero_cuotas: Number(form.numero_cuotas || 1),
          valor_cuota: Number(form.valor_cuota || form.monto_total),
          fecha_prestamo: form.fecha_prestamo || getTodayStr(),
          notas: form.notas.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorForm(data.error || 'Error al registrar el préstamo');
        return;
      }

      setMostrarModalNuevo(false);
      setForm({
        barbero_id: barberos[0]?.id || '',
        tipo: 'adelanto_dinero',
        descripcion: '',
        monto_total: '',
        numero_cuotas: 1,
        valor_cuota: '',
        fecha_prestamo: getTodayStr(),
        notas: ''
      });
      cargarPrestamos();
      if (onActualizar) onActualizar();
    } catch (err) {
      setErrorForm('Error de conexión con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleRegistrarAbonoManual(e) {
    e.preventDefault();
    if (!montoAbono || Number(montoAbono) <= 0) return;

    setGuardandoAbono(true);
    try {
      const res = await fetch(`/api/prestamos/${prestamoAbono.id}/abono?b=${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-barberia-slug': slug
        },
        body: JSON.stringify({
          monto: Number(montoAbono),
          notas: notasAbono.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPrestamoAbono(null);
        setMontoAbono('');
        setNotasAbono('');
        cargarPrestamos();
        if (onActualizar) onActualizar();
      } else {
        alert(data.error || 'Error al registrar abono');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setGuardandoAbono(false);
    }
  }

  async function handleVerHistorial(p) {
    setPrestamoHistorial(p);
    setCargandoHistorial(true);
    try {
      const res = await fetch(`/api/prestamos/${p.id}/historial?b=${encodeURIComponent(slug)}`, {
        headers: { 'x-barberia-slug': slug }
      });
      const data = await res.json();
      setHistorialAbonos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoHistorial(false);
    }
  }

  async function handleEliminarPrestamo(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este registro de préstamo o adelanto?')) return;
    try {
      const res = await fetch(`/api/prestamos/${id}?b=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: { 'x-barberia-slug': slug }
      });
      if (res.ok) {
        cargarPrestamos();
        if (onActualizar) onActualizar();
      } else {
        alert('No se pudo eliminar el préstamo');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  }

  // Cálculos de métricas globales de préstamos
  const totalPrestadoGlobal = prestamos.reduce((sum, p) => sum + Number(p.monto_total || 0), 0);
  const saldoPendienteGlobal = prestamos.filter(p => p.estado === 'activo').reduce((sum, p) => sum + Number(p.saldo_pendiente || 0), 0);
  const prestamosActivosCount = prestamos.filter(p => p.estado === 'activo').length;

  return (
    <div className="space-y-6">
      
      {/* Tarjetas de Resumen de Créditos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Financiado</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white font-serif">{formatCOP(totalPrestadoGlobal)}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Histórico en adelantos y productos</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-400 uppercase">Saldo Pendiente por Cobrar</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-amber-400 font-serif">{formatCOP(saldoPendienteGlobal)}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Por amortizar en liquidaciones</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-purple-400 uppercase">Créditos Activos</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-purple-400 font-serif">{prestamosActivosCount} activos</span>
          <span className="text-[10px] text-slate-400 block mt-1">Colaboradores con cuotas pactadas</span>
        </div>
      </div>

      {/* Barra de Acciones y Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Barbero */}
          <select
            value={filtroBarbero}
            onChange={(e) => setFiltroBarbero(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los Colaboradores</option>
            {barberos.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>

          {/* Filtro Estado */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFiltroEstado('activos')}
              className={`px-3 py-1 rounded-lg transition-all ${filtroEstado === 'activos' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('pagados')}
              className={`px-3 py-1 rounded-lg transition-all ${filtroEstado === 'pagados' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Completados
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1 rounded-lg transition-all ${filtroEstado === 'todos' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Botón Nuevo Préstamo */}
        <button
          type="button"
          onClick={() => setMostrarModalNuevo(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Préstamo o Adelanto</span>
        </button>
      </div>

      {/* Lista de Préstamos */}
      {cargando ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Cargando registros de adelantos y préstamos...
        </div>
      ) : prestamos.length === 0 ? (
        <div className="py-12 px-4 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
          <HandCoins className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-bold text-sm text-slate-300">No hay adelantos o préstamos registrados</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cuando un colaborador solicite un adelanto de comisión, préstamo en efectivo o tome productos del local a crédito, regístralo aquí para pactar el cobro por cuotas.
          </p>
          <button
            type="button"
            onClick={() => setMostrarModalNuevo(true)}
            className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear primer adelanto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prestamos.map(p => {
            const tipoConfig = TIPOS_PRESTAMO.find(t => t.id === p.tipo) || TIPOS_PRESTAMO[0];
            const TipoIcon = tipoConfig.icon;
            const pctProgreso = Number(p.monto_total) > 0 ? Math.round(((Number(p.monto_total) - Number(p.saldo_pendiente)) / Number(p.monto_total)) * 100) : 100;

            return (
              <div 
                key={p.id}
                className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden ${
                  p.estado === 'pagado' ? 'border-emerald-500/30 opacity-80' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header del Préstamo */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.barbero_foto || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=80&h=80&fit=crop&crop=faces'}
                        alt={p.barbero_nombre}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{p.barbero_nombre}</h4>
                        <span className="text-[10px] text-slate-400 block">{formatDateReadable(p.fecha_prestamo)}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      p.estado === 'pagado'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {p.estado === 'pagado' ? '✓ Pagado' : 'Pendiente'}
                    </span>
                  </div>

                  {/* Tipo de crédito */}
                  <div className="flex items-center gap-1.5 my-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${tipoConfig.color}`}>
                      <TipoIcon className="w-3 h-3" />
                      <span>{tipoConfig.label}</span>
                    </span>
                  </div>

                  {/* Descripción */}
                  {p.descripcion && (
                    <p className="text-xs text-slate-300 font-medium line-clamp-2 mb-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                      "{p.descripcion}"
                    </p>
                  )}

                  {/* Cifras y Cuotas */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 mb-3">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-400">Total financiado:</span>
                      <span className="font-bold text-white">{formatCOP(p.monto_total)}</span>
                    </div>

                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-amber-400 font-semibold">Saldo por pagar:</span>
                      <span className="font-black text-amber-400 text-sm">{formatCOP(p.saldo_pendiente)}</span>
                    </div>

                    <div className="flex justify-between items-baseline text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Cuota pactada:</span>
                      <span className="font-semibold text-slate-200">{formatCOP(p.valor_cuota)} / liquidación</span>
                    </div>

                    {/* Barra de Progreso de Cuotas */}
                    <div className="pt-1">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Cuota {p.cuotas_pagadas || 0} de {p.numero_cuotas}</span>
                        <span>{pctProgreso}% pagado</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${p.estado === 'pagado' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${pctProgreso}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  {p.estado === 'activo' && (
                    <button
                      type="button"
                      onClick={() => {
                        setPrestamoAbono(p);
                        setMontoAbono(String(Math.min(Number(p.valor_cuota), Number(p.saldo_pendiente))));
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                      title="Registrar abono directo en efectivo"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Abonar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleVerHistorial(p)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all"
                    title="Ver historial de cuotas y abonos"
                  >
                    <History className="w-3 h-3" />
                    <span>Abonos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEliminarPrestamo(p.id)}
                    className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR NUEVO PRÉSTAMO / ADELANTO / PRODUCTO     */}
      {/* ========================================================= */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slideIn">
            
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Nuevo Préstamo o Adelanto</h3>
                  <p className="text-[11px] text-slate-400">Pacta monto, cuotas y cobro automático en liquidación</p>
                </div>
              </div>
              <button 
                onClick={() => setMostrarModalNuevo(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearPrestamo} className="p-5 space-y-4 overflow-y-auto text-xs">
              {errorForm && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorForm}</span>
                </div>
              )}

              {/* Colaborador */}
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">
                  Colaborador que Recibe el Crédito *
                </label>
                <select
                  value={form.barbero_id}
                  onChange={(e) => setForm({ ...form, barbero_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  {barberos.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Préstamo / Adelanto */}
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1.5">
                  Concepto del Financiamiento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_PRESTAMO.map(t => {
                    const Icon = t.icon;
                    const isSelected = form.tipo === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, tipo: t.id })}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white font-bold ring-1 ring-amber-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span className="text-[11px] leading-tight">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descripción / Detalle de Productos o Razón */}
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">
                  Descripción o Detalle (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. 2 Ceras mate + 1 Shaver / Anticipo arriendo"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Monto Total y Número de Cuotas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-400 font-bold uppercase mb-1">
                    Monto Total Prestado ($ COP) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    placeholder="Ej. 200000"
                    value={form.monto_total}
                    onChange={(e) => handleCambioMontoOCuotas(e.target.value, form.numero_cuotas)}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-black text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">
                    Número de Cuotas *
                  </label>
                  <select
                    value={form.numero_cuotas}
                    onChange={(e) => handleCambioMontoOCuotas(form.monto_total, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'cuota (pago único)' : 'cuotas'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Valor por Cuota sugerido y editable */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-slate-400 font-semibold">Valor a cobrar por cuota:</span>
                  <div className="relative max-w-[130px]">
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={form.valor_cuota}
                      onChange={(e) => setForm({ ...form, valor_cuota: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-amber-400 font-bold text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Se descontará automáticamente como deducción sugerida al liquidar comisiones.
                </span>
              </div>

              {/* Fecha y Notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Fecha del Préstamo</label>
                  <input
                    type="date"
                    value={form.fecha_prestamo}
                    onChange={(e) => setForm({ ...form, fecha_prestamo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Notas Internas</label>
                  <input
                    type="text"
                    placeholder="Opcional..."
                    value={form.notas}
                    onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Crear Préstamo'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR ABONO MANUAL EN EFECTIVO                 */}
      {/* ========================================================= */}
      {prestamoAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-white text-base">Abono Directo</h4>
                <p className="text-[11px] text-slate-400">{prestamoAbono.barbero_nombre} • Saldo: {formatCOP(prestamoAbono.saldo_pendiente)}</p>
              </div>
              <button onClick={() => setPrestamoAbono(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegistrarAbonoManual} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Monto del Abono ($ COP) *</label>
                <input
                  type="number"
                  min="1000"
                  max={prestamoAbono.saldo_pendiente}
                  step="1000"
                  required
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-emerald-400 font-black text-base focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Máximo a abonar: {formatCOP(prestamoAbono.saldo_pendiente)}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Nota o Comentario</label>
                <input
                  type="text"
                  placeholder="Ej. Pago en efectivo fuera de nómina"
                  value={notasAbono}
                  onChange={(e) => setNotasAbono(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrestamoAbono(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAbono}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                >
                  {guardandoAbono ? 'Registrando...' : 'Confirmar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: HISTORIAL DE ABONOS Y CUOTAS PAGADAS               */}
      {/* ========================================================= */}
      {prestamoHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-white text-base">Historial de Cuotas y Abonos</h4>
                <p className="text-[11px] text-slate-400">{prestamoHistorial.barbero_nombre} • Total: {formatCOP(prestamoHistorial.monto_total)}</p>
              </div>
              <button onClick={() => setPrestamoHistorial(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {cargandoHistorial ? (
                <div className="py-8 text-center text-slate-400">Cargando abonos...</div>
              ) : historialAbonos.length === 0 ? (
                <div className="py-8 text-center text-slate-500">Aún no se han registrado abonos o cuotas para este préstamo.</div>
              ) : (
                historialAbonos.map((a, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Cuota #{a.numero_cuota} ({a.origen === 'liquidacion' ? 'En Liquidación' : 'Abono Directo'})</span>
                      <span className="text-[10px] text-slate-500">{formatDateReadable(a.fecha_abono)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-400 text-sm block">+{formatCOP(a.monto_abonado)}</span>
                      <span className="text-[10px] text-slate-400">Saldo rest: {formatCOP(a.saldo_restante)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPrestamoHistorial(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
