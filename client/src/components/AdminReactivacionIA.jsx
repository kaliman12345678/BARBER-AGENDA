import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  TrendingUp,
  AlertTriangle,
  UserX,
  UserCheck,
  Send,
  MessageCircle,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  Gift,
  Calendar,
  Clock,
  Scissors,
  Crown,
  HeartHandshake,
  ChevronRight,
  ExternalLink,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { formatTime12 } from '../utils/helpers';

export default function AdminReactivacionIA({ shopConfig, barberos = [] }) {
  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [filtroSemaforo, setFiltroSemaforo] = useState('todos'); // 'todos', 'amarillo', 'rojo', 'verde'
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  // Estado del modal de reactivación individual
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteActivo, setClienteActivo] = useState(null);
  const [estrategia, setEstrategia] = useState('dias_muertos');
  const [incentivo, setIncentivo] = useState('');
  const [mensajeGenerado, setMensajeGenerado] = useState('');
  const [waUrl, setWaUrl] = useState('');
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'principal';

  useEffect(() => {
    cargarAnalisis();
  }, [slug]);

  async function cargarAnalisis() {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/reactivacion/analisis?b=${encodeURIComponent(slug)}`, {
        headers: { 'x-barberia-slug': slug }
      });
      if (res.ok) {
        const data = await res.json();
        setResumen(data.resumen);
        setClientes(data.clientes || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'No se pudo cargar el análisis de reactivación');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  }

  // Abrir modal y generar copy automáticamente
  async function handleAbrirReactivacion(cliente, estDefecto = null) {
    setClienteActivo(cliente);
    const est = estDefecto || (cliente.semaforo === 'rojo' ? 'rescate_inactivo' : cliente.semaforo === 'amarillo' ? 'mantenimiento_preventivo' : 'dias_muertos');
    setEstrategia(est);
    setIncentivo('');
    setModalAbierto(true);
    await generarMensajeIA(cliente, est, '');
  }

  async function generarMensajeIA(cliente, est, inc) {
    if (!cliente) return;
    setGenerando(true);
    setCopiado(false);
    try {
      const res = await fetch(`/api/reactivacion/generar-mensaje?b=${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-barberia-slug': slug
        },
        body: JSON.stringify({
          cliente_nombre: cliente.nombre,
          cliente_telefono: cliente.telefono,
          dias_sin_visita: cliente.dias_sin_visita,
          barbero_nombre: cliente.ultimo_barbero_nombre,
          servicio_nombre: cliente.servicio_habitual,
          estrategia: est,
          incentivo: inc
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMensajeGenerado(data.mensaje);
        setWaUrl(data.wa_url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerando(false);
    }
  }

  function handleCopiarMensaje() {
    if (!mensajeGenerado) return;
    navigator.clipboard.writeText(mensajeGenerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function handleDispararWhatsApp() {
    if (!waUrl && !mensajeGenerado) return;
    const rawPhone = String(clienteActivo?.telefono || '').replace(/[^0-9]/g, '');
    const fullPhone = rawPhone.length === 10 ? `57${rawPhone}` : rawPhone;
    const finalUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(mensajeGenerado)}`;
    window.open(finalUrl, '_blank');
  }

  // Filtrado de clientes
  const clientesFiltrados = clientes.filter(c => {
    if (filtroSemaforo !== 'todos' && c.semaforo !== filtroSemaforo) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const matchNom = c.nombre?.toLowerCase().includes(q);
      const matchTel = c.telefono?.includes(q);
      const matchBarb = c.ultimo_barbero_nombre?.toLowerCase().includes(q);
      return matchNom || matchTel || matchBarb;
    }
    return true;
  });

  return (
    <div className="space-y-6">

      {/* HEADER PRINCIPAL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Inteligencia Comercial Predictiva
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
              WhatsApp 1-Clic
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-serif flex items-center gap-2">
            Asistente de Reactivación & Retención
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Detecta automáticamente clientes en riesgo de abandono, llena los días flojos (martes y miércoles) y genera copys persuasivos personalizados por WhatsApp.
          </p>
        </div>

        <button
          onClick={cargarAnalisis}
          disabled={cargando}
          className="shrink-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-amber-400' : ''}`} />
          <span>Actualizar Radar</span>
        </button>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* RADAR DE SALUD: 4 TARJETAS MÉTRICAS */}
      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Activos (Verde) */}
          <div 
            onClick={() => setFiltroSemaforo(filtroSemaforo === 'verde' ? 'todos' : 'verde')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filtroSemaforo === 'verde'
                ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Activos (&lt; 21 días)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">
              {resumen.activos_count}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Clientes con visita reciente
            </p>
          </div>

          {/* En Riesgo (Amarillo) */}
          <div 
            onClick={() => setFiltroSemaforo(filtroSemaforo === 'amarillo' ? 'todos' : 'amarillo')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filtroSemaforo === 'amarillo'
                ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-500/30'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                En Riesgo (21-45 d)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">
              {resumen.en_riesgo_count}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Momento de corte preventivo
            </p>
          </div>

          {/* Inactivos / Por Rescatar (Rojo) */}
          <div 
            onClick={() => setFiltroSemaforo(filtroSemaforo === 'rojo' ? 'todos' : 'rojo')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filtroSemaforo === 'rojo'
                ? 'bg-rose-500/15 border-rose-400 ring-2 ring-rose-500/30'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                Inactivos (&gt; 45 días)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">
              {resumen.inactivos_count}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Requieren oferta de choque
            </p>
          </div>

          {/* Salud de Cartera */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                Salud de Cartera
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl sm:text-3xl font-black text-white">
                {resumen.porcentaje_salud}%
              </p>
              <span className="text-[10px] text-slate-400">frecuentes</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500" 
                style={{ width: `${resumen.porcentaje_salud}%` }}
              ></div>
            </div>
          </div>

        </div>
      )}

      {/* BARRA DE ESTRATEGIAS RÁPIDAS PARA LLENAR LA SEMANA */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            Estrategias Recomendadas de Reactivación
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Elige una campaña para disparar mensajes persuasivos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => {
              setFiltroSemaforo('amarillo');
              const primerC = clientes.find(c => c.semaforo === 'amarillo') || clientes[0];
              if (primerC) handleAbrirReactivacion(primerC, 'dias_muertos');
            }}
            className="p-3 bg-slate-950/70 hover:bg-slate-800 border border-amber-500/20 hover:border-amber-400 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  Llenar Martes &amp; Miércoles
                </p>
                <p className="text-[10px] text-slate-400">Incentivo en días tranquilos</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setFiltroSemaforo('rojo');
              const primerC = clientes.find(c => c.semaforo === 'rojo') || clientes[0];
              if (primerC) handleAbrirReactivacion(primerC, 'rescate_inactivo');
            }}
            className="p-3 bg-slate-950/70 hover:bg-slate-800 border border-rose-500/20 hover:border-rose-400 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                  Rescate Clientes Perdidos
                </p>
                <p className="text-[10px] text-slate-400">Oferta especial de regreso</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setFiltroSemaforo('amarillo');
              const primerC = clientes.find(c => c.semaforo === 'amarillo') || clientes[0];
              if (primerC) handleAbrirReactivacion(primerC, 'mantenimiento_preventivo');
            }}
            className="p-3 bg-slate-950/70 hover:bg-slate-800 border border-blue-500/20 hover:border-blue-400 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <Scissors className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                  Mantenimiento de Estilo
                </p>
                <p className="text-[10px] text-slate-400">Retoque antes de perder la línea</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setFiltroSemaforo('todos');
              const primerC = clientes.find(c => c.sellos_acumulados >= 5) || clientes[0];
              if (primerC) handleAbrirReactivacion(primerC, 'vip_sellos');
            }}
            className="p-3 bg-slate-950/70 hover:bg-slate-800 border border-purple-500/20 hover:border-purple-400 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Crown className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                  Beneficio &amp; Sellos VIP
                </p>
                <p className="text-[10px] text-slate-400">Recordatorio de cortes gratis</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BUSCADOR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'amarillo', label: '🟡 En Riesgo' },
            { id: 'rojo', label: '🔴 Inactivos' },
            { id: 'verde', label: '🟢 Activos' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroSemaforo(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                filtroSemaforo === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, teléfono o barbero..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* LISTA / TABLA DE CLIENTES CON SEMÁFORO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {cargando ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span>Escaneando historial de visitas y calculando semáforo...</span>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-bold text-slate-300">No se encontraron clientes con este filtro</p>
            <p className="text-[11px] text-slate-500 mt-1">Prueba cambiando el semáforo o el término de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Cliente</th>
                  <th className="py-3 px-3 font-bold">Semáforo / Ausencia</th>
                  <th className="py-3 px-3 font-bold">Último Barbero</th>
                  <th className="py-3 px-3 font-bold">Servicio Habitual</th>
                  <th className="py-3 px-3 font-bold text-center">Sellos VIP</th>
                  <th className="py-3 px-4 font-bold text-right">Acción IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {clientesFiltrados.map(c => {
                  const esRojo = c.semaforo === 'rojo';
                  const esAmarillo = c.semaforo === 'amarillo';

                  return (
                    <tr key={c.id || c.telefono} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Cliente */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            esRojo ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            esAmarillo ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {c.nombre?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs truncate max-w-[150px]">{c.nombre}</p>
                            <p className="text-[11px] text-slate-400">{c.telefono || 'Sin teléfono'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Semáforo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          esRojo ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                          esAmarillo ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                          'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            esRojo ? 'bg-rose-500' : esAmarillo ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}></span>
                          {c.dias_sin_visita >= 900 ? 'Sin citas registradas' : `Hace ${c.dias_sin_visita} días`}
                        </span>
                      </td>

                      {/* Barbero */}
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {c.ultimo_barbero_nombre}
                      </td>

                      {/* Servicio */}
                      <td className="py-3 px-3 text-slate-400">
                        {c.servicio_habitual}
                      </td>

                      {/* Sellos VIP */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-[11px]">
                          {c.sellos_acumulados}/10
                        </span>
                      </td>

                      {/* Botón Acción */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleAbrirReactivacion(c)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1.5 ml-auto transition-all cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Reactivar con IA</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL GENERADOR Y DISPARADOR DE MENSAJE IA A WHATSAPP */}
      {/* ======================================================== */}
      {modalAbierto && clienteActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-8">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">
                    Reactivar a {clienteActivo.nombre}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {clienteActivo.telefono} • Ausente hace {clienteActivo.dias_sin_visita >= 900 ? '+60' : clienteActivo.dias_sin_visita} días
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalAbierto(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selector de Estrategia */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                1. Selecciona la Estrategia del Mensaje:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'dias_muertos', label: '☕ Llenar Martes/Miérc.' },
                  { id: 'rescate_inactivo', label: '🎁 Rescate Inactivo' },
                  { id: 'mantenimiento_preventivo', label: '✂️ Mantenimiento Fade' },
                  { id: 'vip_sellos', label: '👑 Beneficio VIP' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setEstrategia(item.id);
                      generarMensajeIA(clienteActivo, item.id, incentivo);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      estrategia === item.id
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-xs'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Incentivo / Cortesía personalizada */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                2. Gancho u Obsequio Personalizado (Opcional):
              </label>
              <input
                type="text"
                value={incentivo}
                onChange={(e) => setIncentivo(e.target.value)}
                onBlur={() => generarMensajeIA(clienteActivo, estrategia, incentivo)}
                placeholder="Ej: un café de cortesía, 15% de descuento, perfilado de cejas..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {[
                  'Bebida de cortesía gratis',
                  '15% de descuento',
                  'Perfilado de cejas gratis',
                  'Exfoliación facial de bienvenida'
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setIncentivo(sug);
                      generarMensajeIA(clienteActivo, estrategia, sug);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    +{sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Previsualizador de Copy con IA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  3. Mensaje Listo para WhatsApp (Editable):
                </label>
                {generando && (
                  <span className="text-[10px] text-indigo-400 animate-pulse font-bold">
                    Generando copy con IA...
                  </span>
                )}
              </div>

              <textarea
                rows={7}
                value={mensajeGenerado}
                onChange={(e) => setMensajeGenerado(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-2xl text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              ></textarea>
            </div>

            {/* BOTONES DE DISPARO */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDispararWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer text-xs hover:scale-[1.01] active:scale-95"
              >
                <Send className="w-4 h-4 text-emerald-200" />
                <span>📲 Disparar por WhatsApp al Cliente</span>
              </button>

              <button
                type="button"
                onClick={handleCopiarMensaje}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">¡Mensaje copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
