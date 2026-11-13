import React, { useState } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, KeyRound, Building, Upload, Image, Trash2, Sparkles, Palette, Sun, Moon, Check, Share2, Copy, ExternalLink, Star, MessageSquare } from 'lucide-react';
import { DEFAULT_GOOGLE_REVIEWS_MENSAJE } from '../utils/googleReviews';

const CLIENT_THEME_OPTIONS = [
  { id: 'oscuro', nombre: 'Obsidian Dark (Oscuro)', icon: Moon, desc: 'Fondo negro premium con alto contraste y elegancia', bg: 'bg-slate-950 text-white border-slate-800' },
  { id: 'claro', nombre: 'Minimal Clean (Claro)', icon: Sun, desc: 'Fondo blanco moderno, fresco y luminoso', bg: 'bg-slate-50 text-slate-900 border-slate-200' },
  { id: 'vintage', nombre: 'Barber Gold (Vintage)', icon: Sparkles, desc: 'Estilo clásico con toques de oro y barbería tradicional', bg: 'bg-[#0c0a09] text-amber-50 border-amber-900/40' },
  { id: 'cyber', nombre: 'Cyber Tech (Moderno)', icon: Palette, desc: 'Degradados de vanguardia y estilo contemporáneo', bg: 'bg-[#090d16] text-sky-100 border-sky-900/40' }
];

