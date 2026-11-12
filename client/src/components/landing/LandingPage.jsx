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
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Layers,
  Zap,
  Globe,
  ExternalLink,
  Award,
  Check,
  X,
  Store,
  Receipt,
  HelpCircle,
  Flame,
  BadgePercent
} from 'lucide-react';

export default function LandingPage({
  onIrABarberia,
  onAbrirLogin,
  configCMS = null
}) {
  const [config, setConfig] = useState(configCMS);
  const [cargando, setCargando] = useState(!configCMS);
  const [pasoActivo, setPasoActivo] = useState(0);
  const [faqAbierta, setFaqAbierta] = useState(null);
  const [modoDolor, setModoDolor] = useState('comparacion'); // 'comparacion', 'dolores', 'soluciones'

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

  if (cargando || !config) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-semibold tracking-wide">Cargando experiencia EXAKTA...</p>
      </div>
    );
  }

  const { general, hero, dolores, flujo, comparativa, planes, testimonios, faqs } = config;

  function abrirWhatsAppComercial(mensajeExtra = '') {
    const tel = general?.whatsapp_comercial || '573114220554';
    const msg = encodeURIComponent(
      mensajeExtra || general?.whatsapp_mensaje_demo || 'Hola EXAKTA, quiero solicitar una demostración para mi barbería.'
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      
      {/* Luces y Efectos de Fondo */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-600/25 via-indigo-500/20 to-teal-400/10 blur-[130px] rounded-full -z-10" />
      <div className="pointer-events-none absolute top-[1200px] -left-40 w-[600px] h-[500px] bg-blue-700/15 blur-[140px] rounded-full -z-10" />
      <div className="pointer-events-none absolute top-[2600px] -right-40 w-[600px] h-[500px] bg-emerald-600/10 blur-[140px] rounded-full -z-10" />

      {/* =========================================================================
          1. HEADER / NAVBAR DE NAVEGACIÓN COMERCIAL
      ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo EXAKTA */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Scissors className="w-5 h-5 text-blue-400 transform -rotate-45" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-white">EXAKTA</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  SaaS Barber
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Plataforma Cloud para Barberías</p>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#dolores" className="hover:text-blue-400 transition-colors">Dolores vs Solución</a>
            <a href="#flujo" className="hover:text-blue-400 transition-colors">Cómo Funciona</a>
            <a href="#comparativa" className="hover:text-blue-400 transition-colors">Comparativa</a>
            <a href="#planes" className="hover:text-blue-400 transition-colors">Planes y Precios</a>
            <a href="#faqs" className="hover:text-blue-400 transition-colors">Preguntas</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3">
            <button
              onClick={irADemo}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-sm"
            >
              <Store className="w-4 h-4 text-blue-400" />
              <span>Ver Demo en Vivo</span>
            </button>

            <button
              onClick={() => abrirWhatsAppComercial()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hablar con Asesor</span>
            </button>

            {onAbrirLogin && (
              <button
                onClick={onAbrirLogin}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all"
                title="Acceso Dueños y Barberos"
              >
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden text-xs">Acceso</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION (GANCHO DE ALTO IMPACTO)
      ========================================================================= */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Badge Superior */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-semibold mb-8 animate-fade-in shadow-inner">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{hero?.badge_superior || '💈 SaaS Multi-Tenant Especializado para Barberías'}</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-5xl mx-auto mb-6">
          {hero?.titulo_principal || 'Deja de perder dinero en desorden y comisiones en papel.'}{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
            {hero?.titulo_resaltado || 'Digitaliza tu barbería en minutos.'}
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          {hero?.subtitulo ||
            'La plataforma todo-en-uno que automatiza tus citas 24/7, liquida a tus barberos en 1 clic con comprobante a WhatsApp y te muestra tu ganancia neta real sin pagar en dólares ni tarifas sorpresa.'}
        </p>

        {/* CTAs Principales */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-14">
          <button
            onClick={() => abrirWhatsAppComercial()}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-blue-400/30"
          >
            <MessageCircle className="w-5 h-5 text-blue-200" />
            <span>{hero?.cta_principal_texto || 'Solicitar Demo por WhatsApp'}</span>
            <ArrowRight className="w-5 h-5 text-blue-200" />
          </button>

          <button
            onClick={irADemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-base font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all shadow-lg"
          >
            <Store className="w-5 h-5 text-blue-400" />
            <span>{hero?.cta_secundario_texto || 'Ver Barbería Demo'}</span>
          </button>
        </div>

        {/* Badges de Confianza */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6 border-t border-slate-800/80">
          {(hero?.badges_confianza || [
            'Multi-tenant 100% en la Nube',
            '$0 Costo extra por mensajes de WhatsApp',
            'Precios transparentes en Pesos Colombianos ($ COP)',
            'Cero descargas de apps para tus clientes'
          ]).map((badge, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-semibold text-slate-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{badge}</span>
            </div>
          ))}
        </div>

        {/* Mockup Interactivo / Vista Previa Visual del Sistema */}
        <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-700/50 via-slate-800/30 to-slate-900/80 border border-slate-700/70 shadow-2xl shadow-blue-900/20">
          <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
            {/* Barra superior estilo navegador */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="px-4 py-1 rounded-lg bg-slate-950 text-[11px] text-slate-400 font-mono flex items-center gap-2 border border-slate-800">
                <Globe className="w-3 h-3 text-blue-400" />
                <span>exakta.online/b/{general?.demo_slug || 'the-barber-club'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase">En Vivo</span>
              </div>
            </div>

            {/* Vista previa visual */}
            <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              
              {/* Tarjeta 1: Agendamiento sin app */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">Reserva Web en 20 Segundos</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tus clientes escanean tu QR o tocan tu enlace en Instagram. Eligen corte, barbero y hora disponible al instante.
                </p>
                <div className="pt-2 text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Sin instalar aplicaciones
                </div>
              </div>

              {/* Tarjeta 2: Portal del Barbero */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">Portal Móvil para Barberos</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cada barbero ve en su propio celular los turnos que tiene asignados hoy, sin ver las cuentas ni costos del negocio.
                </p>
                <div className="pt-2 text-[11px] text-indigo-400 font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Turnos y comisiones al día
                </div>
              </div>

              {/* Tarjeta 3: Liquidación en 1 clic */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">Liquidación a WhatsApp</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Liquida la semana o quincena con 1 clic. El barbero recibe el comprobante con la lista exacta de cortes y su pago neto.
                </p>
                <div className="pt-2 text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Cero planillas en papel
                </div>
              </div>

            </div>
          </div>
        </div>

      </section>

      {/* =========================================================================
          3. SECCIÓN DE DOLORES REALES vs. SOLUCIÓN EXAKTA (EL NÚCLEO PERSUASIVO)
      ========================================================================= */}
      <section id="dolores" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Flame className="w-3.5 h-3.5" />
            <span>Los Dolores Ocultos de Toda Barbería</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            ¿Por qué administrar una barbería hoy se vuelve un caos?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Identificamos los 4 puntos ciegos que le quitan tiempo, paz mental y dinero a los dueños de barberías todos los días, y construimos la solución exacta.
          </p>
        </div>

        {/* Grilla de Dolores vs Soluciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(dolores || []).map((item, index) => (
            <div
              key={item.id || index}
              className="rounded-3xl p-6 sm:p-8 bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl"
            >
              <div>
                {/* Etiqueta del dolor */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    {item.etiqueta || `Dolor #${index + 1}`}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    EXAKTA Resuelve
                  </span>
                </div>

                {/* El Dolor (Antes) */}
                <div className="mb-6 p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-rose-200 mb-1">
                        {item.dolor_titulo}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {item.dolor_desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* La Solución EXAKTA (Ahora) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm sm:text-base font-bold text-emerald-300">
                        {item.solucion_titulo}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {item.solucion_desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impacto Concreto */}
              {item.impacto && (
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-slate-200">Impacto Real:</strong> {item.impacto}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Llamado a la acción intermedio */}
        <div className="mt-16 text-center">
          <button
            onClick={() => abrirWhatsAppComercial('Hola EXAKTA, quiero ver cómo resuelven las comisiones y citas en mi barbería.')}
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/25 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Eliminar estos dolores en mi barbería hoy</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </section>

      {/* =========================================================================
          4. TOUR VISUAL / FLUJO OPERATIVO (CÓMO FUNCIONA PASO A PASO)
      ========================================================================= */}
      <section id="flujo" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80 bg-slate-900/30 rounded-3xl my-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Flujo Operativo Simple y Transparente</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Así de fluido opera tu barbería con EXAKTA
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Sin curvas de aprendizaje complejas. Todo pensado para que tú y tu equipo dominen el sistema en menos de 5 minutos.
          </p>
        </div>

        {/* Stepper / Tarjetas de Pasos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(flujo || []).map((paso, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl p-6 bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black text-blue-500/30 group-hover:text-blue-400 transition-colors">
                    {paso.paso}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/20">
                    Paso {idx + 1}
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {paso.titulo}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {paso.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center text-[11px] font-semibold text-slate-500 group-hover:text-slate-300">
                <span>100% Automático</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mención especial a la Galería Multimedia */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900/90 to-indigo-900/30 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Galería Multimedia de Estilos Integrada</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white">
              Inspira a tus clientes y exhibe el arte de tu equipo
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Carga fotos y videos de tus cortes en tendencia. Tus clientes podrán ver el catálogo de estilos directamente antes de elegir su cita.
            </p>
          </div>
          <button
            onClick={irADemo}
            className="shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-2"
          >
            <span>Ver Catálogo en Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </section>

      {/* =========================================================================
          5. TABLA COMPARATIVA DIRECTA (EXAKTA vs LA COMPETENCIA)
      ========================================================================= */}
      <section id="comparativa" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Award className="w-3.5 h-3.5" />
            <span>Comparativa Frente al Mercado</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {comparativa?.titulo || '¿Por qué las barberías eligen EXAKTA?'}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            {comparativa?.subtitulo || 'Sin cobros en dólares ni tarifas sorpresa por cada mensaje de WhatsApp.'}
          </p>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                <th className="p-4 sm:p-5 text-xs font-extrabold uppercase text-slate-400 tracking-wider w-1/4">
                  Característica / Criterio
                </th>
                <th className="p-4 sm:p-5 text-xs font-black uppercase tracking-wider bg-blue-900/30 border-x border-blue-500/30 text-blue-300 w-1/5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Scissors className="w-4 h-4 text-blue-400" />
                    <span>EXAKTA</span>
                  </div>
                </th>
                <th className="p-4 sm:p-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-1/8">
                  WeiBook
                </th>
                <th className="p-4 sm:p-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-1/8">
                  BEWE
                </th>
                <th className="p-4 sm:p-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-1/8">
                  AgendaPro
                </th>
                <th className="p-4 sm:p-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-1/8">
                  AionClock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
              {(comparativa?.criterios || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">
                    {row.nombre}
                  </td>
                  <td className="p-4 sm:p-5 font-extrabold text-center bg-blue-950/20 border-x border-blue-500/20 text-emerald-300">
                    <div className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{row.exakta}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">
                    {row.weibook}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">
                    {row.bewe}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">
                    {row.agendapro}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">
                    {row.aionclock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen de ahorro */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
          <BadgePercent className="w-5 h-5 text-emerald-400" />
          <span>
            <strong>Conclusión Económica:</strong> Una suscripción de WeiBook cuesta ~US$ 99/mes (~$390.000 COP) y BEWE cuesta ~US$ 89/mes. Con EXAKTA ahorras entre el 40% y 60% mensual con mejores funciones adaptadas a Colombia.
          </span>
        </div>

      </section>

      {/* =========================================================================
          6. SECCIÓN DE PLANES Y TARIFAS EN PESOS COLOMBIANOS ($ COP)
      ========================================================================= */}
      <section id="planes" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Tarifas Claras y Transparentes</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Planes diseñados para crecer con tu barbería
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Facturación 100% en Pesos Colombianos ($ COP). Sin cláusulas de permanencia, sin comisiones por reservas y con soporte local continuo.
          </p>
        </div>

        {/* Grilla de Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {(planes || []).map((plan, idx) => {
            const esDestacado = plan.destacado || plan.id === 'pro';
            return (
              <div
                key={plan.id || idx}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                  esDestacado
                    ? 'bg-gradient-to-b from-blue-950/60 via-slate-900 to-slate-950 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 transform lg:-translate-y-2'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Badge de Plan Destacado */}
                {plan.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md ${
                      esDestacado
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.nombre}</h3>
                  <p className="text-xs text-slate-400 mb-6 min-h-[36px] leading-relaxed">
                    {plan.descripcion}
                  </p>

                  {/* Precio en COP */}
                  <div className="mb-6 pb-6 border-b border-slate-800">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        ${Number(plan.precio_cop || 0).toLocaleString('es-CO')}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold uppercase">
                        COP / {plan.periodo || 'mes'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-medium mt-1">
                      $0 cobro extra por WhatsApp
                    </p>
                  </div>

                  {/* Lista de características */}
                  <div className="space-y-3 mb-8">
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Incluye:
                    </p>
                    {(plan.caracteristicas || []).map((carac, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{carac}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón de suscripción al plan */}
                <button
                  onClick={() =>
                    abrirWhatsAppComercial(
                      `Hola EXAKTA, quiero contratar el ${plan.nombre} ($${Number(
                        plan.precio_cop || 0
                      ).toLocaleString('es-CO')} COP/mes) para mi barbería.`
                    )
                  }
                  className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    esDestacado
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Empezar con {plan.nombre}</span>
                </button>
              </div>
            );
          })}
        </div>

      </section>

      {/* =========================================================================
          7. TESTIMONIOS REALES DE DUEÑOS DE BARBERÍA
      ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Historias Reales de Éxito</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Barberías que transformaron su negocio con EXAKTA
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(testimonios || []).map((testimonio, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                {/* 5 Estrellas */}
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(testimonio.estrellas || 5)].map((_, sIdx) => (
                    <Star key={sIdx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-6">
                  "{testimonio.texto}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/30">
                  {testimonio.nombre?.charAt(0) || 'B'}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{testimonio.nombre}</h4>
                  <p className="text-[11px] text-slate-400">{testimonio.rol}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* =========================================================================
          8. PREGUNTAS FRECUENTES (FAQS)
      ========================================================================= */}
      <section id="faqs" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Resolvemos tus Dudas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
        </div>

        <div className="space-y-4">
          {(faqs || []).map((faq, idx) => {
            const estaAbierta = faqAbierta === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setFaqAbierta(estaAbierta ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-200 hover:text-white"
                >
                  <span>{faq.pregunta}</span>
                  {estaAbierta ? (
                    <ChevronUp className="w-5 h-5 text-blue-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                </button>
                {estaAbierta && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>

      {/* =========================================================================
          9. FOOTER Y CONTACTO POR WHATSAPP
      ========================================================================= */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <Scissors className="w-4 h-4 text-white -rotate-45" />
              </div>
              <span className="text-lg font-black text-white tracking-wider">EXAKTA</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              SaaS Multi-Tenant para Barberías y Salones Masculinos en Colombia. Control exacto de citas, barberos y caja.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => abrirWhatsAppComercial()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Comercial ({general?.whatsapp_comercial || '3114220554'})</span>
            </button>

            {onAbrirLogin && (
              <button
                onClick={onAbrirLogin}
                className="px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800"
              >
                Portal Administrativo
              </button>
            )}
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} EXAKTA SaaS. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <a href="#dolores" className="hover:text-slate-400">Dolores</a>
            <a href="#flujo" className="hover:text-slate-400">Flujo</a>
            <a href="#planes" className="hover:text-slate-400">Planes</a>
            <a href="#faqs" className="hover:text-slate-400">Preguntas</a>
          </div>
        </div>
      </footer>

      {/* Botón Flotante de WhatsApp para Contacto Inmediato */}
      <aside
        aria-label="Contacto Comercial EXAKTA"
        className="fixed bottom-6 right-6 z-50 flex items-center group"
      >
        <span className="hidden md:inline-flex items-center mr-3 px-3.5 py-1.5 rounded-full bg-slate-900/95 text-slate-200 text-xs font-bold border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          ¿Dudas? Habla con un Asesor
        </span>
        <button
          onClick={() => abrirWhatsAppComercial()}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-2xl shadow-emerald-500/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          title="Contactar con Asesor Comercial de EXAKTA"
        >
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
          <MessageCircle className="w-7 h-7" />
        </button>
      </aside>

    </div>
  );
}
