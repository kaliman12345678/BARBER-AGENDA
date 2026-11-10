import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, Trash2, CheckCircle, AlertCircle, X, UserCheck } from 'lucide-react';

export default function AdminResenas({ shopConfig }) {
  const [resenasData, setResenasData] = useState({ resenas: [], total: 0, promedio: 5.0 });
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    cliente_nombre: '',
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
      const res = await fetch('/api/resenas');
      if (res.ok) {
        const data = await res.json();
        setResenasData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
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
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setModalAbierto(false);
        setForm({
          cliente_nombre: '',
          calificacion: 5,
          comentario: '',
          servicio_nombre: 'Corte Clásico'
        });
        cargarResenas();
      }
    } catch (err) {
      console.error(err);
      alert('Error al guardar la reseña');
    } finally {
      setEnviando(false);
    }
  }

  async function handleEliminarResena(id) {
    if (!window.confirm('¿Deseas eliminar esta reseña del portal público?')) return;
    try {
      const res = await fetch(`/api/resenas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarResenas();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const { resenas = [], total = 0, promedio = 5.0 } = resenasData;

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
                Reseñas & Calificaciones Públicas
              </h2>
              <p className="text-xs text-slate-500">
                Opiniones y testimonios visibles públicamente para tus clientes en el inicio.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Reseña Destacada</span>
        </button>
      </div>

      {/* METRICAS DE RESEÑAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
              Calificación Promedio
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
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Excelente Reputación
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
              Total de Reseñas Activas
            </span>
            <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">
              {total}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Mostradas en el agendamiento
          </span>
        </div>
      </div>

      {/* LISTA DE RESEÑAS */}
      {cargando ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          Cargando opiniones...
        </div>
      ) : resenas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-bold text-slate-800">No hay reseñas registradas aún</h4>
          <p className="text-[11px] text-slate-400">Tus clientes pueden dejar reseñas desde el inicio o tú puedes registrar testimonios con el botón superior.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {resenas.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {r.cliente_nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {r.fecha} • {r.servicio_nombre || 'Servicio'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= Number(r.calificacion) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleEliminarResena(r.id)}
                      title="Eliminar reseña"
                      className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                  "{r.comentario}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Pública en el Inicio
                </span>
                <span className="font-mono">ID #{r.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR RESEÑA DESDE ADMIN */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slideIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <h3 className="font-black text-base text-slate-900">Agregar Reseña Destacada</h3>
              </div>
              <button onClick={() => setModalAbierto(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearResena} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Calificación en Estrellas</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setForm({ ...form, calificacion: s })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${s <= form.calificacion ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-slate-700 ml-2">{form.calificacion} / 5</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sebastián Villa"
                  value={form.cliente_nombre}
                  onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Servicio Realizado</label>
                <input
                  type="text"
                  placeholder="Ej: Corte Fade + Arreglo de Barba"
                  value={form.servicio_nombre}
                  onChange={(e) => setForm({ ...form, servicio_nombre: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Testimonio / Comentario *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Escribe la opinión o testimonio del cliente..."
                  value={form.comentario}
                  onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {enviando ? 'Guardando...' : 'Publicar Reseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
