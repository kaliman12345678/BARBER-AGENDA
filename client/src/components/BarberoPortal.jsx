import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Scissors, 
  TrendingUp, 
  User, 
  CheckCircle2, 
  Clock, 
  Percent, 
  Calculator, 
  LogOut, 
  HelpCircle,
  ShieldCheck,
  Package, 
  Wallet,
  Camera,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  History,
  AlertCircle,
  Play
} from 'lucide-react';
import { formatCOP, formatDateReadable, formatTime12, getTodayStr } from '../utils/helpers';
import InstagramIcon from './InstagramIcon';
import DateRangeFilter from './DateRangeFilter';

export default function BarberoPortal({ barbero, onLogout }) {
  const [tab, setTab] = useState('citas'); // 'citas', 'record', 'balance', 'calculadora', 'portafolio'
  const [citas, setCitas] = useState([]);
  const [balance, setBalance] = useState(null);
  const [recordData, setRecordData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('todas'); // 'todas', 'hoy', 'ayer', '7d', 'rango'
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [busquedaCitas, setBusquedaCitas] = useState('');

  // Portafolio multimedia del barbero
  const [misPublicaciones, setMisPublicaciones] = useState([]);
  const [mostrarModalNuevoPost, setMostrarModalNuevoPost] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [guardandoPost, setGuardandoPost] = useState(false);
  const [errorPost, setErrorPost] = useState('');
  const [nuevoPost, setNuevoPost] = useState({
    titulo: '',
    tipo: 'imagen',
    url_media: '',
    url_red_social: '',
    descripcion: ''
  });

  // Calculadora personal del barbero (para saber cuánto gana haciendo X cortes)
  const [precioCortePromedio, setPrecioCortePromedio] = useState('25000');
  const [cortesDiaSimulados, setCortesDiaSimulados] = useState('6');
  const [diasTrabajoMes, setDiasTrabajoMes] = useState('26');
  const [metaGananciaPersonal, setMetaGananciaPersonal] = useState('2000000');

  useEffect(() => {
    cargarDatos();
  }, [filtroFecha, fechaDesde, fechaHasta]);

  async function cargarDatos() {
    setCargando(true);
    try {
      let urlCitas = `/api/barbero-portal/citas?barbero_id=${barbero.id}`;
      if (filtroFecha === 'hoy') {
        urlCitas += `&fecha=${getTodayStr()}`;
      } else if (filtroFecha === 'ayer') {
        const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        urlCitas += `&fecha=${ayer}`;
      } else if (filtroFecha === '7d') {
        const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        urlCitas += `&desde=${hace7}&hasta=${getTodayStr()}`;
      } else if (filtroFecha === 'rango' && fechaDesde && fechaHasta) {
        urlCitas += `&desde=${fechaDesde}&hasta=${fechaHasta}`;
      }
      if (busquedaCitas.trim()) {
        urlCitas += `&q=${encodeURIComponent(busquedaCitas.trim())}`;
      }

      const [resC, resB, resR, resM] = await Promise.all([
        fetch(urlCitas),
        fetch(`/api/barbero-portal/balance?barbero_id=${barbero.id}`),
        fetch(`/api/barberos/${barbero.id}/record?es_barbero=true`),
        fetch('/api/multimedia?todos=true')
      ]);

      const dataC = await resC.json();
      const dataB = await resB.json();
      const dataR = await resR.json();
      const dataM = await resM.json();

      setCitas(dataC);
      setBalance(dataB);
      setRecordData(dataR);
      setMisPublicaciones(dataM.filter(m => String(m.barbero_id) === String(barbero.id)));
    } catch (err) {
      console.error('Error cargando portal del barbero:', err);
    } finally {
      setCargando(false);
    }
  }

  async function handleSubirFotoPost(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoArchivo(true);
    setErrorPost('');

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorPost(data.error || 'Error al subir foto');
        return;
      }
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm)$/i);
      setNuevoPost(prev => ({
        ...prev,
        url_media: data.url,
        tipo: isVideo ? 'video' : 'imagen'
      }));
    } catch (err) {
      setErrorPost('Error de conexión al subir imagen');
    } finally {
      setSubiendoArchivo(false);
    }
  }

  async function handleGuardarPublicacion(e) {
    e.preventDefault();
    if (!nuevoPost.titulo.trim() || !nuevoPost.url_media.trim()) {
      setErrorPost('Por favor escribe un título y adjunta la foto o enlace');
      return;
    }

    setGuardandoPost(true);
    setErrorPost('');

    try {
      const res = await fetch('/api/multimedia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoPost,
          barbero_id: barbero.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorPost(data.error || 'Error al publicar');
        return;
      }

      setMostrarModalNuevoPost(false);
      setNuevoPost({
        titulo: '',
        tipo: 'imagen',
        url_media: '',
        url_red_social: '',
        descripcion: ''
      });
      cargarDatos();
    } catch (err) {
      setErrorPost('Error al comunicar con el servidor');
    } finally {
      setGuardandoPost(false);
    }
  }

  async function handleEliminarPublicacion(id) {
    if (!confirm('¿Estás seguro de eliminar esta publicación de tu portafolio?')) return;
    try {
      const res = await fetch(`/api/multimedia/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarDatos();
      }
    } catch (err) {
      console.error('Error eliminando publicación:', err);
    }
  }

  // Cálculos de la calculadora personal del barbero
  const miComision = barbero.porcentaje_comision || 50;
  const numPrecio = Number(precioCortePromedio) || 0;
  const gananciaPorCorte = Math.round(numPrecio * (miComision / 100));
  const numCortesDia = Number(cortesDiaSimulados) || 0;
  const numDias = Number(diasTrabajoMes) || 0;
  const totalCortesMes = Math.round(numCortesDia * numDias);
  const miGananciaMensualSimulada = totalCortesMes * gananciaPorCorte;

  const numMeta = Number(metaGananciaPersonal) || 0;
  const cortesMesNecesarios = gananciaPorCorte > 0 ? Math.ceil(numMeta / gananciaPorCorte) : 0;
  const cortesDiaNecesarios = numDias > 0 ? (cortesMesNecesarios / numDias).toFixed(1) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 animate-fadeIn">
      
      {/* Barra de Bienvenida del Barbero */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={barbero.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&h=150&fit=crop&crop=faces'}
            alt={barbero.nombre}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-slate-900 font-sans">
                Hola, {barbero.nombre}
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                Tu Comisión: {miComision}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Panel personal de colaboradores • Consulta tus turnos, récord vitalicio, ganancias y comparte tus cortes.
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors self-start md:self-auto border border-slate-200 hover:border-rose-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Pestañas de Navegación del Barbero */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'citas', label: 'Mis Citas Asignadas', icon: Calendar, badge: citas.length },
          { id: 'record', label: 'Mi Récord & Historial', icon: History, badge: 'Vitalicio' },
          { id: 'balance', label: 'Mi Utilidad & Pagos', icon: DollarSign },
          { id: 'portafolio', label: 'Mi Portafolio & Galería', icon: Camera, badge: misPublicaciones.length },
          { id: 'calculadora', label: 'Calculadora de Rentabilidad', icon: Calculator, badge: 'Proyección' }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: MIS CITAS ASIGNADAS (SIN DATOS PRIVADOS CLIENTE) */}
      {/* ======================================================== */}
      {tab === 'citas' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* FILTRO DE FECHA UNIVERSAL & MOTOR DE BÚSQUEDA */}
          <DateRangeFilter
            filtroTiempo={filtroFecha}
            setFiltroTiempo={setFiltroFecha}
            fechaDesde={fechaDesde}
            setFechaDesde={setFechaDesde}
            fechaHasta={fechaHasta}
            setFechaHasta={setFechaHasta}
            busqueda={busquedaCitas}
            setBusqueda={setBusquedaCitas}
            onBuscar={cargarDatos}
            placeholder="Buscar por nombre de cliente..."
          />

          {cargando ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-medium">Cargando turnos...</p>
            </div>
          ) : citas.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <Scissors className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-slate-800 font-bold text-base">No tienes citas asignadas</h4>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Los nuevos turnos que agenden los clientes o que te asigne la administración aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {citas.map((c) => {
                const isCompletada = c.estado === 'completada';
                const miGananciaCorte = Math.round(c.precio_cobrado * (miComision / 100));

                return (
                  <div
                    key={c.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCompletada
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                          {formatTime12(c.hora_inicio)} - {formatTime12(c.hora_fin)}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCompletada ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {c.estado}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{c.cliente_nombre}</span>
                      </h4>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <p className="flex items-center gap-2">
                          <Scissors className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="font-semibold text-slate-800">{c.servicio_nombre}</span>
                          <span className="text-slate-400 text-[11px] ml-auto">({c.duracion_minutos} min)</span>
                        </p>
                        <p className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Fecha: {c.fecha}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tu Ganancia:</span>
                        <span className="text-sm font-extrabold text-emerald-600">
                          {formatCOP(miGananciaCorte)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Corte: {formatCOP(c.precio_cobrado)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: MI RÉCORD & HISTORIAL COMPLETO */}
      {/* ======================================================== */}
      {tab === 'record' && recordData && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 font-sans mb-1">
              Mi Expediente & Récord Vitalicio
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Historial acumulado de todos tus turnos completados, dinero generado y liquidaciones pagadas.
            </p>

            {/* Tarjetas de Resumen Vitalicio */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Cortes Completados
                </span>
                <span className="text-2xl font-black text-blue-900 font-sans mt-0.5 block">
                  {recordData.resumen.total_citas_completadas}
                </span>
                <span className="text-[11px] text-blue-600">
                  Turnos atendidos en el local
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Producido
                </span>
                <span className="text-2xl font-black text-slate-900 font-sans mt-0.5 block">
                  {formatCOP(recordData.resumen.total_bruto_servicios)}
                </span>
                <span className="text-[11px] text-slate-500">
                  Facturación bruta de tus cortes
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Total Comisiones
                </span>
                <span className="text-2xl font-black text-emerald-800 font-sans mt-0.5 block">
                  {formatCOP(recordData.resumen.total_ganado_vitalicio)}
                </span>
                <span className="text-[11px] text-emerald-600">
                  {miComision}% comisión correspondiente
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Saldo por Cobrar
                </span>
                <span className="text-2xl font-black text-amber-900 font-sans mt-0.5 block">
                  {formatCOP(recordData.resumen.saldo_pendiente_por_cobrar)}
                </span>
                <span className="text-[11px] text-amber-700">
                  {formatCOP(recordData.resumen.total_liquidado_pagado)} ya cobrado
                </span>
              </div>
            </div>

            {/* Tabla Historial de Liquidaciones Recibidas */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden mt-6">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider">
                Liquidaciones y Pagos Realizados por Administración
              </div>
              {recordData.liquidaciones.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  No hay pagos de liquidación registrados aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                        <th className="py-2.5 px-3">Fecha de Pago</th>
                        <th className="py-2.5 px-3">Período</th>
                        <th className="py-2.5 px-3">Cortes</th>
                        <th className="py-2.5 px-3">Método</th>
                        <th className="py-2.5 px-3 text-right">Monto Pagado</th>
                        <th className="py-2.5 px-3">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recordData.liquidaciones.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{l.fecha_pago ? l.fecha_pago.split(' ')[0] : '-'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{l.fecha_inicio} al {l.fecha_fin}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{l.total_servicios} cortes</td>
                          <td className="py-2.5 px-3 text-slate-600">{l.metodo_pago || 'Efectivo'}</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">{formatCOP(l.total_pagado)}</td>
                          <td className="py-2.5 px-3 text-slate-500 italic text-[11px]">{l.notas || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: MI PORTAFOLIO & GALERÍA (AGREGAR CONTENIDO) */}
      {/* ======================================================== */}
      {tab === 'portafolio' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-sans">
                Mi Portafolio de Cortes & Trabajos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sube fotos de tus mejores cortes o enlaces de TikTok/Instagram para que los clientes vean tu talento en la vitrina del local.
              </p>
            </div>

            <button
              onClick={() => {
                setErrorPost('');
                setMostrarModalNuevoPost(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Nuevo Trabajo</span>
            </button>
          </div>

          {misPublicaciones.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-slate-800 font-bold text-base">Aún no has subido fotos de tus cortes</h4>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Muestra tu estilo subiendo fotos de fade, barba, o peinados. Aparecerán con tu firma en la vitrina multimedia.
              </p>
              <button
                onClick={() => setMostrarModalNuevoPost(true)}
                className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors"
              >
                Subir mi primer corte
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {misPublicaciones.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-4/3 bg-slate-100">
                      {p.tipo === 'video' ? (
                        <video src={p.url_media} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={p.url_media} alt={p.titulo} className="w-full h-full object-cover" />
                      )}
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                        {p.tipo === 'video' ? 'Video' : 'Foto'}
                      </span>
                    </div>

                    <div className="p-4 space-y-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{p.titulo}</h4>
                      {p.descripcion && <p className="text-xs text-slate-500 line-clamp-2">{p.descripcion}</p>}
                      {p.url_red_social && (
                        <a
                          href={p.url_red_social}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold pt-1"
                        >
                          <InstagramIcon className="w-3 h-3 text-pink-600" />
                          <span>Ver en redes</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Por: {barbero.nombre}</span>
                    <button
                      onClick={() => handleEliminarPublicacion(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar publicación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODAL PARA PUBLICAR NUEVO TRABAJO */}
          {mostrarModalNuevoPost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-900 mb-1 font-sans">
                  Publicar Trabajo en la Galería
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Sube una foto de tu corte o ingresa un enlace para exhibir tu trabajo.
                </p>

                {errorPost && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorPost}</span>
                  </div>
                )}

                <form onSubmit={handleGuardarPublicacion} className="space-y-3.5 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Título del Trabajo / Corte *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Low Fade + Diseño de Barba"
                      value={nuevoPost.titulo}
                      onChange={(e) => setNuevoPost({ ...nuevoPost, titulo: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Foto o Video del Trabajo *
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        id="archivo-post-barbero"
                        accept="image/*,video/*"
                        className="hidden"
                        disabled={subiendoArchivo}
                        onChange={handleSubirFotoPost}
                      />
                      <label
                        htmlFor="archivo-post-barbero"
                        className="cursor-pointer w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Upload className={`w-4 h-4 ${subiendoArchivo ? 'animate-bounce' : ''}`} />
                        <span>{subiendoArchivo ? 'Subiendo archivo...' : 'Seleccionar foto desde tu celular o PC'}</span>
                      </label>
                      <input
                        type="text"
                        placeholder="O pegar URL directa de imagen..."
                        value={nuevoPost.url_media}
                        onChange={(e) => setNuevoPost({ ...nuevoPost, url_media: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Enlace de Instagram / TikTok (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/p/..."
                      value={nuevoPost.url_red_social}
                      onChange={(e) => setNuevoPost({ ...nuevoPost, url_red_social: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Descripción breve
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detalles de la técnica, productos usados..."
                      value={nuevoPost.descripcion}
                      onChange={(e) => setNuevoPost({ ...nuevoPost, descripcion: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 text-xs resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMostrarModalNuevoPost(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoPost}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
                    >
                      {guardandoPost ? 'Publicando...' : 'Publicar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 4: MI UTILIDAD & BALANCE PERSONAL */}
      {/* ======================================================== */}
      {tab === 'balance' && balance && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest block">
                Total Ganado en Comisiones
              </span>
              <h4 className="text-3xl font-black text-blue-900 font-sans mt-2">
                {formatCOP(balance.ganancia_total_barbero)}
              </h4>
              <p className="text-xs text-blue-600 mt-2">
                {balance.total_servicios} cortes completados • {miComision}% de comisión
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest block">
                Total Pagado por Administración
              </span>
              <h4 className="text-3xl font-black text-emerald-900 font-sans mt-2">
                {formatCOP(balance.total_ya_cobrado)}
              </h4>
              <p className="text-xs text-emerald-600 mt-2">
                Liquidaciones ya recibidas en tu cuenta o en efectivo
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest block">
                Saldo Pendiente por Liquidar
              </span>
              <h4 className="text-3xl font-black text-amber-900 font-sans mt-2">
                {formatCOP(balance.pendiente_por_cobrar)}
              </h4>
              <p className="text-xs text-amber-700 mt-2">
                {balance.servicios_pendientes_count} cortes listos para la próxima liquidación
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 5: CALCULADORA DE RENTABILIDAD & METAS */}
      {/* ======================================================== */}
      {tab === 'calculadora' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs animate-fadeIn space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-sans">
              Calculadora de Ganancias Personales
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simula tus ingresos mensuales según cuántos clientes atiendas al día o calcula cuántos cortes necesitas para alcanzar tu meta de dinero.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Parámetros de Simulación */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Precio promedio de tu corte
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={precioCortePromedio}
                  onChange={(e) => setPrecioCortePromedio(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-blue-600 font-semibold block mt-1">
                  Tu comisión ({miComision}%): {formatCOP(gananciaPorCorte)} por corte
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cortes promedio que haces al día
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cortesDiaSimulados}
                  onChange={(e) => setCortesDiaSimulados(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500 text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Días que trabajas en el mes
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={diasTrabajoMes}
                  onChange={(e) => setDiasTrabajoMes(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500 text-center"
                />
              </div>
            </div>

            {/* Resultado de la Simulación */}
            <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200 p-6 rounded-2xl">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest block">
                  Tu Ganancia Proyectada al Mes
                </span>
                <h4 className="text-3xl sm:text-4xl font-black text-slate-900 font-sans mt-2">
                  {formatCOP(miGananciaMensualSimulada)}
                </h4>
                <p className="text-xs text-slate-600 mt-2">
                  Haciendo <strong className="text-blue-700">{cortesDiaSimulados} cortes diarios</strong> durante {diasTrabajoMes} días laborales (total de {totalCortesMes} cortes al mes).
                </p>
              </div>

              {/* Calculadora Inversa: ¿Cuánto quieres ganar? */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <h6 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      ¿Tienes una meta de dinero en mente?
                    </h6>
                    <span className="text-xs text-slate-500">
                      Escribe cuánto dinero quieres llevarte a tu casa este mes:
                    </span>
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={metaGananciaPersonal}
                    onChange={(e) => setMetaGananciaPersonal(e.target.value.replace(/[^0-9]/g, ''))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-emerald-600 font-black text-sm text-right w-36 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <p className="text-xs text-slate-700">
                  💡 Para alcanzar tu meta de <strong className="text-emerald-600">{formatCOP(numMeta)}</strong>, necesitas completar <strong className="text-slate-900">{cortesMesNecesarios} cortes al mes</strong>. Esto equivale a una meta diaria de <strong className="text-blue-700 text-sm">{cortesDiaNecesarios} cortes por día</strong>.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
