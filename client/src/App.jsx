import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ClientBooking from './components/ClientBooking';
import AdminDashboard from './components/AdminDashboard';
import AdminPinModal from './components/AdminPinModal';
import { Lock } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('client'); // 'client' o 'admin'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [shopConfig, setShopConfig] = useState({
    nombre_barberia: 'The Barber Club',
    telefono_barberia: '+57 300 123 4567',
    direccion_barberia: 'Calle Principal # 10 - 20'
  });

  useEffect(() => {
    cargarConfiguracion();
    
    // Verificar si viene con parámetro de bypass/auto-login de demo (?demo_admin=1 o ?admin=1234)
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin');
    const isAdminRoute = window.location.pathname.includes('/admin') || window.location.hash.includes('admin') || window.location.search.includes('admin');
    
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
    }

    // Escuchar navegación del historial
    const handlePopState = () => {
      const isRouteAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('admin');
      if (isRouteAdmin) {
        const currentToken = sessionStorage.getItem('barberia_admin_token');
        if (currentToken) {
          setActiveView('admin');
        } else {
          setShowPinModal(true);
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

  function handleLogout() {
    sessionStorage.removeItem('barberia_admin_token');
    setIsAdminLoggedIn(false);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Barra de Navegación Superior */}
      <Navbar
        activeView={activeView}
        setActiveView={handleSwitchView}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogout={handleLogout}
        shopName={shopConfig.nombre_barberia}
        shopPhone={shopConfig.telefono_barberia}
      />

      {/* Contenido Principal */}
      <main className="flex-1 pb-16">
        {activeView === 'client' ? (
          <ClientBooking shopConfig={shopConfig} />
        ) : (
          <AdminDashboard
            shopConfig={shopConfig}
            onConfigActualizada={cargarConfiguracion}
          />
        )}
      </main>

      {/* Modal de PIN para Administrador */}
      {showPinModal && (
        <AdminPinModal
          onAuthenticated={handleAuthenticated}
          onCancel={() => {
            setShowPinModal(false);
            if (activeView !== 'admin') {
              window.history.pushState(null, '', '/');
            }
          }}
        />
      )}

      {/* Pie de página con acceso discreto para el dueño */}
      <footer className="border-t border-slate-900 py-6 text-xs text-slate-500 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            {shopConfig.nombre_barberia} • Todos los derechos reservados.
          </p>

          {/* Enlace discreto para que el dueño ingrese sin alertar a los clientes */}
          <button
            onClick={handleAbrirAdminDesdeFooter}
            title="Acceso exclusivo administración"
            className="text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1.5 text-[11px] py-1 px-2 rounded-lg hover:bg-slate-900"
          >
            <Lock className="w-3 h-3" />
            <span>Acceso Administración</span>
          </button>
        </div>
      </footer>

    </div>
  );
}