const COLOR_PRESETS = [
  { name: 'Azul Real', hex: '#2563eb' },
  { name: 'Oro Barber', hex: '#d97706' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Rojo Rubí', hex: '#dc2626' },
  { name: 'Púrpura Real', hex: '#7c3aed' },
  { name: 'Carbón Dark', hex: '#0f172a' }
];

export default function AdminConfig({ shopConfig, onConfigActualizada }) {
  const [form, setForm] = useState({
    nombre_barberia: shopConfig?.nombre_barberia || 'The Barber Club',
    eslogan: shopConfig?.eslogan_barberia || shopConfig?.eslogan || 'Tu estilo en las mejores manos',
    telefono_barberia: (shopConfig?.telefono_barberia || shopConfig?.telefono || '3001234567').replace(/\D/g, '').slice(0, 10),
    email_barberia: shopConfig?.email_barberia || shopConfig?.email || 'admin@thebarberclub.com',
    direccion_barberia: shopConfig?.direccion_barberia || shopConfig?.direccion || 'Calle 100 # 15-20',
    logo_url: shopConfig?.logo_url || '',
    color_primario: shopConfig?.color_primario || '#2563eb',
    tema_cliente: shopConfig?.tema_cliente || 'oscuro',
    google_reviews_url: shopConfig?.google_reviews_url || '',
    google_reviews_mensaje: shopConfig?.google_reviews_mensaje || DEFAULT_GOOGLE_REVIEWS_MENSAJE,
    pin_admin: ''
  });

  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [copiadoSlug, setCopiadoSlug] = useState(false);

  const slugActual = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';
  const urlPublica = `${window.location.origin}/?b=${slugActual}`;

  function handleCopiarLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(urlPublica);
    }
    setCopiadoSlug(true);
    setTimeout(() => setCopiadoSlug(false), 2500);
  }

  function handleProbarWhatsAppResena() {
    const rawPhone = form.telefono_barberia || '3001234567';
    let fullPhone = rawPhone.replace(/\D/g, '');
    if (fullPhone.length === 10 && fullPhone.startsWith('3')) {
      fullPhone = `57${fullPhone}`;
    }
    const enlace = form.google_reviews_url?.trim() || 'https://g.page/r/ejemplo/review';
    const plantilla = form.google_reviews_mensaje?.trim() || DEFAULT_GOOGLE_REVIEWS_MENSAJE;
    const msg = plantilla
      .replace(/\{cliente\}/g, 'Carlos Gómez')
      .replace(/\{barbero\}/g, 'Mateo')
      .replace(/\{barberia\}/g, form.nombre_barberia || 'The Barber Club')
      .replace(/\{enlace_google\}/g, enlace);

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  async function handleSubirLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoLogo(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(prev => ({ ...prev, logo_url: data.url }));
        setMensaje('Logo cargado. Guarda los cambios para aplicarlo.');
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setError(data.error || 'Error al subir la imagen del logo');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al subir la imagen');
    } finally {
      setSubiendoLogo(false);
    }
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setError('');

    const cleanTel = form.telefono_barberia ? form.telefono_barberia.replace(/\D/g, '') : '';
    if (cleanTel && cleanTel.length !== 10) {
      setError('El teléfono debe tener exactamente 10 dígitos numéricos (ej: 3001234567)');
      return;
    }

    if (form.email_barberia && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_barberia.trim())) {
      setError('Por favor ingresa un correo con formato válido (ej: nombre@dominio.com)');
      return;
    }

    if (form.pin_admin && form.pin_admin.trim()) {
      const p = form.pin_admin.trim();
      if (p.length < 6 || !/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) {
        setError('La nueva contraseña debe ser alfanumérica: debe tener al menos 6 caracteres e incluir tanto letras como números (ej: Barber2026)');
        return;
      }
    }

    setGuardando(true);
    setMensaje('');

    try {
      const payload = { 
        ...form, 
        telefono_barberia: cleanTel,
        email_barberia: form.email_barberia.trim()
      };
      if (!payload.pin_admin) delete payload.pin_admin;

      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo actualizar la configuración');
        return;
      }

      setMensaje('Configuración y contraseña guardadas correctamente. El SuperAdmin fue notificado si cambiaste tu clave.');
      setForm(prev => ({ ...prev, pin_admin: '' }));
      if (onConfigActualizada) onConfigActualizada();
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Ajustes del Local & Marca
        </h3>
        <p className="text-xs text-slate-500">
          Personaliza el logo, eslogan, datos de contacto y clave de seguridad de tu barbería.
        </p>
      </div>

      {mensaje && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleGuardar} className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 text-xs">
        
        {/* ENLACE PÚBLICO DE RESERVAS PARA CLIENTES */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Enlace Web para tus Clientes</span>
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
              Directo & Sin Claves
            </span>
          </div>

          <p className="text-[11px] text-blue-900/80">
            Comparte este enlace con tus clientes por WhatsApp o Instagram para que agenden sus citas directamente con tu marca:
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={urlPublica}
              className="flex-1 p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-mono font-bold text-slate-800 select-all shadow-inner"
            />
            <button
              type="button"
              onClick={handleCopiarLink}
              className="py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
            >
              {copiadoSlug ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
            <a
              href={urlPublica}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
              title="Abrir como cliente"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* SECCIÓN LOGO DE LA BARBERÍA */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Logo Oficial de la Barbería
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {form.logo_url ? (
              <div className="relative group">
                <img
                  src={form.logo_url}
                  alt="Logo Barbería"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logo_url: '' })}
                  title="Eliminar logo"
                  className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                <Image className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[9px] font-bold">Sin Logo</span>
              </div>
            )}

            <div className="flex-1 space-y-2 text-left">
              <div className="flex items-center gap-2">
                <label className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{subiendoLogo ? 'Subiendo...' : 'Subir Imagen de Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSubirLogo}
                    disabled={subiendoLogo}
                    className="hidden"
                  />
                </label>

                {form.logo_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo_url: '' })}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                  >
                    Quitar
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="O pega la URL directa de la imagen del logo..."
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 bg-white text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                Formatos recomendados: PNG o JPG cuadrado (mínimo 200x200 px). Se mostrará en la cabecera, inicio y comprobantes.
              </p>
            </div>
          </div>
        </div>

        {/* DATOS DEL ESTABLECIMIENTO */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nombre de la Barbería *
          </label>
          <input
            type="text"
            required
            value={form.nombre_barberia}
            onChange={(e) => setForm({ ...form, nombre_barberia: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Eslogan o Frase Distintiva
          </label>
          <input
            type="text"
            placeholder="Ej: Cortes clásicos, barbas perfectas y estilo contemporáneo"
            value={form.eslogan}
            onChange={(e) => setForm({ ...form, eslogan: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teléfono / WhatsApp Oficial (10 dígitos) *
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              placeholder="Ej: 3001234567"
              value={form.telefono_barberia}
              onChange={(e) => setForm({ ...form, telefono_barberia: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              onKeyDown={(e) => {
                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Solo 10 números para botón de WhatsApp y acceso.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correo Electrónico Oficial del Dueño
            </label>
            <input
              type="email"
              placeholder="admin@barberia.com"
              value={form.email_barberia}
              onChange={(e) => setForm({ ...form, email_barberia: e.target.value.trim() })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Formato real de correo para iniciar sesión como dueño.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Dirección Física del Local
          </label>
          <input
            type="text"
            placeholder="Ej: Calle 10 # 43 - 20, Sector Provenza"
            value={form.direccion_barberia}
            onChange={(e) => setForm({ ...form, direccion_barberia: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* SECCIÓN GOOGLE REVIEWS 5★ (POSICIONAMIENTO & CRECIMIENTO) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-yellow-50/50 to-amber-50/90 border border-amber-200/90 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-600 shrink-0">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  Google Reviews 5★ (Crecimiento en Google Maps)
                </span>
                <p className="text-[11px] text-amber-800/80">
                  Pide reseñas automáticamente por WhatsApp al cobrar cada cita en 1 clic
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black border border-amber-300 hidden sm:inline-block">
              5.0 ★★★★★
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>Enlace Directo de Opiniones de Google Maps</span>
              <span className="text-[10px] text-amber-700 font-semibold">¿Dónde lo consigo? Perfil de Negocio Google &gt; Solicitar opiniones</span>
            </label>
            <input
              type="url"
              placeholder="Ej: https://g.page/r/CdABC123/review o https://maps.app.goo.gl/..."
              value={form.google_reviews_url}
              onChange={(e) => setForm({ ...form, google_reviews_url: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-amber-200 bg-white font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-inner"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Cuando el cliente toque este enlace desde su celular, Google Maps abrirá directamente la ventana de 5 estrellas para calificar tu negocio.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Plantilla de Mensaje por WhatsApp
            </label>
            <textarea
              rows={3}
              value={form.google_reviews_mensaje}
              onChange={(e) => setForm({ ...form, google_reviews_mensaje: e.target.value })}
              placeholder="Mensaje a enviar por WhatsApp..."
              className="w-full p-2.5 rounded-xl border border-amber-200 bg-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5">
              <span className="text-[10px] text-slate-500">
                Variables disponibles: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-900 font-bold">{'{cliente}'}</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-900 font-bold">{'{barbero}'}</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-900 font-bold">{'{barberia}'}</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-900 font-bold">{'{enlace_google}'}</code>
              </span>
              <button
                type="button"
                onClick={handleProbarWhatsAppResena}
                className="py-1 px-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-300"
                title="Abre WhatsApp con un mensaje de ejemplo para verificar cómo lo verá tu cliente"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>Probar Mensaje en WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* PERSONALIZACIÓN DE TEMA Y COLOR PARA EL CLIENTE */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-blue-600" />
              <span>Tema & Color con el que el Cliente Verá la App</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Tú decides cómo experimentan tus clientes la página de agendamiento público.
            </p>
          </div>

          {/* Selector de Tema del Cliente */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Tema Visual del Cliente
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CLIENT_THEME_OPTIONS.map((t) => {
                const Icon = t.icon;
                const isSelected = form.tema_cliente === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, tema_cliente: t.id })}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${t.bg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{t.nombre}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color de Acento y Marca */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Color de Marca de tu Barbería (Botones, Destacados y Horarios)
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {COLOR_PRESETS.map((c) => {
                const isSelected = form.color_primario.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setForm({ ...form, color_primario: c.hex })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                      isSelected
                        ? 'border-slate-800 bg-white shadow-sm ring-2 ring-slate-800/10'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">Color Personalizado:</span>
              <input
                type="color"
                value={form.color_primario}
                onChange={(e) => setForm({ ...form, color_primario: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={form.color_primario}
                onChange={(e) => setForm({ ...form, color_primario: e.target.value })}
                className="w-28 p-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 uppercase text-center bg-white"
              />
              <div 
                className="px-3 py-1 rounded-lg text-white text-[11px] font-bold shadow-xs ml-auto"
                style={{ backgroundColor: form.color_primario }}
              >
                Muestra de Botón
              </div>
            </div>
          </div>
        </div>

        {/* PIN / CONTRASEÑA DE ACCESO */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>Cambiar Contraseña / PIN de Acceso Administrador</span>
          </label>
          <input
            type="password"
            maxLength={30}
            placeholder="Dejar en blanco para conservar actual (mín. 6 letras y números)"
            value={form.pin_admin}
            onChange={(e) => setForm({ ...form, pin_admin: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-center tracking-wider font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Contraseña alfanumérica (mínimo 6 caracteres, letras y números obligatorios). Al cambiarla, la app notificará automáticamente al SuperAdmin.
          </p>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{guardando ? 'Guardando Cambios...' : 'Guardar Ajustes'}</span>
        </button>
      </form>
    </div>
  );
}
