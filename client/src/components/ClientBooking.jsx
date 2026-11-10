import React, { useState, useEffect } from 'react';
import { 
  User, 
  Scissors, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Phone, 
  Sparkles,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCOP, formatDateReadable, formatTime12, getTodayStr, getNextDays } from '../utils/helpers';
import ClientMediaFeed from './ClientMediaFeed';

export default function ClientBooking({ shopConfig }) {
  // Datos maestros
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Pasos: 1: Barbero, 2: Servicio, 3: Fecha y Hora, 4: Datos Cliente, 5: Confirmado
  const [paso, setPaso] = useState(1);

  // Selecciones del cliente
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getTodayStr());
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);

  // Disponibilidad de horarios
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('');

  // Formulario del cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteNotas, setClienteNotas] = useState('');

  // Estado de envío y resultado
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [citaConfirmada, setCitaConfirmada] = useState(null);

  const diasDisponibles = getNextDays(14);

  // Cargar barberos y servicios activos al iniciar
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoadingInitial(true);
        const [resB, resS] = await Promise.all([
          fetch('/api/barberos'),
          fetch('/api/servicios')
        ]);
        const dataB = await resB.json();
        const dataS = await resS.json();
        setBarberos(dataB);
        setServicios(dataS);
      } catch (err) {
        console.error('Error cargando catálogo:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    cargarDatos();
  }, []);

  // Consultar disponibilidad cuando cambia barbero, fecha o servicio
  useEffect(() => {
    if (barberoSeleccionado && fechaSeleccionada && servicioSeleccionado) {
      cargarDisponibilidad();
    }
  }, [barberoSeleccionado, fechaSeleccionada, servicioSeleccionado]);

  async function cargarDisponibilidad() {
    setLoadingSlots(true);
    setErrorDisponibilidad('');
    setSlotSeleccionado(null);
    try {
      const duracion = servicioSeleccionado ? servicioSeleccionado.duracion_minutos : 45;
      const res = await fetch(`/api/disponibilidad?barbero_id=${barberoSeleccionado.id}&fecha=${fechaSeleccionada}&duracion_minutos=${duracion}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorDisponibilidad(data.error || 'No se pudo consultar la disponibilidad');
        setSlots([]);
        return;
      }

      if (!data.disponible_dia) {
        setErrorDisponibilidad(data.motivo || 'El barbero no labora en este día');
        setSlots([]);
      } else {
        setSlots(data.slots || []);
      }
    } catch (err) {
      setErrorDisponibilidad('Error de conexión al cargar horarios');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  // Enviar reserva
  async function handleSubmitReserva(e) {
    e.preventDefault();
    if (!clienteNombre.trim() || !clienteTelefono.trim()) {
      setErrorEnvio('Por favor completa tu nombre y número de WhatsApp');
      return;
    }

    setEnviando(true);
    setErrorEnvio('');

    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbero_id: barberoSeleccionado.id,
          servicio_id: servicioSeleccionado.id,
          cliente_nombre: clienteNombre.trim(),
          cliente_telefono: clienteTelefono.trim(),
          fecha: fechaSeleccionada,
          hora_inicio: slotSeleccionado.hora_inicio,
          notas: clienteNotas.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // En caso de conflicto de horario (ej: 409)
        setErrorEnvio(data.error || 'Ocurrió un error al agendar la cita');
        // Recargar disponibilidad para reflejar el estado actual
        cargarDisponibilidad();
        return;
      }

      // Éxito: Guardar cita confirmada y lanzar confeti
      setCitaConfirmada({
        id: data.id,
        barbero: barberoSeleccionado,
        servicio: servicioSeleccionado,
        fecha: fechaSeleccionada,
        hora_inicio: slotSeleccionado.hora_inicio,
        hora_fin: slotSeleccionado.hora_fin,
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim(),
        precio: servicioSeleccionado.precio_cop
      });

      setPaso(5);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Ignorar si falla confetti
      }

    } catch (err) {
      setErrorEnvio('Error de conexión con el servidor. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  // Generar URL para WhatsApp
  function generarWhatsAppUrl() {
    if (!citaConfirmada) return '#';
    const telLimpio = (shopConfig.telefono_barberia || '573001234567').replace(/[^0-9]/g, '');
    const mensaje = encodeURIComponent(
      `¡Hola ${shopConfig.nombre_barberia || 'The Barber Club'}! Acabo de agendar mi turno:\n\n` +
      `👤 *Cliente:* ${citaConfirmada.clienteNombre}\n` +
      `✂️ *Barbero:* ${citaConfirmada.barbero.nombre}\n` +
      `💈 *Servicio:* ${citaConfirmada.servicio.nombre} (${formatCOP(citaConfirmada.precio)})\n` +
      `📅 *Fecha:* ${formatDateReadable(citaConfirmada.fecha)}\n` +
      `⏰ *Hora:* ${formatTime12(citaConfirmada.hora_inicio)}\n\n` +
      `¿Me confirman la reserva por favor? ¡Gracias!`
    );
    return `https://wa.me/${telLimpio}?text=${mensaje}`;
  }

  function reiniciarReserva() {
    setPaso(1);
    setBarberoSeleccionado(null);
    setServicioSeleccionado(null);
    setSlotSeleccionado(null);
    setClienteNombre('');
    setClienteTelefono('');
    setClienteNotas('');
    setCitaConfirmada(null);
    setErrorEnvio('');
  }

  function handleSelectBarberoFromMedia(barberoId) {
    const b = barberos.find(item => item.id === barberoId);
    if (b) {
      setBarberoSeleccionado(b);
      setPaso(2);
    }
  }

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Cargando barberos y servicios...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Encabezado Principal */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wider uppercase mb-2 sm:mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Agenda tu Cita en Línea
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
          {shopConfig.nombre_barberia || 'The Barber Club'}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-2 max-w-lg mx-auto">
          Selecciona a tu barbero de confianza, el servicio deseado y elige tu horario disponible al instante.
        </p>
      </div>

      {/* Barra de Progreso de Pasos (Optimizada para Móvil) */}
      {paso < 5 && (
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative px-2">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-300 rounded-full"
              style={{ width: `${((paso - 1) / 3) * 100}%` }}
            ></div>

            {[
              { num: 1, label: 'Barbero', icon: User },
              { num: 2, label: 'Servicio', icon: Scissors },
              { num: 3, label: 'Horario', icon: CalendarIcon },
              { num: 4, label: 'Tus Datos', icon: Clock }
            ].map((step) => {
              const Icon = step.icon;
              const isDone = paso > step.num;
              const isCurrent = paso === step.num;
              return (
                <div key={step.num} className="relative z-10 flex flex-col items-center">
                  <div 
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                      isDone 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : isCurrent
                        ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-md shadow-blue-500/20 scale-105 sm:scale-110'
                        : 'bg-white text-slate-400 border border-slate-300'
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-1.5 font-bold ${
                    isCurrent ? 'text-blue-600 font-extrabold' : isDone ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 1: SELECCIONAR BARBERO */}
      {/* ======================================================== */}
      {paso === 1 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Galería Multimedia de Redes Sociales sin salir de la página */}
          <ClientMediaFeed onSeleccionarBarbero={handleSelectBarberoFromMedia} />

          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 justify-center sm:justify-start">
              <User className="w-5 h-5 text-blue-600" />
              1. Selecciona a tu Barbero
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">Elige el profesional que cuidará de tu estilo</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {barberos.map((b) => {
              const isSelected = barberoSeleccionado?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setBarberoSeleccionado(b);
                    setPaso(2);
                  }}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer bg-slate-900/60 hover:bg-slate-800/80 ${
                    isSelected 
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={b.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&h=150&fit=crop&crop=faces'} 
                      alt={b.nombre} 
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 group-hover:border-amber-500/50 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base truncate group-hover:text-amber-400 transition-colors">
                        {b.nombre}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Horario: {formatTime12(b.horario_inicio)} - {formatTime12(b.horario_fin)}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-amber-400 font-medium">
                        <span>Seleccionar</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {barberos.length === 0 && (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <p className="text-slate-300 font-medium">No hay barberos activos en este momento.</p>
              <p className="text-slate-500 text-sm">Por favor comunícate directamente con la recepción.</p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 2: SELECCIONAR SERVICIO */}
      {/* ======================================================== */}
      {paso === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-blue-600" />
                2. Selecciona el Servicio
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                Barbero elegido: <span className="text-blue-600 font-bold">{barberoSeleccionado?.nombre}</span>
              </p>
            </div>
            <button
              onClick={() => setPaso(1)}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              Cambiar Barbero
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {servicios.map((s) => {
              const isSelected = servicioSeleccionado?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setServicioSeleccionado(s);
                    setPaso(3);
                  }}
                  className={`group p-5 rounded-2xl border transition-all cursor-pointer bg-slate-900/60 hover:bg-slate-800/80 flex flex-col justify-between ${
                    isSelected 
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors">
                        {s.nombre}
                      </h3>
                      <span className="text-amber-400 font-black text-lg whitespace-nowrap bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {formatCOP(s.precio_cop)}
                      </span>
                    </div>
                    {s.descripcion && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {s.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Duración: {s.duracion_minutos} min
                    </span>
                    <span className="text-amber-400 font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                      Elegir <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 3: FECHA Y HORA (CON PREVENCIÓN DE COLISIONES) */}
      {/* ======================================================== */}
      {paso === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                3. Elige Fecha y Hora
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                Con <span className="text-blue-600 font-bold">{barberoSeleccionado?.nombre}</span> para <span className="text-slate-800 font-bold">{servicioSeleccionado?.nombre}</span> ({servicioSeleccionado?.duracion_minutos} min)
              </p>
            </div>
            <button
              onClick={() => setPaso(2)}
              className="self-start sm:self-center flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              Cambiar Servicio
            </button>
          </div>

          {/* Carrusel de Próximos 14 Días */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Día de la Cita
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 no-scrollbar">
              {diasDisponibles.map((dia) => {
                const isSelected = fechaSeleccionada === dia.dateStr;
                return (
                  <button
                    key={dia.dateStr}
                    type="button"
                    onClick={() => setFechaSeleccionada(dia.dateStr)}
                    className={`flex-shrink-0 w-20 py-3 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[11px] uppercase tracking-wider opacity-80">
                      {dia.isToday ? 'Hoy' : dia.dayName}
                    </span>
                    <span className="text-xl font-extrabold my-0.5">
                      {dia.dayNumber}
                    </span>
                    <span className="text-[10px] uppercase opacity-75">
                      {dia.monthName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Horarios Disponibles */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base">
                  Horarios para el {formatDateReadable(fechaSeleccionada)}
                </h3>
                <p className="text-xs text-slate-400">
                  Las horas ocupadas o bloqueadas no se pueden seleccionar.
                </p>
              </div>
              <button 
                onClick={cargarDisponibilidad}
                title="Actualizar disponibilidad"
                className="text-slate-400 hover:text-amber-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className={`w-4 h-4 ${loadingSlots ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingSlots ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-medium">Verificando agenda y disponibilidad...</p>
              </div>
            ) : errorDisponibilidad ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorDisponibilidad}</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No hay turnos disponibles para esta fecha con el barbero seleccionado.</p>
                <p className="text-xs text-slate-500 mt-1">Por favor elige otro día o consulta con otro barbero.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {slots.map((s, idx) => {
                  const isSelected = slotSeleccionado?.hora_inicio === s.hora_inicio;
                  
                  if (!s.disponible) {
                    return (
                      <div
                        key={idx}
                        title={s.razon || 'Horario no disponible'}
                        className="py-3 px-2 rounded-xl bg-slate-950/50 border border-slate-800/60 text-slate-600 text-center cursor-not-allowed select-none flex flex-col items-center justify-center"
                      >
                        <span className="text-xs font-semibold line-through">
                          {formatTime12(s.hora_inicio)}
                        </span>
                        <span className="text-[10px] text-rose-400/80 font-medium truncate max-w-full px-1 mt-0.5">
                          {s.razon?.includes('Bloqueado') ? 'Bloqueado' : 'Ocupado'}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSlotSeleccionado(s)}
                      className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 hover:border-amber-500/50'
                      }`}
                    >
                      <span className="text-sm font-bold">
                        {formatTime12(s.hora_inicio)}
                      </span>
                      <span className="text-[10px] opacity-75 mt-0.5">
                        hasta {formatTime12(s.hora_fin)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botón para continuar */}
          <div className="flex justify-end pt-2">
            <button
              disabled={!slotSeleccionado}
              onClick={() => setPaso(4)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <span>Continuar con mis datos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 4: FORMULARIO DE DATOS DEL CLIENTE */}
      {/* ======================================================== */}
      {paso === 4 && (
        <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                4. Confirma tus Datos
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm">Necesitamos tu nombre y WhatsApp para guardar tu cita</p>
            </div>
            <button
              onClick={() => setPaso(3)}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              Cambiar Hora
            </button>
          </div>

          {/* Tarjeta Resumen del Turno */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              Resumen de tu Turno
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Barbero</span>
                <span className="font-semibold text-white">{barberoSeleccionado?.nombre}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Servicio</span>
                <span className="font-semibold text-white">{servicioSeleccionado?.nombre}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Fecha</span>
                <span className="font-semibold text-white">{formatDateReadable(fechaSeleccionada)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Hora</span>
                <span className="font-bold text-amber-400">{formatTime12(slotSeleccionado?.hora_inicio)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span>Valor a pagar en la barbería:</span>
              <span className="text-base font-extrabold text-amber-400">
                {formatCOP(servicioSeleccionado?.precio_cop)}
              </span>
            </div>
          </div>

          {errorEnvio && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorEnvio}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmitReserva} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tu Nombre Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Pérez"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Número de WhatsApp / Teléfono *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="Ej. 312 345 6789"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <Phone className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Te enviaremos los detalles y recordatorio de tu turno por WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Notas especiales para el barbero (Opcional)
              </label>
              <textarea
                rows="2"
                placeholder="Ej. Corte bajo con degradado en v, toalla extra caliente..."
                value={clienteNotas}
                onChange={(e) => setClienteNotas(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {enviando ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Confirmando tu reserva...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirmar Mi Cita Ahora</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 5: RESERVA EXITOSA Y BOTÓN WHATSAPP */}
      {/* ======================================================== */}
      {paso === 5 && citaConfirmada && (
        <div className="max-w-lg mx-auto animate-fadeIn text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white font-serif">
              ¡Turno Confirmado con Éxito!
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Te esperamos con el mejor servicio y estilo.
            </p>
          </div>

          {/* Ticket de Reserva */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left relative overflow-hidden shadow-2xl">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="border-b border-dashed border-slate-800 pb-4 mb-4">
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                Comprobante de Reserva
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {citaConfirmada.clienteNombre}
              </h3>
              <p className="text-xs text-slate-400">
                WhatsApp: {citaConfirmada.clienteTelefono}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Barbero Asignado:</span>
                <span className="font-semibold text-white">{citaConfirmada.barbero.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Servicio:</span>
                <span className="font-semibold text-white">{citaConfirmada.servicio.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Fecha:</span>
                <span className="font-semibold text-white">{formatDateReadable(citaConfirmada.fecha)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Horario:</span>
                <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {formatTime12(citaConfirmada.hora_inicio)} - {formatTime12(citaConfirmada.hora_fin)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-medium">Total a pagar:</span>
                <span className="text-xl font-extrabold text-amber-400">
                  {formatCOP(citaConfirmada.precio)}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones: WhatsApp y Nueva Cita */}
          <div className="space-y-3">
            <a
              href={generarWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Enviar Confirmación a WhatsApp</span>
            </a>

            <button
              onClick={reiniciarReserva}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-all"
            >
              Agendar otro turno
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
