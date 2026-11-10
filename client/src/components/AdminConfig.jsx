import React, { useState } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, KeyRound, Building, Upload, Image, Trash2, Sparkles } from 'lucide-react';

export default function AdminConfig({ shopConfig, onConfigActualizada }) {
  const [form, setForm] = useState({
    nombre_barberia: shopConfig?.nombre_barberia || 'The Barber Club',
    eslogan: shopConfig?.eslogan_barberia || shopConfig?.eslogan || 'Tu estilo en las mejores manos',
    telefono_barberia: shopConfig?.telefono_barberia || '+57 300 123 4567',
    direccion_barberia: shopConfig?.direccion_barberia || 'Calle Principal # 10 - 20',
    logo_url: shopConfig?.logo_url || '',
    pin_admin: ''
  });

  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

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
    setGuardando(true);
    setMensaje('');
    setError('');

    try {
      const payload = { ...form };
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

      setMensaje('Configuración y logo guardados correctamente.');
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

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Teléfono / WhatsApp Oficial de la Barbería *
          </label>
          <input
            type="text"
            required
            placeholder="+57 300 123 4567"
            value={form.telefono_barberia}
            onChange={(e) => setForm({ ...form, telefono_barberia: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Este es el número oficial al que direccionará el botón de WhatsApp del portal público.
          </p>
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

        {/* PIN DE ACCESO */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>Cambiar PIN de Acceso Administrador</span>
          </label>
          <input
            type="password"
            maxLength={6}
            placeholder="Dejar en blanco para conservar el PIN actual"
            value={form.pin_admin}
            onChange={(e) => setForm({ ...form, pin_admin: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-center tracking-widest font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Clave secreta de 4 dígitos para ingresar al panel de dueño.
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
