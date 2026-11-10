import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, CheckCircle2, X, Sparkles, UserCheck } from 'lucide-react';

export default function ClientReviewsSection({ shopConfig }) {
  const [resenasData, setResenasData] = useState({ resenas: [], total: 0, promedio: 5.0 });
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviadoExito, setEnviadoExito] = useState(false);

  const [form, setForm] = useState({
    cliente_nombre: '',
    calificacion: 5,
    comentario: '',
    servicio_nombre: 'Corte de Cabello'
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
      console.error('Error cargando reseñas:', err);
    } finally {
      setCargando(false);
    }
  }

  async function handleEnviarResena(e) {
    e.preventDefault();
    if (!form.cliente_nombre.trim() || !form.comentario.trim()) {
      alert('Por favor ingresa tu nombre y un comentario');
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
        setEnviadoExito(true);
        cargarResenas();
        setTimeout(() => {
          setEnviadoExito(false);
          setModalAbierto(false);
          setForm({
            cliente_nombre: '',
            calificacion: 5,
            comentario: '',
            servicio_nombre: 'Corte de Cabello'
          });
        }, 1800);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al enviar la reseña');
    } finally {
      setEnviando(false);
    }
  }

  const { resenas = [], total = 0, promedio = 5.0 } = resenasData;

  return (
    <section className="mt-12 pt-8 border-t border-slate-200/90 space-y-6">
      
      {/* CABECERA DE RESEÑAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Opiniones de Clientes Verificados
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Experiencias en {shopConfig?.nombre_barberia || 'The Barber Club'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(promedio) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                />
              ))}
            </div>
            <span className="text-sm font-extrabold text-slate-800 font-mono">{promedio}</span>
            <span className="text-xs text-slate-400">({total} calificaciones recibidas)</span>
          </div>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Dejar mi Opinión</span>
        </button>
      </div>

      {/* LISTA DE RESEÑAS */}
      {cargando ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Cargando opiniones de clientes...
        </div>
      ) : resenas.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">Sé el primero en calificar tu experiencia</p>
          <p className="text-[11px] text-slate-400">Tu opinión ayuda a otros clientes y a mejorar el servicio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {resenas.map((r) => (
            <div
              key={r.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3 relative group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-xs shrink-0">
                      {r.cliente_nombre?.slice(0, 1).toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 block truncate">
                        {r.cliente_nombre}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <UserCheck className="w-3 h-3" />
                        Cliente Verificado
                      </span>
                    </div>
                  </div>

                  <div className="flex text-amber-400 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= Number(r.calificacion) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  "{r.comentario}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500 truncate max-w-[150px]">
                  {r.servicio_nombre || 'Servicio General'}
                </span>
                <span className="font-mono">{r.fecha}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PARA DEJAR RESEÑA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slideIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <h3 className="font-black text-base text-slate-900">Califica tu Experiencia</h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {enviadoExito ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-extrabold text-base text-slate-900">¡Muchas gracias por tu opinión!</h4>
                <p className="text-xs text-slate-500">Tu reseña ya es pública en el portal de la barbería.</p>
              </div>
            ) : (
              <form onSubmit={handleEnviarResena} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Tu Calificación</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setForm({ ...form, calificacion: s })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${s <= form.calificacion ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        />
                      </button>
                    ))}
                    <span className="font-mono font-bold text-sm text-slate-700 ml-2">
                      {form.calificacion} de 5 estrellas
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tu Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Daniel Ramírez"
                    value={form.cliente_nombre}
                    onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Servicio Recibido</label>
                  <input
                    type="text"
                    placeholder="Ej: Corte Degradado + Barba VIP"
                    value={form.servicio_nombre}
                    onChange={(e) => setForm({ ...form, servicio_nombre: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tu Comentario / Experiencia *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Cuéntanos qué tal estuvo la atención, puntualidad y el resultado..."
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
                    {enviando ? 'Publicando...' : 'Publicar Reseña'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
