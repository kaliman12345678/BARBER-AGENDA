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
  Calculator,
  History,
  Crown,
  Award,
  Star,
  Share2,
  Copy,
  Check,
  RotateCw,
  ArrowLeft
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
import AdminAuditoria from './AdminAuditoria';
import AdminNotifications from './AdminNotifications';
import AdminClientes from './AdminClientes';
import AdminResenas from './AdminResenas';
import ThemeSelector, { THEMES } from './ThemeSelector';

export default function AdminDashboard({ shopConfig, onConfigActualizada }) {
  const [activeTab, setActiveTab] = useState('agenda');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [temaActual, setTemaActual] = useState(() => localStorage.getItem('barberia_tema_admin') || 'claro');
  const [linkCopiado, setLinkCopiado] = useState(false);

  function handleCopiarLinkClientes() {
    const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';
    const url = `${window.location.origin}/?b=${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2500);
  }

  function handleCambiarTema(nuevoTema) {
    setTemaActual(nuevoTema);
    localStorage.setItem('barberia_tema_admin', nuevoTema);
  }

  const temaObj = THEMES.find(t => t.id === temaActual) || THEMES[0];

  useEffect(() => {
    cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    try {
      const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';
      const [resB, resS] = await Promise.all([
        fetch(`/api/barberos?todos=true&b=${encodeURIComponent(slug)}`),
        fetch(`/api/servicios?todos=true&b=${encodeURIComponent(slug)}`)
      ]);
      const dataB = await resB.json();
      const dataS = await resS.json();
      setBarberos(Array.isArray(dataB) ? dataB : []);
      setServicios(Array.isArray(dataS) ? dataS : []);
    } catch (err) {
      console.error(err);
    }
  }

  // Filtrado de módulos según el Plan contratado por la barbería
  const modulos = shopConfig?.modulos_activos || {};

  const allTabs = [
    { id: 'agenda', label: 'Agenda & Citas', icon: Calendar, visible: modulos.agenda !== false },
    { id: 'clientes', label: 'Clientes Preferenciales', icon: Award, badge: 'VIP & Fidelidad', visible: modulos.fidelizacion_clientes !== false },
    { id: 'bloqueos', label: 'Bloquear Horarios', icon: Ban, visible: modulos.agenda !== false },
    { id: 'liquidaciones', label: 'Plantilla de Pagos (%)', icon: Percent, badge: 'Principal', visible: modulos.liquidaciones !== false },
    { id: 'costos', label: 'Caja & Egresos', icon: DollarSign, visible: modulos.costos !== false },
    { id: 'productos', label: 'Productos & Stock', icon: Package, badge: 'Tienda', visible: modulos.productos !== false },
    { id: 'balance', label: 'Balance General', icon: TrendingUp, badge: 'Desglose', visible: modulos.costos !== false || modulos.liquidaciones !== false },
    { id: 'rentabilidad', label: 'Rentabilidad & Proyección', icon: Calculator, badge: 'Simulador', visible: modulos.rentabilidad !== false },
    { id: 'barberos', label: 'Equipo Barberos', icon: Users, visible: true },
    { id: 'servicios', label: 'Servicios & Tarifas', icon: Scissors, visible: true },
    { id: 'auditoria', label: 'Auditoría & Historial', icon: History, badge: 'Seguridad', visible: modulos.auditoria !== false },
    { id: 'media', label: 'Galería & Redes', icon: InstagramIcon, badge: 'Social', visible: modulos.galeria !== false },
    { id: 'resenas', label: 'Reseñas & Reputación', icon: Star, badge: 'Públicas', visible: true },
    { id: 'config', label: 'Ajustes del Local', icon: Settings, visible: true },
  ];

  const tabs = allTabs.filter(t => t.visible);

  // Asegurar que la pestaña activa exista en las visibles
  useEffect(() => {
    if (!tabs.some(t => t.id === activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0] || allTabs[0];
  const ActiveIcon = activeTabObj.icon;

  const planName = (shopConfig?.plan || 'vip').toUpperCase();
  const planColorClass = 
    planName === 'VIP' ? 'bg-amber-500/10 text-amber-600 border-amber-300' :
    planName === 'PRO' ? 'bg-blue-500/10 text-blue-600 border-blue-300' :
    'bg-slate-500/10 text-slate-600 border-slate-300';

  return (
    <div className={`max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-4 min-h-screen transition-colors duration-300 ${temaObj.containerClass}`}>
      
      {/* Barra superior de estado & Notificaciones en tiempo real */}
      <div className={`border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-xs transition-colors duration-300 ${temaObj.headerClass}`}>
        
        {/* Lado izquierdo: Botón Atrás + Menú en móvil, Título en escritorio */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón Atrás en móvil cuando no está en agenda */}
          {activeTab !== 'agenda' && (
            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer border border-slate-300"
              title="Volver a Agenda"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>Atrás</span>
            </button>
          )}

          {/* Botón Móvil: Menú de Módulos (Ubicado arriba para máxima comodidad) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
            title="Abrir menú"
          >
            <Menu className="w-4 h-4 text-white" />
            <span>Menú</span>
          </button>

          {/* En escritorio: Título del módulo activo */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold font-sans leading-tight">
                {activeTabObj.label}
              </h2>
              <p className="text-[11px] opacity-70">
                {shopConfig?.nombre_barberia || 'The Barber Club'} • Panel de Administración
              </p>
            </div>
          </div>
        </div>

        {/* Lado derecho: Actualizar + Link Clientes + Selector de Tema + Notificaciones */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Botón Actualizar Dueño */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            title="Actualizar datos y recargar cambios"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Botón para que el dueño copie su enlace de clientes */}
          <button
            type="button"
            onClick={handleCopiarLinkClientes}
            title="Copiar enlace web para compartir con tus clientes"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            {linkCopiado ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Link Clientes</span>
                <span className="sm:hidden">Link</span>
              </>
            )}
          </button>

          <ThemeSelector 
            temaActual={temaActual} 
            onCambiarTema={handleCambiarTema} 
          />

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>En Vivo</span>
          </div>

          <AdminNotifications 
            onVerCitaEnAgenda={() => setActiveTab('agenda')} 
          />
        </div>
      </div>

      {/* Cajón desplegable móvil (Mobile Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fadeIn">
          {/* Fondo oscuro traslúcido */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel Lateral Deslizante */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-slideInRight">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="font-extrabold text-sm text-slate-800">Menú de Gestión</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto flex-1 space-y-1">
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <span className="font-extrabold text-slate-800 block text-xs truncate">
                  {shopConfig?.nombre_barberia || 'The Barber Club'}
                </span>
                <span className="text-[10px] text-slate-400">Panel de Administración</span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full border font-black flex items-center gap-1 shrink-0 ${planColorClass}`}>
                <Crown className="w-3 h-3" />
                <span>Plan {planName}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DISPOSICIÓN PRINCIPAL EN ESCRITORIO (Sidebar + Contenido) */}
      <div className="flex items-start gap-5">
        
        {/* BARRA LATERAL (SIDEBAR DE MÓDULOS) */}
        <aside 
          className={`hidden md:flex flex-col bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs sticky top-24 transition-all duration-300 flex-shrink-0 ${
            sidebarExpanded ? 'w-64' : 'w-20'
          }`}
        >
          {/* Cabecera del Sidebar con botón para colapsar/expandir */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-3 border-b border-slate-100">
            {sidebarExpanded ? (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Módulos ({tabs.length})
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
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs'
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
            <div className="mt-6 pt-3 border-t border-slate-100 px-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 truncate max-w-[110px]">
                {shopConfig?.nombre_barberia || 'The Barber Club'}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black flex items-center gap-1 ${planColorClass}`}>
                <Crown className="w-2.5 h-2.5" />
                <span>{planName}</span>
              </span>
            </div>
          )}
        </aside>

        {/* ÁREA DE CONTENIDO (A LA DERECHA) */}
        <main className="flex-1 min-w-0">
          {/* Botón Atrás / Volver a Agenda para todos los módulos */}
          {activeTab !== 'agenda' && (
            <div className="mb-4 flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-xs animate-fadeIn">
              <button
                type="button"
                onClick={() => setActiveTab('agenda')}
                className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-xs font-black transition-all cursor-pointer border border-slate-200 hover:border-blue-300 shadow-xs active:scale-95"
                title="Volver a la Agenda principal"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Volver a Agenda</span>
              </button>
              
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 hidden sm:inline font-medium">Estás en:</span>
                <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-extrabold border border-blue-200/80 flex items-center gap-1.5 text-xs">
                  <ActiveIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{activeTabObj.label}</span>
                </span>
              </div>
            </div>
          )}

          <div className="animate-fadeIn">
            {activeTab === 'agenda' && (
              <AdminAgenda 
                barberos={barberos.filter(b => b.activo)} 
                servicios={servicios.filter(s => s.activo)} 
                shopConfig={shopConfig}
              />
            )}

            {activeTab === 'clientes' && (
              <AdminClientes 
                shopConfig={shopConfig} 
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

            {activeTab === 'balance' && (
              <AdminBalance />
            )}

            {activeTab === 'rentabilidad' && (
              <AdminRentabilidad 
                barberos={barberos}
              />
            )}

            {activeTab === 'barberos' && (
              <AdminBarberos 
                barberos={barberos} 
                onRecargar={cargarCatalogos} 
                onIrABloqueos={() => setActiveTab('bloqueos')}
              />
            )}

            {activeTab === 'servicios' && (
              <AdminServicios 
                servicios={servicios} 
                onRecargar={cargarCatalogos} 
              />
            )}

            {activeTab === 'auditoria' && (
              <AdminAuditoria />
            )}

            {activeTab === 'media' && (
              <AdminMediaManager 
                barberos={barberos} 
              />
            )}

            {activeTab === 'resenas' && (
              <AdminResenas 
                shopConfig={shopConfig} 
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
