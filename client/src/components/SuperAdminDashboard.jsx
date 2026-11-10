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
  ToggleLeft,
  ToggleRight,
  Sliders,
  Trash2,
  Lock,
  ArrowRight,
  Sparkles,
  Crown,
  Layers,
  Settings2,
  X,
  Copy,
  Check
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Azul Real', hex: '#2563eb' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Púrpura', hex: '#7c3aed' },
  { name: 'Rubí', hex: '#dc2626' },
  { name: 'Ámbar', hex: '#d97706' },
  { name: 'Grafito', hex: '#334155' },
];

export default function SuperAdminDashboard({ onVolverAApp, onSeleccionarBarberia }) {
  const [isSuperLoggedIn, setIsSuperLoggedIn] = useState(false);
  const [superPin, setSuperPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [barberias, setBarberias] = useState([]);
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalModulosOpen, setModalModulosOpen] = useState(false);
  const [barberiaSeleccionada, setBarberiaSeleccionada] = useState(null);
  const [slugCopiado, setSlugCopiado] = useState(null);

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
      setPinError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  }

  async function cargarBarberias() {
    try {
      const res = await fetch('/api/superadmin/barberias');
      if (res.ok) {
        const data = await res.json();
        setBarberias(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleActivo(barberia) {
    try {
      const res = await fetch(`/api/superadmin/barberias/${barberia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: barberia.activo === 1 ? 0 : 1 })
      });
      if (res.ok) {
        cargarBarberias();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEliminarBarberia(id, nombre) {
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
        cargarBarberias();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGuardarModulos(e) {
    e.preventDefault();
    if (!barberiaSeleccionada) return;

    try {
      const res = await fetch(`/api/superadmin/barberias/${barberiaSeleccionada.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: barberiaSeleccionada.plan,
          modulos_activos: barberiaSeleccionada.modulos_activos,
          color_primario: barberiaSeleccionada.color_primario
        })
      });
      if (res.ok) {
        setModalModulosOpen(false);
        setBarberiaSeleccionada(null);
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
        cargarBarberias();
      } else {
        alert(data.error || 'Error al crear la barbería');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setCargando(false);
    }
  }

  function handleCopiarEnlace(slug) {
    const url = `${window.location.origin}/?b=${slug}`;
    navigator.clipboard.writeText(url);
    setSlugCopiado(slug);
    setTimeout(() => setSlugCopiado(null), 2000);
  }

  // Si no está autenticado como SuperAdmin, mostrar pantalla de PIN
  if (!isSuperLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 max-w-md w-full shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">
              Portal SuperAdmin SaaS
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa el PIN Maestro para gestionar barberías clientes, activar planes y módulos independientes.
            </p>
          </div>

          <form onSubmit={handleLoginSuper} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                PIN Maestro (SuperAdmin)
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={superPin}
                  onChange={(e) => setSuperPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center text-2xl font-bold tracking-widest py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 bg-slate-50 focus:bg-white"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {pinError && (
                <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{pinError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={cargando || !superPin}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{cargando ? 'Verificando...' : 'Acceder al SuperAdmin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={onVolverAApp}
              className="hover:text-slate-600 transition-colors font-medium"
            >
              ← Volver a la Barbería
            </button>
            <span>PIN de fábrica: 9999</span>
          </div>
        </div>
      </div>
    );
  }

  // Métricas del SaaS
  const totalBarberias = barberias.length;
  const activas = barberias.filter(b => b.activo === 1).length;
  const totalCitas = barberias.reduce((sum, b) => sum + (b.total_citas || 0), 0);
  const totalBarberos = barberias.reduce((sum, b) => sum + (b.total_barberos || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Encabezado SuperAdmin */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" />
            <span>Master Multi-Tenant Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestión Central de Barberías Clientes
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Controla suscripciones, planes Básico/Pro/VIP y activa o suspende funciones individuales para cada barbería de manera independiente.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setModalCrearOpen(true)}
            className="py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Barbería</span>
          </button>

          <button
            onClick={onVolverAApp}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Volver a la App
          </button>
        </div>

        {/* Círculo decorativo */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Barberías Clientes</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalBarberias}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">{activas} activas en servicio</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Barberos en Red</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalBarberos}</p>
          <p className="text-[11px] text-slate-400 mt-1">Colaboradores registrados</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Citas Procesadas</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalCitas}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total acumulado en el sistema</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Planes Activos</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
              Bás: {barberias.filter(b => b.plan === 'basico').length}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">
              Pro: {barberias.filter(b => b.plan === 'pro').length}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold">
              VIP: {barberias.filter(b => b.plan === 'vip').length}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Barberías Clientes */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Barberías Registradas ({barberias.length})
            </h2>
            <p className="text-xs text-slate-500">
              Cada cliente cuenta con base de datos aislada, enlace propio y marca personalizada.
            </p>
          </div>

          <button
            onClick={() => setModalCrearOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Barbería</span>
          </button>
        </div>

        <div className="space-y-3">
          {barberias.map((b) => {
            const esActiva = b.activo === 1;
            const planBadge = 
              b.plan === 'vip' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              b.plan === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={b.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  esActiva ? 'border-slate-200 bg-white hover:border-slate-300' : 'border-rose-200 bg-rose-50/30 opacity-75'
                }`}
              >
                {/* Columna Izquierda: Info */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-lg shadow-sm flex-shrink-0"
                    style={{ backgroundColor: b.color_primario || '#2563eb' }}
                  >
                    {b.nombre.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {b.nombre}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${planBadge}`}>
                        Plan {b.plan}
                      </span>
                      {esActiva ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          Activa
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                          Suspendida
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        /{b.slug}
                      </span>
                      <span>•</span>
                      <span>{b.total_barberos || 0} barberos</span>
                      <span>•</span>
                      <span>{b.total_citas || 0} citas</span>
                      {b.telefono && (
                        <>
                          <span>•</span>
                          <span>{b.telefono}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Acciones */}
                <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                  {/* Copiar enlace cliente */}
                  <button
                    onClick={() => handleCopiarEnlace(b.slug)}
                    title="Copiar URL para el cliente"
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                  >
                    {slugCopiado === b.slug ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Abrir en la app */}
                  <button
                    onClick={() => onSeleccionarBarberia(b.slug)}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Configurar Módulos y Plan */}
                  <button
                    onClick={() => {
                      setBarberiaSeleccionada(b);
                      setModalModulosOpen(true);
                    }}
                    className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Módulos & Plan</span>
                  </button>

                  {/* Switch Activo / Suspendido */}
                  <button
                    onClick={() => handleToggleActivo(b)}
                    title={esActiva ? 'Suspender barbería' : 'Activar barbería'}
                    className={`p-1.5 rounded-xl border transition-colors ${
                      esActiva ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-200' : 'text-slate-400 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {esActiva ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>

                  {/* Eliminar (si no es la 1) */}
                  {b.id !== 1 && (
                    <button
                      onClick={() => handleEliminarBarberia(b.id, b.nombre)}
                      title="Eliminar barbería cliente"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Crear Nueva Barbería */}
      {modalCrearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Alta de Nueva Barbería (Cliente)
                </h3>
              </div>
              <button
                onClick={() => setModalCrearOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearBarberia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de la Barbería *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Master Barber Club"
                  value={nuevaBarberia.nombre}
                  onChange={(e) => {
                    const nombre = e.target.value;
                    const autoSlug = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    setNuevaBarberia({ ...nuevaBarberia, nombre, slug: autoSlug });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Identificador URL (Slug) *
                </label>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono bg-slate-50 px-3 py-2 border border-slate-300 rounded-xl">
                  <span>/?b=</span>
                  <input
                    type="text"
                    required
                    value={nuevaBarberia.slug}
                    onChange={(e) => setNuevaBarberia({ ...nuevaBarberia, slug: e.target.value })}
                    className="flex-1 bg-transparent outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Plan de Suscripción *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'basico', name: 'Básico', price: '$20/mes', desc: 'Hasta 2 barberos' },
                    { id: 'pro', name: 'Pro', price: '$45/mes', desc: 'Hasta 5 barberos' },
                    { id: 'vip', name: 'VIP', price: '$80/mes', desc: 'Todo ilimitado' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNuevaBarberia({ ...nuevaBarberia, plan: p.id })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        nuevaBarberia.plan === p.id
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-extrabold text-xs text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-indigo-600 font-bold">{p.price}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Color Primario de Marca
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNuevaBarberia({ ...nuevaBarberia, color_primario: c.hex })}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-transform ${
                        nuevaBarberia.color_primario === c.hex ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {nuevaBarberia.color_primario === c.hex && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+57 300 000 0000"
                    value={nuevaBarberia.telefono}
                    onChange={(e) => setNuevaBarberia({ ...nuevaBarberia, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PIN Admin Inicial
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={nuevaBarberia.pin_admin}
                    onChange={(e) => setNuevaBarberia({ ...nuevaBarberia, pin_admin: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCrearOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {cargando ? 'Creando...' : 'Crear Barbería'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configuración de Módulos y Plan */}
      {modalModulosOpen && barberiaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Configurar Módulos & Plan
                </h3>
                <p className="text-xs text-slate-500">{barberiaSeleccionada.nombre}</p>
              </div>
              <button
                onClick={() => setModalModulosOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarModulos} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Plan Contratado
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['basico', 'pro', 'vip'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        let newMods = { ...barberiaSeleccionada.modulos_activos };
                        if (p === 'basico') {
                          newMods = { agenda: true, max_barberos: 2, portal_barberos: false, liquidaciones: false, costos: false, notificaciones_audio: true, productos: false, rentabilidad: false, galeria: false, auditoria: false };
                        } else if (p === 'pro') {
                          newMods = { agenda: true, max_barberos: 5, portal_barberos: true, liquidaciones: true, costos: true, notificaciones_audio: true, productos: true, rentabilidad: false, galeria: true, auditoria: false };
                        } else {
                          newMods = { agenda: true, max_barberos: 999, portal_barberos: true, liquidaciones: true, costos: true, notificaciones_audio: true, productos: true, rentabilidad: true, galeria: true, auditoria: true };
                        }
                        setBarberiaSeleccionada({
                          ...barberiaSeleccionada,
                          plan: p,
                          modulos_activos: newMods
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        barberiaSeleccionada.plan === p
                          ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-xs uppercase font-extrabold">{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Módulos Activos (Independientes)
                </label>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                  {[
                    { key: 'agenda', label: 'Agenda & Reservas de Clientes' },
                    { key: 'portal_barberos', label: 'Portal Móvil para Barberos' },
                    { key: 'liquidaciones', label: 'Plantilla de Pagos (%) & Liquidaciones' },
                    { key: 'costos', label: 'Caja, Ingresos y Egresos' },
                    { key: 'productos', label: 'Tienda de Productos & Inventario' },
                    { key: 'rentabilidad', label: 'Simulador de Rentabilidad & Punto de Equilibrio' },
                    { key: 'galeria', label: 'Galería de Fotos & Redes Sociales' },
                    { key: 'auditoria', label: 'Historial de Auditoría & Seguridad' },
                  ].map((m) => {
                    const isChecked = barberiaSeleccionada.modulos_activos?.[m.key] !== false;
                    return (
                      <label key={m.key} className="flex items-center justify-between p-2 rounded-xl hover:bg-white cursor-pointer transition-colors text-xs">
                        <span className="font-medium text-slate-800">{m.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setBarberiaSeleccionada({
                              ...barberiaSeleccionada,
                              modulos_activos: {
                                ...barberiaSeleccionada.modulos_activos,
                                [m.key]: e.target.checked
                              }
                            });
                          }}
                          className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalModulosOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
