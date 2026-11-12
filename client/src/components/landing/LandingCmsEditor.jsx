import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  DollarSign,
  Flame,
  MessageCircle,
  HelpCircle,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  ChevronRight,
  Globe,
  Settings
} from 'lucide-react';

export default function LandingCmsEditor({ onVerLanding }) {
  const [tabActiva, setTabActiva] = useState('general'); // 'general', 'hero', 'dolores', 'planes', 'flujo', 'comparativa', 'faqs'
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const superToken = sessionStorage.getItem('barberia_superadmin_token') || 'auth-superadmin-session-token';

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    setCargando(true);
    setMensajeError('');
    try {
      const res = await fetch('/api/landing-config');
      if (res.ok) {
        const json = await res.json();
        if (json.data) setConfig(json.data);
      } else {
        setMensajeError('No se pudo cargar la configuración de la Landing.');
      }
    } catch (e) {
      setMensajeError('Error de red al consultar la configuración.');
    } finally {
      setCargando(false);
    }
  }

  async function guardarCambios() {
    setGuardando(true);
    setMensajeExito('');
    setMensajeError('');
    try {
      const res = await fetch('/api/superadmin/landing-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superToken}`,
          'x-superadmin-token': superToken
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMensajeExito('¡Cambios guardados con éxito! La web pública ya los refleja en tiempo real.');
        setTimeout(() => setMensajeExito(''), 4500);
      } else {
        setMensajeError(data.error || 'Error al guardar los cambios.');
      }
    } catch (e) {
      setMensajeError('Error de red al conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  }

  async function restablecerFabrica() {
    if (!window.confirm('¿Seguro que deseas restablecer TODOS los textos y precios de la landing a los valores de fábrica?')) {
      return;
    }
    setGuardando(true);
    setMensajeError('');
    try {
      const res = await fetch('/api/superadmin/landing-config/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superToken}`,
          'x-superadmin-token': superToken
        }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setConfig(data.data);
        setMensajeExito('Configuración restablecida a valores de fábrica.');
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        setMensajeError(data.error || 'Error al restablecer.');
      }
    } catch (e) {
      setMensajeError('Error de red al conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  }

  // Métodos auxiliares para actualizar campos anidados
  function updateGeneral(field, value) {
    setConfig(prev => ({
      ...prev,
      general: { ...prev.general, [field]: value }
    }));
  }

  function updateHero(field, value) {
    setConfig(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  }

  function updateDolor(index, field, value) {
    setConfig(prev => {
      const nuevos = [...(prev.dolores || [])];
      nuevos[index] = { ...nuevos[index], [field]: value };
      return { ...prev, dolores: nuevos };
    });
  }

  function updatePlan(index, field, value) {
    setConfig(prev => {
      const nuevos = [...(prev.planes || [])];
      nuevos[index] = { ...nuevos[index], [field]: value };
      return { ...prev, planes: nuevos };
    });
  }

  function updateFlujo(index, field, value) {
    setConfig(prev => {
      const nuevos = [...(prev.flujo || [])];
      nuevos[index] = { ...nuevos[index], [field]: value };
      return { ...prev, flujo: nuevos };
    });
  }

  function updateFaq(index, field, value) {
    setConfig(prev => {
      const nuevos = [...(prev.faqs || [])];
      nuevos[index] = { ...nuevos[index], [field]: value };
      return { ...prev, faqs: nuevos };
    });
  }

  function agregarFaq() {
    setConfig(prev => ({
      ...prev,
      faqs: [
        ...(prev.faqs || []),
        {
          pregunta: 'Nueva Pregunta Frecuente',
          respuesta: 'Escribe aquí la respuesta correspondiente...'
        }
      ]
    }));
  }

  function eliminarFaq(index) {
    setConfig(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, idx) => idx !== index)
    }));
  }

  if (cargando || !config) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold">Cargando panel CMS de la Landing...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General & Contacto', icon: Settings },
    { id: 'hero', label: 'Hero (Portada)', icon: Sparkles },
    { id: 'dolores', label: 'Dolores vs Soluciones', icon: Flame },
    { id: 'planes', label: 'Planes y Precios ($ COP)', icon: DollarSign },
    { id: 'flujo', label: 'Flujo Operativo (Tour)', icon: Layers },
    { id: 'comparativa', label: 'Tabla Comparativa', icon: Award },
    { id: 'faqs', label: 'Preguntas Frecuentes', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      
      {/* Barra Superior del CMS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Globe className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900">CMS de la Landing Page</h2>
          </div>
          <p className="text-xs text-slate-500">
            Edita títulos, precios, dolores, soluciones y WhatsApp comercial sin tocar código. Los cambios impactan la web pública de inmediato.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onVerLanding || (() => window.open('/landing', '_blank'))}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-2 transition-all"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Previsualizar Landing</span>
          </button>

          <button
            onClick={restablecerFabrica}
            disabled={guardando}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition-all"
            title="Restablecer a valores de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>

          <button
            onClick={guardarCambios}
            disabled={guardando}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{guardando ? 'Guardando en Supabase...' : 'Guardar Cambios en Vivo'}</span>
          </button>
        </div>
      </div>

      {/* Alertas de Éxito / Error */}
      {mensajeExito && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}
      {mensajeError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* Sub-Pestañas de Navegación del CMS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-thin">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const activa = tabActiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activa
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${activa ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: GENERAL & CONTACTO
      ========================================================================= */}
      {tabActiva === 'general' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span>Datos Generales y Enlaces Comerciales</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                WhatsApp Comercial (con código de país, ej. 573114220554)
              </label>
              <input
                type="text"
                value={config.general?.whatsapp_comercial || ''}
                onChange={e => updateGeneral('whatsapp_comercial', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="573114220554"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                A este número llegarán todos los prospectos que toquen "Solicitar Demo" o los planes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Slug de la Barbería Demo (Ej. the-barber-club)
              </label>
              <input
                type="text"
                value={config.general?.demo_slug || ''}
                onChange={e => updateGeneral('demo_slug', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="the-barber-club"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Barbería pública que se abre cuando un visitante toca "Ver Demo en Vivo".
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Mensaje predeterminado de WhatsApp para solicitar Demo
              </label>
              <textarea
                rows={2}
                value={config.general?.whatsapp_mensaje_demo || ''}
                onChange={e => updateGeneral('whatsapp_mensaje_demo', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Correo Electrónico de Contacto
              </label>
              <input
                type="email"
                value={config.general?.email_contacto || ''}
                onChange={e => updateGeneral('email_contacto', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: HERO SECTION (PORTADA)
      ========================================================================= */}
      {tabActiva === 'hero' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Textos Principales del Hero (Gancho de Entrada)</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Badge Superior
              </label>
              <input
                type="text"
                value={config.hero?.badge_superior || ''}
                onChange={e => updateHero('badge_superior', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Título Principal (Parte blanca)
                </label>
                <input
                  type="text"
                  value={config.hero?.titulo_principal || ''}
                  onChange={e => updateHero('titulo_principal', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Título Resaltado (En degradé llamativo)
                </label>
                <input
                  type="text"
                  value={config.hero?.titulo_resaltado || ''}
                  onChange={e => updateHero('titulo_resaltado', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Subtítulo Persuasivo
              </label>
              <textarea
                rows={3}
                value={config.hero?.subtitulo || ''}
                onChange={e => updateHero('subtitulo', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Texto Botón CTA Principal
                </label>
                <input
                  type="text"
                  value={config.hero?.cta_principal_texto || ''}
                  onChange={e => updateHero('cta_principal_texto', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Texto Botón Secundario (Demo)
                </label>
                <input
                  type="text"
                  value={config.hero?.cta_secundario_texto || ''}
                  onChange={e => updateHero('cta_secundario_texto', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Badges de Confianza */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Badges de Confianza (4 puntos clave)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(config.hero?.badges_confianza || []).map((badge, bIdx) => (
                  <input
                    key={bIdx}
                    type="text"
                    value={badge}
                    onChange={e => {
                      const nuevos = [...(config.hero?.badges_confianza || [])];
                      nuevos[bIdx] = e.target.value;
                      updateHero('badges_confianza', nuevos);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DOLORES VS. SOLUCIONES
      ========================================================================= */}
      {tabActiva === 'dolores' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Los 4 Dolores Reales vs. La Solución EXAKTA</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Personaliza cómo presentas los dolores que viven los dueños de barberías y cómo tu software los transforma en tranquilidad.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {(config.dolores || []).map((item, index) => (
              <div
                key={item.id || index}
                className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-extrabold uppercase text-slate-800">
                    Tarjeta #{index + 1} ({item.id})
                  </span>
                  <input
                    type="text"
                    value={item.etiqueta || ''}
                    onChange={e => updateDolor(index, 'etiqueta', e.target.value)}
                    className="px-3 py-1 rounded-lg border border-slate-300 text-xs font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* El Dolor */}
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                    <span className="text-[11px] font-black uppercase text-rose-700 tracking-wider">
                      El Dolor (Antes de EXAKTA)
                    </span>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Título del Dolor</label>
                      <input
                        type="text"
                        value={item.dolor_titulo || ''}
                        onChange={e => updateDolor(index, 'dolor_titulo', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Descripción del Dolor</label>
                      <textarea
                        rows={2}
                        value={item.dolor_desc || ''}
                        onChange={e => updateDolor(index, 'dolor_desc', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 text-xs text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none bg-white leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* La Solución */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                    <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                      La Solución EXAKTA
                    </span>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Título de la Solución</label>
                      <input
                        type="text"
                        value={item.solucion_titulo || ''}
                        onChange={e => updateDolor(index, 'solucion_titulo', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Descripción de la Solución</label>
                      <textarea
                        rows={2}
                        value={item.solucion_desc || ''}
                        onChange={e => updateDolor(index, 'solucion_desc', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none bg-white leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Impacto */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Impacto Concreto (Llamada al beneficio cuantificable)
                  </label>
                  <input
                    type="text"
                    value={item.impacto || ''}
                    onChange={e => updateDolor(index, 'impacto', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. Ahorra más de 4 horas cada fin de semana..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PLANES Y TARIFAS EN PESOS COLOMBIANOS
      ========================================================================= */}
      {tabActiva === 'planes' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Planes y Tarifas en Pesos Colombianos ($ COP)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Modifica los precios y descripciones de tus planes para que se actualicen inmediatamente en la landing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(config.planes || []).map((plan, index) => (
              <div
                key={plan.id || index}
                className={`p-6 bg-white rounded-3xl border space-y-4 shadow-sm flex flex-col justify-between ${
                  plan.destacado ? 'border-2 border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Plan ID: {plan.id}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!plan.destacado}
                        onChange={e => updatePlan(index, 'destacado', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Destacado</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Plan</label>
                    <input
                      type="text"
                      value={plan.nombre || ''}
                      onChange={e => updatePlan(index, 'nombre', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Precio en COP ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        value={plan.precio_cop || 0}
                        onChange={e => updatePlan(index, 'precio_cop', Number(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Etiqueta (Badge)</label>
                    <input
                      type="text"
                      value={plan.badge || ''}
                      onChange={e => updatePlan(index, 'badge', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Más Elegido, Para Empezar..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Descripción Breve</label>
                    <textarea
                      rows={2}
                      value={plan.descripcion || ''}
                      onChange={e => updatePlan(index, 'descripcion', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                    />
                  </div>

                  {/* Características (separadas por líneas) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Características (1 por línea)
                    </label>
                    <textarea
                      rows={5}
                      value={(plan.caracteristicas || []).join('\n')}
                      onChange={e => {
                        const lineas = e.target.value.split('\n').filter(l => l.trim().length > 0);
                        updatePlan(index, 'caracteristicas', lineas);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: FLUJO OPERATIVO (TOUR PASO A PASO)
      ========================================================================= */}
      {tabActiva === 'flujo' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Los 4 Pasos del Flujo Operativo</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(config.flujo || []).map((paso, index) => (
              <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-600">Paso {paso.paso}</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Título del Paso</label>
                  <input
                    type="text"
                    value={paso.titulo || ''}
                    onChange={e => updateFlujo(index, 'titulo', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={paso.desc || ''}
                    onChange={e => updateFlujo(index, 'desc', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: TABLA COMPARATIVA
      ========================================================================= */}
      {tabActiva === 'comparativa' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Criterios de la Tabla Comparativa Frente a la Competencia</span>
          </h3>

          <div className="space-y-4">
            {(config.comparativa?.criterios || []).map((criterio, index) => (
              <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-800">
                  Criterio #{index + 1}:
                  <input
                    type="text"
                    value={criterio.nombre || ''}
                    onChange={e => {
                      const nuevos = [...(config.comparativa?.criterios || [])];
                      nuevos[index] = { ...nuevos[index], nombre: e.target.value };
                      setConfig(prev => ({
                        ...prev,
                        comparativa: { ...prev.comparativa, criterios: nuevos }
                      }));
                    }}
                    className="ml-2 px-3 py-1 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-white w-2/3"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                  <div>
                    <label className="font-bold text-blue-600 block mb-1">EXAKTA</label>
                    <input
                      type="text"
                      value={criterio.exakta || ''}
                      onChange={e => {
                        const nuevos = [...(config.comparativa?.criterios || [])];
                        nuevos[index] = { ...nuevos[index], exakta: e.target.value };
                        setConfig(prev => ({
                          ...prev,
                          comparativa: { ...prev.comparativa, criterios: nuevos }
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50/50 text-blue-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-500 block mb-1">WeiBook</label>
                    <input
                      type="text"
                      value={criterio.weibook || ''}
                      onChange={e => {
                        const nuevos = [...(config.comparativa?.criterios || [])];
                        nuevos[index] = { ...nuevos[index], weibook: e.target.value };
                        setConfig(prev => ({
                          ...prev,
                          comparativa: { ...prev.comparativa, criterios: nuevos }
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-500 block mb-1">BEWE</label>
                    <input
                      type="text"
                      value={criterio.bewe || ''}
                      onChange={e => {
                        const nuevos = [...(config.comparativa?.criterios || [])];
                        nuevos[index] = { ...nuevos[index], bewe: e.target.value };
                        setConfig(prev => ({
                          ...prev,
                          comparativa: { ...prev.comparativa, criterios: nuevos }
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-500 block mb-1">AgendaPro</label>
                    <input
                      type="text"
                      value={criterio.agendapro || ''}
                      onChange={e => {
                        const nuevos = [...(config.comparativa?.criterios || [])];
                        nuevos[index] = { ...nuevos[index], agendapro: e.target.value };
                        setConfig(prev => ({
                          ...prev,
                          comparativa: { ...prev.comparativa, criterios: nuevos }
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-500 block mb-1">AionClock</label>
                    <input
                      type="text"
                      value={criterio.aionclock || ''}
                      onChange={e => {
                        const nuevos = [...(config.comparativa?.criterios || [])];
                        nuevos[index] = { ...nuevos[index], aionclock: e.target.value };
                        setConfig(prev => ({
                          ...prev,
                          comparativa: { ...prev.comparativa, criterios: nuevos }
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: PREGUNTAS FRECUENTES (FAQS)
      ========================================================================= */}
      {tabActiva === 'faqs' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Preguntas Frecuentes (Acordeón)</span>
            </h3>
            <button
              onClick={agregarFaq}
              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Pregunta</span>
            </button>
          </div>

          <div className="space-y-4">
            {(config.faqs || []).map((faq, index) => (
              <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-slate-500">#{index + 1}</span>
                  <button
                    onClick={() => eliminarFaq(index)}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 text-xs"
                    title="Eliminar pregunta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pregunta</label>
                  <input
                    type="text"
                    value={faq.pregunta || ''}
                    onChange={e => updateFaq(index, 'pregunta', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Respuesta</label>
                  <textarea
                    rows={2}
                    value={faq.respuesta || ''}
                    onChange={e => updateFaq(index, 'respuesta', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
