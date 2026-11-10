import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ClientBooking from './components/ClientBooking';
import AdminDashboard from './components/AdminDashboard';
import AdminPinModal from './components/AdminPinModal';
import BarberoPortal from './components/BarberoPortal';
import BarberoLoginModal from './components/BarberoLoginModal';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { Lock, Scissors, UserCheck, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';

function getInitialSlug() {
  const urlParams = new URLSearchParams(window.location.search);
  const bParam = urlParams.get('b') || urlParams.get('slug') || urlParams.get('barberia');
  if (bParam) return bParam;

  const pathname = window.location.pathname;
  const match = pathname.match(/^\/b\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  return sessionStorage.getItem('current_barberia_slug') || 'the-barber-club';
}

export default function App() {
  const [tenantSlug, setTenantSlug] = useState(getInitialSlug);
  const [activeView, setActiveView] = useState('client'); // 'client', 'admin', 'barbero', 'superadmin'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [barberoAutenticado, setBarberoAutenticado] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showBarberoModal, setShowBarberoModal] = useState(false);

  const [shopConfig, setShopConfig] = useState({
    nombre_barberia: 'The Barber Club',
    telefono_barberia: '+57 300 123 4567',
    direccion_barberia: 'Calle Principal # 10 - 20',
    color_primario: '#2563eb',
    plan: 'vip',
    modulos_activos: {},
    activo: 1
  });

  // Sincronizar tenant global y cargar su configuración
  useEffect(() => {
    window.__BARBERIA_SLUG = tenantSlug;
    sessionStorage.setItem('current_barberia_slug', tenantSlug);
    cargarConfiguracion(tenantSlug);
  }, [tenantSlug]);

  useEffect(() => {
    // Restaurar sesión de barbero si existe
    const barberoGuardado = sessionStorage.getItem('barberia_barbero_session');
    if (barberoGuardado) {
      try {
        const parsed = JSON.parse(barberoGuardado);
        setBarberoAutenticado(parsed);
      } catch (e) {
        sessionStorage.removeItem('barberia_barbero_session');
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin');
    const isSuperRoute = window.location.pathname.includes('/superadmin') || urlParams.get('superadmin') !== null;
    const isAdminRoute = window.location.pathname.includes('/admin') || window.location.hash.includes('admin') || urlParams.get('admin') !== null;
    const isBarberoRoute = window.location.pathname.includes('/barbero') || window.location.hash.includes('barbero') || urlParams.get('barbero') !== null;

    if (isSuperRoute) {
      setActiveView('superadmin');
      return;
    }

    if (pinParam === '1234' || urlParams.get('demo_admin') === '1') {
      sessionStorage.setItem('barberia_admin_token', 'demo_admin_authenticated');
      setIsAdminLoggedIn(true);
      setActiveView('admin');
      return;
    }

    const token = sessionStorage.getItem('barberia_admin_token');

    if (token) {
      setIsAdminLoggedIn(true);
      if (isAdminRoute) {
        setActiveView('admin');
      }
    } else if (isAdminRoute) {
      setShowPinModal(true);
    } else if (isBarberoRoute) {
      if (barberoGuardado) {
        setActiveView('barbero');
      } else {
        setShowBarberoModal(true);
      }
    }

    // Escuchar navegación del historial del navegador
    const handlePopState = () => {
      const isRouteSuper = window.location.pathname.includes('/superadmin');
      const isRouteAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('admin');
      const isRouteBarbero = window.location.pathname.includes('/barbero') || window.location.hash.includes('barbero');

      if (isRouteSuper) {
        setActiveView('superadmin');
      } else if (isRouteAdmin) {
        const currentToken = sessionStorage.getItem('barberia_admin_token');
        if (currentToken) {
          setActiveView('admin');
        } else {
          setShowPinModal(true);
        }
      } else if (isRouteBarbero) {
        const currentBarbero = sessionStorage.getItem('barberia_barbero_session');
        if (currentBarbero) {
          setActiveView('barbero');
        } else {
          setShowBarberoModal(true);
        }
      } else {
        setActiveView('client');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  async function cargarConfiguracion(slugActual = tenantSlug) {
    try {
      const res = await fetch(`/api/barberias/info?b=${slugActual}`);
      if (res.ok) {
        const data = await res.json();
        setShopConfig({
          id: data.id,
          slug: data.slug,
          nombre_barberia: data.nombre,
          telefono_barberia: data.telefono,
          direccion_barberia: data.direccion,
          eslogan: data.eslogan,
          color_primario: data.color_primario || '#2563eb',
          color_secundario: data.color_secundario || '#1e293b',
          plan: data.plan || 'basico',
          modulos_activos: data.modulos_activos || {},
          activo: data.activo
        });

        // Aplicar color primario dinámico en CSS
        if (data.color_primario) {
          document.documentElement.style.setProperty('--color-primary', data.color_primario);
        }
      }
    } catch (err) {
      console.error('Error cargando configuración multi-tenant:', err);
    }
  }

  function handleSwitchView(view) {
    if (view === 'superadmin') {
      setActiveView('superadmin');
      window.history.pushState(null, '', '/superadmin');
    } else if (view === 'admin') {
      if (!isAdminLoggedIn) {
        setShowPinModal(true);
      } else {
        setActiveView('admin');
        window.history.pushState(null, '', `/?b=${tenantSlug}&admin=1`);
      }
    } else if (view === 'barbero') {
      if (!barberoAutenticado) {
        setShowBarberoModal(true);
      } else {
        setActiveView('barbero');
        window.history.pushState(null, '', `/?b=${tenantSlug}&barbero=1`);
      }
    } else {
      setActiveView('client');
      window.history.pushState(null, '', `/?b=${tenantSlug}`);
    }
  }

  function handleAuthenticated(token) {
    sessionStorage.setItem('barberia_admin_token', token);
    setIsAdminLoggedIn(true);
    setShowPinModal(false);
    setActiveView('admin');
    window.history.pushState(null, '', `/?b=${tenantSlug}&admin=1`);
  }

  function handleBarberoAuthenticated(barbero) {
    sessionStorage.setItem('barberia_barbero_session', JSON.stringify(barbero));
    setBarberoAutenticado(barbero);
    setShowBarberoModal(false);
    setActiveView('barbero');
    window.history.pushState(null, '', `/?b=${tenantSlug}&barbero=1`);
  }

  function handleLogout() {
    sessionStorage.removeItem('barberia_admin_token');
    setIsAdminLoggedIn(false);
    setActiveView('client');
    window.history.pushState(null, '', `/?b=${tenantSlug}`);
  }

  function handleLogoutBarbero() {
    sessionStorage.removeItem('barberia_barbero_session');
    setBarberoAutenticado(null);
    setActiveView('client');
    window.history.pushState(null, '', `/?b=${tenantSlug}`);
  }

  function cambiarBarberia(nuevoSlug) {
    setTenantSlug(nuevoSlug);
    window.__BARBERIA_SLUG = nuevoSlug;
    sessionStorage.setItem('current_barberia_slug', nuevoSlug);
    setActiveView('client');
    window.history.pushState(null, '', `/?b=${nuevoSlug}`);
  }

  // Vista exclusiva de SuperAdmin
  if (activeView === 'superadmin') {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
        <SuperAdminDashboard
          onVolverAApp={() => handleSwitchView('client')}
          onSeleccionarBarberia={cambiarBarberia}
        />
      </div>
    );
  }

  // Si la barbería está suspendida por falta de pago o desactivación
  const estaSuspendida = shopConfig.activo === 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Barra de Notificación si la barbería está suspendida */}
      {estaSuspendida && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
          <AlertTriangle className="w-4 h-4" />
          <span>Atención: Esta cuenta se encuentra suspendida temporalmente. Comunícate con el soporte del sistema.</span>
        </div>
      )}

      {/* Barra de Navegación Superior */}
      <Navbar
        activeView={activeView}
        setActiveView={handleSwitchView}
        isAdminLoggedIn={isAdminLoggedIn}
        barberoAutenticado={barberoAutenticado}
        onLogout={handleLogout}
        onLogoutBarbero={handleLogoutBarbero}
        onAbrirBarberoLogin={() => {
          if (barberoAutenticado) {
            setActiveView('barbero');
          } else {
            setShowBarberoModal(true);
          }
        }}
        shopName={shopConfig.nombre_barberia}
        shopPhone={shopConfig.telefono_barberia}
      />

      {/* Contenido Principal */}
      <main className="flex-1 pb-16">
        {estaSuspendida && activeView !== 'admin' ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-200 rounded-3xl text-center shadow-lg space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Barbería Temporalmente Inactiva
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              El servicio para <strong>{shopConfig.nombre_barberia}</strong> se encuentra en pausa. Si eres el dueño, ingresa con tu PIN para reactivar la cuenta.
            </p>
            <button
              onClick={() => setShowPinModal(true)}
              className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              Acceso Dueño
            </button>
          </div>
        ) : activeView === 'admin' ? (
          <AdminDashboard
            shopConfig={shopConfig}
            onConfigActualizada={() => cargarConfiguracion(tenantSlug)}
          />
        ) : activeView === 'barbero' && barberoAutenticado ? (
          <BarberoPortal 
            barbero={barberoAutenticado}
            onLogout={handleLogoutBarbero}
          />
        ) : (
          <ClientBooking shopConfig={shopConfig} />
        )}
      </main>

      {/* Modal de PIN para Administrador */}
      {showPinModal && (
        <AdminPinModal
          onAuthenticated={handleAuthenticated}
          onCancel={() => {
            setShowPinModal(false);
            if (activeView === 'admin') {
              setActiveView('client');
              window.history.pushState(null, '', `/?b=${tenantSlug}`);
            }
          }}
        />
      )}

      {/* Modal de Autenticación de Barbero */}
      {showBarberoModal && (
        <BarberoLoginModal
          onAutenticado={handleBarberoAuthenticated}
          onCancel={() => {
            setShowBarberoModal(false);
            if (activeView === 'barbero') {
              setActiveView('client');
              window.history.pushState(null, '', `/?b=${tenantSlug}`);
            }
          }}
        />
      )}

      {/* Pie de página con accesos discretos */}
      <footer className="border-t border-slate-200 py-6 text-xs text-slate-500 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-500">
            {shopConfig.nombre_barberia} • Plataforma SaaS de Agendamiento
          </p>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Enlace discreto al Portal de Barberos */}
            <button
              onClick={() => {
                if (barberoAutenticado) {
                  setActiveView('barbero');
                } else {
                  setShowBarberoModal(true);
                }
              }}
              title="Acceso exclusivo para barberos del equipo"
              className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-[11px] py-1 px-2.5 rounded-lg hover:bg-slate-100 font-medium"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Portal Barberos</span>
            </button>

            {/* Enlace discreto para que el dueño ingrese */}
            <button
              onClick={() => {
                if (isAdminLoggedIn) {
                  setActiveView('admin');
                } else {
                  setShowPinModal(true);
                }
              }}
              title="Acceso exclusivo administración"
              className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-[11px] py-1 px-2.5 rounded-lg hover:bg-slate-100 font-medium"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Acceso Dueño</span>
            </button>

            {/* Enlace exclusivo SuperAdmin SaaS */}
            <button
              onClick={() => handleSwitchView('superadmin')}
              title="Portal SuperAdmin (Gestión de Barberías & Clientes)"
              className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 text-[11px] py-1 px-2 rounded-lg hover:bg-indigo-50 font-medium"
            >
              <ShieldAlert className="w-3 h-3 text-indigo-400" />
              <span>SuperAdmin</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
