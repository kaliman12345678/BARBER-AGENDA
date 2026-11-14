import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  User, 
  Calendar, 
  Camera, 
  Upload, 
  X, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Trash2, 
  Eye, 
  History,
  Phone,
  BookmarkCheck,
  ChevronRight
} from 'lucide-react';
import { formatDateReadable } from '../utils/helpers';

const CORTES_PRESETS = [
  'Mid Fade (Degradado Medio)',
  'Low Fade (Degradado Bajo)',
  'High Fade (Degradado Alto)',
  'Taper Fade (Patillas y Nuca)',
  'Clásico Ejecutivo',
  'Buzz Cut / Militar',
  'Pompadour / Quiff',
  'Mullet Moderno',
  'Corte a Tijera Completo'
];

const MAQUINAS_PRESETS = [
  '0.5 Palanca Abierta',
  'Guía 1 (3mm)',
  'Guía 1.5 Intermedia',
  'Guía 2 (6mm)',
  'Shaver / Afeitadora al ras',
  'Navaja Cuchilla Libre'
];

export default function ModalFichaTecnica({ 
  cliente, 
  barberos = [], 
  barberoActual = null, 
  onClose,
  citaRelacionada = null,
  shopConfig = null
}) {
  const [tab, setTab] = useState('historial'); // 'historial' | 'nuevo'
  const [fichas, setFichas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    cliente_nombre: cliente?.cliente_nombre || '',
    cliente_telefono: cliente?.cliente_telefono || '',
    barbero_id: barberoActual?.id || barberos[0]?.id || '',
    cita_id: citaRelacionada?.id || '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_corte: 'Mid Fade (Degradado Medio)',
    maquina_laterales: '0.5 Palanca Abierta subiendo a Guía 1.5',
    corte_superior: 'Tijera a 3 dedos, despuntado y peinado natural',
    detalles_barba: 'Perfilado con navaja, rebajado al nivel 2',
    productos_aplicados: 'Cera mate efecto seco',
    observaciones_piel: '',
    foto_resultado_url: ''
  });

  const rawPhone = (cliente?.cliente_telefono || '').replace(/[^0-9]/g, '');
  const activeSlug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';

  useEffect(() => {
    cargarFichas();
  }, [rawPhone]);

  async function cargarFichas() {
    if (!rawPhone) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const res = await fetch(`/api/fichas-tecnicas?telefono=${encodeURIComponent(rawPhone)}&b=${encodeURIComponent(activeSlug)}`, {
        headers: { 'x-barberia-slug': activeSlug }
      });
      if (res.ok) {
        const data = await res.json();
        setFichas(Array.isArray(data) ? data : []);
        // Si no hay fichas previas, sugerir ir a crear la primera
        if (Array.isArray(data) && data.length === 0) {
          setTab('nuevo');
        }
      }
    } catch (err) {
      console.error('Error cargando fichas:', err);
    } finally {
      setCargando(false);
    }
  }

  async function handleSubirFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFoto(true);
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
        setForm(prev => ({ ...prev, foto_resultado_url: data.url }));
      } else {
        setError(data.error || 'Error al subir la fotografía del corte');
      }
    } catch (err) {
      setError('Error de conexión al subir la imagen');
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function handleGuardarFicha(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    setMensajeExito('');

    try {
      const res = await fetch(`/api/fichas-tecnicas?b=${encodeURIComponent(activeSlug)}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-barberia-slug': activeSlug
        },
        body: JSON.stringify({
          ...form,
          cliente_telefono: rawPhone,
          cliente_nombre: form.cliente_nombre || cliente?.cliente_nombre || 'Cliente'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMensajeExito('¡Fórmula de corte guardada exitosamente en el expediente!');
        cargarFichas();
        setTimeout(() => {
          setMensajeExito('');
          setTab('historial');
        }, 1200);
      } else {
        setError(data.error || 'No se pudo guardar la ficha técnica');
      }
    } catch (err) {
      setError('Error al comunicar con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminarFicha(id) {
    if (!window.confirm('¿Deseas eliminar este registro técnico del historial?')) return;
    try {
      const res = await fetch(`/api/fichas-tecnicas/${id}?b=${encodeURIComponent(activeSlug)}`, { 
        method: 'DELETE',
        headers: { 'x-barberia-slug': activeSlug }
      });
      if (res.ok) {
        setFichas(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      alert('Error al eliminar registro');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slideIn">
        
        {/* HEADER DEL MODAL */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg truncate">
                  Ficha Técnica & Estilo
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold shrink-0">
                  Fase 2
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate flex items-center gap-2 mt-0.5">
                <span className="font-bold text-white">{cliente?.cliente_nombre || 'Cliente'}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{cliente?.cliente_telefono}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELECTOR DE PESTAÑAS (TABS) */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('historial')}
              className={`py-2 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                tab === 'historial'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial de Cortes ({fichas.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('nuevo')}
              className={`py-2 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                tab === 'nuevo'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Registrar Nueva Fórmula</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Asegura que el cliente siempre quede igual
          </span>
        </div>

        {/* CONTENIDO DEL MODAL */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {mensajeExito && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: HISTORIAL DE CORTES */}
          {/* ======================================================== */}
          {tab === 'historial' && (
            <div className="space-y-4 animate-fadeIn">
              {cargando ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Consultando expediente técnico...</p>
                </div>
              ) : fichas.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Sin fórmulas de corte registradas aún</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Registra los números de máquina, largo de tijera y foto para que cualquier barbero pueda replicar su estilo a la perfección.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('nuevo')}
                    className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Primera Ficha Técnica</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {fichas.map((f, idx) => (
                    <div 
                      key={f.id} 
                      className={`p-4 sm:p-5 rounded-2xl border transition-all text-xs space-y-3 relative ${
                        idx === 0 
                          ? 'bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border-amber-200 shadow-xs' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {idx === 0 && (
                        <span className="absolute -top-2.5 right-4 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Último Corte Realizado
                        </span>
                      )}

                      {/* Header de la Ficha: Fecha y Barbero */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {f.tipo_corte || 'Corte Personalizado'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {f.fecha}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {f.barbero_nombre && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              <span>{f.barbero_nombre}</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEliminarFicha(f.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Cuerpo Técnico: Laterales, Superior, Barba */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        
                        {f.maquina_laterales && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                              Laterales & Nuca (Máquina):
                            </span>
                            <span className="font-bold text-slate-800">
                              {f.maquina_laterales}
                            </span>
                          </div>
                        )}

                        {f.corte_superior && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                              Corte Superior (Tijera):
                            </span>
                            <span className="font-bold text-slate-800">
                              {f.corte_superior}
                            </span>
                          </div>
                        )}

                        {f.detalles_barba && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                              Barba & Perfilado:
                            </span>
                            <span className="font-bold text-slate-800">
                              {f.detalles_barba}
                            </span>
                          </div>
                        )}

                        {f.productos_aplicados && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                              Productos Aplicados:
                            </span>
                            <span className="font-bold text-slate-800">
                              {f.productos_aplicados}
                            </span>
                          </div>
                        )}

                      </div>

                      {/* Observaciones de Piel / Alergias */}
                      {f.observaciones_piel && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black text-[10px] uppercase block">
                              Advertencia de Piel / Sensibilidad:
                            </span>
                            <p className="font-semibold">{f.observaciones_piel}</p>
                          </div>
                        </div>
                      )}

                      {/* Fotografía de Resultado */}
                      {f.foto_resultado_url && (
                        <div className="pt-2 flex items-center gap-3">
                          <div 
                            onClick={() => setFotoAmpliada(f.foto_resultado_url)}
                            className="relative group cursor-pointer"
                          >
                            <img 
                              src={f.foto_resultado_url} 
                              alt="Resultado corte" 
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs group-hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 block">
                              Foto del Resultado
                            </span>
                            <button
                              type="button"
                              onClick={() => setFotoAmpliada(f.foto_resultado_url)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                            >
                              Ver en tamaño completo
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: REGISTRAR NUEVA FÓRMULA DE CORTE */}
          {/* ======================================================== */}
          {tab === 'nuevo' && (
            <form onSubmit={handleGuardarFicha} className="space-y-4 animate-fadeIn text-xs">
              
              {/* Barbero que atendió y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barbero que Realizó el Corte
                  </label>
                  <select
                    value={form.barbero_id}
                    onChange={(e) => setForm({ ...form, barbero_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {barberos.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha del Servicio
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              {/* Tipo de Corte con Chips Rápidos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Estilo / Tipo de Corte Principal
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mid Fade, Taper Fade, Clásico..."
                  value={form.tipo_corte}
                  onChange={(e) => setForm({ ...form, tipo_corte: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {CORTES_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, tipo_corte: c })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        form.tipo_corte === c
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {c.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Laterales & Nuca (Máquinas) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Laterales y Nuca (Guías de Máquina y Palanca)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 0.5 palanca abierta a 1.5 intermedia, desvanecido limpio..."
                  value={form.maquina_laterales}
                  onChange={(e) => setForm({ ...form, maquina_laterales: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold mb-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  {MAQUINAS_PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        maquina_laterales: prev.maquina_laterales ? `${prev.maquina_laterales} + ${m}` : m
                      }))}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold cursor-pointer"
                    >
                      + {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corte Superior */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corte Superior (Tijera, Largo y Dirección de Peinado)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tijera a 3 dedos, despunte con entresacadora, caída a la derecha..."
                  value={form.corte_superior}
                  onChange={(e) => setForm({ ...form, corte_superior: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Barba & Perfilado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barba & Perfilado
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Perfilado con navaja, nivel 2 en barbilla..."
                    value={form.detalles_barba}
                    onChange={(e) => setForm({ ...form, detalles_barba: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Productos Aplicados
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Cera mate, aftershave mentolado, talco..."
                    value={form.productos_aplicados}
                    onChange={(e) => setForm({ ...form, productos_aplicados: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Observaciones de Piel / Sensibilidad */}
              <div>
                <label className="block text-xs font-bold text-rose-700 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sensibilidad en Piel, Alergias o Lunares (Importante)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Piel sensible en el cuello, no pasar navaja en seco, evitar alcohol..."
                  value={form.observaciones_piel}
                  onChange={(e) => setForm({ ...form, observaciones_piel: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-rose-200 bg-rose-50/40 text-rose-950 focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Foto del Resultado del Corte */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Foto del Resultado Final (Opcional)</span>
                  {subiendoFoto && <span className="text-blue-600 font-bold text-[10px] animate-pulse">Subiendo foto...</span>}
                </label>

                <div className="flex items-center gap-3">
                  {form.foto_resultado_url ? (
                    <div className="relative group">
                      <img 
                        src={form.foto_resultado_url} 
                        alt="Preview resultado" 
                        className="w-20 h-20 rounded-xl object-cover border border-slate-300 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, foto_resultado_url: '' })}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                        title="Eliminar foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer">
                      <Camera className="w-6 h-6 mb-0.5 opacity-60" />
                      <span className="text-[9px] font-bold">Tomar Foto</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        onChange={handleSubirFoto} 
                        className="hidden" 
                      />
                    </label>
                  )}

                  <div className="flex-1 text-[11px] text-slate-500">
                    <p className="font-semibold text-slate-700">Toma una foto con el celular o sube una imagen.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Quedará registrada en el expediente para que en su próxima visita tú o cualquier compañero vean el resultado exacto.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de Guardar */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTab('historial')}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || subiendoFoto}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>{guardando ? 'Guardando Fórmula...' : 'Guardar en Expediente'}</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* MODAL LIGHTBOX FOTO AMPLIADA */}
        {fotoAmpliada && (
          <div 
            onClick={() => setFotoAmpliada(null)}
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
          >
            <div className="relative max-w-lg w-full">
              <img 
                src={fotoAmpliada} 
                alt="Foto ampliada del corte" 
                className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => setFotoAmpliada(null)}
                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
