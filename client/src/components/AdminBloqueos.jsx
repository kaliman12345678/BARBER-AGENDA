import React, { useState, useEffect } from 'react';
import { Ban, Plus, Trash2, Calendar, Clock, AlertCircle, CheckCircle, Shield, User, Sun } from 'lucide-react';
import { formatDateReadable, formatTime12, getTodayStr } from '../utils/helpers';

export default function AdminBloqueos({ barberos = [] }) {
  const [bloqueos, setBloqueos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Formulario nuevo bloqueo
  const [barberoId, setBarberoId] = useState(''); // vacío = toda la barbería
  const [fecha, setFecha] = useState(getTodayStr());
  const [diaCompleto, setDiaCompleto] = useState(false);
  const [horaInicio, setHoraInicio] = useState('13:00');
  const [horaFin, setHoraFin] = useState('14:00');
  const [motivo, setMotivo] = useState('Hora de almuerzo');

  const [filtroBarbero, setFiltroBarbero] = useState('todos');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarBloqueos();
  }, []);

  async function cargarBloqueos() {
    setCargando(true);
    try {
      const res = await fetch('/api/bloqueos');
      const data = await res.json();
      setBloqueos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar bloqueos:', err);
    } finally {
      setCargando(false);
    }
  }

  async function handleCrearBloqueo(e) {
    e.preventDefault();
    if (!fecha || (!diaCompleto && (!horaInicio || !horaFin)) || !motivo.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setGuardando(true);
    setError('');
    setMensajeExito('');

    const hInicio = diaCompleto ? '00:00' : horaInicio;
    const hFin = diaCompleto ? '23:59' : horaFin;

    try {
      const res = await fetch('/api/bloqueos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbero_id: barberoId || null,
          fecha,
          hora_inicio: hInicio,
          hora_fin: hFin,
          motivo: motivo.trim(),
          dia_completo: diaCompleto
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudo crear el bloqueo');
        return;
      }

      setMensajeExito(
        diaCompleto 
          ? '¡Día completo bloqueado con éxito! Ningún cliente podrá reservar para este día.' 
          : '¡Horario bloqueado con éxito! El turno queda inhabilitado en la agenda pública.'
      );
      setTimeout(() => setMensajeExito(''), 4500);
      cargarBloqueos();
    } catch (err) {
      setError('Error de comunicación con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminarBloqueo(id) {
    if (!confirm('¿Deseas desbloquear este horario o día para que vuelva a estar libre para los clientes?')) return;
    try {
      const res = await fetch(`/api/bloqueos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarBloqueos();
      }
    } catch (err) {
      console.error('Error al eliminar bloqueo:', err);
    }
  }

  const MOTIVOS_RAPIDOS = [
    'Almuerzo / Descanso',
    'Cita Médica',
    'Día Libre / Vacaciones',
    'Asunto Personal / Familiar',
    'Capacitación / Evento'
  ];

  const bloqueosFiltrados = bloqueos.filter(b => {
    if (filtroBarbero === 'todos') return true;
    if (filtroBarbero === 'general') return !b.barbero_id;
    return String(b.barbero_id) === String(filtroBarbero);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Explicación de la funcionalidad */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Ban className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-amber-800 dark:text-amber-300">Bloqueo de Días y Horarios por Barbero</p>
          <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
            Como dueño puedes bloquear tanto <strong>días completos</strong> (feriados, descansos, vacaciones) como <strong>intervalos de horas</strong> (almuerzos, salidas tempranas) de manera individual para cada barbero o para toda la barbería.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORMULARIO PARA CREAR BLOQUEO */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm h-fit">
          <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-600" />
            Nuevo Bloqueo
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Elige el barbero y el día u horario que deseas inhabilitar.
          </p>

          {mensajeExito && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCrearBloqueo} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                ¿A quién aplica el bloqueo? *
              </label>
              <select
                value={barberoId}
                onChange={(e) => setBarberoId(e.target.value)}
                style={{ color: '#0f172a' }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">🏢 Toda la Barbería (Cierre General / Feriado)</option>
                {barberos.map(b => (
                  <option key={b.id} value={b.id}>👤 Barbero: {b.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Fecha a Bloquear *
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={{ color: '#0f172a' }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* TOGGLE DIA COMPLETO */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="font-extrabold text-amber-950 block">Bloquear Todo el Día</span>
                  <span className="text-[10px] text-amber-700">Inhabilita la jornada completa</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={diaCompleto}
                onChange={(e) => setDiaCompleto(e.target.checked)}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {!diaCompleto && (
              <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    style={{ color: '#0f172a' }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    required
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    style={{ color: '#0f172a' }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Motivo del Bloqueo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Almuerzo, Cita médica, Vacaciones..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                style={{ color: '#0f172a' }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {/* Presets rápidos */}
              <div className="flex flex-wrap gap-1 mt-2">
                {MOTIVOS_RAPIDOS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMotivo(m)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
            >
              <Ban className="w-4 h-4" />
              <span>{guardando ? 'Aplicando Bloqueo...' : (diaCompleto ? 'Bloquear Todo el Día' : 'Bloquear Rango de Horas')}</span>
            </button>
          </form>
        </div>

        {/* TABLA DE BLOQUEOS EXISTENTES */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Bloqueos Activos y Programados
              </h3>
              <p className="text-xs text-slate-500">
                Turnos o días actualmente bloqueados para reservas de clientes.
              </p>
            </div>

            {/* Filtro por Barbero */}
            <select
              value={filtroBarbero}
              onChange={(e) => setFiltroBarbero(e.target.value)}
              style={{ color: '#0f172a' }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none"
            >
              <option value="todos">Todos los Bloqueos ({bloqueos.length})</option>
              <option value="general">Solo Toda la Barbería</option>
              {barberos.map(b => (
                <option key={b.id} value={b.id}>Solo {b.nombre}</option>
              ))}
            </select>
          </div>

          {cargando ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Cargando bloqueos...
            </div>
          ) : bloqueosFiltrados.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No hay bloqueos activos para este filtro</p>
              <p className="text-[11px] text-slate-400">Todos los horarios regulares de los barberos están habilitados.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {bloqueosFiltrados.map((b) => {
                const esDiaCompleto = (b.hora_inicio === '00:00' && (b.hora_fin === '23:59' || b.hora_fin === '24:00')) || (b.hora_inicio <= '09:00' && b.hora_fin >= '19:00');
                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${esDiaCompleto ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                        {esDiaCompleto ? <Sun className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            {b.barbero_nombre || 'Toda la Barbería'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${esDiaCompleto ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                            {esDiaCompleto ? 'Día Completo' : `${formatTime12(b.hora_inicio)} - ${formatTime12(b.hora_fin)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{formatDateReadable(b.fecha)}</span>
                          <span>•</span>
                          <span className="italic text-slate-600">{b.motivo}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEliminarBloqueo(b.id)}
                      className="py-1.5 px-3 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors self-end sm:self-auto cursor-pointer"
                      title="Eliminar bloqueo y volver a liberar horario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Desbloquear</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
