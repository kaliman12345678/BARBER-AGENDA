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
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  UserCheck,
  Send,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { formatCOP, formatDateReadable, formatTime12, getTodayStr } from '../utils/helpers';
import DateRangeFilter from './DateRangeFilter';

export default function AdminAgenda({ barberos, servicios }) {
  // Filtro de tiempo universal y buscador de cliente
  const [filtroTiempo, setFiltroTiempo] = useState('todas'); // 'todas', 'hoy', 'ayer', '7d', 'rango'
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
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

  // Modal para Reasignar Barbero
  const [citaAReasignar, setCitaAReasignar] = useState(null);
  const [nuevoBarberoId, setNuevoBarberoId] = useState('');
  const [guardandoReasignacion, setGuardandoReasignacion] = useState(false);
  const [errorReasignacion, setErrorReasignacion] = useState('');

  // Modal para Enviar al Barbero (Strictly NO phone / sensitive data)
  const [citaAEnviar, setCitaAEnviar] = useState(null);
  const [mensajeCopiado, setMensajeCopiado] = useState(false);

  useEffect(() => {
    cargarCitas();
  }, [filtroTiempo, fechaDesde, fechaHasta, barberoId]);

  async function cargarCitas() {
    setCargando(true);
    try {
      let url = '/api/citas';
      const params = [];
      if (filtroTiempo === 'hoy') {
        const hoy = getTodayStr();
        params.push(`fecha=${hoy}`);
      } else if (filtroTiempo === 'ayer') {
        const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        params.push(`fecha=${ayer}`);
      } else if (filtroTiempo === '7d') {
        const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const hoy = getTodayStr();
        params.push(`desde=${hace7}&hasta=${hoy}`);
      } else if (filtroTiempo === 'rango' && fechaDesde && fechaHasta) {
        params.push(`desde=${fechaDesde}&hasta=${fechaHasta}`);
      }
      if (barberoId) {
        params.push(`barbero_id=${barberoId}`);
      }
      if (busqueda.trim()) {
        params.push(`q=${encodeURIComponent(busqueda.trim())}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setCitas(Array.isArray(data) ? data : []);
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

  // Ejecutar Reasignación de Barbero
  async function handleGuardarReasignacion(e) {
    e.preventDefault();
    if (!nuevoBarberoId) {
      setErrorReasignacion('Selecciona el nuevo barbero a asignar');
      return;
    }

    setGuardandoReasignacion(true);
    setErrorReasignacion('');

    try {
      const res = await fetch(`/api/citas/${citaAReasignar.id}/reasignar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbero_id: Number(nuevoBarberoId),
          usuario: 'Administrador'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorReasignacion(data.error || 'Error al reasignar cita');
        return;
      }

      setCitaAReasignar(null);
      cargarCitas();
    } catch (err) {
      setErrorReasignacion('Error de conexión con el servidor');
    } finally {
      setGuardandoReasignacion(false);
    }
  }

  // Generar mensaje confidencial para el barbero (SIN teléfono ni datos sensibles del cliente)
  function construirMensajeBarbero(cita) {
    return (
      `💈 *NUEVO TURNO ASIGNADO*\n\n` +
      `👤 *Cliente:* ${cita.cliente_nombre}\n` +
      `✂️ *Servicio:* ${cita.servicio_nombre}\n` +
      `📅 *Fecha:* ${cita.fecha}\n` +
      `⏰ *Horario:* ${formatTime12(cita.hora_inicio)} - ${formatTime12(cita.hora_fin)}\n\n` +
      `_Por favor confirma disponibilidad para este turno en el local._`
    );
  }

  async function handleCopiarMensaje(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      setMensajeCopiado(true);
      setTimeout(() => setMensajeCopiado(false), 2500);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  }

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
    <div className="space-y-4">
      
      {/* FILTRO DE FECHAS UNIVERSAL & MOTOR DE BÚSQUEDA */}
      <DateRangeFilter
        filtroTiempo={filtroTiempo}
        setFiltroTiempo={setFiltroTiempo}
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onBuscar={cargarCitas}
        placeholder="Buscar cita por cliente o teléfono..."
      />

      {/* BARRA SECUNDARIA: FILTRO POR BARBERO & BOTÓN NUEVA CITA */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:max-w-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={barberoId}
            onChange={(e) => setBarberoId(e.target.value)}
            className="w-full bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-bold"
          >
            <option value="">Todos los Barberos del Equipo</option>
            {barberos.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setNuevaCita(prev => ({
              ...prev,
              barbero_id: barberos[0]?.id || '',
              servicio_id: servicios[0]?.id || '',
              fecha: getTodayStr()
            }));
            setMostrarModalNueva(true);
          }}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Cita Presencial</span>
        </button>
      </div>

      {/* Título de la agenda */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 capitalize font-sans">
            {vistaModo === 'dia' ? formatDateReadable(fecha) : 'Historial de Citas Agendadas'}
          </h3>
          <p className="text-xs text-slate-500">
            Total de turnos visibles: <span className="text-blue-600 font-bold">{citas.length}</span>
            {vistaModo === 'todas' && <span className="text-slate-400 ml-1">(ordenadas cronológicamente por las más recientes)</span>}
          </p>
        </div>
        <button
          onClick={cargarCitas}
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition-colors font-medium"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-blue-600' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Lista de citas */}
      {cargando ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-medium">Cargando agenda...</p>
        </div>
      ) : citas.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-slate-800 font-bold text-base">No hay turnos para esta fecha</h4>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
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
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isCancelada
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : isNoAsistio
                    ? 'bg-rose-50/50 border-rose-200 opacity-75'
                    : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  {/* Encabezado de la cita: Hora y Estado */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                      {formatTime12(cita.hora_inicio)} - {formatTime12(cita.hora_fin)}
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isCompletada 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : isCancelada 
                        ? 'bg-slate-100 text-slate-600 line-through'
                        : isNoAsistio 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {cita.estado === 'completada' ? 'Completado' : cita.estado}
                    </span>
                  </div>

                  {/* Datos del Cliente y Servicio */}
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{cita.cliente_nombre}</span>
                  </h4>

                  <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-800">{cita.servicio_nombre}</span>
                      <span className="text-emerald-700 font-extrabold ml-auto">{formatCOP(cita.precio_cobrado)}</span>
                    </p>

                    {/* Teléfono del cliente visible SOLO para el admin */}
                    <p className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <a href={`https://wa.me/${cita.cliente_telefono?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-blue-600 underline font-medium">
                        {cita.cliente_telefono}
                      </a>
                    </p>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Barbero Asignado:</span>
                        <span className="text-slate-900 font-bold">{cita.barbero_nombre}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha:</span>
                        <span className="text-slate-700 font-medium">{cita.fecha}</span>
                      </div>
                    </div>

                    {cita.notas && (
                      <p className="text-slate-600 text-[11px] italic bg-slate-50 p-2.5 rounded-lg mt-1 border border-slate-200">
                        "{cita.notas}"
                      </p>
                    )}
                  </div>

                  {/* ACCIONES DE ASIGNACIÓN & ENVÍO SEGURO AL BARBERO */}
                  {!isCancelada && (
                    <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200 grid grid-cols-2 gap-2">
                      
                      {/* Botón Reasignar Barbero */}
                      <button
                        type="button"
                        onClick={() => {
                          setCitaAReasignar(cita);
                          setNuevoBarberoId(String(cita.barbero_id));
                          setErrorReasignacion('');
                        }}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200/80 hover:border-blue-200 transition-all flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Reasignar</span>
                      </button>

                      {/* Botón Enviar al Barbero (Confidencial: Sin teléfono ni datos sensibles) */}
                      <button
                        type="button"
                        onClick={() => setCitaAEnviar(cita)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold border border-slate-200/80 hover:border-emerald-200 transition-all flex items-center justify-center gap-1.5"
                        title="Enviar resumen al barbero sin datos sensibles"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enviar al Barbero</span>
                      </button>

                    </div>
                  )}
                </div>

                {/* Acciones de Estado de la Cita */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  {cita.estado !== 'completada' && (
                    <button
                      onClick={() => cambiarEstadoCita(cita.id, 'completada')}
                      title="Marcar como atendido y cobrado"
                      className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg font-bold border border-emerald-200 hover:border-emerald-600 transition-all flex items-center justify-center gap-1 shadow-xs"
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
                        className="py-1.5 px-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-semibold"
                      >
                        No asistió
                      </button>
                      <button
                        onClick={() => cambiarEstadoCita(cita.id, 'cancelada')}
                        title="Cancelar cita y liberar horario"
                        className="py-1.5 px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {cita.estado === 'completada' && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 ml-auto">
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

      {/* MODAL PARA REASIGNAR BARBERO A LA CITA */}
      {citaAReasignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-sans">
                  Reasignar Barbero
                </h3>
                <p className="text-xs text-slate-500">
                  Cambia el barbero que atenderá este turno
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-xs space-y-1">
              <p className="font-bold text-slate-800">
                Cliente: <span className="text-blue-600">{citaAReasignar.cliente_nombre}</span>
              </p>
              <p className="text-slate-600">
                Servicio: <span className="font-semibold">{citaAReasignar.servicio_nombre}</span> • Horario: {formatTime12(citaAReasignar.hora_inicio)} - {formatTime12(citaAReasignar.hora_fin)}
              </p>
              <p className="text-slate-500">
                Barbero actual: <span className="font-semibold text-slate-700">{citaAReasignar.barbero_nombre}</span>
              </p>
            </div>

            {errorReasignacion && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorReasignacion}</span>
              </div>
            )}

            <form onSubmit={handleGuardarReasignacion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Seleccionar Nuevo Barbero Responsable:
                </label>
                <select
                  required
                  value={nuevoBarberoId}
                  onChange={(e) => setNuevoBarberoId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {barberos.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} {String(b.id) === String(citaAReasignar.barbero_id) ? '(Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  El sistema registrará esta reasignación en el libro de auditoría histórico para control de administración.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCitaAReasignar(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoReasignacion}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {guardandoReasignacion ? 'Reasignando...' : 'Confirmar Reasignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA ENVIAR CITA AL BARBERO (STRICT CONFIDENTIALITY: SIN TELÉFONO NI DATOS PERSONALES) */}
      {citaAEnviar && (() => {
        const barberoAsignado = barberos.find(b => String(b.id) === String(citaAEnviar.barbero_id));
        const textoConfidencial = construirMensajeBarbero(citaAEnviar);
        const telefonoBarberoLimpio = barberoAsignado?.telefono ? barberoAsignado.telefono.replace(/[^0-9]/g, '') : '';
        const whatsappUrl = telefonoBarberoLimpio 
          ? `https://wa.me/${telefonoBarberoLimpio}?text=${encodeURIComponent(textoConfidencial)}` 
          : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-sans">
                    Enviar Turno a {citaAEnviar.barbero_nombre}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Notifica al barbero de forma directa y 100% confidencial
                  </p>
                </div>
              </div>

              {/* Mensaje de Seguridad / Privacidad de Datos */}
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Protección de Datos Activa</span>
                  <span className="text-[11px] text-emerald-700">
                    El mensaje generado solo contiene el nombre del cliente, horario y servicio. 
                    <strong> NO incluye teléfono, correo ni notas privadas</strong> para resguardar la privacidad.
                  </span>
                </div>
              </div>

              {/* Vista previa del mensaje */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed mb-4">
                {textoConfidencial}
              </div>

              <div className="space-y-2">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Abrir WhatsApp de {citaAEnviar.barbero_nombre}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium">
                    ⚠️ {citaAEnviar.barbero_nombre} no tiene teléfono registrado. Puedes copiar el texto abajo para enviárselo por cualquier medio.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleCopiarMensaje(textoConfidencial)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {mensajeCopiado ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">¡Mensaje Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copiar Texto al Portapapeles</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCitaAEnviar(null)}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL PARA AGENDAR CITA PRESENCIAL (WALK-IN) */}
      {mostrarModalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-sans">
              Agendar Turno Presencial
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Registra un cliente que llegó directamente a la barbería o llamó por teléfono.
            </p>

            {errorNueva && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorNueva}</span>
              </div>
            )}

            <form onSubmit={handleCrearCitaManual} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Barbero Asignado *
                </label>
                <select
                  required
                  value={nuevaCita.barbero_id}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, barbero_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecciona barbero</option>
                  {barberos.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Servicio a Realizar *
                </label>
                <select
                  required
                  value={nuevaCita.servicio_id}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, servicio_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
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
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={nuevaCita.fecha}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, fecha: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={nuevaCita.hora_inicio}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, hora_inicio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombre y apellido"
                  value={nuevaCita.cliente_nombre}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, cliente_nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="Ej. 300 123 4567"
                  value={nuevaCita.cliente_telefono}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, cliente_telefono: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNueva(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoNueva}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50 shadow-md shadow-blue-500/20"
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
