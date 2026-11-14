import React, { useState, useEffect } from 'react';
import { 
  User, 
  Scissors, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle,
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Phone, 
  Sparkles,
  MessageCircle,
  RotateCcw,
  MapPin,
  Globe,
  CalendarCheck,
  Link2,
  AtSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCOP, formatDateReadable, formatTime12, getTodayStr, getNextDays } from '../utils/helpers';
import ClientMediaFeed from './ClientMediaFeed';
import ClientReviewsSection from './ClientReviewsSection';

const THEME_STYLES = {
  oscuro: {
    wrapper: 'bg-slate-950 text-slate-100',
    title: 'text-white',
    subtitle: 'text-slate-400',
    card: 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white shadow-md',
    cardSubtle: 'bg-slate-900/60 border-slate-800 text-slate-300',
    subCard: 'bg-slate-950/70 border-slate-800',
    trackBg: 'bg-slate-800',
    stepIdle: 'bg-slate-900 text-slate-400 border-slate-700',
    input: 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500',
    slotAvailable: 'bg-slate-800/90 border-slate-700 text-slate-200 hover:border-slate-600',
    slotUnavailable: 'bg-slate-950/60 border-slate-900 text-slate-600',
    dateBtnIdle: 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850',
    btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200'
  },
  claro: {
    wrapper: 'bg-[#f8fafc] text-slate-800',
    title: 'text-slate-900',
    subtitle: 'text-slate-500',
    card: 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs hover:shadow-md',
    cardSubtle: 'bg-slate-100/80 border-slate-200 text-slate-700',
    subCard: 'bg-slate-50 border-slate-200',
    trackBg: 'bg-slate-200',
    stepIdle: 'bg-white text-slate-400 border-slate-300',
    input: 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white',
    slotAvailable: 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs',
    slotUnavailable: 'bg-slate-100/60 border-slate-200 text-slate-400',
    dateBtnIdle: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700'
  },
  vintage: {
    wrapper: 'bg-[#0c0a09] text-amber-50',
    title: 'text-amber-100 font-serif',
    subtitle: 'text-amber-200/70',
    card: 'bg-[#1c1917] border-amber-900/40 hover:border-amber-800/60 text-amber-50 shadow-md',
    cardSubtle: 'bg-[#181513] border-amber-900/40 text-amber-200',
    subCard: 'bg-[#12100e] border-amber-900/40',
    trackBg: 'bg-stone-800',
    stepIdle: 'bg-[#1c1917] text-amber-400/50 border-amber-900/50',
    input: 'bg-[#141210] border-amber-900/50 text-amber-100 placeholder-amber-400/30',
    slotAvailable: 'bg-[#292524] border-amber-900/40 text-amber-100 hover:border-amber-700',
    slotUnavailable: 'bg-[#141210]/60 border-amber-950 text-amber-900/50',
    dateBtnIdle: 'bg-[#1c1917] border-amber-900/40 text-amber-200 hover:bg-[#292524]',
    btnSecondary: 'bg-stone-800 hover:bg-stone-700 text-amber-200'
  },
  cyber: {
    wrapper: 'bg-[#090d16] text-sky-50',
    title: 'text-sky-100',
    subtitle: 'text-sky-300/70',
    card: 'bg-[#111827]/90 border-sky-900/40 hover:border-sky-700/60 text-sky-100 shadow-md',
    cardSubtle: 'bg-[#0c1424] border-sky-900/40 text-sky-200',
    subCard: 'bg-[#060a12] border-sky-900/40',
    trackBg: 'bg-slate-800',
    stepIdle: 'bg-[#111827] text-sky-400/50 border-sky-900/50',
    input: 'bg-[#0b1120] border-sky-900/50 text-sky-100 placeholder-sky-400/30',
    slotAvailable: 'bg-[#1e293b] border-sky-900/40 text-sky-200 hover:border-sky-600',
    slotUnavailable: 'bg-[#0b1120]/60 border-sky-950 text-sky-900/50',
    dateBtnIdle: 'bg-[#111827] border-sky-900/40 text-sky-200 hover:bg-[#1e293b]',
    btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-sky-200'
  }
};

