import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  User, 
  Scissors, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Phone, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  UserCheck,
  Send,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Kanban,
  List,
  Columns,
  LayoutGrid,
  DollarSign,
  Sparkles,
  Star,
  Receipt,
  CreditCard
} from 'lucide-react';
import { formatCOP, formatDateReadable, formatTime12, getTodayStr } from '../utils/helpers';
import DateRangeFilter from './DateRangeFilter';
import { generarUrlWhatsAppResena } from '../utils/googleReviews';
import ModalFichaTecnica from './ModalFichaTecnica';
import ModalTirillaPOS from './ModalTirillaPOS';
import ModalTarjetaVIPAdmin from './ModalTarjetaVIPAdmin';

export default function AdminAgenda({ barberos, servicios, shopConfig }) {
  // Filtro de tiempo universal y buscador de cliente
  const [filtroTiempo, setFiltroTiempo] = useState('todas'); // 'todas', 'hoy', 'ayer', '7d', 'rango'
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [barberoId, setBarberoId] = useState('');
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [citaFichaSeleccionada, setCitaFichaSeleccionada] = useState(null);
  const [citaTirillaSeleccionada, setCitaTirillaSeleccionada] = useState(null);
  const [citaVIPSeleccionada, setCitaVIPSeleccionada] = useState(null);

  // Selector de Tipo de Vista: 'tablero' | 'lista' | 'barberos' | 'cuadricula'
  const [tipoVista, setTipoVista] = useState(() => localStorage.getItem('barberia_agenda_vista') || 'tablero');

  function handleCambiarVista(nuevaVista) {
    setTipoVista(nuevaVista);
    localStorage.setItem('barberia_agenda_vista', nuevaVista);
  }

  // Modal para nueva cita presencial
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [nuevaCita, setNuevaCita] = useState({
    barbero_id: '',
    servicio_id: '',
    cliente_nombre: '',
    cliente_telefono: '',
    fecha: getTodayStr(),
    hora_inicio: '10:00',
    notas: ''
  });
  const [errorNueva, setErrorNueva] = useState('');
  const [guardandoNueva, setGuardandoNueva] = useState(false);

  // Modal para Reasignar Barbero
  const [citaAReasignar, setCitaAReasignar] = useState(null);
  const [nuevoBarberoId, setNuevoBarberoId] = useState('');
  const [guardandoReasignacion, setGuardandoReasignacion] = useState(false);
  const [errorReasignacion, setErrorReasignacion] = useState('');

  // Modal para Enviar al Barbero (Strictly NO phone / sensitive data)
  const [citaAEnviar, setCitaAEnviar] = useState(null);
  const [mensajeCopiado, setMensajeCopiado] = useState(false);

  useEffect(() => {
    cargarCitas();
  }, [filtroTiempo, fechaDesde, fechaHasta, barberoId]);

  async function cargarCitas() {
    setCargando(true);
    try {
      let url = '/api/citas';
      const params = [];
      if (filtroTiempo === 'hoy') {
        const hoy = getTodayStr();
        params.push(`fecha=${hoy}`);
      } else if (filtroTiempo === 'ayer') {
        const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        params.push(`fecha=${ayer}`);
      } else if (filtroTiempo === '7d') {
        const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const hoy = getTodayStr();
        params.push(`desde=${hace7}&hasta=${hoy}`);
      } else if (filtroTiempo === 'rango' && fechaDesde && fechaHasta) {
        params.push(`desde=${fechaDesde}&hasta=${fechaHasta}`);
      }
      if (barberoId) {
        params.push(`barbero_id=${barberoId}`);
      }
      if (busqueda.trim()) {
        params.push(`q=${encodeURIComponent(busqueda.trim())}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setCitas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar citas:', err);
    } finally {
      setCargando(false);
    }
  }

  function handlePedirResenaGoogle(cita) {
    if (!cita) return;
    const rawPhone = String(cita.cliente_telefono || '').replace(/\D/g, '');
    if (!rawPhone) {
      alert('Esta cita no tiene un número de WhatsApp registrado para contactar al cliente.');
      return;
    }

    if (!shopConfig?.google_reviews_url) {
      const continuar = window.confirm(
        'Aún no has configurado el enlace directo de Google Maps en Ajustes > Google Reviews 5★.\n\n¿Deseas enviar el mensaje de agradecimiento por WhatsApp de todas formas?'
      );
      if (!continuar) return;
    }

    const waUrl = generarUrlWhatsAppResena({ cita, shopConfig });
    if (waUrl) {
      window.open(waUrl, '_blank');
    }
  }

  async function cambiarEstadoCita(id, nuevoEstado) {
    try {
      const res = await fetch(`/api/citas/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        if (nuevoEstado === 'completada') {
          const citaObj = citas.find(c => c.id === id);
          if (citaObj && citaObj.cliente_telefono) {
            const desearResena = window.confirm(
              `¡Turno completado y cobrado! 🎉\n\n¿Deseas enviar a ${citaObj.cliente_nombre || 'el cliente'} la solicitud de reseña de 5★ en Google por WhatsApp ahora?`
            );
            if (desearResena) {
              handlePedirResenaGoogle(citaObj);
            }
          }
        }
        cargarCitas();
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  }

  async function handleCrearCitaManual(e) {
    e.preventDefault();
    if (!nuevaCita.barbero_id || !nuevaCita.servicio_id || !nuevaCita.cliente_nombre) {
      setErrorNueva('Por favor completa barbero, servicio y nombre del cliente');
      return;
    }
    setGuardandoNueva(true);
    setErrorNueva('');

    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaCita)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorNueva(data.error || 'No se pudo guardar la cita');
        return;
      }

      setMostrarModalNueva(false);
      setNuevaCita({
        barbero_id: barberos[0]?.id || '',
        servicio_id: servicios[0]?.id || '',
        cliente_nombre: '',
        cliente_telefono: '',
        fecha: getTodayStr(),
        hora_inicio: '10:00',
        notas: ''
      });
      cargarCitas();
    } catch (err) {
      setErrorNueva('Error de conexión');
    } finally {
      setGuardandoNueva(false);
    }
  }

  // Ejecutar Reasignación de Barbero
  async function handleGuardarReasignacion(e) {
    e.preventDefault();
    if (!nuevoBarberoId) {
      setErrorReasignacion('Selecciona el nuevo barbero a asignar');
      return;
    }

    setGuardandoReasignacion(true);
    setErrorReasignacion('');

    try {
      const res = await fetch(`/api/citas/${citaAReasignar.id}/reasignar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbero_id: Number(nuevoBarberoId),
          usuario: 'Administrador'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorReasignacion(data.error || 'Error al reasignar cita');
        return;
      }

      setCitaAReasignar(null);
      cargarCitas();
    } catch (err) {
      setErrorReasignacion('Error de conexión con el servidor');
    } finally {
      setGuardandoReasignacion(false);
    }
  }

  // Generar mensaje confidencial para el barbero (SIN teléfono ni datos sensibles del cliente)
  function construirMensajeBarbero(cita) {
    return (
      `💈 *NUEVO TURNO ASIGNADO*\n\n` +
      `👤 *Cliente:* ${cita.cliente_nombre}\n` +
      `✂️ *Servicio:* ${cita.servicio_nombre}\n` +
      `📅 *Fecha:* ${cita.fecha}\n` +
      `⏰ *Horario:* ${formatTime12(cita.hora_inicio)} - ${formatTime12(cita.hora_fin)}\n\n` +
      `_Por favor confirma disponibilidad para este turno en el local._`
    );
  }

  async function handleCopiarMensaje(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      setMensajeCopiado(true);
      setTimeout(() => setMensajeCopiado(false), 2500);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  }

  // Agrupaciones para el Tablero Kanban
  const citasPendientes = citas.filter(c => !['completada', 'cancelada', 'no_asistio'].includes(c.estado));
  const citasCompletadas = citas.filter(c => c.estado === 'completada');
  const citasCanceladas = citas.filter(c => ['cancelada', 'no_asistio'].includes(c.estado));

  const totalRecaudadoCompletadas = citasCompletadas.reduce((acc, c) => acc + Number(c.precio_cobrado || 0), 0);

  return (
    <div className="space-y-4">
      
      {/* FILTRO DE FECHAS UNIVERSAL & MOTOR DE BÚSQUEDA */}
      <DateRangeFilter
        filtroTiempo={filtroTiempo}
        setFiltroTiempo={setFiltroTiempo}
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onBuscar={cargarCitas}
        placeholder="Buscar cita por cliente o teléfono..."
      />

      {/* BARRA SECUNDARIA: FILTRO POR BARBERO & BOTÓN NUEVA CITA */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:max-w-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={barberoId}
            onChange={(e) => setBarberoId(e.target.value)}
            className="w-full bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-bold"
          >
            <option value="">Todos los Barberos del Equipo</option>
            {barberos.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setNuevaCita(prev => ({
              ...prev,
              barbero_id: barberos[0]?.id || '',
              servicio_id: servicios[0]?.id || ''
            }));
            setMostrarModalNueva(true);
          }}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Cita Presencial</span>
        </button>
      </div>

      {/* ENCABEZADO DE AGENDA & SELECTOR DE VISTAS (TABLERO, LISTA, POR BARBERO, TARJETAS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-sans leading-tight">
              Historial & Agenda de Turnos
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-extrabold border border-blue-200">
              {citas.length} turnos
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Elige el estilo de visualización que mejor se adapte a tu flujo de trabajo.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* SELECTOR DE MODO DE VISTA */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/80 shadow-inner">
            
            {/* 1. Modo Tablero Kanban */}
            <button
              type="button"
              onClick={() => handleCambiarVista('tablero')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tipoVista === 'tablero'
                  ? 'bg-white text-blue-600 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista Tablero Kanban por Estado"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Tablero</span>
            </button>

            {/* 2. Modo Lista / Tabla Detallada */}
            <button
              type="button"
              onClick={() => handleCambiarVista('lista')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tipoVista === 'lista'
                  ? 'bg-white text-blue-600 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en Lista de Filas"
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>

            {/* 3. Modo Columnas por Barbero */}
            <button
              type="button"
              onClick={() => handleCambiarVista('barberos')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tipoVista === 'barberos'
                  ? 'bg-white text-blue-600 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Horarios por Cada Barbero"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Por Barbero</span>
            </button>

            {/* 4. Modo Cuadrícula de Tarjetas */}
            <button
              type="button"
              onClick={() => handleCambiarVista('cuadricula')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tipoVista === 'cuadricula'
                  ? 'bg-white text-blue-600 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Tarjetas Amplias"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Tarjetas</span>
            </button>

          </div>

          <button
            type="button"
            onClick={cargarCitas}
            title="Recargar agenda"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-blue-600 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL SEGÚN EL MODO DE VISTA SELECCIONADO */}
      {cargando ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-medium">Cargando agenda de turnos...</p>
        </div>
      ) : citas.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-slate-800 font-bold text-base">No hay turnos para este criterio</h4>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
            Prueba cambiando el filtro de fecha o registra un cliente presencial con el botón "Agendar Cita Presencial".
          </p>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* VISTA 1: TABLERO KANBAN POR ESTADO (RECOMENDADA) */}
          {/* ======================================================== */}
          {tipoVista === 'tablero' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start animate-fadeIn">
              
              {/* COLUMNA 1: PENDIENTES / POR ATENDER */}
              <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                      Por Atender / Pendientes
                    </h4>
                  </div>
                  <span className="text-[11px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {citasPendientes.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {citasPendientes.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-white/60 rounded-xl border border-dashed border-slate-200">
                      No hay turnos pendientes en este filtro
                    </div>
                  ) : (
                    citasPendientes.map(cita => (
                      <TarjetaKanbanCita 
                        key={cita.id} 
                        cita={cita}
                        shopConfig={shopConfig}
                        onCompletar={() => cambiarEstadoCita(cita.id, 'completada')}
                        onCancelar={() => cambiarEstadoCita(cita.id, 'cancelada')}
                        onNoAsistio={() => cambiarEstadoCita(cita.id, 'no_asistio')}
                        onReasignar={() => {
                          setCitaAReasignar(cita);
                          setNuevoBarberoId(String(cita.barbero_id));
                        }}
                        onEnviar={() => setCitaAEnviar(cita)}
                        onPedirResena={() => handlePedirResenaGoogle(cita)}
                        onVerFicha={() => setCitaFichaSeleccionada(cita)}
                        onVerTirilla={() => setCitaTirillaSeleccionada(cita)}
                        onVerVIP={() => setCitaVIPSeleccionada(cita)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* COLUMNA 2: COMPLETADAS / COBRADAS */}
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-3 sm:p-3.5 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900">
                      Completadas & Cobradas
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 hidden sm:inline">
                      {formatCOP(totalRecaudadoCompletadas)}
                    </span>
                    <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {citasCompletadas.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {citasCompletadas.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-white/60 rounded-xl border border-dashed border-emerald-200">
                      Aún no hay turnos completados en este rango
                    </div>
                  ) : (
                    citasCompletadas.map(cita => (
                      <TarjetaKanbanCita 
                        key={cita.id} 
                        cita={cita}
                        shopConfig={shopConfig}
                        onCompletar={() => cambiarEstadoCita(cita.id, 'completada')}
                        onCancelar={() => cambiarEstadoCita(cita.id, 'cancelada')}
                        onNoAsistio={() => cambiarEstadoCita(cita.id, 'no_asistio')}
                        onReasignar={() => {
                          setCitaAReasignar(cita);
                          setNuevoBarberoId(String(cita.barbero_id));
                        }}
                        onEnviar={() => setCitaAEnviar(cita)}
                        onPedirResena={() => handlePedirResenaGoogle(cita)}
                        onVerFicha={() => setCitaFichaSeleccionada(cita)}
                        onVerTirilla={() => setCitaTirillaSeleccionada(cita)}
                        onVerVIP={() => setCitaVIPSeleccionada(cita)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* COLUMNA 3: CANCELADAS / NO ASISTIÓ */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
                      Canceladas / No Asistió
                    </h4>
                  </div>
                  <span className="text-[11px] font-black bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {citasCanceladas.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {citasCanceladas.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-white/60 rounded-xl border border-dashed border-slate-200">
                      Sin citas canceladas
                    </div>
                  ) : (
                    citasCanceladas.map(cita => (
                      <TarjetaKanbanCita 
                        key={cita.id} 
                        cita={cita}
                        shopConfig={shopConfig}
                        onCompletar={() => cambiarEstadoCita(cita.id, 'completada')}
                        onCancelar={() => cambiarEstadoCita(cita.id, 'cancelada')}
                        onNoAsistio={() => cambiarEstadoCita(cita.id, 'no_asistio')}
                        onReasignar={() => {
                          setCitaAReasignar(cita);
                          setNuevoBarberoId(String(cita.barbero_id));
                        }}
                        onEnviar={() => setCitaAEnviar(cita)}
                        onPedirResena={() => handlePedirResenaGoogle(cita)}
                        onVerFicha={() => setCitaFichaSeleccionada(cita)}
                        onVerTirilla={() => setCitaTirillaSeleccionada(cita)}
                        onVerVIP={() => setCitaVIPSeleccionada(cita)}
                      />
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 2: LISTA DETALLADA / TABLA DE ALTA DENSIDAD */}
          {/* ======================================================== */}
          {tipoVista === 'lista' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                    <tr>
                      <th className="py-3 px-4">Hora & Fecha</th>
                      <th className="py-3 px-4">Cliente & Contacto</th>
                      <th className="py-3 px-4">Servicio & Valor</th>
                      <th className="py-3 px-4">Barbero Responsable</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {citas.map(cita => {
                      const isCompletada = cita.estado === 'completada';
                      const isCancelada = cita.estado === 'cancelada';
                      const isNoAsistio = cita.estado === 'no_asistio';

                      return (
                        <tr key={cita.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-black text-slate-900 block text-xs">
                              {formatTime12(cita.hora_inicio)} - {formatTime12(cita.hora_fin)}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {cita.fecha}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                              {cita.cliente_nombre}
                            </span>
                            {cita.cliente_telefono && (
                              <a
                                href={`https://wa.me/${cita.cliente_telefono.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-mono flex items-center gap-1 mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{cita.cliente_telefono}</span>
                              </a>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {cita.servicio_nombre}
                            </span>
                            <span className="font-extrabold text-emerald-700 text-xs">
                              {formatCOP(cita.precio_cobrado)}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              <span>{cita.barbero_nombre}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block ${
                              isCompletada
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isCancelada
                                ? 'bg-slate-100 text-slate-600 line-through'
                                : isNoAsistio
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {cita.estado === 'completada' ? 'Completado' : cita.estado}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isCompletada && !isCancelada && (
                                <button
                                  onClick={() => cambiarEstadoCita(cita.id, 'completada')}
                                  title="Marcar como atendida y cobrada"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              {!isCancelada && (
                                <>
                                  <button
                                    onClick={() => {
                                      setCitaAReasignar(cita);
                                      setNuevoBarberoId(String(cita.barbero_id));
                                    }}
                                    title="Reasignar a otro barbero"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => setCitaAEnviar(cita)}
                                    title="Enviar al WhatsApp del barbero sin datos del cliente"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {!isCancelada && !isCompletada && (
                                <button
                                  onClick={() => cambiarEstadoCita(cita.id, 'cancelada')}
                                  title="Cancelar turno"
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 3: COLUMNAS DE TURNOS POR BARBERO */}
          {/* ======================================================== */}
          {tipoVista === 'barberos' && (
            <div className="flex gap-4 overflow-x-auto pb-4 items-start animate-fadeIn">
              {barberos.map(barbero => {
                const citasBarbero = citas.filter(c => String(c.barbero_id) === String(barbero.id));
                const recaudadoBarbero = citasBarbero
                  .filter(c => c.estado === 'completada')
                  .reduce((acc, c) => acc + Number(c.precio_cobrado || 0), 0);

                return (
                  <div key={barbero.id} className="min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 shrink-0 shadow-xs">
                    {/* Encabezado del Barbero */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200 bg-white p-3 rounded-xl shadow-xs">
                      <img
                        src={barbero.foto_url || 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=120'}
                        alt={barbero.nombre}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-xs text-slate-900 block truncate">
                          {barbero.nombre}
                        </span>
                        <span className="text-[10px] text-blue-600 block truncate font-medium">
                          {barbero.especialidad || 'Barbero Oficial'}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>{citasBarbero.length} turnos</span>
                          <span className="font-extrabold text-emerald-700">{formatCOP(recaudadoBarbero)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Turnos de este barbero */}
                    <div className="space-y-2.5">
                      {citasBarbero.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs bg-white/70 rounded-xl border border-dashed border-slate-200">
                          Sin turnos asignados en este rango
                        </div>
                      ) : (
                        citasBarbero.map(cita => (
                          <TarjetaKanbanCita 
                            key={cita.id} 
                            cita={cita}
                            shopConfig={shopConfig}
                            onCompletar={() => cambiarEstadoCita(cita.id, 'completada')}
                            onCancelar={() => cambiarEstadoCita(cita.id, 'cancelada')}
                            onNoAsistio={() => cambiarEstadoCita(cita.id, 'no_asistio')}
                            onReasignar={() => {
                              setCitaAReasignar(cita);
                              setNuevoBarberoId(String(cita.barbero_id));
                            }}
                            onEnviar={() => setCitaAEnviar(cita)}
                            onPedirResena={() => handlePedirResenaGoogle(cita)}
                            onVerFicha={() => setCitaFichaSeleccionada(cita)}
                            onVerTirilla={() => setCitaTirillaSeleccionada(cita)}
                            onVerVIP={() => setCitaVIPSeleccionada(cita)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 4: CUADRÍCULA DE TARJETAS (VISTA CLÁSICA) */}
          {/* ======================================================== */}
          {tipoVista === 'cuadricula' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
              {citas.map((cita) => {
                const isCompletada = cita.estado === 'completada';
                const isCancelada = cita.estado === 'cancelada';
                const isNoAsistio = cita.estado === 'no_asistio';

                return (
                  <div
                    key={cita.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCompletada
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isCancelada
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isNoAsistio
                        ? 'bg-rose-50/50 border-rose-200 opacity-75'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Encabezado de la cita: Hora y Estado */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                          {formatTime12(cita.hora_inicio)} - {formatTime12(cita.hora_fin)}
                        </span>
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCompletada 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isCancelada 
                            ? 'bg-slate-100 text-slate-600 line-through'
                            : isNoAsistio 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {cita.estado === 'completada' ? 'Completado' : cita.estado}
                        </span>
                      </div>

                      {/* Datos del Cliente y Servicio */}
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{cita.cliente_nombre}</span>
                        </h4>
                        {shopConfig?.modulos_activos?.ficha_tecnica !== false && (
                          <button
                            type="button"
                            onClick={() => setCitaFichaSeleccionada(cita)}
                            className="py-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            title="Consultar o registrar fórmula de corte de este cliente"
                          >
                            <Scissors className="w-3.5 h-3.5 text-amber-600" />
                            <span>Ficha de Estilo</span>
                          </button>
                        )}
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                        <p className="flex items-center gap-2">
                          <Scissors className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="font-semibold text-slate-800">{cita.servicio_nombre}</span>
                          <span className="text-emerald-700 font-extrabold ml-auto">{formatCOP(cita.precio_cobrado)}</span>
                        </p>

                        {cita.cliente_telefono && (
                          <p className="flex items-center gap-2 text-slate-500">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <a href={`https://wa.me/${cita.cliente_telefono.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-blue-600 underline font-medium">
                              {cita.cliente_telefono}
                            </a>
                          </p>
                        )}

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Barbero Asignado:</span>
                            <span className="text-slate-900 font-bold">{cita.barbero_nombre}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha:</span>
                            <span className="text-slate-700 font-medium">{cita.fecha}</span>
                          </div>
                        </div>

                        {cita.notas && (
                          <p className="text-slate-600 text-[11px] italic bg-slate-50 p-2.5 rounded-lg mt-1 border border-slate-200">
                            "{cita.notas}"
                          </p>
                        )}
                      </div>

                      {/* ACCIONES DE ASIGNACIÓN & ENVÍO SEGURO AL BARBERO */}
                      {!isCancelada && (
                        <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCitaAReasignar(cita);
                              setNuevoBarberoId(String(cita.barbero_id));
                              setErrorReasignacion('');
                            }}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200/80 hover:border-blue-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Reasignar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCitaAEnviar(cita)}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold border border-slate-200/80 hover:border-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Enviar resumen al barbero sin datos sensibles"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Enviar Barbero</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Acciones de Estado de la Cita */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                      {cita.estado !== 'completada' && (
                        <button
                          onClick={() => cambiarEstadoCita(cita.id, 'completada')}
                          title="Marcar como atendido y cobrado"
                          className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg font-bold border border-emerald-200 hover:border-emerald-600 transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completar</span>
                        </button>
                      )}

                      {cita.estado === 'confirmada' && (
                        <>
                          <button
                            onClick={() => cambiarEstadoCita(cita.id, 'no_asistio')}
                            title="Marcar como cliente no asistió"
                            className="py-1.5 px-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-semibold cursor-pointer"
                          >
                            No asistió
                          </button>
                          <button
                            onClick={() => cambiarEstadoCita(cita.id, 'cancelada')}
                            title="Cancelar cita"
                            className="py-1.5 px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {cita.estado === 'completada' && (
                        <div className="flex items-center gap-2 ml-auto flex-wrap">
                          {shopConfig?.modulos_activos?.tarjeta_vip !== false && (
                            <button
                              type="button"
                              onClick={() => setCitaVIPSeleccionada(cita)}
                              className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-all shadow-xs cursor-pointer border border-amber-300"
                              title="Ver o sellar tarjeta VIP del cliente"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                              <span>Sellar VIP</span>
                            </button>
                          )}
                          {shopConfig?.modulos_activos?.tirilla_pos !== false && (
                            <button
                              type="button"
                              onClick={() => setCitaTirillaSeleccionada(cita)}
                              className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-slate-200"
                              title="Ver o emitir tirilla digital térmica POS con código QR"
                            >
                              <Receipt className="w-3.5 h-3.5 text-slate-600" />
                              <span>Recibo POS</span>
                            </button>
                          )}
                          {shopConfig?.modulos_activos?.google_reviews !== false && (
                            <button
                              type="button"
                              onClick={() => handlePedirResenaGoogle(cita)}
                              className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Enviar WhatsApp al cliente para pedir reseña de 5 estrellas en Google Maps"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                              <span>Pedir Reseña 5★</span>
                            </button>
                          )}
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Listo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL PARA REASIGNAR BARBERO A LA CITA */}
      {citaAReasignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-sans">
                  Reasignar Barbero
                </h3>
                <p className="text-xs text-slate-500">
                  Cambia el barbero que atenderá este turno
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-xs space-y-1">
              <p className="font-bold text-slate-800">
                Cliente: <span className="text-blue-600">{citaAReasignar.cliente_nombre}</span>
              </p>
              <p className="text-slate-600">
                Servicio: <span className="font-semibold">{citaAReasignar.servicio_nombre}</span> • Horario: {formatTime12(citaAReasignar.hora_inicio)} - {formatTime12(citaAReasignar.hora_fin)}
              </p>
              <p className="text-slate-500">
                Barbero actual: <span className="font-semibold text-slate-700">{citaAReasignar.barbero_nombre}</span>
              </p>
            </div>

            {errorReasignacion && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorReasignacion}</span>
              </div>
            )}

            <form onSubmit={handleGuardarReasignacion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Seleccionar Nuevo Barbero Responsable:
                </label>
                <select
                  required
                  value={nuevoBarberoId}
                  onChange={(e) => setNuevoBarberoId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {barberos.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} {String(b.id) === String(citaAReasignar.barbero_id) ? '(Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  El sistema registrará esta reasignación en el libro de auditoría histórico para control de administración.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCitaAReasignar(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoReasignacion}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {guardandoReasignacion ? 'Reasignando...' : 'Confirmar Reasignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA ENVIAR CITA AL BARBERO (CONFIDENCIAL) */}
      {citaAEnviar && (() => {
        const barberoAsignado = barberos.find(b => String(b.id) === String(citaAEnviar.barbero_id));
        const textoConfidencial = construirMensajeBarbero(citaAEnviar);
        const telefonoBarberoLimpio = barberoAsignado?.telefono ? barberoAsignado.telefono.replace(/[^0-9]/g, '') : '';
        const whatsappUrl = telefonoBarberoLimpio 
          ? `https://wa.me/${telefonoBarberoLimpio}?text=${encodeURIComponent(textoConfidencial)}` 
          : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-sans">
                    Enviar Turno a {citaAEnviar.barbero_nombre}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Notifica al barbero de forma directa y 100% confidencial
                  </p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Protección de Datos Activa</span>
                  <span className="text-[11px] text-emerald-700">
                    El mensaje generado solo contiene el nombre del cliente, horario y servicio. 
                    <strong> NO incluye teléfono, correo ni notas privadas</strong> para resguardar la privacidad.
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed mb-4">
                {textoConfidencial}
              </div>

              <div className="space-y-2">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Abrir WhatsApp de {citaAEnviar.barbero_nombre}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium">
                    ⚠️ {citaAEnviar.barbero_nombre} no tiene teléfono registrado. Puedes copiar el texto abajo para enviárselo por cualquier medio.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleCopiarMensaje(textoConfidencial)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {mensajeCopiado ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">¡Mensaje Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copiar Texto al Portapapeles</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCitaAEnviar(null)}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL PARA AGENDAR CITA PRESENCIAL (WALK-IN) */}
      {mostrarModalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-sans">
              Agendar Turno Presencial
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Registra un cliente que llegó directamente a la barbería o llamó por teléfono.
            </p>

            {errorNueva && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorNueva}</span>
              </div>
            )}

            <form onSubmit={handleCrearCitaManual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={nuevaCita.cliente_nombre}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, cliente_nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="Ej: 3001234567"
                  value={nuevaCita.cliente_telefono}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, cliente_telefono: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Barbero *
                  </label>
                  <select
                    required
                    value={nuevaCita.barbero_id}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, barbero_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="">Seleccionar...</option>
                    {barberos.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Servicio *
                  </label>
                  <select
                    required
                    value={nuevaCita.servicio_id}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, servicio_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="">Seleccionar...</option>
                    {servicios.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} ({formatCOP(s.precio_cop)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={nuevaCita.fecha}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, fecha: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={nuevaCita.hora_inicio}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, hora_inicio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notas adicionales
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalles sobre el corte o pedido especial..."
                  value={nuevaCita.notas}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, notas: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNueva(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoNueva}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {guardandoNueva ? 'Guardando...' : 'Confirmar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FICHA TÉCNICA DE ESTILO (FASE 2) */}
      {citaFichaSeleccionada && (
        <ModalFichaTecnica
          cliente={{
            cliente_nombre: citaFichaSeleccionada.cliente_nombre,
            cliente_telefono: citaFichaSeleccionada.cliente_telefono
          }}
          barberos={barberos}
          citaRelacionada={citaFichaSeleccionada}
          shopConfig={shopConfig}
          onClose={() => setCitaFichaSeleccionada(null)}
        />
      )}

      {/* MODAL TIRILLA DIGITAL / RECIBO POS CON QR */}
      {citaTirillaSeleccionada && (
        <ModalTirillaPOS
          cita={citaTirillaSeleccionada}
          shopConfig={shopConfig}
          onActualizarCita={cargarCitas}
          onClose={() => setCitaTirillaSeleccionada(null)}
        />
      )}

      {/* MODAL TARJETA DIGITAL VIP & SELLOS (FASE 4) */}
      {citaVIPSeleccionada && (
        <ModalTarjetaVIPAdmin
          cliente={citaVIPSeleccionada}
          shopConfig={shopConfig}
          onClose={() => setCitaVIPSeleccionada(null)}
          onSuccess={cargarCitas}
        />
      )}

    </div>
  );
}

// Subcomponente de Tarjeta para Tablero Kanban & Vista por Barbero
function TarjetaKanbanCita({ cita, onCompletar, onCancelar, onNoAsistio, onReasignar, onEnviar, onPedirResena, onVerFicha, onVerTirilla, onVerVIP, shopConfig }) {
  const isCompletada = cita.estado === 'completada';
  const isCancelada = cita.estado === 'cancelada';
  const isNoAsistio = cita.estado === 'no_asistio';

  return (
    <div className={`p-3.5 rounded-xl border transition-all text-xs space-y-2.5 ${
      isCompletada
        ? 'bg-white border-emerald-200 shadow-xs'
        : isCancelada
        ? 'bg-white border-slate-200 opacity-60'
        : isNoAsistio
        ? 'bg-white border-rose-200 opacity-80'
        : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md'
    }`}>
      {/* Horario y Estado */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] border border-blue-200/80">
          {formatTime12(cita.hora_inicio)} - {formatTime12(cita.hora_fin)}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {cita.fecha}
        </span>
      </div>

      {/* Cliente y Teléfono */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <span className="font-extrabold text-slate-900 block text-xs truncate">
            {cita.cliente_nombre}
          </span>
          {shopConfig?.modulos_activos?.ficha_tecnica !== false && (
            <button
              type="button"
              onClick={onVerFicha}
              className="text-[9px] text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              title="Ver o registrar fórmula de estilo de este cliente"
            >
              <Scissors className="w-2.5 h-2.5 text-amber-600" />
              <span>Ficha</span>
            </button>
          )}
        </div>
        {cita.cliente_telefono && (
          <a
            href={`https://wa.me/${cita.cliente_telefono.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-emerald-600 hover:text-emerald-700 font-mono flex items-center gap-1 mt-0.5"
          >
            <Phone className="w-2.5 h-2.5" />
            <span>{cita.cliente_telefono}</span>
          </a>
        )}
      </div>

      {/* Servicio & Valor */}
      <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
        <span className="text-slate-700 font-semibold truncate pr-2">
          {cita.servicio_nombre}
        </span>
        <span className="font-black text-emerald-700 shrink-0">
          {formatCOP(cita.precio_cobrado)}
        </span>
      </div>

      {/* Barbero */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <User className="w-3 h-3 text-slate-400" />
        <span className="font-bold text-slate-700 truncate">{cita.barbero_nombre}</span>
      </div>

      {/* Notas */}
      {cita.notas && (
        <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded-md border border-slate-200 line-clamp-2">
          "{cita.notas}"
        </p>
      )}

      {/* Botones de Acción */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
        {!isCompletada && !isCancelada && (
          <button
            type="button"
            onClick={onCompletar}
            className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
            title="Marcar como atendida y cobrada"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Cobrar</span>
          </button>
        )}

        {!isCancelada && (
          <>
            <button
              type="button"
              onClick={onReasignar}
              className="p-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              title="Reasignar barbero"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onEnviar}
              className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
              title="Enviar al WhatsApp del barbero"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {!isCancelada && !isCompletada && (
          <button
            type="button"
            onClick={onCancelar}
            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Cancelar cita"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {isCompletada && (
          <div className="flex items-center justify-between w-full gap-1.5 flex-wrap">
            {shopConfig?.modulos_activos?.tarjeta_vip !== false && (
              <button
                type="button"
                onClick={onVerVIP}
                className="py-1 px-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                title="Ver o sellar tarjeta VIP del cliente"
              >
                <CreditCard className="w-3 h-3 text-amber-600" />
                <span>VIP</span>
              </button>
            )}
            {shopConfig?.modulos_activos?.tirilla_pos !== false && (
              <button
                type="button"
                onClick={onVerTirilla}
                className="py-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs cursor-pointer border border-slate-200"
                title="Ver tirilla digital POS con QR o enviar por WhatsApp"
              >
                <Receipt className="w-3 h-3 text-slate-600" />
                <span>Recibo</span>
              </button>
            )}
            {shopConfig?.modulos_activos?.google_reviews !== false && (
              <button
                type="button"
                onClick={onPedirResena}
                className="py-1 px-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-900 border border-amber-300 font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                title="Enviar WhatsApp pidiendo reseña 5★ en Google Maps"
              >
                <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                <span>5★</span>
              </button>
            )}
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 ml-auto">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Cobrada</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
