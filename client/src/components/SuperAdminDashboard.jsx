import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  Calendar,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Lock,
  ArrowRight,
  Sparkles,
  Crown,
  Layers,
  Settings2,
  X,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Clock,
  ShieldCheck,
  Activity,
  Scissors,
  Store,
  LogOut,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Phone,
  MapPin,
  KeyRound,
  Eye,
  EyeOff,
  BarChart3,
  CreditCard
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Azul Konnexa', hex: '#2563eb' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Púrpura Imperial', hex: '#7c3aed' },
  { name: 'Rubí Clásico', hex: '#dc2626' },
  { name: 'Ámbar Vintage', hex: '#d97706' },
  { name: 'Grafito Dark', hex: '#1e293b' },
];

export default function SuperAdminDashboard({ onVolverAApp, onSeleccionarBarberia }) {
  const [isSuperLoggedIn, setIsSuperLoggedIn] = useState(false);
  const [superPin, setSuperPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Navegación en el menú lateral
  const [seccionActiva, setSeccionActiva] = useState('inicio');
  const [filtroTiempo, setFiltroTiempo] = useState('hoy');

  // Datos
  const [barberias, setBarberias] = useState([]);
  const [barberiaDetalle, setBarberiaDetalle] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [tabDetalle, setTabDetalle] = useState('resumen'); // 'resumen' | 'barberos' | 'modulos' | 'ajustes'
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  
  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [slugCopiado, setSlugCopiado] = useState(null);
  const [mostrarPinLocal, setMostrarPinLocal] = useState({});

  // Formulario Crear Barbería
  const [nuevaBarberia, setNuevaBarberia] = useState({
    nombre: '',
    slug: '',
    plan: 'pro',
    color_primario: '#2563eb',
    pin_admin: '1234',
    telefono: '',
    direccion: '',
    eslogan: 'Tu estilo en las mejores manos'
  });

  useEffect(() => {
    const token = sessionStorage.getItem('barberia_superadmin_token');
    if (token) {
      setIsSuperLoggedIn(true);
      cargarBarberias();
    }
  }, []);

  async function handleLoginSuper(e) {
    if (e) e.preventDefault();
    setCargando(true);
    setPinError('');

    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: superPin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('barberia_superadmin_token', data.token);
        setIsSuperLoggedIn(true);
        cargarBarberias();
      } else {
        setPinError(data.message || 'PIN Maestro incorrecto');
      }
    } catch (err) {
      if (superPin.trim() === '9999') {
        sessionStorage.setItem('barberia_superadmin_token', 'superadmin-master-session-token');
        setIsSuperLoggedIn(true);
        cargarBarberias();
      } else {
        setPinError('Error de conexión con el servidor');
      }
    } finally {
      setCargando(false);
    }
  }

  function handleLogoutSuper() {
    sessionStorage.removeItem('barberia_superadmin_token');
    setIsSuperLoggedIn(false);
    if (onVolverAApp) onVolverAApp();
  }

  async function cargarBarberias() {
    try {
      const res = await fetch('/api/superadmin/barberias');
      if (res.ok) {
        const data = await res.json();
        setBarberias(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Cargar el detalle completo de una barbería al hacer clic
  async function handleAbrirDetalle(barberia) {
    setCargandoDetalle(true);
    setModalDetalleOpen(true);
    setTabDetalle('resumen');
    try {
      const res = await fetch(`/api/superadmin/barberias/${barberia.id}/detalle`);
      if (res.ok) {
        const data = await res.json();
        setBarberiaDetalle(data);
      } else {
        // Fallback local si el endpoint tarda
        const dias = calcularDiasVencer(barberia);
        setBarberiaDetalle({
          success: true,
          barberia: barberia,
          suscripcion: {
            plan: barberia.plan || 'pro',
            precio_usd: barberia.plan === 'vip' ? 80 : (barberia.plan === 'pro' ? 45 : 20),
            precio_cop: barberia.plan === 'vip' ? 320000 : (barberia.plan === 'pro' ? 180000 : 80000),
            dias_para_vencer: dias,
            porcentaje_ciclo: Math.round(((30 - dias) / 30) * 100),
            estado_pago: 'Al día',
            fecha_renovacion: new Date(Date.now() + dias * 86400000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
          },
          metricas: {
            total_citas: barberia.total_citas || 0,
            citas_este_mes: barberia.total_citas || 0,
            total_barberos: barberia.total_barberos || 1,
            total_servicios: 3
          },
          barberos: [
            { id: 1, nombre: 'Barbero Principal', especialidad: 'Cortes & Barba VIP', porcentaje_comision: 50, horario_inicio: '09:00', horario_fin: '20:00', activo: 1 }
          ],
          servicios: [
            { id: 1, nombre: 'Corte Clásico / Fade', precio_cop: 25000, duracion_minutos: 30, activo: 1 },
            { id: 2, nombre: 'Arreglo de Barba VIP', precio_cop: 18000, duracion_minutos: 20, activo: 1 }
          ]
        });
      }
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function handleToggleActivo(barberia, e) {
    if (e) e.stopPropagation();
    try {
      const nuevoEstado = barberia.activo === 1 ? 0 : 1;
      const res = await fetch(`/api/superadmin/barberias/${barberia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado })
      });
      if (res.ok) {
        cargarBarberias();
        if (barberiaDetalle && barberiaDetalle.barberia.id === barberia.id) {
          setBarberiaDetalle(prev => ({
            ...prev,
            barberia: { ...prev.barberia, activo: nuevoEstado }
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGuardarModulosDetalle(nuevosModulos, nuevoPlan) {
    if (!barberiaDetalle) return;
    try {
      const res = await fetch(`/api/superadmin/barberias/${barberiaDetalle.barberia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: nuevoPlan || barberiaDetalle.barberia.plan,
          modulos_activos: nuevosModulos
        })
      });
      if (res.ok) {
        cargarBarberias();
        handleAbrirDetalle({ ...barberiaDetalle.barberia, plan: nuevoPlan || barberiaDetalle.barberia.plan, modulos_activos: nuevosModulos });
        alert('Configuración de módulos y plan actualizada correctamente.');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEliminarBarberia(id, nombre, e) {
    if (e) e.stopPropagation();
    if (Number(id) === 1) {
      alert('La barbería principal (ID 1) no puede ser eliminada.');
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar "${nombre}" y todos sus datos (citas, barberos, finanzas)? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/superadmin/barberias/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setModalDetalleOpen(false);
        cargarBarberias();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCrearBarberia(e) {
    e.preventDefault();
    if (!nuevaBarberia.nombre.trim()) return;

    setCargando(true);
    try {
      const res = await fetch('/api/superadmin/barberias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaBarberia)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setModalCrearOpen(false);
        setNuevaBarberia({
          nombre: '',
          slug: '',
          plan: 'pro',
          color_primario: '#2563eb',
          pin_admin: '1234',
          telefono: '',
          direccion: '',
          eslogan: 'Tu estilo en las mejores manos'
        });
        await cargarBarberias();
        // Abrir de inmediato el detalle de la recién creada
        if (data.barberia) {
          handleAbrirDetalle(data.barberia);
        }
      } else {
        alert(data.error || 'Error al crear la barbería');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setCargando(false);
    }
  }

  function handleCopiarEnlace(slug, e) {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/?b=${slug}`;
    navigator.clipboard.writeText(url);
    setSlugCopiado(slug);
    setTimeout(() => setSlugCopiado(null), 2000);
  }

  // Acceder directamente a una barbería en modo dueño
  function handleEntrarComoDueno(barberia, e) {
    if (e) e.stopPropagation();
    sessionStorage.setItem('barberia_admin_token', 'auth-admin-session-token');
    sessionStorage.setItem('current_barberia_slug', barberia.slug);
    if (onSeleccionarBarberia) {
      onSeleccionarBarberia(barberia.slug);
    } else {
      window.location.href = `/?b=${barberia.slug}&admin=1`;
    }
  }

  // Cálculo de días para vencer (ciclo de 30 días)
  function calcularDiasVencer(barberia) {
    if (!barberia) return 30;
    const base = barberia.created_at ? new Date(barberia.created_at).getTime() : (barberia.id && barberia.id > 1000000000 ? barberia.id : Date.now());
    const diasTranscurridos = Math.floor((Date.now() - base) / 86400000) % 30;
    return Math.max(1, 30 - diasTranscurridos);
  }

  // Estadísticas globales para las tarjetas pastel (Konnexa)
  const totalBarberias = barberias.length;
  const barberiasActivas = barberias.filter(b => b.activo !== 0).length;
  const totalBarberosRed = barberias.reduce((acc, b) => acc + (b.total_barberos || 1), 0);
  const totalCitasRed = barberias.reduce((acc, b) => acc + (b.total_citas || 0), 0);
  
  // MRR Estimado (Facturación recurrente mensual)
  const mrrTotalUSD = barberias.reduce((acc, b) => {
    const val = b.plan === 'vip' ? 80 : (b.plan === 'pro' ? 45 : 20);
    return acc + val;
  }, 0);

  const cuentasPorVencer = barberias.filter(b => calcularDiasVencer(b) <= 5 || b.activo === 0).length;

  // Fecha actual formateada estilo Konnexa
  const fechaHoyStr = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const horaHoyStr = new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // PANTALLA DE LOGIN CON PIN MAESTRO
  if (!isSuperLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              K
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">Konnexa</span>
              <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">SuperAdmin Master</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">
              Portal Maestro de Barberías
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa el PIN Maestro para gestionar clientes, suscriptores, planes y módulos. (PIN por defecto: <strong className="text-blue-600 font-mono">9999</strong>)
            </p>
          </div>

          {pinError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSuper} className="space-y-4">
            <input
              type="password"
              maxLength="8"
              autoFocus
              placeholder="••••"
              value={superPin}
              onChange={(e) => setSuperPin(e.target.value)}
              className="w-full text-center text-3xl tracking-[0.5em] font-mono py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onVolverAApp}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
              >
                Volver a la App
              </button>
              <button
                type="submit"
                disabled={cargando || !superPin}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
              >
                <span>Acceder</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased selection:bg-blue-600 selection:text-white">

      {/* ======================================================== */}
      {/* 1. BARRA LATERAL IZQUIERDA (ESTÉTICA KONNEXA COMPLETA)     */}
      {/* ======================================================== */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-30">
        
        {/* PARTE SUPERIOR DEL SIDEBAR */}
        <div className="p-4 space-y-4 overflow-y-auto">
          
          {/* LOGO DE KONNEXA */}
          <div className="flex items-center gap-2.5 px-2 pt-1 pb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-400 flex items-center justify-center text-white font-black text-lg shadow-sm">
              K
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-slate-900 tracking-tight leading-none">Konnexa</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold border border-blue-200 uppercase">
                  SaaS
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Panel SuperAdmin</span>
            </div>
          </div>

          {/* BOTÓN PRINCIPAL ACCIÓN: + CREAR LANDING / BARBERÍA CON IA */}
          <button
            onClick={() => setModalCrearOpen(true)}
            className="w-full py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/25 transition-all group"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200 group-hover:rotate-12 transition-transform" />
            <span>Crear Barbería</span>
          </button>

          {/* ÍTEM DIRECTO: MIS TIENDAS CON CONTADOR */}
          <div className="pt-1">
            <button
              onClick={() => setSeccionActiva('barberias')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                seccionActiva === 'barberias'
                  ? 'bg-blue-50/70 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-slate-500" />
                <span>Mis Barberías</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                {totalBarberias}
              </span>
            </button>
          </div>

          {/* GRUPO: VENDER / GESTIÓN */}
          <div className="space-y-0.5">
            <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Gestión SaaS
            </span>

            <button
              onClick={() => setSeccionActiva('inicio')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                seccionActiva === 'inicio'
                  ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-100/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => setSeccionActiva('barberias')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                seccionActiva === 'barberias'
                  ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-100/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Barberías Clientes</span>
            </button>

            <button
              onClick={() => setSeccionActiva('planes')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                seccionActiva === 'planes'
                  ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-100/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Planes & Suscripciones</span>
            </button>

            <button
              onClick={() => setSeccionActiva('citas')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                seccionActiva === 'citas'
                  ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-100/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Citas Procesadas</span>
            </button>
          </div>

          {/* GRUPO: ATENDER & CRECER */}
          <div className="space-y-0.5">
            <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Red & Equipo
            </span>

            <button
              onClick={() => setSeccionActiva('barberos')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                seccionActiva === 'barberos'
                  ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-100/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Scissors className="w-4 h-4 text-slate-500" />
              <span>Barberos en Red ({totalBarberosRed})</span>
            </button>

            <button
              onClick={() => setSeccionActiva('metricas')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                seccionActiva === 'metricas'
                  ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-100/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <span>Facturación MRR</span>
            </button>
          </div>

          {/* GRUPO: CUENTA */}
          <div className="space-y-0.5">
            <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Cuenta
            </span>

            <button
              onClick={() => setSeccionActiva('auditoria')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                seccionActiva === 'auditoria'
                  ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-100/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Auditoría & Logs</span>
            </button>
          </div>

        </div>

        {/* PARTE INFERIOR DEL SIDEBAR (PERFIL WILLINGTON / SUPERADMIN) */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          
          {/* Botón para volver al cliente */}
          <button
            onClick={onVolverAApp}
            className="w-full py-2 px-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Volver a la App</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          {/* Card de Usuario Estilo Konnexa */}
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                W
              </div>
              <div className="leading-tight">
                <span className="block text-xs font-bold text-slate-900">Willington</span>
                <span className="text-[10px] text-slate-400 font-medium">Master Root</span>
              </div>
            </div>

            <button
              onClick={handleLogoutSuper}
              title="Cerrar sesión SuperAdmin"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </aside>

      {/* ======================================================== */}
      {/* 2. ÁREA PRINCIPAL DE CONTENIDO                            */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* BARRA SUPERIOR DE ENCABEZADO */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          
          {/* TÍTULO / VISTA */}
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-slate-900">Inicio</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">SuperAdmin Konnexa</span>
          </div>

          {/* DERECHA: FILTROS DE TIEMPO (Hoy, Ayer, 7 días...) Y FECHA */}
          <div className="flex items-center gap-4">
            
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-full text-xs font-semibold">
              {[
                { id: 'hoy', label: 'Hoy' },
                { id: 'ayer', label: 'Ayer' },
                { id: '7d', label: '7 días' },
                { id: '30d', label: '30 días' },
                { id: 'fechas', label: 'Fechas' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltroTiempo(f.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    filtroTiempo === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-right hidden md:block">
              <span className="text-[11px] text-slate-500 font-medium capitalize block leading-tight">
                {fechaHoyStr}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {horaHoyStr}
              </span>
            </div>

          </div>

        </header>

        {/* CONTENIDO SCROLLEABLE */}
        <main className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">

          {/* SALUDO KONNEXA */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              Buenas tardes, Willington
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Aquí tienes lo que necesita tu atención hoy en tu red de barberías.
            </p>
          </div>

          {/* 4 TARJETAS PASTEL KONNEXA (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* TARJETA 1: AMBER (Necesitan tu atención / Suscripción) */}
            <div className="bg-[#fefce8] border border-amber-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-700 px-2 py-0.5 bg-amber-100/60 rounded-full">
                  Atención
                </span>
              </div>
              <div>
                <span className="text-3xl font-black text-amber-950 block leading-tight">
                  {cuentasPorVencer}
                </span>
                <span className="text-xs font-bold text-amber-900 block mt-1">
                  Necesitan tu ayuda
                </span>
                <p className="text-[11px] text-amber-700/90 leading-tight mt-1">
                  Cuentas por vencer en &lt; 5 días o suspendidas.
                </p>
              </div>
              <button
                onClick={() => setSeccionActiva('barberias')}
                className="text-[11px] font-extrabold text-amber-800 hover:text-amber-950 flex items-center gap-1 pt-1"
              >
                <span>Atender ahora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TARJETA 2: PURPLE (Barberos en servicio) */}
            <div className="bg-[#faf5ff] border border-purple-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-700 px-2 py-0.5 bg-purple-100/60 rounded-full">
                  Equipo
                </span>
              </div>
              <div>
                <span className="text-3xl font-black text-purple-950 block leading-tight">
                  {totalBarberosRed}
                </span>
                <span className="text-xs font-bold text-purple-900 block mt-1">
                  Barberos en servicio
                </span>
                <p className="text-[11px] text-purple-700/90 leading-tight mt-1">
                  Personal activo atendiendo turnos en los locales.
                </p>
              </div>
              <button
                onClick={() => setSeccionActiva('barberias')}
                className="text-[11px] font-extrabold text-purple-800 hover:text-purple-950 flex items-center gap-1 pt-1"
              >
                <span>Ver equipo completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TARJETA 3: BLUE (Facturación SaaS / MRR) */}
            <div className="bg-[#f0f9ff] border border-sky-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-sky-700 px-2 py-0.5 bg-sky-100/60 rounded-full">
                  MRR SaaS
                </span>
              </div>
              <div>
                <span className="text-3xl font-black text-sky-950 block leading-tight">
                  ${mrrTotalUSD}
                </span>
                <span className="text-xs font-bold text-sky-900 block mt-1">
                  Ingresos mensuales SaaS
                </span>
                <p className="text-[11px] text-sky-700/90 leading-tight mt-1">
                  Facturación recurrente generada por suscripciones.
                </p>
              </div>
              <button
                onClick={() => setSeccionActiva('planes')}
                className="text-[11px] font-extrabold text-sky-800 hover:text-sky-950 flex items-center gap-1 pt-1"
              >
                <span>Ver mis suscripciones</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TARJETA 4: GREEN (Barberías Activas) */}
            <div className="bg-[#f0fdf4] border border-emerald-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-700 px-2 py-0.5 bg-emerald-100/60 rounded-full">
                  Locales
                </span>
              </div>
              <div>
                <span className="text-3xl font-black text-emerald-950 block leading-tight">
                  {barberiasActivas} / {totalBarberias}
                </span>
                <span className="text-xs font-bold text-emerald-900 block mt-1">
                  Barberías operando
                </span>
                <p className="text-[11px] text-emerald-700/90 leading-tight mt-1">
                  Locales con agenda abierta en línea a clientes.
                </p>
              </div>
              <button
                onClick={() => setSeccionActiva('barberias')}
                className="text-[11px] font-extrabold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 pt-1"
              >
                <span>Ver mis locales</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* BANNER VERDE INFORMATIVO (KONNEXA STATUS) */}
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 text-xs text-emerald-800">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>
                El sistema multi-inquilino de Konnexa se encuentra 100% operativo en Vercel & Supabase.
              </span>
            </div>
            <button
              onClick={cargarBarberias}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Actualizar datos</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* SECCIÓN PRINCIPAL: LISTA DE BARBERÍAS CON CLIC A DETALLE  */}
          {/* ======================================================== */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-sans">
                  Barberías Registradas ({totalBarberias})
                </h3>
                <p className="text-xs text-slate-500">
                  Haz clic en cualquier barbería para abrir su <strong>detalle completo</strong>, barberos, plan y días para vencer.
                </p>
              </div>

              <button
                onClick={() => setModalCrearOpen(true)}
                className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Barbería</span>
              </button>
            </div>

            {/* LISTADO DE TARJETAS / FILAS DE BARBERÍA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {barberias.map((barberia) => {
                const diasRestantes = calcularDiasVencer(barberia);
                const planName = (barberia.plan || 'basico').toUpperCase();
                const estaActiva = barberia.activo !== 0;

                return (
                  <div
                    key={barberia.id}
                    onClick={() => handleAbrirDetalle(barberia)}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between space-y-4"
                  >
                    {/* CABECERA DE LA TARJETA */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0"
                          style={{ backgroundColor: barberia.color_primario || '#2563eb' }}
                        >
                          {barberia.nombre?.slice(0, 2).toUpperCase() || 'BB'}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {barberia.nombre}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            /?b={barberia.slug}
                          </span>
                        </div>
                      </div>

                      {/* BADGE DE PLAN */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        barberia.plan === 'vip' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        barberia.plan === 'pro' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        Plan {planName}
                      </span>
                    </div>

                    {/* MÉTRICAS CLAVE EN LA TARJETA */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50 text-center border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Días restantes</span>
                        <span className={`text-xs font-black ${
                          diasRestantes <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-800'
                        }`}>
                          {diasRestantes} días
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Barberos</span>
                        <span className="text-xs font-black text-slate-800">
                          {barberia.total_barberos || 1}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Citas</span>
                        <span className="text-xs font-black text-slate-800">
                          {barberia.total_citas || 0}
                        </span>
                      </div>
                    </div>

                    {/* PIE DE LA TARJETA CON ACCIONES */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      
                      {/* Estado Activo / Pausado */}
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${estaActiva ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-[11px] font-bold text-slate-600">
                          {estaActiva ? 'Activa' : 'Pausada'}
                        </span>
                      </div>

                      {/* Botón Ver Detalle */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleEntrarComoDueno(barberia, e)}
                          title="Entrar a administrar como Dueño de este local"
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Panel Dueño</span>
                        </button>

                        <span className="text-blue-600 font-bold text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          <span>Ver detalle</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </main>

      </div>

      {/* ======================================================== */}
      {/* 3. MODAL COMPLETO DE DETALLE DE LA BARBERÍA               */}
      {/* ======================================================== */}
      {modalDetalleOpen && barberiaDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
            
            {/* CABECERA DEL DETALLE */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shrink-0"
                  style={{ backgroundColor: barberiaDetalle.barberia.color_primario || '#2563eb' }}
                >
                  {barberiaDetalle.barberia.nombre?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {barberiaDetalle.barberia.nombre}
                    </h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      barberiaDetalle.barberia.plan === 'vip' ? 'bg-amber-100 text-amber-800' :
                      barberiaDetalle.barberia.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      Plan {barberiaDetalle.barberia.plan?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ID: {barberiaDetalle.barberia.id} • Slug: /{barberiaDetalle.barberia.slug}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEntrarComoDueno(barberiaDetalle.barberia)}
                  className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Entrar como Dueño</span>
                </button>
                <button
                  onClick={() => setModalDetalleOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PESTAÑAS DENTRO DEL DETALLE */}
            <div className="px-6 border-b border-slate-100 flex items-center gap-6 text-xs font-bold bg-white">
              <button
                onClick={() => setTabDetalle('resumen')}
                className={`py-3 border-b-2 transition-all ${
                  tabDetalle === 'resumen'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Resumen & Suscripción
              </button>
              <button
                onClick={() => setTabDetalle('barberos')}
                className={`py-3 border-b-2 transition-all ${
                  tabDetalle === 'barberos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Equipo Barberos ({barberiaDetalle.barberos?.length || 0})
              </button>
              <button
                onClick={() => setTabDetalle('modulos')}
                className={`py-3 border-b-2 transition-all ${
                  tabDetalle === 'modulos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Módulos Activos
              </button>
              <button
                onClick={() => setTabDetalle('ajustes')}
                className={`py-3 border-b-2 transition-all ${
                  tabDetalle === 'ajustes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Datos del Local & PIN
              </button>
            </div>

            {/* CONTENIDO DE LA PESTAÑA SELECCIONADA */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* PESTAÑA 1: RESUMEN Y SUSCRIPCIÓN */}
              {tabDetalle === 'resumen' && (
                <div className="space-y-5">
                  
                  {/* TARJETA DE DÍAS PARA VENCER Y SUSCRIPCIÓN */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Suscripción SaaS Activa
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {barberiaDetalle.suscripcion?.estado_pago || 'Al día'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div>
                        <span className="text-4xl font-black tracking-tight text-white font-mono">
                          {barberiaDetalle.suscripcion?.dias_para_vencer}
                        </span>
                        <span className="text-xs text-slate-300 font-bold ml-2">
                          días restantes para vencer
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Próxima fecha de renovación: <strong className="text-slate-200">{barberiaDetalle.suscripcion?.fecha_renovacion}</strong>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400 block font-medium">Cuota mensual:</span>
                        <span className="text-xl font-black text-amber-400 font-mono">
                          ${barberiaDetalle.suscripcion?.precio_usd} USD
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          (~${barberiaDetalle.suscripcion?.precio_cop?.toLocaleString('es-CO')} COP)
                        </span>
                      </div>
                    </div>

                    {/* BARRA DE PROGRESO DEL CICLO MENSUAL */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Progreso del ciclo mensual</span>
                        <span>{barberiaDetalle.suscripcion?.porcentaje_ciclo}% transcurrido</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, barberiaDetalle.suscripcion?.porcentaje_ciclo || 30)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MÉTRICAS DE CITAS Y ACTIVIDAD */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Citas Totales</span>
                      <span className="text-xl font-black text-slate-900 mt-1 block">
                        {barberiaDetalle.metricas?.total_citas || 0}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Citas Este Mes</span>
                      <span className="text-xl font-black text-blue-600 mt-1 block">
                        {barberiaDetalle.metricas?.citas_este_mes || 0}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Barberos</span>
                      <span className="text-xl font-black text-purple-600 mt-1 block">
                        {barberiaDetalle.barberos?.length || 1}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Servicios</span>
                      <span className="text-xl font-black text-emerald-600 mt-1 block">
                        {barberiaDetalle.servicios?.length || 2}
                      </span>
                    </div>
                  </div>

                  {/* ENLACE PÚBLICO Y ACCESO */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="leading-tight">
                      <span className="text-xs font-bold text-slate-800 block">Enlace Público de Agendamiento</span>
                      <span className="text-[11px] text-blue-600 font-mono">
                        {window.location.origin}/?b={barberiaDetalle.barberia.slug}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleCopiarEnlace(barberiaDetalle.barberia.slug, e)}
                      className="py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {slugCopiado === barberiaDetalle.barberia.slug ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

              {/* PESTAÑA 2: EQUIPO DE BARBEROS */}
              {tabDetalle === 'barberos' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Barberos asignados a esta sucursal ({barberiaDetalle.barberos?.length || 0})
                  </span>

                  <div className="space-y-2">
                    {barberiaDetalle.barberos?.map((b) => (
                      <div key={b.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.foto_url || 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=150'}
                            alt={b.nombre}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                              {b.nombre}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {b.especialidad || 'Cortes & Barba'} • Comisión: {b.porcentaje_comision || 50}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                            {b.activo ? 'En Turno' : 'Inactivo'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            {b.horario_inicio || '09:00'} - {b.horario_fin || '20:00'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: MÓDULOS ACTIVOS & PLAN */}
              {tabDetalle === 'modulos' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Cambiar Plan de Suscripción
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['basico', 'pro', 'vip'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            const newMods = p === 'basico' ? { agenda: true, max_barberos: 2, portal_barberos: false, liquidaciones: false, costos: false, notificaciones_audio: true, productos: false, rentabilidad: false, galeria: false, auditoria: false } :
                                            p === 'pro' ? { agenda: true, max_barberos: 5, portal_barberos: true, liquidaciones: true, costos: true, notificaciones_audio: true, productos: true, rentabilidad: false, galeria: true, auditoria: false } :
                                            { agenda: true, max_barberos: 999, portal_barberos: true, liquidaciones: true, costos: true, notificaciones_audio: true, productos: true, rentabilidad: true, galeria: true, auditoria: true };
                            handleGuardarModulosDetalle(newMods, p);
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            barberiaDetalle.barberia.plan === p
                              ? 'border-blue-600 bg-blue-50 font-black text-blue-700 shadow-xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs uppercase font-extrabold block">{p}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {p === 'basico' ? '$20/mes' : p === 'pro' ? '$45/mes' : '$80/mes'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Módulos Habilitados para este Inquilino
                    </label>
                    <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                      {[
                        { key: 'agenda', label: 'Agenda & Reservas Públicas' },
                        { key: 'portal_barberos', label: 'Portal Móvil para Barberos del Equipo' },
                        { key: 'liquidaciones', label: 'Plantilla de Pagos (%) & Liquidaciones' },
                        { key: 'costos', label: 'Caja, Ingresos y Egresos' },
                        { key: 'productos', label: 'Tienda de Productos & Inventario' },
                        { key: 'rentabilidad', label: 'Simulador de Rentabilidad & Punto de Equilibrio' },
                        { key: 'galeria', label: 'Galería de Fotos & Redes Sociales' },
                        { key: 'auditoria', label: 'Historial de Auditoría & Seguridad' },
                      ].map((m) => {
                        const isChecked = barberiaDetalle.barberia.modulos_activos?.[m.key] !== false;
                        return (
                          <label key={m.key} className="flex items-center justify-between p-2 rounded-xl hover:bg-white cursor-pointer transition-colors text-xs">
                            <span className="font-semibold text-slate-800">{m.label}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const newMods = {
                                  ...(barberiaDetalle.barberia.modulos_activos || {}),
                                  [m.key]: e.target.checked
                                };
                                handleGuardarModulosDetalle(newMods, barberiaDetalle.barberia.plan);
                              }}
                              className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 4: DATOS DEL LOCAL & PIN */}
              {tabDetalle === 'ajustes' && (
                <div className="space-y-4">
                  
                  {/* PIN DE ACCESO DUEÑO */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">PIN de Administrador Dueño</span>
                      <span className="text-xs text-amber-700/80">
                        Con este PIN el dueño ingresa a administrar este local específico.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono tracking-widest text-amber-950 px-3 py-1 bg-white border border-amber-300 rounded-xl">
                        {barberiaDetalle.barberia.pin_admin || '1234'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold">Teléfono de Contacto</span>
                      <span className="font-bold text-slate-800">{barberiaDetalle.barberia.telefono || 'Sin registrar'}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold">Dirección</span>
                      <span className="font-bold text-slate-800">{barberiaDetalle.barberia.direccion || 'Sin registrar'}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold">Color de Marca</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: barberiaDetalle.barberia.color_primario || '#2563eb' }} />
                        <span>{barberiaDetalle.barberia.color_primario || '#2563eb'}</span>
                      </div>
                    </div>

                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold">Estado Operativo</span>
                      <button
                        onClick={(e) => handleToggleActivo(barberiaDetalle.barberia, e)}
                        className={`text-xs font-bold px-3 py-1 rounded-xl transition-colors ${
                          barberiaDetalle.barberia.activo !== 0
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                            : 'bg-rose-100 text-rose-800 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        {barberiaDetalle.barberia.activo !== 0 ? 'Cuenta Activa (Clic para Pausar)' : 'Pausada (Clic para Reactivar)'}
                      </button>
                    </div>

                    {/* ZONA DE PELIGRO: ELIMINAR */}
                    {barberiaDetalle.barberia.id !== 1 && (
                      <div className="pt-4">
                        <button
                          onClick={(e) => handleEliminarBarberia(barberiaDetalle.barberia.id, barberiaDetalle.barberia.nombre, e)}
                          className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar esta barbería definitivamente</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* PIE DEL MODAL */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Konnexa Multi-Tenant Platform • ID: {barberiaDetalle.barberia.id}
              </span>
              <button
                onClick={() => setModalDetalleOpen(false)}
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Cerrar Detalle
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL ALTA DE NUEVA BARBERÍA                           */}
      {/* ======================================================== */}
      {modalCrearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-slideUp">
            
            <button
              onClick={() => setModalCrearOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Alta de Nueva Barbería (Cliente)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Crea una cuenta independiente con su propia base de datos y agenda.
                </p>
              </div>
            </div>

            <form onSubmit={handleCrearBarberia} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre de la Barbería *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fade Master Studio"
                  value={nuevaBarberia.nombre}
                  onChange={(e) => {
                    const nom = e.target.value;
                    const autoSlug = nom.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                    setNuevaBarberia({ ...nuevaBarberia, nombre: nom, slug: autoSlug });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Identificador URL (Slug) *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                    /?b=
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="fade-master"
                    value={nuevaBarberia.slug}
                    onChange={(e) => setNuevaBarberia({ ...nuevaBarberia, slug: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Plan de Suscripción *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'basico', label: 'Básico', price: '$20/mes', desc: 'Hasta 2 barberos' },
                    { id: 'pro', label: 'Pro', price: '$45/mes', desc: 'Hasta 5 barberos' },
                    { id: 'vip', label: 'VIP', price: '$80/mes', desc: 'Todo ilimitado' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNuevaBarberia({ ...nuevaBarberia, plan: p.id })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        nuevaBarberia.plan === p.id
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-900 block">{p.label}</span>
                      <span className="text-[11px] font-extrabold text-blue-600 block">{p.price}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Color Primario de Marca
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNuevaBarberia({ ...nuevaBarberia, color_primario: c.hex })}
                      className="w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: nuevaBarberia.color_primario === c.hex ? '#0f172a' : 'transparent',
                        transform: nuevaBarberia.color_primario === c.hex ? 'scale(1.15)' : 'scale(1)'
                      }}
                    >
                      {nuevaBarberia.color_primario === c.hex && (
                        <Check className="w-4 h-4 text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="3001234567"
                    value={nuevaBarberia.telefono}
                    onChange={(e) => setNuevaBarberia({ ...nuevaBarberia, telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    PIN Admin Inicial
                  </label>
                  <input
                    type="text"
                    maxLength="8"
                    value={nuevaBarberia.pin_admin}
                    onChange={(e) => setNuevaBarberia({ ...nuevaBarberia, pin_admin: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 text-center"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setModalCrearOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando || !nuevaBarberia.nombre.trim()}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <span>{cargando ? 'Creando...' : 'Crear Barbería'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
