import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, CheckCircle2, X, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export default function ClientReviewsSection({ shopConfig }) {
  const [resenasData, setResenasData] = useState({ resenas: [], total: 0, promedio: 5.0 });
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviadoExito, setEnviadoExito] = useState(false);

  const [form, setForm] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    calificacion: 5,
    comentario: '',
    servicio_nombre: 'Corte de Cabello',
    suscribir_novedades: true
  });

  useEffect(() => {
    cargarResenas();
    // Pre-cargar si el cliente ya ingresó sus datos previamente en este navegador
    const guardadoTel = localStorage.getItem('cliente_telefono_reservas') || '';
    const guardadoNombre = localStorage.getItem('cliente_nombre_reservas') || '';
    if (guardadoNombre || guardadoTel) {
      setForm(prev => ({
        ...prev,
        cliente_nombre: guardadoNombre,
        cliente_telefono: guardadoTel
      }));
    }
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
    if (!form.cliente_nombre.trim() || !form.cliente_telefono.trim() || !form.comentario.trim()) {
      alert('Por favor ingresa tu nombre, número de WhatsApp para suscribirte y tu comentario');
      return;
    }

    setEnviando(true);
    try {
      // Guardar en localStorage para futuras reservas
      localStorage.setItem('cliente_nombre_reservas', form.cliente_nombre.trim());
      localStorage.setItem('cliente_telefono_reservas', form.cliente_telefono.trim());

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
          setForm(prev => ({
            ...prev,
            comentario: '',
            calificacion: 5
          }));
        }, 3200);
      } else {
        const errData = await res.json();
        alert(errData.error || 'No se pudo enviar la reseña');
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
    <section className="mt-12 pt-8 border-t border-slate-700/60 space-y-6">
      
      {/* CABECERA DE RESEÑAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Opiniones de Clientes Verificados
          </div>
          <h2 
            className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm"
            style={{ color: '#ffffff' }}
          >
            Experiencias en {shopConfig?.nombre_barberia || 'The Barber Club'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(promedio) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                />
              ))}
            </div>
            <span className="text-sm font-extrabold text-white font-mono">{promedio}</span>
            <span className="text-xs text-slate-300">({total} calificaciones recibidas)</span>
          </div>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Dejar mi Opinión</span>
        </button>
      </div>

      {/* LISTA DE RESEÑAS */}
      {cargando ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Cargando opiniones de clientes...
        </div>
      ) : resenas.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs font-bold text-slate-200">Sé el primero en calificar tu experiencia</p>
          <p className="text-[11px] text-slate-400">Tu opinión ayuda a otros clientes y a mejorar el servicio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {resenas.map((r) => (
            <div
              key={r.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between space-y-3 relative group text-slate-900"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-xs shrink-0">
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

                <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slideIn space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Califica tu Experiencia</h3>
                  <span className="text-[11px] text-slate-500 block">Suscríbete y comparte tu opinión</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enviadoExito ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-black text-lg text-slate-900">¡Muchas gracias por tu reseña y suscripción!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Tu opinión ha sido enviada con éxito. Será visible en el portal público en cuanto el dueño de la barbería la autorice.
                </p>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Estado: Pendiente de Autorización
                </span>
              </div>
            ) : (
              <form onSubmit={handleEnviarResena} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Tu Calificación *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setForm({ ...form, calificacion: s })}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${s <= form.calificacion ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      </button>
                    ))}
                    <span className="font-mono font-bold text-sm text-slate-800 ml-2">
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
                    style={{ color: '#0f172a' }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    WhatsApp / Celular (Requerido para Suscripción) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 3001234567"
                    value={form.cliente_telefono}
                    onChange={(e) => setForm({ ...form, cliente_telefono: e.target.value })}
                    style={{ color: '#0f172a' }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Te identifica como cliente verificado y suscribe a novedades.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Servicio Recibido</label>
                  <input
                    type="text"
                    placeholder="Ej: Corte Degradado + Barba VIP"
                    value={form.servicio_nombre}
                    onChange={(e) => setForm({ ...form, servicio_nombre: e.target.value })}
                    style={{ color: '#0f172a' }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    style={{ color: '#0f172a' }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                  ></textarea>
                </div>

                {/* Casilla de suscripción y nota de autorización */}
                <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-1.5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.suscribir_novedades}
                      onChange={(e) => setForm({ ...form, suscribir_novedades: e.target.checked })}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-bold text-blue-950 leading-tight">
                      Suscribirme al club de clientes para recibir promociones y descuentos exclusivos
                    </span>
                  </label>
                  <div className="flex items-center gap-1 text-[10px] text-blue-700 font-medium pl-5">
                    <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>La reseña se publicará tras la autorización del dueño de la barbería.</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
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
                    {enviando ? 'Enviando...' : 'Suscribirse & Enviar Reseña'}
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
