import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ClientBooking from './components/ClientBooking';
import AdminDashboard from './components/AdminDashboard';
import AdminPinModal from './components/AdminPinModal';
import BarberoPortal from './components/BarberoPortal';
import BarberoLoginModal from './components/BarberoLoginModal';
import { Lock, Scissors, UserCheck } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('client'); // 'client', 'admin', 'barbero'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [barberoAutenticado, setBarberoAutenticado] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showBarberoModal, setShowBarberoModal] = useState(false);

  const [shopConfig, setShopConfig] = useState({
    nombre_barberia: 'The Barber Club',
    telefono_barberia: '+57 300 123 4567',
    direccion_barberia: 'Calle Principal # 10 - 20'
  });

  useEffect(() => {
    cargarConfiguracion();

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
    
    // Verificar si viene con parámetro de bypass/auto-login de demo (?demo_admin=1 o ?admin=1234)
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin');
    const isAdminRoute = window.location.pathname.includes('/admin') || window.location.hash.includes('admin') || window.location.search.includes('admin');
    const isBarberoRoute = window.location.pathname.includes('/barbero') || window.location.hash.includes('barbero') || urlParams.get('barbero') !== null;
    
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

    // Escuchar navegación del historial
    const handlePopState = () => {
      const isRouteAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('admin');
      const isRouteBarbero = window.location.pathname.includes('/barbero') || window.location.hash.includes('barbero');
      
      if (isRouteAdmin) {
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

  async function cargarConfiguracion() {
    try {
      const res = await fetch('/api/configuracion');
      if (res.ok) {
        const data = await res.json();
        setShopConfig(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
    }
  }

  function handleSwitchView(view) {
    if (view === 'admin') {
      if (!isAdminLoggedIn) {
        setShowPinModal(true);
      } else {
        setActiveView('admin');
        window.history.pushState(null, '', '/admin');
      }
    } else if (view === 'barbero') {
      if (!barberoAutenticado) {
        setShowBarberoModal(true);
      } else {
        setActiveView('barbero');
        window.history.pushState(null, '', '/barbero');
      }
    } else {
      setActiveView('client');
      window.history.pushState(null, '', '/');
    }
  }

  function handleAuthenticated(token) {
    sessionStorage.setItem('barberia_admin_token', token);
    setIsAdminLoggedIn(true);
    setShowPinModal(false);
    setActiveView('admin');
    window.history.pushState(null, '', '/admin');
  }

  function handleBarberoAuthenticated(barbero) {
    sessionStorage.setItem('barberia_barbero_session', JSON.stringify(barbero));
    setBarberoAutenticado(barbero);
    setShowBarberoModal(false);
    setActiveView('barbero');
    window.history.pushState(null, '', '/barbero');
  }

  function handleLogout() {
    sessionStorage.removeItem('barberia_admin_token');
    setIsAdminLoggedIn(false);
    setActiveView('client');
    window.history.pushState(null, '', '/');
  }

  function handleLogoutBarbero() {
    sessionStorage.removeItem('barberia_barbero_session');
    setBarberoAutenticado(null);
    setActiveView('client');
    window.history.pushState(null, '', '/');
  }

  function handleAbrirAdminDesdeFooter() {
    if (isAdminLoggedIn) {
      setActiveView('admin');
      window.history.pushState(null, '', '/admin');
    } else {
      setShowPinModal(true);
    }
  }

  function handleAbrirBarberoDesdeFooter() {
    if (barberoAutenticado) {
      setActiveView('barbero');
      window.history.pushState(null, '', '/barbero');
    } else {
      setShowBarberoModal(true);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      
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
        {activeView === 'admin' ? (
          <AdminDashboard
            shopConfig={shopConfig}
            onConfigActualizada={cargarConfiguracion}
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
              window.history.pushState(null, '', '/');
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
              window.history.pushState(null, '', '/');
            }
          }}
        />
      )}

      {/* Pie de página con accesos discretos */}
      <footer className="border-t border-slate-200 py-6 text-xs text-slate-500 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-500">
            {shopConfig.nombre_barberia} • Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-3">
            {/* Enlace discreto al Portal de Barberos */}
            <button
              onClick={handleAbrirBarberoDesdeFooter}
              title="Acceso exclusivo para barberos del equipo"
              className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-[11px] py-1 px-2.5 rounded-lg hover:bg-slate-100 font-medium"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Portal Barberos</span>
            </button>

            {/* Enlace discreto para que el dueño ingrese sin alertar a los clientes */}
            <button
              onClick={handleAbrirAdminDesdeFooter}
              title="Acceso exclusivo administración"
              className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-[11px] py-1 px-2.5 rounded-lg hover:bg-slate-100 font-medium"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Acceso Dueño</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
