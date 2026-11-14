import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Smartphone,
  Star,
  Users,
  Award,
  Check,
  X,
  Store,
  Receipt,
  HelpCircle,
  Flame,
  BadgePercent,
  QrCode,
  HeartHandshake,
  Bot,
  UserCheck,
  Gift,
  MapPin,
  ChevronRight,
  Zap,
  Coffee,
  ThumbsUp
} from 'lucide-react';

export default function LandingPage({
  onIrABarberia,
  onAbrirLogin,
  configCMS = null
}) {
  const [config, setConfig] = useState(configCMS);
  const [cargando, setCargando] = useState(!configCMS);
  const [armaActiva, setArmaActiva] = useState(0); // 0 a 5 para el showcase interactivo
  const [sellosSimulados, setSellosSimulados] = useState(5);
  const [faqAbierta, setFaqAbierta] = useState(null);
  const [tabComparativa, setTabComparativa] = useState('despues'); // 'antes' vs 'despues'

  useEffect(() => {
    if (configCMS) {
      setConfig(configCMS);
      setCargando(false);
      return;
    }

    async function cargarLanding() {
      try {
        const res = await fetch('/api/landing-config');
        if (res.ok) {
          const json = await res.json();
          if (json.data) setConfig(json.data);
        }
      } catch (e) {
        console.error('Error cargando landing config:', e);
      } finally {
        setCargando(false);
      }
    }
    cargarLanding();
  }, [configCMS]);

  const general = config?.general || {
    whatsapp_comercial: '573114220554',
    whatsapp_mensaje_demo: 'Hola EXAKTA, quiero ver una demostración y saber cómo digitalizar mi barbería.',
    demo_slug: 'the-barber-club'
  };

  const planes = config?.planes || [
    {
      id: 'basico',
      nombre: 'Plan Emprendedor',
      precio_cop: 80000,
      periodo: 'mes',
      badge: 'Para Empezar',
      descripcion: 'Para barberos independientes o estudios de 1 a 2 sillas que quieren ordenar sus citas.',
      caracteristicas: [
        'Hasta 2 Barberos activos',
        'Agenda web en tiempo real 24/7',
        'Recordatorios de citas automáticos a WhatsApp',
        'Cero descargas de apps para el cliente',
        'Tu propio enlace exclusivo (exakta.online/b/tu-marca)'
      ],
      destacado: false
    },
    {
      id: 'pro',
      nombre: 'Plan Barbería Pro',
      precio_cop: 180000,
      periodo: 'mes',
      badge: 'EL MÁS ELEGIDO',
      descripcion: 'Para barberías con equipo que necesitan liquidar comisiones rápido y llenar días flojos.',
      caracteristicas: [
        'Hasta 6 Barberos activos',
        '⭐️ Google Reviews Flex (Más clientes en Maps)',
        '🧾 Tirilla Digital & Recibo POS con código QR',
        '✂️ Ficha Técnica y fórmula de corte de clientes',
        '💵 Liquidación automática de comisiones en 1 clic',
        'Portal móvil privado para cada barbero',
        'Control de caja diaria y egresos limpios'
      ],
      destacado: true
    },
    {
      id: 'vip',
      nombre: 'Plan VIP Franquicia',
      precio_cop: 320000,
      periodo: 'mes',
      badge: 'SIN LÍMITES',
      descripcion: 'Control absoluto para barberías grandes, estudios premium y franquicias.',
      caracteristicas: [
        'Barberos ilimitados',
        '💳 Tarjeta Digital VIP con sellos móviles para clientes',
        '🤖 Asistente de Reactivación para llenar martes y miércoles',
        'Galería de cortes y estilos en alta definición',
        'Auditoría y reportes de rentabilidad neta',
        'Acompañamiento VIP prioritario 1 a 1 por WhatsApp'
      ],
      destacado: false
    }
  ];

  function abrirWhatsApp(mensajePersonalizado = '') {
    const tel = general?.whatsapp_comercial || '573114220554';
    const msg = encodeURIComponent(
      mensajePersonalizado ||
      general?.whatsapp_mensaje_demo ||
      'Hola EXAKTA, quiero ver una demostración y conocer cómo funciona en mi barbería.'
    );
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  }

  function irADemo() {
    const slug = general?.demo_slug || 'the-barber-club';
    if (onIrABarberia) {
      onIrABarberia(slug);
    } else {
      window.location.href = `/b/${slug}`;
    }
  }

  // Las 6 Armas Clave de EXAKTA para barberías colombianas
  const armasSecretas = [
    {
      id: 'reviews',
      titulo: 'Google Reviews Flex',
      subtitulo: 'Aparece de primero en Google Maps sin pagar publicidad',
      icono: Star,
      color: 'from-amber-500 to-yellow-600',
      badge: 'Multiplicador de Clientes',
      resumen: 'Al terminar cada corte, el sistema envía un mensaje con 1 toque al WhatsApp del cliente pidiéndole su reseña de 5 estrellas.',
      beneficioClave: 'Tu barbería se posiciona sobre tu competencia en las búsquedas de tu ciudad en automático.'
    },
    {
      id: 'pos',
      titulo: 'Tirilla Digital POS con QR',
      subtitulo: 'Recibo profesional en el celular del cliente',
      icono: Receipt,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Cero Papel Térmico',
      resumen: 'Tirilla con desglose de servicios, cortes, productos y código QR. Se envía directo al WhatsApp del cliente.',
      beneficioClave: 'Ahorras en rollos de papel térmico y las propinas quedan 100% transparentes para el barbero.'
    },
    {
      id: 'ficha',
      titulo: 'Ficha Técnica de Estilo',
      subtitulo: 'Si el barbero de siempre no vino, el corte sale idéntico',
      icono: Scissors,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Historial CRM del Cliente',
      resumen: 'Guarda la fórmula exacta: número de máquina (fade, #1.5, tijera), barba, remolinos y fotos antes/después.',
      beneficioClave: 'Cero clientes molestos diciendo: "El nuevo no me cortó como a mí me gusta".'
    },
    {
      id: 'vip',
      titulo: 'Tarjeta VIP con Sellos Móviles',
      subtitulo: 'Fidelización en el teléfono del cliente sin cartones perdidos',
      icono: Gift,
      color: 'from-purple-500 to-pink-600',
      badge: 'Monedero Digital QR',
      resumen: 'El cliente guarda su tarjeta VIP en la pantalla de su celular. Acumula sellos por corte y redime premios (ej. corte gratis o cerveza).',
      beneficioClave: 'Nunca más clientes con la tarjeta de cartón arrugada o botada en la casa.'
    },
    {
      id: 'ia',
      titulo: 'Llenador de Días Muertos',
      subtitulo: 'Semáforo de clientes que llena tus martes y miércoles',
      icono: Bot,
      color: 'from-rose-500 to-orange-600',
      badge: 'Asistente de Reactivación',
      resumen: 'Detecta en semáforo (amarillo y rojo) a clientes que llevan más de 20 días sin venir y redacta mensajes de WhatsApp listos para enviar.',
      beneficioClave: 'Transforma los días más flojos de la semana en jornadas llenas con un solo toque.'
    },
    {
      id: 'liquidacion',
      titulo: 'Liquidación en 1 Clic',
      subtitulo: 'Sábados sin calculadoras, sin planillas y sin discusiones',
      icono: DollarSign,
      color: 'from-emerald-600 to-green-700',
      badge: 'Paz Mental para el Dueño',
      resumen: 'Calcula comisiones por corte (%), productos vendidos, adelantos y propinas en 2 segundos. Envía el comprobante oficial al WhatsApp privado del barbero.',
      beneficioClave: 'Te ahorras 4 horas cada fin de semana sumando papelitos arrugados.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Luces y Atmósfera Premium Barber Shop (Oro, Azul Noche y Esmeralda) */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-amber-500/15 via-blue-600/10 to-transparent blur-[140px] rounded-full -z-10" />
      <div className="pointer-events-none absolute top-[900px] -left-48 w-[500px] h-[500px] bg-emerald-600/10 blur-[150px] rounded-full -z-10" />
      <div className="pointer-events-none absolute top-[2100px] -right-48 w-[600px] h-[600px] bg-amber-600/10 blur-[160px] rounded-full -z-10" />

      {/* =========================================================================
          1. HEADER / NAVBAR ELEGANTE Y DIRECTO
      ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070a11]/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo EXAKTA */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-600 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
                <Scissors className="w-5 h-5 text-amber-400 transform -rotate-45" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-white">EXAKTA</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Barber Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Hecho para Barberías en Colombia 🇨🇴</p>
            </div>
          </div>

          {/* Menú Rápido */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#showcase" className="hover:text-amber-400 transition-colors">Las 6 Armas Clave</a>
            <a href="#comparativa" className="hover:text-amber-400 transition-colors">El Caos vs EXAKTA</a>
            <a href="#planes" className="hover:text-amber-400 transition-colors">Planes en Pesos</a>
            <a href="#faqs" className="hover:text-amber-400 transition-colors">Preguntas</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={irADemo}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-sm"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Ver Barbería en Vivo</span>
              <span className="sm:hidden">Demo</span>
            </button>

            <button
              onClick={() => abrirWhatsApp()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageCircle className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Pedir Demo</span>
            </button>

            {onAbrirLogin && (
              <button
                onClick={onAbrirLogin}
                className="hidden md:inline-flex px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Acceso Dueños
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION: DIRECTO AL GRANO, PERSUASIVO Y VISUAL
      ========================================================================= */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Badge Colombiano */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-bold mb-6 shadow-inner animate-fade-in">
          <span>🇨🇴 Especializado para Barberías y Salones en Colombia</span>
        </div>

        {/* Titular Gancho */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] max-w-4xl mx-auto mb-6">
          Llena tus sillas los días flojos y liquida a tus barberos{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
            en 1 solo clic.
          </span>
        </h1>

        {/* Subtítulo Corto */}
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed font-normal">
          Sin cuadernos manchados, sin clientes que no llegan y sin peleas por comisiones los sábados. La plataforma que pone tu negocio en piloto automático.
        </p>

        {/* Llamado a la Acción Prominente */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-12">
          <button
            onClick={() => abrirWhatsApp('Hola EXAKTA, quiero ver cómo llenar las sillas de mi barbería y liquidar comisiones en 1 clic.')}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-2xl shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <MessageCircle className="w-5 h-5 text-slate-950 fill-slate-950" />
            <span>Hablar por WhatsApp con un Asesor</span>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>

          <button
            onClick={irADemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all"
          >
            <Store className="w-5 h-5 text-amber-400" />
            <span>Ver Barbería Demo</span>
          </button>
        </div>

        {/* Barra de 4 Números de Confianza */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-8 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <span className="block text-2xl sm:text-3xl font-black text-amber-400">+35%</span>
            <span className="text-xs text-slate-400 font-semibold">Más citas en martes y miércoles</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <span className="block text-2xl sm:text-3xl font-black text-emerald-400">4 Horas</span>
            <span className="text-xs text-slate-400 font-semibold">Ahorradas los fines de semana</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <span className="block text-2xl sm:text-3xl font-black text-blue-400">0 Apps</span>
            <span className="text-xs text-slate-400 font-semibold">Tu cliente agenda sin descargar nada</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <span className="block text-2xl sm:text-3xl font-black text-purple-400">100% $ COP</span>
            <span className="text-xs text-slate-400 font-semibold">Sin cobros abusivos en dólares</span>
          </div>
        </div>

      </section>

      {/* =========================================================================
          3. SHOWCASE INTERACTIVO: LAS 6 ARMAS POTENTES DE EXAKTA
      ========================================================================= */}
      <section id="showcase" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tecnología Práctica • Cero Enredos</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Las 6 armas que duplican la rentabilidad de tu barbería
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Toca cualquiera de las tarjetas para ver cómo funciona en pantalla real:
          </p>
        </div>

        {/* Selector de Pestañas de las 6 Armas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-10">
          {armasSecretas.map((arma, idx) => {
            const Icon = arma.icono;
            const activa = armaActiva === idx;
            return (
              <button
                key={arma.id}
                onClick={() => setArmaActiva(idx)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  activa
                    ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40 transform -translate-y-1'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activa ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">0{idx + 1}</span>
                </div>
                <div>
                  <h4 className={`text-xs font-bold leading-tight ${activa ? 'text-white' : 'text-slate-300'}`}>
                    {arma.titulo}
                  </h4>
                  <span className="text-[10px] text-amber-400/90 font-medium block mt-1">
                    {arma.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visualizador de la Pantalla / Maqueta Activa */}
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-[#0b0f19] to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Explicación en Palabras Simples (Columna Izquierda) */}
            <div className="lg:col-span-5 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase">
                <span>Herramienta #{armaActiva + 1} de 6</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {armasSecretas[armaActiva].titulo}
              </h3>
              <p className="text-sm font-semibold text-amber-400">
                {armasSecretas[armaActiva].subtitulo}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {armasSecretas[armaActiva].resumen}
              </p>
              
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="text-amber-400 font-black uppercase text-[11px] block">
                  Beneficio Real para tu Bolsillo:
                </span>
                <p className="leading-relaxed font-medium">
                  {armasSecretas[armaActiva].beneficioClave}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => abrirWhatsApp(`Hola EXAKTA, quiero ver en vivo cómo funciona la herramienta de "${armasSecretas[armaActiva].titulo}".`)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md"
                >
                  <MessageCircle className="w-4 h-4 fill-slate-950" />
                  <span>Quiero esto en mi barbería</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulador Interactivo de Teléfono Móvil (Columna Derecha) */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-sm rounded-[36px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border border-slate-700/80 shadow-2xl shadow-black/80">
                <div className="rounded-[28px] bg-[#0c101b] border border-slate-800 p-5 text-left text-slate-100 overflow-hidden relative min-h-[440px] flex flex-col justify-between">
                  
                  {/* Barra superior de celular simulada */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-[10px] text-slate-400 font-mono">
                    <span className="font-bold text-white">9:41 AM</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>EXAKTA Cloud</span>
                    </div>
                  </div>

                  {/* VISTA 1: Google Reviews Flex */}
                  {armaActiva === 0 && (
                    <div className="py-4 space-y-4 animate-fade-in my-auto">
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                        <div className="flex items-center justify-center gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-6 h-6 fill-amber-400" />
                          ))}
                        </div>
                        <h5 className="text-sm font-black text-white">Reseña Automática en Google Maps</h5>
                        <p className="text-xs text-slate-300">
                          Mensaje enviado al WhatsApp del cliente 15 min después del corte:
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp • The Barber Club</span>
                        </div>
                        <p className="text-slate-300 text-xs italic">
                          "¡Hola Carlos! 💈 Esperamos que hayas disfrutado tu corte hoy con Mateo. ¿Nos regalas tu opinión de 5 estrellas en Google? Solo toma 10 segundos 👇"
                        </p>
                        <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold text-center text-[11px]">
                          ⭐⭐⭐⭐⭐ Calificar en Google Maps
                        </div>
                      </div>

                      <div className="text-center text-[11px] text-emerald-400 font-bold">
                        ✓ 42 nuevas reseñas de 5 estrellas este mes
                      </div>
                    </div>
                  )}

                  {/* VISTA 2: Tirilla Digital POS */}
                  {armaActiva === 1 && (
                    <div className="py-2 space-y-3 animate-fade-in my-auto">
                      <div className="bg-white text-slate-950 p-4 rounded-2xl font-mono text-xs space-y-2 shadow-xl border border-slate-300">
                        <div className="text-center border-b border-dashed border-slate-400 pb-2">
                          <p className="font-black text-sm">THE BARBER CLUB</p>
                          <p className="text-[10px] text-slate-600">NIT: 901.458.120-1 • Bogotá</p>
                          <p className="text-[10px] text-slate-500 font-bold">RECIBO DIGITAL #0482</p>
                        </div>

                        <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                          <div className="flex justify-between">
                            <span>Corte Clásico + Lavado</span>
                            <span className="font-bold">$30.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Perfilado de Barba</span>
                            <span className="font-bold">$15.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cera Fijadora Mate</span>
                            <span className="font-bold">$25.000</span>
                          </div>
                        </div>

                        <div className="flex justify-between font-black text-sm pt-1">
                          <span>TOTAL PAGADO:</span>
                          <span className="text-emerald-700">$70.000 COP</span>
                        </div>

                        <div className="text-[10px] text-slate-600 pt-1 text-center border-t border-slate-200">
                          Barbero: <strong>Santiago O.</strong> • Propina: $5.000 (100% barbero)
                        </div>

                        <div className="flex justify-center pt-1">
                          <QrCode className="w-10 h-10 text-slate-900" />
                        </div>
                      </div>

                      <button
                        onClick={() => abrirWhatsApp('Hola, me interesa la tirilla digital POS para mi barbería.')}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Enviar Tirilla por WhatsApp</span>
                      </button>
                    </div>
                  )}

                  {/* VISTA 3: Ficha Técnica de Estilo */}
                  {armaActiva === 2 && (
                    <div className="py-2 space-y-3 animate-fade-in my-auto">
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 font-black flex items-center justify-center text-xs">
                              AG
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-white">Andrés Gómez</h5>
                              <span className="text-[10px] text-slate-400">Cliente VIP • 14 visitas</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            Fórmula Activa
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <p><strong className="text-amber-400">Laterales:</strong> Mid Fade (Guía #1.5 palanca abierta a navaja)</p>
                          <p><strong className="text-amber-400">Parte Alta:</strong> Texturizado a tijera 4cm con textura mate</p>
                          <p><strong className="text-amber-400">Barba:</strong> Cuadrada perfilada, aceite de eucalipto</p>
                          <p className="text-[11px] text-rose-300 italic pt-1">
                            ⚠️ Cuidado con remolino en coronilla izquierda
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                        <p className="text-xs text-emerald-300 font-bold">
                          ✓ Cualquier barbero de tu equipo puede hacerle el mismo corte sin equivocarse.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* VISTA 4: Tarjeta VIP Digital con Sellos */}
                  {armaActiva === 3 && (
                    <div className="py-2 space-y-3 animate-fade-in my-auto">
                      <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-950/60 via-slate-900 to-yellow-950/50 border border-amber-500/40 space-y-3 text-center">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-amber-400 tracking-wider">THE BARBER CLUB VIP</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: #9931</span>
                        </div>

                        <div className="py-2">
                          <p className="text-xs text-slate-300 font-semibold mb-2">Sellos por Corte:</p>
                          <div className="grid grid-cols-6 gap-2 max-w-[240px] mx-auto">
                            {[1, 2, 3, 4, 5, 6].map((s) => (
                              <div
                                key={s}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                  s <= sellosSimulados
                                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105'
                                    : 'bg-slate-800 text-slate-600 border border-slate-700'
                                }`}
                              >
                                {s <= sellosSimulados ? '✂️' : s}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-300 font-bold">
                          {sellosSimulados >= 6
                            ? '🎉 ¡Corte #6 GRATIS desbloqueado!'
                            : `¡Te falta solo 1 corte para reclamar tu premio!`}
                        </div>
                      </div>

                      <button
                        onClick={() => setSellosSimulados(sellosSimulados >= 6 ? 1 : sellosSimulados + 1)}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Toca para simular +1 Sello VIP</span>
                      </button>
                    </div>
                  )}

                  {/* VISTA 5: Llenador de Días Muertos (Semáforo IA) */}
                  {armaActiva === 4 && (
                    <div className="py-2 space-y-2.5 animate-fade-in my-auto">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-1">
                        <span>Semáforo de Clientes</span>
                        <span className="text-amber-400">Martes y Miércoles</span>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-white">🔴 Carlos Méndez</p>
                          <p className="text-[10px] text-slate-400">Hace 28 días no viene (Riesgo)</p>
                        </div>
                        <button
                          onClick={() => abrirWhatsApp('Hola Carlos, te extrañamos en The Barber Club. Este martes tenemos 20% OFF en tu corte.')}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold"
                        >
                          Llenar Martes
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-white">🟡 David Rincón</p>
                          <p className="text-[10px] text-slate-400">Hace 18 días no viene (Toca corte)</p>
                        </div>
                        <button
                          onClick={() => abrirWhatsApp('Hola David, te toca mantenimiento de corte.')}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold"
                        >
                          Recordar
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center text-[11px] text-emerald-300 font-bold">
                        ✓ Llena los horarios muertos sin rogarle a nadie.
                      </div>
                    </div>
                  )}

                  {/* VISTA 6: Liquidación de Barberos en 1 Clic */}
                  {armaActiva === 5 && (
                    <div className="py-2 space-y-2.5 animate-fade-in my-auto">
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                          <div>
                            <p className="font-black text-white">Mateo Barber</p>
                            <p className="text-[10px] text-slate-400">Liquidación Semanal (1 al 7)</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            Comisión 60%
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-300">
                          <div className="flex justify-between">
                            <span>34 Cortes realizados:</span>
                            <span className="font-bold text-white">$1.020.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Comisión barbero (60%):</span>
                            <span className="font-bold text-emerald-400">$612.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>8 Pomadas vendidas (20%):</span>
                            <span className="font-bold text-emerald-400">$40.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Propinas recibidas:</span>
                            <span className="font-bold text-emerald-400">$45.000</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm">
                          <span>A PAGAR LIMPIO:</span>
                          <span className="text-emerald-400">$697.000 COP</span>
                        </div>
                      </div>

                      <button
                        onClick={() => abrirWhatsApp('Hola Mateo, aquí tienes el desglose oficial de tu liquidación semanal.')}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Enviar Comprobante a su WhatsApp</span>
                      </button>
                    </div>
                  )}

                  {/* Pie de pantalla de celular */}
                  <div className="pt-3 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
                    Control 100% en la Nube • Respaldado Automáticamente
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* =========================================================================
          4. COMPARATIVA VISUAL DIRECTA: EL CAOS DE ANTES vs TU NEGOCIO CON EXAKTA
      ========================================================================= */}
      <section id="comparativa" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Flame className="w-3.5 h-3.5" />
            <span>La Realidad de Muchas Barberías</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            ¿Cómo manejas tu barbería hoy vs con EXAKTA?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            La diferencia entre perder plata cada semana o tener el control exacto de tu negocio:
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* EL CAOS DE ANTES (ROJO) */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-rose-950/20 via-slate-950 to-slate-950 border border-rose-900/40 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-rose-900/40">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <X className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">El Caos del Cuaderno y WhatsApp</h3>
                <span className="text-xs text-rose-400 font-semibold">Sin EXAKTA</span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p><strong>Cuentas los sábados a medianoche:</strong> Sumando papelitos manchados y recibos arrugados con calculadora.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p><strong>Discusiones con los barberos:</strong> "A mí me salieron 2 cortes más, esa cuenta está mal". Desconfianza en el equipo.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p><strong>Sillas vacías los martes:</strong> Clientes que se les olvida el turno o no confirman y te dejan el hueco de 45 minutos.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p><strong>Pagar softwares en dólares:</strong> WeiBook a US$ 99/mes (~$390.000 COP) o BEWE cobrando paquetes extra por cada mensaje.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p><strong>Caja ciega:</strong> Entra plata todo el día pero a final de mes no sabes cuánto quedó libre tras arriendo e insumos.</p>
              </div>
            </div>
          </div>

          {/* CON EXAKTA (VERDE / ORO) */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-emerald-950/30 via-slate-950 to-slate-950 border-2 border-emerald-500/50 space-y-5 shadow-2xl shadow-emerald-500/10">
            <div className="flex items-center gap-3 pb-4 border-b border-emerald-900/40">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Tu Barbería en Piloto Automático</h3>
                <span className="text-xs text-emerald-400 font-bold">Con EXAKTA</span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Liquidación en 1 Clic:</strong> El sistema calcula comisiones al centavo y envía el comprobante oficial al WhatsApp privado del barbero.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Transparencia total:</strong> Cada barbero ve en su propio celular los cortes que ha hecho hoy, sin ver la caja del negocio.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Agenda llena 24/7 sin descargar apps:</strong> Tus clientes agendan solos desde tu Instagram o WhatsApp en 20 segundos.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Tarifas fijas en Pesos ($ COP):</strong> Precios justos colombianos con integración nativa de WhatsApp sin cobros sorpresas.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Dinero limpio exacto:</strong> Sabes exactamente cuánto vendiste, cuánto pagaste en comisiones y cuánto te quedó libre de ganancia.</p>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* =========================================================================
          5. PLANES Y PRECIOS CLAROS EN PESOS COLOMBIANOS ($ COP)
      ========================================================================= */}
      <section id="planes" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Tarifas Claras • Facturación en Pesos</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Planes diseñados para el tamaño de tu barbería
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Sin contratos amarrados, sin comisiones por corte y con soporte continuo por WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {planes.map((plan, idx) => {
            const esPro = plan.destacado || plan.id === 'pro';
            return (
              <div
                key={plan.id || idx}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                  esPro
                    ? 'bg-gradient-to-b from-[#131c2e] via-[#0d1424] to-[#080d18] border-2 border-amber-400 shadow-2xl shadow-amber-500/15 transform lg:-translate-y-2'
                    : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Badge Superior */}
                {plan.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      esPro
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-white mb-1.5">{plan.nombre}</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed min-h-[36px]">
                    {plan.descripcion}
                  </p>

                  {/* Precio en Pesos Colombianos */}
                  <div className="pb-6 mb-6 border-b border-slate-800">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        ${Number(plan.precio_cop || 0).toLocaleString('es-CO')}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        COP / {plan.periodo || 'mes'}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                      ✓ $0 costo extra por WhatsApp
                    </span>
                  </div>

                  {/* Lista de Beneficios */}
                  <div className="space-y-3 mb-8 text-xs text-slate-300">
                    {(plan.caracteristicas || []).map((carac, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{carac}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() =>
                    abrirWhatsApp(
                      `Hola EXAKTA, quiero activar el ${plan.nombre} ($${Number(
                        plan.precio_cop || 0
                      ).toLocaleString('es-CO')} COP/mes) para mi barbería.`
                    )
                  }
                  className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                    esPro
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-400/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Activar Mi Barbería</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Garantía de Seguridad Simple */}
        <div className="mt-10 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center max-w-2xl mx-auto flex items-center justify-center gap-3 text-xs text-slate-300">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <span>
            <strong>Tranquilidad Garantizada:</strong> Tus datos y tu dinero están 100% protegidos con copias de seguridad automáticas en la nube. Solo tú tienes la llave de tu caja.
          </span>
        </div>

      </section>

      {/* =========================================================================
          6. TESTIMONIOS REALES DE DUEÑOS EN COLOMBIA
      ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Lo que dicen los dueños de barbería
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Barberos reales en Bogotá, Medellín y Cali que cambiaron el cuaderno por EXAKTA:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                "Los sábados eran un dolor de cabeza sumando planillas y siempre había peleas con los muchachos por comisiones. Con EXAKTA liquido a los 5 barberos en 2 minutos y les llega el comprobante exacto a su WhatsApp. Santo remedio."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs">
                C
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Carlos Mario O.</h4>
                <p className="text-[11px] text-slate-400">The Barber Club • Bogotá</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                "Casi pago un software en dólares que me cobraba 90 dólares al mes más plata por cada mensaje de WhatsApp. EXAKTA me cuesta una fracción en pesos colombianos y mis clientes agendan solos desde el link de Instagram."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-xs">
                M
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Manuel Miranda</h4>
                <p className="text-[11px] text-slate-400">Vice Barber • Medellín</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                "Los clientes que no llegaban nos dejaban sillas vacías perdiendo plata. Ahora con los recordatorios directos a WhatsApp las inasistencias cayeron a casi cero y los martes los llenamos con el semáforo."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs">
                H
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Hellen Aiza</h4>
                <p className="text-[11px] text-slate-400">BIP Barber Club • Cali</p>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* =========================================================================
          7. PREGUNTAS FRECUENTES (RESPUESTAS CLARAS SIN ENREDOS)
      ========================================================================= */}
      <section id="faqs" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Preguntas que nos hacen los dueños
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              p: '¿Mis clientes tienen que descargar alguna app para pedir cita?',
              r: 'No. Tus clientes simplemente tocan el enlace de tu barbería (en tu Instagram, WhatsApp o código QR en el local) y en 20 segundos eligen su corte y barbero desde cualquier celular sin descargar nada.'
            },
            {
              p: '¿Me cobran por cada mensaje de WhatsApp que se envíe?',
              r: 'No. A diferencia de otros programas que te cobran paquetes de mensajes o créditos extra, EXAKTA incluye WhatsApp nativo con $0 pesos de recargo adicional.'
            },
            {
              p: '¿Mis barberos pueden ver cuánto dinero entra a la caja de la barbería?',
              r: 'No. Cada barbero tiene su portal móvil independiente donde solo ve sus propios turnos y su acumulado de comisiones personales. La facturación global y los costos solo los ves tú como dueño.'
            },
            {
              p: '¿Cómo funciona la liquidación automática de comisiones?',
              r: 'Tú decides el porcentaje de cada barbero (ej. 50% o 60%). A medida que atienden clientes, el sistema suma todo. Al terminar la semana o quincena, tocas 1 botón y se genera el recibo oficial con el desglose exacto directo a su WhatsApp.'
            },
            {
              p: '¿Qué pasa si no sé mucho de tecnología?',
              r: 'EXAKTA fue diseñado para ser tan fácil de usar como WhatsApp. Además, nuestro equipo te ayuda a configurar tus servicios y barberos en 10 minutos.'
            }
          ].map((faq, idx) => {
            const abierta = faqAbierta === idx;
            return (
              <div key={idx} className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setFaqAbierta(abierta ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-200 flex justify-between items-center gap-3 hover:text-amber-400"
                >
                  <span>{faq.p}</span>
                  <span className="text-amber-400 font-mono text-base">{abierta ? '−' : '+'}</span>
                </button>
                {abierta && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                    {faq.r}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>

      {/* =========================================================================
          8. FOOTER Y CONTACTO DIRECTO
      ========================================================================= */}
      <footer className="border-t border-slate-800/80 bg-[#05080e] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Scissors className="w-4 h-4 transform -rotate-45" />
              </div>
              <span className="text-lg font-black text-white tracking-wider">EXAKTA</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              La plataforma que llena tus sillas y liquida a tus barberos en 1 clic. Hecho en Colombia 🇨🇴.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => abrirWhatsApp()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-400/20 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>WhatsApp Comercial ({general?.whatsapp_comercial || '3114220554'})</span>
            </button>

            {onAbrirLogin && (
              <button
                onClick={onAbrirLogin}
                className="px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                Acceso Administrativo
              </button>
            )}
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 text-center text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} EXAKTA Barber Pro. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Botón Flotante de WhatsApp Animado */}
      <aside
        aria-label="Contacto Comercial EXAKTA"
        className="fixed bottom-6 right-6 z-50 flex items-center group cursor-pointer"
        onClick={() => abrirWhatsApp()}
      >
        <span className="hidden md:inline-flex items-center mr-3 px-3.5 py-1.5 rounded-full bg-slate-900/95 text-emerald-300 text-xs font-black border border-emerald-500/40 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ¿Dudas? Habla con un Asesor por WhatsApp
        </span>
        <button
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-green-600 text-slate-950 shadow-2xl shadow-emerald-500/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          title="Hablar con Asesor Comercial"
        >
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#070a11]" />
          <MessageCircle className="w-7 h-7 text-white fill-white" />
        </button>
      </aside>

    </div>
  );
}
