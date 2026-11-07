import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  User, 
  Scissors, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Phone, 
  Filter,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { formatCOP, formatDateReadable, formatTime12, getTodayStr } from '../utils/helpers';

export default function AdminAgenda({ barberos, servicios }) {
  // Modo de visualización: 'dia' (por fecha específica) o 'todas' (todas las citas)
  const [vistaModo, setVistaModo] = useState('todas'); // 'todas' o 'dia'
  const [fecha, setFecha] = useState(getTodayStr());
  const [barberoId, setBarberoId] = useState('');
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Modal para nueva cita presencial
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [nuevaCita, setNuevaCita] = useState({
    barbero_id: '',
    servicio_id: '',
    cliente_nombre: '',
    cliente_telefono: '',
    fecha: getTodayStr(),
    hora_inicio: '10:00',
    notas: ''
  });
  const [errorNueva, setErrorNueva] = useState('');
  const [guardandoNueva, setGuardandoNueva] = useState(false);

  useEffect(() => {
    cargarCitas();
  }, [fecha, barberoId, vistaModo]);

  async function cargarCitas() {
    setCargando(true);
    try {
      let url = '/api/citas';
      const params = [];
      if (vistaModo === 'dia' && fecha) {
        params.push(`fecha=${fecha}`);
      }
      if (barberoId) {
        params.push(`barbero_id=${barberoId}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setCitas(data);
    } catch (err) {
      console.error('Error al cargar citas:', err);
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstadoCita(id, nuevoEstado) {
    try {
      const res = await fetch(`/api/citas/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        cargarCitas();
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  }

  async function handleCrearCitaManual(e) {
    e.preventDefault();
    if (!nuevaCita.barbero_id || !nuevaCita.servicio_id || !nuevaCita.cliente_nombre) {
      setErrorNueva('Por favor completa barbero, servicio y nombre del cliente');
      return;
    }
    setGuardandoNueva(true);
    setErrorNueva('');

    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaCita)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorNueva(data.error || 'No se pudo guardar la cita');
        return;
      }

      setMostrarModalNueva(false);
      setNuevaCita({
        barbero_id: barberos[0]?.id || '',
        servicio_id: servicios[0]?.id || '',
        cliente_nombre: '',
        cliente_telefono: '',
        fecha: fecha,
        hora_inicio: '10:00',
        notas: ''
      });
      cargarCitas();
    } catch (err) {
      setErrorNueva('Error de conexión');
    } finally {
      setGuardandoNueva(false);
    }
  }

  // Navegar días
  function moverDia(delta) {
    const [y, m, d] = fecha.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + delta);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    setFecha(`${ny}-${nm}-${nd}`);
  }

  return (
    <div className="space-y-6">
      
      {/* Barra superior de controles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Selector de modo y selector de fecha */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botones de Modo: Todas vs Por Día */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setVistaModo('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vistaModo === 'todas'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ver Todas las Citas
            </button>
            <button
              type="button"
              onClick={() => setVistaModo('dia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vistaModo === 'dia'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Filtrar por Día
            </button>
          </div>

          {/* Navegación por día solo cuando vistaModo === 'dia' */}
          {vistaModo === 'dia' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => moverDia(-1)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => moverDia(1)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setFecha(getTodayStr())}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-colors"
              >
                Hoy
              </button>
            </div>
          )}
        </div>

        {/* Filtro por barbero y botón Nueva Cita */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 flex-1 md:flex-initial">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={barberoId}
              onChange={(e) => setBarberoId(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">Todos los Barberos</option>
              {barberos.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900">{b.nombre}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setNuevaCita(prev => ({
                ...prev,
                barbero_id: barberos[0]?.id || '',
                servicio_id: servicios[0]?.id || '',
                fecha: fecha
              }));
              setMostrarModalNueva(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 whitespace-nowrap transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Presencial</span>
          </button>
        </div>

      </div>

      {/* Título de la agenda */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white capitalize">
            {vistaModo === 'dia' ? formatDateReadable(fecha) : 'Historial de Citas Agendadas'}
          </h3>
          <p className="text-xs text-slate-400">
            Total de turnos visibles: <span className="text-amber-400 font-bold">{citas.length}</span>
            {vistaModo === 'todas' && <span className="text-slate-500 ml-1">(ordenadas cronológicamente por las más recientes)</span>}
          </p>
        </div>
        <button
          onClick={cargarCitas}
          className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Lista de citas */}
      {cargando ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs">Cargando agenda...</p>
        </div>
      ) : citas.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-slate-300 font-bold text-base">No hay turnos para esta fecha</h4>
          <p className="text-slate-500 text-xs mt-1">
            Los clientes pueden agendar desde el portal o puedes registrar un cliente presencial con el botón "Agendar Presencial".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {citas.map((cita) => {
            const isCompletada = cita.estado === 'completada';
            const isCancelada = cita.estado === 'cancelada';
            const isNoAsistio = cita.estado === 'no_asistio';

            return (
              <div
                key={cita.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCompletada
                    ? 'bg-slate-900/40 border-emerald-500/30 ring-1 ring-emerald-500/10'
                    : isCancelada
                    ? 'bg-slate-950/60 border-slate-800/80 opacity-60'
                    : isNoAsistio
                    ? 'bg-slate-950/60 border-rose-900/40 opacity-70'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div>
                  {/* Encabezado de la cita: Hora y Estado */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-sm font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-mono">
                      {formatTime12(cita.hora_inicio)} - {formatTime12(cita.hora_fin)}
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isCompletada 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isCancelada 
                        ? 'bg-slate-800 text-slate-400 line-through'
                        : isNoAsistio 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {cita.estado === 'completada' ? 'Completado' : cita.estado}
                    </span>
                  </div>

                  {/* Datos del Cliente y Servicio */}
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{cita.cliente_nombre}</span>
                  </h4>

                  <div className="mt-2 space-y-1 text-xs text-slate-300">
                    <p className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="font-medium text-slate-200">{cita.servicio_nombre}</span>
                      <span className="text-amber-400 font-bold ml-auto">{formatCOP(cita.precio_cobrado)}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <a href={`https://wa.me/${cita.cliente_telefono.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-emerald-400 underline">
                        {cita.cliente_telefono}
                      </a>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Barbero: <span className="text-white font-medium">{cita.barbero_nombre}</span>
                    </p>
                    {cita.notas && (
                      <p className="text-slate-400 text-[11px] italic bg-slate-950/40 p-2 rounded-lg mt-1 border border-slate-800">
                        "{cita.notas}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones de Estado */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1 text-xs">
                  {cita.estado !== 'completada' && (
                    <button
                      onClick={() => cambiarEstadoCita(cita.id, 'completada')}
                      title="Marcar como atendido y cobrado"
                      className="flex-1 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg font-bold border border-emerald-500/30 transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completar</span>
                    </button>
                  )}

                  {cita.estado === 'confirmada' && (
                    <>
                      <button
                        onClick={() => cambiarEstadoCita(cita.id, 'no_asistio')}
                        title="Marcar como cliente no asistió"
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition-all"
                      >
                        No asistió
                      </button>
                      <button
                        onClick={() => cambiarEstadoCita(cita.id, 'cancelada')}
                        title="Cancelar cita y liberar horario"
                        className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg font-medium transition-all"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {cita.estado === 'completada' && (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 ml-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Listo para liquidación
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PARA AGENDAR CITA PRESENCIAL (WALK-IN) */}
      {mostrarModalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 font-serif">
              Agendar Turno Presencial
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Registra un cliente que llegó directamente a la barbería o llamó por teléfono.
            </p>

            {errorNueva && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorNueva}</span>
              </div>
            )}

            <form onSubmit={handleCrearCitaManual} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Barbero Asignado *
                </label>
                <select
                  required
                  value={nuevaCita.barbero_id}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, barbero_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecciona barbero</option>
                  {barberos.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Servicio a Realizar *
                </label>
                <select
                  required
                  value={nuevaCita.servicio_id}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, servicio_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecciona servicio</option>
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} - {formatCOP(s.precio_cop)} ({s.duracion_minutos} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={nuevaCita.fecha}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, fecha: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={nuevaCita.hora_inicio}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, hora_inicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombre y apellido"
                  value={nuevaCita.cliente_nombre}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, cliente_nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="Ej. 300 123 4567"
                  value={nuevaCita.cliente_telefono}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, cliente_telefono: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNueva(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoNueva}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  {guardandoNueva ? 'Guardando...' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
