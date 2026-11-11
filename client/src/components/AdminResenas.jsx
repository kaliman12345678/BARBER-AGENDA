import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, Trash2, CheckCircle2, AlertCircle, X, UserCheck, ShieldCheck, Eye, EyeOff, ThumbsUp, Phone } from 'lucide-react';

export default function AdminResenas({ shopConfig }) {
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabActual, setTabActual] = useState('pendientes'); // 'pendientes' | 'publicadas'
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);

  const [form, setForm] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    calificacion: 5,
    comentario: '',
    servicio_nombre: 'Corte Clásico'
  });

  useEffect(() => {
    cargarResenas();
  }, []);

  async function cargarResenas() {
    setCargando(true);
    try {
      const res = await fetch('/api/resenas?todas=true');
      if (res.ok) {
        const data = await res.json();
        setResenas(Array.isArray(data.resenas) ? data.resenas : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  async function handleCambiarEstadoResena(id, nuevoEstado) {
    setProcesandoId(id);
    try {
      const res = await fetch(`/api/resenas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobada: nuevoEstado })
      });
      if (res.ok) {
        await cargarResenas();
      } else {
        alert('No se pudo actualizar el estado de la reseña');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al actualizar reseña');
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleEliminarResena(id) {
    if (!window.confirm('¿Deseas eliminar permanentemente esta reseña?')) return;
    setProcesandoId(id);
    try {
      const res = await fetch(`/api/resenas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await cargarResenas();
      }
    } catch (err) {
      console.error(err);
      alert('Error al eliminar reseña');
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleCrearResena(e) {
    e.preventDefault();
    if (!form.cliente_nombre.trim() || !form.comentario.trim()) {
      alert('Nombre y comentario son obligatorios');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          aprobada: 1 // Si la crea el dueño, nace aprobada directamente
        })
      });
      if (res.ok) {
        setModalAbierto(false);
        setForm({
          cliente_nombre: '',
          cliente_telefono: '',
          calificacion: 5,
          comentario: '',
          servicio_nombre: 'Corte Clásico'
        });
        await cargarResenas();
      }
    } catch (err) {
      console.error(err);
      alert('Error al guardar la reseña');
    } finally {
      setEnviando(false);
    }
  }

  const pendientes = resenas.filter(r => !r.aprobada || r.aprobada === 0);
  const publicadas = resenas.filter(r => r.aprobada === 1 || r.aprobada === true);

  const promedio = publicadas.length > 0
    ? (publicadas.reduce((acc, r) => acc + Number(r.calificacion || 5), 0) / publicadas.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Control de Reseñas & Calificaciones
              </h2>
              <p className="text-xs text-slate-500">
                Autoriza qué opiniones de clientes aparecen públicamente en el inicio de tu barbería.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Reseña Destacada</span>
        </button>
      </div>

      {/* METRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
              Calificación Pública
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 font-mono">{promedio}</span>
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(promedio) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
              Reseñas Publicadas
            </span>
            <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">
              {publicadas.length}
            </span>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
            Visibles en Inicio
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
              Pendientes de Autorizar
            </span>
            <span className="text-3xl font-black text-amber-600 font-mono mt-1 block">
              {pendientes.length}
            </span>
          </div>
          {pendientes.length > 0 && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold border border-amber-200 animate-pulse">
              Requieren Revisión
            </span>
          )}
        </div>
      </div>

      {/* PESTAÑAS DE MODERACIÓN */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTabActual('pendientes')}
          className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            tabActual === 'pendientes'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Pendientes de Autorización</span>
          {pendientes.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-amber-700 font-black">
              {pendientes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTabActual('publicadas')}
          className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            tabActual === 'publicadas'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Públicas en el Inicio</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 font-bold">
            {publicadas.length}
          </span>
        </button>
      </div>

      {/* LISTADO DE RESEÑAS SEGÚN PESTAÑA */}
      {cargando ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          Cargando opiniones...
        </div>
      ) : tabActual === 'pendientes' ? (
        pendientes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">¡Al día! No hay reseñas pendientes de revisión</h4>
            <p className="text-xs text-slate-400">Cuando un cliente nuevo deje su opinión, aparecerá aquí para que la apruebes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendientes.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-900">{r.cliente_nombre}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Pendiente
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {r.cliente_telefono && (
                          <span className="flex items-center gap-1 text-blue-600 font-mono font-bold">
                            <Phone className="w-3 h-3" />
                            {r.cliente_telefono}
                          </span>
                        )}
                        <span>• {r.fecha}</span>
                      </div>
                    </div>

                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${s <= Number(r.calificacion) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 italic leading-relaxed">
                    "{r.comentario}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">{r.servicio_nombre || 'Servicio'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={procesandoId === r.id}
                      onClick={() => handleEliminarResena(r.id)}
                      className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Rechazar</span>
                    </button>
                    <button
                      type="button"
                      disabled={procesandoId === r.id}
                      onClick={() => handleCambiarEstadoResena(r.id, 1)}
                      className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Aprobar & Publicar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        publicadas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No hay reseñas públicas actualmente</h4>
            <p className="text-xs text-slate-400">Aprueba reseñas pendientes o agrega testimonios destacados para que aparezcan en tu inicio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicadas.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-black text-slate-900 block truncate">{r.cliente_nombre}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.fecha} • {r.servicio_nombre || 'Servicio'}</span>
                    </div>

                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= Number(r.calificacion) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                    "{r.comentario}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Pública en Inicio
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={procesandoId === r.id}
                      onClick={() => handleCambiarEstadoResena(r.id, 0)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Ocultar del inicio (pasar a pendientes)"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={procesandoId === r.id}
                      onClick={() => handleEliminarResena(r.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* MODAL AGREGAR RESEÑA DESTACADA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-black text-base text-slate-900">Agregar Testimonio Destacado</h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearResena} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Calificación de Estrellas</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setForm({ ...form, calificacion: s })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${s <= form.calificacion ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    </button>
                  ))}
                  <span className="font-mono font-bold text-sm text-slate-800 ml-2">{form.calificacion} de 5</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Daniel Ramírez"
                  value={form.cliente_nombre}
                  onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
                  style={{ color: '#0f172a' }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Servicio</label>
                <input
                  type="text"
                  placeholder="Ej: Corte Degradado + Barba VIP"
                  value={form.servicio_nombre}
                  onChange={(e) => setForm({ ...form, servicio_nombre: e.target.value })}
                  style={{ color: '#0f172a' }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Comentario *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Escribe el testimonio del cliente..."
                  value={form.comentario}
                  onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                  style={{ color: '#0f172a' }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {enviando ? 'Guardando...' : 'Publicar Inmediatamente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
