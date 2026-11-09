import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Ban, 
  Users, 
  Scissors, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Settings,
  Sparkles,
  Menu,
  X,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Calculator
} from 'lucide-react';
import InstagramIcon from './InstagramIcon';
import AdminAgenda from './AdminAgenda';
import AdminBloqueos from './AdminBloqueos';
import AdminBarberos from './AdminBarberos';
import AdminServicios from './AdminServicios';
import AdminCostos from './AdminCostos';
import AdminLiquidaciones from './AdminLiquidaciones';
import AdminBalance from './AdminBalance';
import AdminConfig from './AdminConfig';
import AdminMediaManager from './AdminMediaManager';
import AdminProductos from './AdminProductos';
import AdminRentabilidad from './AdminRentabilidad';

export default function AdminDashboard({ shopConfig, onConfigActualizada }) {
  const [activeTab, setActiveTab] = useState('agenda');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    try {
      const [resB, resS] = await Promise.all([
        fetch('/api/barberos?todos=true'),
        fetch('/api/servicios?todos=true')
      ]);
      const dataB = await resB.json();
      const dataS = await resS.json();
      setBarberos(dataB);
      setServicios(dataS);
    } catch (err) {
      console.error(err);
    }
  }

  const tabs = [
    { id: 'agenda', label: 'Agenda & Citas', icon: Calendar },
    { id: 'bloqueos', label: 'Bloquear Horarios', icon: Ban },
    { id: 'liquidaciones', label: 'Plantilla de Pagos (%)', icon: Percent, badge: 'Principal' },
    { id: 'costos', label: 'Caja & Egresos', icon: DollarSign },
    { id: 'productos', label: 'Productos & Stock', icon: Package, badge: 'Tienda' },
    { id: 'balance', label: 'Balance General', icon: TrendingUp, badge: 'Desglose' },
    { id: 'rentabilidad', label: 'Rentabilidad & Proyección', icon: Calculator, badge: 'Simulador' },
    { id: 'barberos', label: 'Equipo Barberos', icon: Users },
    { id: 'servicios', label: 'Servicios & Tarifas', icon: Scissors },
    { id: 'media', label: 'Galería & Redes', icon: InstagramIcon, badge: 'Social' },
    { id: 'config', label: 'Ajustes del Local', icon: Settings },
  ];

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabObj.icon;

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
      
      {/* Botón flotante / barra móvil para abrir el menú desplegable en pantallas pequeñas */}
      <div className="md:hidden mb-4 bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
        >
          <Menu className="w-4 h-4 text-blue-600" />
          <span>Menú de Opciones</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
          <ActiveIcon className="w-4 h-4" />
          <span>{activeTabObj.label}</span>
        </div>
      </div>

      {/* Cajón desplegable móvil (Mobile Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fadeIn">
          {/* Fondo oscuro backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Menú vertical desplegable desde la izquierda estilo Konnexa */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 p-5 flex flex-col justify-between shadow-2xl z-10 animate-slideRight">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-sm font-sans">Panel de Control</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              {shopConfig?.nombre_barberia || 'The Barber Club'}
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Principal: Sidebar vertical a la izquierda + Contenido a la derecha */}
      <div className="flex gap-6 items-start">
        
        {/* SIDEBAR VERTICAL EN ESCRITORIO (A LA IZQUIERDA) ESTILO KONNEXA SAAS */}
        <aside 
          className={`hidden md:flex flex-col bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm sticky top-24 transition-all duration-300 flex-shrink-0 ${
            sidebarExpanded ? 'w-64' : 'w-20'
          }`}
        >
          {/* Cabecera del Sidebar con botón para colapsar/expandir */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-3 border-b border-slate-100">
            {sidebarExpanded ? (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Módulos
              </span>
            ) : (
              <ShieldCheck className="w-4 h-4 text-blue-600 mx-auto" />
            )}

            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              title={sidebarExpanded ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarExpanded ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Lista Vertical de Opciones */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={!sidebarExpanded ? tab.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all relative group ${
                    sidebarExpanded 
                      ? 'justify-between px-3 py-2.5' 
                      : 'justify-center p-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {sidebarExpanded && (
                      <span className="truncate">{tab.label}</span>
                    )}
                  </div>

                  {sidebarExpanded && tab.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex-shrink-0 ml-1 ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Pie del Sidebar */}
          {sidebarExpanded && (
            <div className="mt-6 pt-3 border-t border-slate-100 px-2 text-[11px] text-slate-400 flex items-center justify-between font-medium">
              <span className="truncate">{shopConfig?.nombre_barberia || 'The Barber Club'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          )}
        </aside>

        {/* ÁREA DE CONTENIDO (A LA DERECHA) */}
        <main className="flex-1 min-w-0">
          <div className="animate-fadeIn">
            {activeTab === 'agenda' && (
              <AdminAgenda 
                barberos={barberos.filter(b => b.activo)} 
                servicios={servicios.filter(s => s.activo)} 
              />
            )}

            {activeTab === 'bloqueos' && (
              <AdminBloqueos 
                barberos={barberos} 
              />
            )}

            {activeTab === 'liquidaciones' && (
              <AdminLiquidaciones 
                barberos={barberos} 
                shopConfig={shopConfig} 
              />
            )}

            {activeTab === 'costos' && (
              <AdminCostos 
                barberos={barberos}
              />
            )}

            {activeTab === 'productos' && (
              <AdminProductos 
                barberos={barberos}
              />
            )}

            {activeTab === 'barberos' && (
              <AdminBarberos 
                barberos={barberos} 
                onRecargar={cargarCatalogos} 
              />
            )}

            {activeTab === 'servicios' && (
              <AdminServicios 
                servicios={servicios} 
                onRecargar={cargarCatalogos} 
              />
            )}

            {activeTab === 'media' && (
              <AdminMediaManager 
                barberos={barberos} 
              />
            )}

            {activeTab === 'balance' && (
              <AdminBalance />
            )}

            {activeTab === 'rentabilidad' && (
              <AdminRentabilidad 
                barberos={barberos}
              />
            )}

            {activeTab === 'config' && (
              <AdminConfig 
                shopConfig={shopConfig} 
                onConfigActualizada={onConfigActualizada} 
              />
            )}
          </div>
        </main>

      </div>

    </div>
  );
}
