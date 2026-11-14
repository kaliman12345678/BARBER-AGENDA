import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Crown, 
  Gift, 
  Cake, 
  Phone, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  MessageCircle, 
  Calendar, 
  DollarSign, 
  Clock, 
  AlertCircle,
  Sparkles,
  Award,
  Filter,
  Scissors,
  BookmarkCheck,
  CreditCard
} from 'lucide-react';
import ModalFichaTecnica from './ModalFichaTecnica';
import ModalTarjetaVIPAdmin from './ModalTarjetaVIPAdmin';

export default function AdminClientes({ shopConfig, barberos = [] }) {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteFichaSeleccionado, setClienteFichaSeleccionado] = useState(null);
  const [clienteTarjetaVIPSeleccionado, setClienteTarjetaVIPSeleccionado] = useState(null);

  const [form, setForm] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    categoria: 'VIP',
    fecha_cumpleanos: '',
    beneficio_fidelidad: '',
    notas: ''
  });

  useEffect(() => {
    cargarClientes();
  }, [filtroCategoria]);

  async function cargarClientes() {
    setCargando(true);
    try {
      let url = '/api/clientes';
      const params = new URLSearchParams();
      if (busqueda.trim()) params.append('q', busqueda.trim());
      if (filtroCategoria !== 'todos') params.append('categoria', filtroCategoria);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setCargando(false);
    }
  }

  function handleBuscar(e) {
    e.preventDefault();
    cargarClientes();
  }

  function abrirModalCrear() {
    setClienteEditando(null);
    setForm({
      cliente_nombre: '',
      cliente_telefono: '',
      categoria: 'VIP',
      fecha_cumpleanos: '',
      beneficio_fidelidad: '10% de descuento en próximo corte',
      notas: ''
    });
    setModalAbierto(true);
  }

  function abrirModalEditar(c) {
    setClienteEditando(c);
    setForm({
      cliente_nombre: c.cliente_nombre || '',
      cliente_telefono: c.cliente_telefono || '',
      categoria: c.categoria || 'VIP',
      fecha_cumpleanos: c.fecha_cumpleanos ? c.fecha_cumpleanos.split('T')[0] : '',
      beneficio_fidelidad: c.beneficio_fidelidad || '',
      notas: c.notas || ''
    });
    setModalAbierto(true);
  }

  async function handleGuardarCliente(e) {
    e.preventDefault();
    if (!form.cliente_nombre.trim() || !form.cliente_telefono.trim()) {
      alert('Nombre y teléfono son obligatorios');
      return;
    }

    try {
      const url = clienteEditando ? `/api/clientes/${clienteEditando.id}` : '/api/clientes';
      const method = clienteEditando ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setModalAbierto(false);
        cargarClientes();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar cliente');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar cliente');
    }
  }

  function getWhatsAppUrl(cliente) {
    const telLimpio = (cliente.cliente_telefono || '').replace(/[^0-9]/g, '');
    const nombre = cliente.cliente_nombre || 'Estimado cliente';
    const barberia = shopConfig?.nombre_barberia || 'nuestra barbería';
    const mensaje = `¡Hola ${nombre}! Te saludamos de ${barberia}. Esperamos que estés muy bien. ¿Te gustaría agendar tu próximo corte de cabello?`;
    return `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`;
  }

  function getCategoriaBadge(cat) {
    switch (cat?.toUpperCase()) {
      case 'VIP':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          icon: Crown,
          label: 'VIP Oro'
        };
      case 'PREFERENCIAL':
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          dot: 'bg-blue-600',
          icon: Award,
          label: 'Preferencial'
        };
      case 'FRECUENTE':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-600',
          icon: Sparkles,
          label: 'Frecuente'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-400',
          icon: Users,
          label: 'Nuevo / Regular'
        };
    }
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Clientes Preferenciales & Fidelización
              </h2>
              <p className="text-xs text-slate-500">
                Historial de visitas, categorías VIP, fechas de cumpleaños y beneficios exclusivos.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={abrirModalCrear}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Cliente Preferencial</span>
        </button>
      </div>

      {/* FILTROS Y MOTOR DE BÚSQUEDA */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* BUSCADOR POR NOMBRE O TELÉFONO */}
          <form onSubmit={handleBuscar} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o número de teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => { setBusqueda(''); cargarClientes(); }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
            >
              Buscar
            </button>
          </form>

          {/* FILTRO POR CATEGORÍA */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'VIP', label: 'VIP' },
              { id: 'Preferencial', label: 'Preferenciales' },
              { id: 'Frecuente', label: 'Frecuentes' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFiltroCategoria(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filtroCategoria === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* LISTA DE CLIENTES */}
      {cargando ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Cargando base de clientes...</p>
        </div>
      ) : clientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No se encontraron clientes</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {busqueda ? 'No hay clientes que coincidan con la búsqueda.' : 'Aún no hay clientes registrados. Agrega el primero con el botón superior.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {clientes.map((c) => {
            const badge = getCategoriaBadge(c.categoria);
            const BadgeIcon = badge.icon;
            const waUrl = getWhatsAppUrl(c);

            return (
              <div
                key={c.id || c.cliente_telefono}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
              >
                {/* PARTE SUPERIOR: NOMBRE, CATEGORÍA Y ACCIONES */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-sm text-slate-900 truncate">
                          {c.cliente_nombre}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3 shrink-0" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* TELÉFONO CON BOTÓN DE WHATSAPP DIRECTO */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-medium text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.cliente_telefono}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => abrirModalEditar(c)}
                      title="Editar datos de fidelidad"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* CUMPLEAÑOS & BENEFICIO */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    {c.fecha_cumpleanos && (
                      <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl font-medium border border-rose-100">
                        <Cake className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span className="text-[11px]">
                          Cumpleaños: <strong>{c.fecha_cumpleanos.split('T')[0]}</strong>
                        </span>
                      </div>
                    )}

                    {c.beneficio_fidelidad ? (
                      <div className="flex items-start gap-1.5 text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-xl text-[11px] border border-amber-200/70">
                        <Gift className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                        <span className="leading-tight">
                          <strong>Beneficio:</strong> {c.beneficio_fidelidad}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic px-1">
                        Sin beneficio asignado aún
                      </div>
                    )}

                    {c.notas && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                        "{c.notas}"
                      </p>
                    )}
                  </div>
                </div>

                {/* MÉTRICAS HISTÓRICAS DEL CLIENTE */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Citas</span>
                      <span className="text-xs font-black text-slate-800">{c.total_citas || 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Consumido</span>
                      <span className="text-xs font-black text-blue-600">
                        ${(c.total_gastado || 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Última</span>
                      <span className="text-[10px] font-bold text-slate-600 truncate block">
                        {c.ultima_visita || 'Reciente'}
                      </span>
                    </div>
                  </div>

                  {/* BOTÓN FICHA TÉCNICA, TARJETA VIP Y BOTÓN WHATSAPP */}
                  <div className="space-y-2">
                    {shopConfig?.modulos_activos?.tarjeta_vip !== false && (
                      <button
                        type="button"
                        onClick={() => setClienteTarjetaVIPSeleccionado(c)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 text-amber-950 border border-amber-300/80 text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        title="Ver tarjeta VIP, sellar cortes y consultar pase digital del cliente"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tarjeta VIP & Sellos ({c.sellos_acumulados || 0}/10)</span>
                      </button>
                    )}

                    {shopConfig?.modulos_activos?.ficha_tecnica !== false && (
                      <button
                        type="button"
                        onClick={() => setClienteFichaSeleccionado(c)}
                        className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Ver o registrar fórmula de corte, degradado y fotos del cliente"
                      >
                        <Scissors className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ficha Técnica & Estilo</span>
                      </button>
                    )}

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-200 fill-emerald-200/20" />
                      <span>Escribir por WhatsApp</span>
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR CLIENTE */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slideIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Crown className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {clienteEditando ? 'Editar Cliente Preferencial' : 'Nuevo Cliente Preferencial'}
                </h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarCliente} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={form.cliente_nombre}
                  onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
                  placeholder="Ej: Carlos Santana"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={form.cliente_telefono}
                  onChange={(e) => setForm({ ...form, cliente_telefono: e.target.value })}
                  placeholder="Ej: 3001234567"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  >
                    <option value="VIP">VIP Oro</option>
                    <option value="Preferencial">Preferencial</option>
                    <option value="Frecuente">Frecuente</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Cumpleaños</label>
                  <input
                    type="date"
                    value={form.fecha_cumpleanos}
                    onChange={(e) => setForm({ ...form, fecha_cumpleanos: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Beneficio de Fidelidad</label>
                <input
                  type="text"
                  value={form.beneficio_fidelidad}
                  onChange={(e) => setForm({ ...form, beneficio_fidelidad: e.target.value })}
                  placeholder="Ej: 10º corte gratis, Bebida de cortesía"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas / Preferencias del Cliente</label>
                <textarea
                  rows="2"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Ej: Prefiere corte con navaja caliente, café sin azúcar..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FICHA TÉCNICA Y EXPEDIENTE DE ESTILO (FASE 2) */}
      {clienteFichaSeleccionado && (
        <ModalFichaTecnica
          cliente={clienteFichaSeleccionado}
          barberos={barberos}
          onClose={() => setClienteFichaSeleccionado(null)}
        />
      )}

      {/* MODAL TARJETA DIGITAL VIP & SELLOS (FASE 4) */}
      {clienteTarjetaVIPSeleccionado && (
        <ModalTarjetaVIPAdmin
          cliente={clienteTarjetaVIPSeleccionado}
          shopConfig={shopConfig}
          onClose={() => setClienteTarjetaVIPSeleccionado(null)}
          onSuccess={() => cargarClientes()}
        />
      )}

    </div>
  );
}