export default function ClientBooking({ shopConfig }) {
  const temaCliente = shopConfig?.tema_cliente || 'oscuro';
  const colorPrimario = shopConfig?.color_primario || '#2563eb';
  const t = THEME_STYLES[temaCliente] || THEME_STYLES.oscuro;

  // Control de vista: landing de barbería vs flujo de agendamiento
  const [mostrandoAgenda, setMostrandoAgenda] = useState(false);

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
  const [prefijoPais, setPrefijoPais] = useState('+57');
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
        const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';
        const [resB, resS] = await Promise.all([
          fetch(`/api/barberos?b=${encodeURIComponent(slug)}`),
          fetch(`/api/servicios?b=${encodeURIComponent(slug)}`)
        ]);
        const dataB = await resB.json();
        const dataS = await resS.json();
        setBarberos(Array.isArray(dataB) ? dataB : []);
        setServicios(Array.isArray(dataS) ? dataS : []);
      } catch (err) {
        console.error('Error cargando catálogo:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    cargarDatos();
  }, [shopConfig?.slug]);

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
      // CRÍTICO: pasar el slug de la barbería para multi-tenant correcto
      const slug = shopConfig?.slug || window.__BARBERIA_SLUG || sessionStorage.getItem('current_barberia_slug') || 'the-barber-club';
      const res = await fetch(`/api/disponibilidad?barbero_id=${barberoSeleccionado.id}&fecha=${fechaSeleccionada}&duracion_minutos=${duracion}&b=${encodeURIComponent(slug)}`, {
        headers: { 'x-barberia-slug': slug }
      });
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
    const telLimpio = clienteTelefono.replace(/\D/g, '');
    if (!clienteNombre.trim() || !telLimpio) {
      setErrorEnvio('Por favor completa tu nombre y número de WhatsApp');
      return;
    }

    if (telLimpio.length < 7 || telLimpio.length > 15) {
      setErrorEnvio('Por favor ingresa un número de teléfono válido (entre 7 y 15 dígitos)');
      return;
    }

    const telefonoCompleto = `${prefijoPais} ${telLimpio}`;

    setEnviando(true);
    setErrorEnvio('');

    try {
      const slug = shopConfig?.slug || window.__BARBERIA_SLUG || sessionStorage.getItem('current_barberia_slug') || 'the-barber-club';
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-barberia-slug': slug
        },
        body: JSON.stringify({
          barbero_id: barberoSeleccionado.id,
          servicio_id: servicioSeleccionado.id,
          cliente_nombre: clienteNombre.trim(),
          cliente_telefono: telefonoCompleto,
          fecha: fechaSeleccionada,
          hora_inicio: slotSeleccionado.hora_inicio,
          notas: clienteNotas.trim(),
          b: slug
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
        clienteTelefono: telefonoCompleto,
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
    setMostrandoAgenda(false);
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
      <div className={`flex flex-col items-center justify-center min-h-[70vh] text-center p-6 ${t.wrapper}`}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: colorPrimario, borderTopColor: 'transparent' }}></div>
        <p className={`font-medium text-sm ${t.subtitle}`}>Cargando perfil de la barbería...</p>
      </div>
    );
  }

  // ─── PANTALLA DE PERFIL DE BARBERÍA (antes del flujo de agenda) ───
  if (!mostrandoAgenda) {
    const ig = shopConfig?.instagram_url;
    const fb = shopConfig?.facebook_url;
    const web = shopConfig?.sitio_web;
    const tel = shopConfig?.telefono_barberia;
    const dir = shopConfig?.direccion_barberia;

    return (
      <div className={`min-h-screen transition-colors duration-300 ${t.wrapper}`}>
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col items-center text-center space-y-6">

          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            {shopConfig?.logo_url ? (
              <img
                src={shopConfig.logo_url}
                alt={shopConfig.nombre_barberia}
                className="w-28 h-28 rounded-3xl object-cover shadow-xl border-4 border-white/10"
              />
            ) : (
              <div
                className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-xl border-4 border-white/10 text-4xl font-black text-white"
                style={{ backgroundColor: colorPrimario }}
              >
                {(shopConfig?.nombre_barberia || 'B').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Nombre */}
            <div>
              <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${t.title}`}>
                {shopConfig?.nombre_barberia || 'Tu Barbería'}
              </h1>
              {shopConfig?.eslogan_barberia && (
                <p className={`text-sm mt-1.5 max-w-xs mx-auto leading-relaxed ${t.subtitle}`}>
                  {shopConfig.eslogan_barberia}
                </p>
              )}
            </div>
          </div>

          {/* Datos de contacto */}
          {(tel || dir) && (
            <div className={`w-full rounded-2xl border p-4 space-y-2.5 ${t.cardSubtle}`}>
              {tel && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Phone className="w-4 h-4 shrink-0" style={{ color: colorPrimario }} />
                  <span className={t.subtitle}>{tel}</span>
                </div>
              )}
              {dir && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: colorPrimario }} />
                  <span className={t.subtitle}>{dir}</span>
                </div>
              )}
            </div>
          )}

          {/* Redes sociales */}
          {(ig || fb || web) && (
            <div className="flex items-center justify-center gap-3">
              {ig && (
                <a
                  href={ig.startsWith('http') ? ig : `https://instagram.com/${ig.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: `${colorPrimario}20`, color: colorPrimario }}
                  title="Instagram"
                >
                  <AtSign className="w-5 h-5" />
                </a>
              )}
              {fb && (
                <a
                  href={fb.startsWith('http') ? fb : `https://facebook.com/${fb}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: `${colorPrimario}20`, color: colorPrimario }}
                  title="Facebook"
                >
                  <Link2 className="w-5 h-5" />
                </a>
              )}
              {web && (
                <a
                  href={web.startsWith('http') ? web : `https://${web}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: `${colorPrimario}20`, color: colorPrimario }}
                  title="Sitio Web"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
          )}

          {/* CTA Principal */}
          <button
            onClick={() => setMostrandoAgenda(true)}
            className="w-full py-4 rounded-2xl text-white font-black text-base shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            style={{ backgroundColor: colorPrimario, boxShadow: `0 8px 32px ${colorPrimario}50` }}
          >
            <CalendarCheck className="w-5 h-5" />
            <span>AGENDA TU CITA</span>
          </button>

          {/* Reseñas de clientes */}
          <div className="w-full">
            <ClientReviewsSection shopConfig={shopConfig} />
          </div>
        </div>
      </div>
    );
  }

  // ─── FLUJO DE AGENDAMIENTO ───
  return (
    <div className={`min-h-screen transition-colors duration-300 ${t.wrapper}`}>
      <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      
        {/* Encabezado compacto en el flujo de agenda */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { setMostrandoAgenda(false); setPaso(1); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors font-bold shrink-0 ${t.btnSecondary}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Perfil</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            {shopConfig?.logo_url && (
              <img
                src={shopConfig.logo_url}
                alt={shopConfig.nombre_barberia}
                className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
              />
            )}
            <span className={`font-black text-sm truncate ${t.title}`}>
              {shopConfig?.nombre_barberia}
            </span>
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shrink-0"
            style={{ backgroundColor: `${colorPrimario}15`, color: colorPrimario, borderColor: `${colorPrimario}40` }}
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Sin login</span>
          </div>
        </div>

        {/* Barra de Progreso de Pasos (Optimizada para Móvil) */}
        {paso < 5 && (
          <div className="py-2">
            <div className="flex items-center justify-between max-w-xl mx-auto relative px-2">
              <div className={`absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 z-0 rounded-full ${t.trackBg}`}></div>
              <div 
                className="absolute top-1/2 left-0 h-1 -translate-y-1/2 z-0 transition-all duration-300 rounded-full"
                style={{ width: `${((paso - 1) / 3) * 100}%`, backgroundColor: colorPrimario }}
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
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                        isDone 
                          ? 'text-white shadow-md'
                          : isCurrent
                          ? 'border-2 scale-105 sm:scale-110 shadow-md font-extrabold'
                          : t.stepIdle
                      }`}
                      style={
                        isDone 
                          ? { backgroundColor: colorPrimario, borderColor: colorPrimario } 
                          : isCurrent 
                          ? { borderColor: colorPrimario, color: colorPrimario, backgroundColor: 'transparent' }
                          : {}
                      }
                    >
                      {isDone ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span 
                      className={`text-[10px] sm:text-xs mt-1 font-bold ${
                        isCurrent ? 'font-black' : isDone ? '' : 'opacity-60'
                      }`}
                      style={isCurrent ? { color: colorPrimario } : {}}
                    >
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
      {/* PASO 1: SELECCIONAR BARBERO — diseño compacto premium   */}
      {/* ======================================================== */}
      {paso === 1 && (
        <div className="space-y-4 animate-fadeIn">
          {/* Galería Multimedia de Redes Sociales sin salir de la página */}
          <ClientMediaFeed onSeleccionarBarbero={handleSelectBarberoFromMedia} />

          <div>
            <h2 className={`text-base font-black flex items-center gap-2 ${t.title}`}>
              <User className="w-4 h-4" style={{ color: colorPrimario }} />
              <span>Selecciona tu Barbero</span>
            </h2>
            <p className={`text-xs mt-0.5 ${t.subtitle}`}>El profesional que cuidará de tu estilo</p>
          </div>

          {/* Lista compacta de barberos */}
          <div className="space-y-2">
            {barberos.map((b) => {
              const isSelected = barberoSeleccionado?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setBarberoSeleccionado(b);
                    setPaso(2);
                  }}
                  className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${t.card} ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={isSelected ? { borderColor: colorPrimario, boxShadow: `0 0 0 2px ${colorPrimario}30` } : {}}
                >
                  {/* Avatar pequeño */}
                  <img
                    src={b.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop&crop=faces'}
                    alt={b.nombre}
                    className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{b.nombre}</p>
                    <p className={`text-[11px] truncate ${t.subtitle}`}>
                      {b.especialidad ? `${b.especialidad} · ` : ''}
                      {formatTime12(b.horario_inicio)} – {formatTime12(b.horario_fin)}
                    </p>
                  </div>
                  {/* Flecha */}
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: colorPrimario }} />
                </div>
              );
            })}
          </div>

          {barberos.length === 0 && (
            <div className={`text-center py-10 rounded-2xl border ${t.card}`}>
              <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: colorPrimario }} />
              <p className="font-bold text-sm">No hay barberos activos en este momento.</p>
              <p className={`text-xs mt-1 ${t.subtitle}`}>Comunícate directamente con la recepción.</p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 2: SELECCIONAR SERVICIO */}
      {/* ======================================================== */}
      {paso === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={`text-lg sm:text-xl font-black flex items-center gap-2 ${t.title}`}>
                <Scissors className="w-5 h-5" style={{ color: colorPrimario }} />
                <span>2. Selecciona el Servicio</span>
              </h2>
              <p className={`text-xs sm:text-sm ${t.subtitle}`}>
                Barbero elegido: <span className="font-bold" style={{ color: colorPrimario }}>{barberoSeleccionado?.nombre}</span>
              </p>
            </div>
            <button
              onClick={() => setPaso(1)}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition-colors font-bold shrink-0 ${t.btnSecondary}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Cambiar Barbero</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {servicios.map((s) => {
              const isSelected = servicioSeleccionado?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setServicioSeleccionado(s);
                    setPaso(3);
                  }}
                  className={`group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${t.card} ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={isSelected ? { borderColor: colorPrimario, boxShadow: `0 0 0 2px ${colorPrimario}40` } : {}}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-base sm:text-lg group-hover:opacity-90 transition-opacity">
                        {s.nombre}
                      </h3>
                      <span 
                        className="font-black text-sm sm:text-base whitespace-nowrap px-2.5 py-1 rounded-xl border shrink-0"
                        style={{ 
                          backgroundColor: `${colorPrimario}15`, 
                          color: colorPrimario,
                          borderColor: `${colorPrimario}30`
                        }}
                      >
                        {formatCOP(s.precio_cop)}
                      </span>
                    </div>
                    {s.descripcion && (
                      <p className={`text-xs mt-2 line-clamp-2 ${t.subtitle}`}>
                        {s.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className={`flex items-center gap-1.5 font-medium ${t.subtitle}`}>
                      <Clock className="w-3.5 h-3.5" style={{ color: colorPrimario }} />
                      <span>{s.duracion_minutos} min</span>
                    </span>
                    <span className="font-bold flex items-center group-hover:translate-x-1 transition-transform" style={{ color: colorPrimario }}>
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
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className={`text-lg sm:text-xl font-black flex items-center gap-2 ${t.title}`}>
                <CalendarIcon className="w-5 h-5" style={{ color: colorPrimario }} />
                <span>3. Elige Fecha y Hora</span>
              </h2>
              <p className={`text-xs sm:text-sm ${t.subtitle}`}>
                Con <span className="font-bold" style={{ color: colorPrimario }}>{barberoSeleccionado?.nombre}</span> • {servicioSeleccionado?.nombre} ({servicioSeleccionado?.duracion_minutos} min)
              </p>
            </div>
            <button
              onClick={() => setPaso(2)}
              className={`self-start sm:self-center flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition-colors font-bold ${t.btnSecondary}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Cambiar Servicio</span>
            </button>
          </div>

          {/* Carrusel de Próximos 14 Días */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${t.subtitle}`}>
              Día de la Cita
            </label>
            <div className="flex gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar">
              {diasDisponibles.map((dia) => {
                const isSelected = fechaSeleccionada === dia.dateStr;
                return (
                  <button
                    key={dia.dateStr}
                    type="button"
                    onClick={() => setFechaSeleccionada(dia.dateStr)}
                    className={`flex-shrink-0 w-16 sm:w-20 py-2.5 sm:py-3 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                      isSelected
                        ? 'shadow-lg scale-105 font-bold'
                        : t.dateBtnIdle
                    }`}
                    style={isSelected ? { backgroundColor: colorPrimario, borderColor: colorPrimario, color: '#ffffff' } : {}}
                  >
                    <span className="text-[10px] uppercase tracking-wider opacity-80">
                      {dia.isToday ? 'Hoy' : dia.dayName}
                    </span>
                    <span className="text-lg sm:text-xl font-black my-0.5">
                      {dia.dayNumber}
                    </span>
                    <span className="text-[9px] uppercase opacity-75">
                      {dia.monthName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Horarios Disponibles */}
          <div className={`rounded-2xl p-4 sm:p-5 border ${t.cardSubtle}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-bold text-sm sm:text-base ${t.title}`}>
                  Horarios para el {formatDateReadable(fechaSeleccionada)}
                </h3>
                <p className={`text-xs ${t.subtitle}`}>
                  Turnos libres para tu cita.
                </p>
              </div>
              <button 
                onClick={cargarDisponibilidad}
                title="Actualizar disponibilidad"
                className="p-2 rounded-xl hover:opacity-80 transition-opacity"
                style={{ color: colorPrimario }}
              >
                <RotateCcw className={`w-4 h-4 ${loadingSlots ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingSlots ? (
              <div className={`py-12 flex flex-col items-center justify-center ${t.subtitle}`}>
                <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: colorPrimario, borderTopColor: 'transparent' }}></div>
                <p className="text-xs font-medium">Verificando agenda y disponibilidad...</p>
              </div>
            ) : errorDisponibilidad ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorDisponibilidad}</span>
              </div>
            ) : slots.length === 0 ? (
              <div className={`text-center py-8 ${t.subtitle}`}>
                <p className="text-sm font-semibold">No hay turnos disponibles para esta fecha con {barberoSeleccionado?.nombre}.</p>
                <p className="text-xs mt-1">Por favor elige otro día en el calendario arriba.</p>
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
                        className={`py-2.5 px-2 rounded-xl border text-center cursor-not-allowed select-none flex flex-col items-center justify-center ${t.slotUnavailable}`}
                      >
                        <span className="text-xs font-semibold line-through opacity-70">
                          {formatTime12(s.hora_inicio)}
                        </span>
                        <span className="text-[10px] text-rose-400 font-medium truncate max-w-full px-1 mt-0.5">
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
                      className={`py-3 px-2 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                        isSelected
                          ? 'font-black shadow-xl ring-4 ring-offset-2 ring-blue-500 scale-[1.04] z-10'
                          : t.slotAvailable
                      }`}
                      style={isSelected ? { backgroundColor: colorPrimario, borderColor: colorPrimario, color: '#ffffff' } : {}}
                    >
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-md border-2 border-white flex items-center justify-center animate-bounce">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      <span className="text-sm font-extrabold tracking-tight">
                        {formatTime12(s.hora_inicio)}
                      </span>
                      <span className="text-[10px] opacity-80 mt-0.5 font-medium">
                        hasta {formatTime12(s.hora_fin)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Banner de Confirmación Inmediata de Selección */}
          {slotSeleccionado && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider block">
                    ✓ Horario Seleccionado:
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {formatTime12(slotSeleccionado.hora_inicio)} - {formatTime12(slotSeleccionado.hora_fin)}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hidden sm:inline">
                Barbero: {barberoSeleccionado?.nombre}
              </span>
            </div>
          )}

          {/* Botón para continuar */}
          <div className="flex justify-end pt-2">
            <button
              disabled={!slotSeleccionado}
              onClick={() => setPaso(4)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              style={{ backgroundColor: colorPrimario }}
            >
              <span>
                {slotSeleccionado 
                  ? `Continuar con mis datos (${formatTime12(slotSeleccionado.hora_inicio)})`
                  : 'Selecciona una hora para continuar'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 4: FORMULARIO DE DATOS DEL CLIENTE */}
      {/* ======================================================== */}
      {paso === 4 && (
        <div className="space-y-5 animate-fadeIn max-w-xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={`text-lg sm:text-xl font-black flex items-center gap-2 ${t.title}`}>
                <User className="w-5 h-5" style={{ color: colorPrimario }} />
                <span>4. Confirma tus Datos</span>
              </h2>
              <p className={`text-xs sm:text-sm ${t.subtitle}`}>Ingresa tu nombre y WhatsApp para apartar tu cupo</p>
            </div>
            <button
              onClick={() => setPaso(3)}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition-colors font-bold shrink-0 ${t.btnSecondary}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Cambiar Hora</span>
            </button>
          </div>

          {/* Tarjeta Resumen del Turno */}
          <div className={`p-4 rounded-2xl border ${t.cardSubtle}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: colorPrimario }}>
              Resumen de tu Turno
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className={`text-[11px] block ${t.subtitle}`}>Barbero</span>
                <span className="font-bold">{barberoSeleccionado?.nombre}</span>
              </div>
              <div>
                <span className={`text-[11px] block ${t.subtitle}`}>Servicio</span>
                <span className="font-bold">{servicioSeleccionado?.nombre}</span>
              </div>
              <div>
                <span className={`text-[11px] block ${t.subtitle}`}>Fecha</span>
                <span className="font-bold">{formatDateReadable(fechaSeleccionada)}</span>
              </div>
              <div>
                <span className={`text-[11px] block ${t.subtitle}`}>Hora</span>
                <span className="font-black" style={{ color: colorPrimario }}>{formatTime12(slotSeleccionado?.hora_inicio)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className={t.subtitle}>Total a pagar en barbería:</span>
              <span className="text-base font-extrabold" style={{ color: colorPrimario }}>
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
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${t.subtitle}`}>
                Tu Nombre Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Pérez"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-colors border ${t.input}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${t.subtitle}`}>
                Número de WhatsApp / Celular *
              </label>
              <div className="flex gap-2">
                {/* Selector de Prefijo Internacional */}
                <select
                  value={prefijoPais}
                  onChange={(e) => setPrefijoPais(e.target.value)}
                  className={`w-32 rounded-xl px-2 py-3 text-xs font-bold focus:outline-none transition-colors border cursor-pointer shrink-0 ${t.input}`}
                >
                  <option value="+57">🇨🇴 +57 (Colombia)</option>
                  <option value="+1">🇺🇸 +1 (USA / Canadá)</option>
                  <option value="+34">🇪🇸 +34 (España)</option>
                  <option value="+52">🇲🇽 +52 (México)</option>
                  <option value="+58">🇻🇪 +58 (Venezuela)</option>
                  <option value="+593">🇪🇨 +593 (Ecuador)</option>
                  <option value="+51">🇵🇪 +51 (Perú)</option>
                  <option value="+56">🇨🇱 +56 (Chile)</option>
                  <option value="+54">🇦🇷 +54 (Argentina)</option>
                  <option value="+507">🇵🇦 +507 (Panamá)</option>
                  <option value="+506">🇨🇷 +506 (Costa Rica)</option>
                  <option value="+502">🇬🇹 +502 (Guatemala)</option>
                  <option value="+503">🇸🇻 +503 (El Salvador)</option>
                  <option value="+504">🇭🇳 +504 (Honduras)</option>
                  <option value="+505">🇳🇮 +505 (Nicaragua)</option>
                  <option value="+591">🇧🇴 +591 (Bolivia)</option>
                  <option value="+595">🇵🇾 +595 (Paraguay)</option>
                  <option value="+598">🇺🇾 +598 (Uruguay)</option>
                  <option value="+1">🇩🇴 +1 (Rep. Dominicana)</option>
                  <option value="+1">🇵🇷 +1 (Puerto Rico)</option>
                  <option value="+44">🇬🇧 +44 (Reino Unido)</option>
                  <option value="+33">🇫🇷 +33 (Francia)</option>
                  <option value="+49">🇩🇪 +49 (Alemania)</option>
                  <option value="+39">🇮🇹 +39 (Italia)</option>
                </select>

                <div className="relative flex-1">
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    placeholder="Ej. 3001234567"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value.replace(/\D/g, ''))}
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none transition-colors border ${t.input}`}
                  />
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
                </div>
              </div>
              <p className={`text-[11px] mt-1 ${t.subtitle}`}>
                Elige el prefijo de tu país e ingresa tu número para enviar el recordatorio.
              </p>
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${t.subtitle}`}>
                Notas para el barbero (Opcional)
              </label>
              <textarea
                rows="2"
                placeholder="Ej. Degradado bajo, toalla caliente..."
                value={clienteNotas}
                onChange={(e) => setClienteNotas(e.target.value)}
                className={`w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors border ${t.input}`}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3.5 rounded-xl text-white font-black text-sm tracking-wide shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: colorPrimario }}
            >
              {enviando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Confirmando tu reserva...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirmar Cita Ahora</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 5: CITA CONFIRMADA EXITOSAMENTE */}
      {/* ======================================================== */}
      {paso === 5 && citaConfirmada && (
        <div className="space-y-6 animate-fadeIn max-w-lg mx-auto text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              ¡Tu Cita está Confirmada!
            </span>
            <h2 className={`text-2xl font-black mt-1 ${t.title}`}>
              Te esperamos, {citaConfirmada.clienteNombre}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${t.subtitle}`}>
              Guarda tu comprobante o envíalo a WhatsApp para asegurar tu turno.
            </p>
          </div>

          {/* Tarjeta Comprobante */}
          <div className={`p-5 rounded-3xl border text-left space-y-4 shadow-xl ${t.card}`}>
            <div className="border-b border-white/10 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colorPrimario }}>
                Comprobante Oficial de Reserva
              </span>
              <h3 className="text-base font-bold mt-0.5">
                {citaConfirmada.clienteNombre}
              </h3>
              <p className={`text-xs ${t.subtitle}`}>
                WhatsApp: {citaConfirmada.clienteTelefono}
              </p>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className={t.subtitle}>Barbero Asignado:</span>
                <span className="font-bold">{citaConfirmada.barbero.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={t.subtitle}>Servicio:</span>
                <span className="font-bold">{citaConfirmada.servicio.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={t.subtitle}>Fecha:</span>
                <span className="font-bold">{formatDateReadable(citaConfirmada.fecha)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={t.subtitle}>Horario:</span>
                <span 
                  className="font-bold px-2.5 py-0.5 rounded-lg border text-xs"
                  style={{ 
                    backgroundColor: `${colorPrimario}15`, 
                    color: colorPrimario,
                    borderColor: `${colorPrimario}30`
                  }}
                >
                  {formatTime12(citaConfirmada.hora_inicio)} - {formatTime12(citaConfirmada.hora_fin)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
                <span className="font-bold">Total a pagar:</span>
                <span className="text-lg font-black" style={{ color: colorPrimario }}>
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
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all ${t.btnSecondary}`}
            >
              Agendar otro turno
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN PÚBLICA DE RESEÑAS Y CALIFICACIONES DE CLIENTES */}
      <ClientReviewsSection shopConfig={shopConfig} />

      </div>
    </div>
  );
}
