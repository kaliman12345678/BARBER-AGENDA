import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ClientBooking from './components/ClientBooking';
import AdminDashboard from './components/AdminDashboard';
import BarberoPortal from './components/BarberoPortal';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import UnifiedLoginModal from './components/UnifiedLoginModal';
import { Lock, AlertTriangle } from 'lucide-react';

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
  const [showLoginModal, setShowLoginModal] = useState(false);

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
    const isSuperRoute = window.location.pathname.includes('/superadmin') || urlParams.get('superadmin') !== null;
    const isAdminRoute = window.location.pathname.includes('/admin') || window.location.hash.includes('admin') || urlParams.get('admin') !== null;
    const isBarberoRoute = window.location.pathname.includes('/barbero') || window.location.hash.includes('barbero') || urlParams.get('barbero') !== null;

    if (isSuperRoute) {
      setActiveView('superadmin');
      return;
    }

    // Auto-login solo si existe token de sesión activo previo en sessionStorage
    const adminToken = sessionStorage.getItem('barberia_admin_token');
    if (adminToken) {
      setIsAdminLoggedIn(true);
      if (isAdminRoute) {
        setActiveView('admin');
      }
    } else if (isAdminRoute) {
      // Si el dueño abre el enlace con &admin=1, desplegar directamente el modal para digitar su PIN
      setActiveView('client');
      setShowLoginModal(true);
    } else {
      // Para clientes regulares: vista limpia de agendamiento
      setActiveView('client');
      setShowLoginModal(false);
    }

    if (isBarberoRoute && barberoGuardado) {
      setActiveView('barbero');
    }
  }, []);

  async function cargarConfiguracion(slug) {
    try {
      const res = await fetch(`/api/configuracion?b=${slug}`, {
        headers: { 'x-barberia-slug': slug }
      });
      if (res.ok) {
        const data = await res.json();
        setShopConfig({
          nombre_barberia: data.nombre_barberia || 'The Barber Club',
          eslogan_barberia: data.eslogan_barberia || '',
          telefono_barberia: data.telefono_barberia || '',
          direccion_barberia: data.direccion_barberia || '',
          logo_url: data.logo_url || '',
          color_primario: data.color_primario || '#2563eb',
          color_secundario: data.color_secundario || '#1e293b',
          tema_cliente: data.tema_cliente || 'oscuro',
          plan: data.plan || 'basico',
          modulos_activos: data.modulos_activos || {},
          activo: data.activo !== undefined ? data.activo : 1
        });

        // Aplicar color de marca dinámico
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
        setShowLoginModal(true);
      } else {
        setActiveView('admin');
        window.history.pushState(null, '', `/?b=${tenantSlug}&admin=1`);
      }
    } else if (view === 'barbero') {
      if (!barberoAutenticado) {
        setShowLoginModal(true);
      } else {
        setActiveView('barbero');
        window.history.pushState(null, '', `/?b=${tenantSlug}&barbero=1`);
      }
    } else {
      setActiveView('client');
      window.history.pushState(null, '', `/?b=${tenantSlug}`);
    }
  }

  // Manejador del login único
  function handleUnifiedLoginSuccess(data) {
    setShowLoginModal(false);

    if (data.role === 'superadmin') {
      sessionStorage.setItem('barberia_superadmin_token', data.token);
      setActiveView('superadmin');
      window.history.pushState(null, '', '/superadmin');
    } else if (data.role === 'admin') {
      sessionStorage.setItem('barberia_admin_token', data.token);
      setIsAdminLoggedIn(true);
      setActiveView('admin');
      const targetSlug = data.barberia_slug || tenantSlug;
      if (targetSlug && targetSlug !== tenantSlug) {
        setTenantSlug(targetSlug);
        sessionStorage.setItem('current_barberia_slug', targetSlug);
        if (typeof window !== 'undefined') window.__BARBERIA_SLUG = targetSlug;
      }
      window.history.pushState(null, '', `/?b=${targetSlug}&admin=1`);
    } else if (data.role === 'barbero') {
      sessionStorage.setItem('barberia_barbero_session', JSON.stringify(data.barbero));
      if (data.token) {
        sessionStorage.setItem('barberia_barbero_token', data.token);
      }
      setBarberoAutenticado(data.barbero);
      setActiveView('barbero');
      const targetSlug = data.barberia_slug || tenantSlug;
      if (targetSlug && targetSlug !== tenantSlug) {
        setTenantSlug(targetSlug);
        sessionStorage.setItem('current_barberia_slug', targetSlug);
        if (typeof window !== 'undefined') window.__BARBERIA_SLUG = targetSlug;
      }
      window.history.pushState(null, '', `/?b=${targetSlug}&barbero=1`);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('barberia_admin_token');
    setIsAdminLoggedIn(false);
    setActiveView('client');
    window.history.pushState(null, '', `/?b=${tenantSlug}`);
  }

  function handleLogoutBarbero() {
    sessionStorage.removeItem('barberia_barbero_session');
    sessionStorage.removeItem('barberia_barbero_token');
    setBarberoAutenticado(null);
    setActiveView('client');
    window.history.pushState(null, '', `/?b=${tenantSlug}`);
  }

  function cambiarBarberia(nuevoSlug, entrarComoAdmin = false) {
    setTenantSlug(nuevoSlug);
    window.__BARBERIA_SLUG = nuevoSlug;
    sessionStorage.setItem('current_barberia_slug', nuevoSlug);
    if (entrarComoAdmin) {
      sessionStorage.setItem('barberia_admin_token', 'auth-admin-session-token');
      setIsAdminLoggedIn(true);
      setActiveView('admin');
      window.history.pushState(null, '', `/?b=${nuevoSlug}&admin=1`);
    } else {
      setActiveView('client');
      window.history.pushState(null, '', `/?b=${nuevoSlug}`);
    }
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
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Atención: Esta cuenta se encuentra suspendida temporalmente. Comunícate con el soporte de EXAKTA.</span>
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
        onAbrirLogin={() => setShowLoginModal(true)}
        shopName={shopConfig.nombre_barberia}
        shopPhone={shopConfig.telefono_barberia}
        shopLogo={shopConfig.logo_url}
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
              El servicio para <strong>{shopConfig.nombre_barberia}</strong> se encuentra en pausa. Si eres el dueño, inicia sesión para reactivar la cuenta.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              Iniciar Sesión
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

      {/* Modal de Inicio de Sesión Único (Sin opciones públicas expuestas) */}
      {showLoginModal && (
        <UnifiedLoginModal
          onLoginSuccess={handleUnifiedLoginSuccess}
          onCancel={() => setShowLoginModal(false)}
        />
      )}

      {/* Pie de página limpio y profesional */}
      <footer className="border-t border-slate-200 py-6 text-xs text-slate-500 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-500 text-center sm:text-left">
            {shopConfig.nombre_barberia} • Impulsado por <strong className="text-slate-700">EXAKTA</strong>
          </p>

          <div className="flex items-center gap-3">
            {/* Único botón discreto de inicio de sesión para operadores */}
            <button
              onClick={() => setShowLoginModal(true)}
              title="Iniciar Sesión (Operadores / Dueño / SuperAdmin)"
              className="text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-xl hover:bg-slate-100 font-bold"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
