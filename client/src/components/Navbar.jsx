import React from 'react';
import { Scissors, ShieldCheck, Calendar, LogOut, Phone } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, isAdminLoggedIn, onLogout, shopName = 'The Barber Club', shopPhone = '' }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand estilo Konnexa SaaS */}
          <div 
            onClick={() => setActiveView('client')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5 text-white transform -rotate-45" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 block font-sans">
                {shopName}
              </span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block -mt-0.5">
                Portal de Gestión & Agenda
              </span>
            </div>
          </div>

          {/* Menú según el tipo de usuario */}
          {isAdminLoggedIn ? (
            /* Controles exclusivos para el Administrador autenticado */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setActiveView('client')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeView === 'client'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Vista Cliente</span>
              </button>

              <button
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeView === 'admin'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Panel Dueño</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>

              <button
                onClick={onLogout}
                title="Cerrar sesión de administrador"
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            /* Vista para clientes comunes: SIN BOTÓN DE PANEL DE DUEÑO */
            <div className="flex items-center gap-3">
              {shopPhone && (
                <a
                  href={`https://wa.me/${shopPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>{shopPhone}</span>
                </a>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Turnos Disponibles</span>
              </span>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
