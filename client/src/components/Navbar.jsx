import React, { useState } from 'react';
import { Scissors, ShieldCheck, Calendar, LogOut, Phone, UserCheck, Lock, LogIn, MessageCircle, RotateCw } from 'lucide-react';

export default function Navbar({ 
  activeView, 
  setActiveView, 
  isAdminLoggedIn, 
  barberoAutenticado,
  onLogout, 
  onLogoutBarbero,
  onAbrirLogin,
  shopName = 'The Barber Club', 
  shopPhone = '',
  shopLogo = ''
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Marca de la Barbería */}
          <div 
            onClick={() => {
              if (barberoAutenticado) {
                setActiveView('barbero');
              } else if (isAdminLoggedIn) {
                setActiveView('admin');
              } else {
                setActiveView('client');
              }
            }}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            {shopLogo ? (
              <img
                src={shopLogo}
                alt={shopName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-sm border border-slate-200 group-hover:scale-105 transition-transform shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-white transform -rotate-45" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 block font-sans truncate max-w-[170px] sm:max-w-xs">
                {shopName}
              </span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block -mt-0.5 truncate">
                {barberoAutenticado 
                  ? `Portal Barbero • ${barberoAutenticado.nombre}` 
                  : isAdminLoggedIn 
                  ? 'Panel de Control' 
                  : 'Agenda de Turnos'}
              </span>
            </div>
          </div>

          {/* Menú según el tipo de sesión activa */}
          {barberoAutenticado ? (
            /* Barbero autenticado en su portal personal */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                title="Actualizar datos y citas sin cerrar sesión"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
                <Scissors className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-none">{barberoAutenticado.nombre}</span>
              </div>

              <button
                onClick={onLogoutBarbero}
                title="Cerrar sesión de barbero"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold border border-rose-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : isAdminLoggedIn ? (
            /* Administrador dueño autenticado */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                title="Actualizar datos y configuración"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <button
                onClick={() => setActiveView('client')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'client'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vista Cliente</span>
                <span className="sm:hidden">Cliente</span>
              </button>

              <button
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Panel Dueño</span>
              </button>

              <button
                onClick={onLogout}
                title="Cerrar sesión de administrador"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold border border-rose-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            /* Vista para clientes comunes: Limpia, profesional con solo Agenda e Iniciar Sesión */
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Botón Actualizar para Clientes */}
              <button
                type="button"
                onClick={() => window.location.reload()}
                title="Actualizar horarios y disponibilidad"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <span className="hidden xs:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Agenda tu cita</span>
              </span>

              {/* Botón único de Iniciar Sesión */}
              <button
                onClick={onAbrirLogin}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Lock className="w-3 h-3 text-slate-300" />
                <span>Iniciar Sesión</span>
              </button>

            </div>
          )}

        </div>
      </div>
    </header>
  );
}
