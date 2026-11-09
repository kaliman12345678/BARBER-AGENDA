import React, { useState } from 'react';
import { 
  User, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Phone, 
  Clock, 
  Percent, 
  ShieldCheck, 
  AlertCircle, 
  Upload,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { formatTime12 } from '../utils/helpers';
import BarberoRecordModal from './BarberoRecordModal';

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lun' },
  { id: 2, nombre: 'Mar' },
  { id: 3, nombre: 'Mié' },
  { id: 4, nombre: 'Jue' },
  { id: 5, nombre: 'Vie' },
  { id: 6, nombre: 'Sáb' },
  { id: 7, nombre: 'Dom' }
];

export default function AdminBarberos({ barberos, onRecargar }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [barberoEditando, setBarberoEditando] = useState(null);
  const [barberoRecordId, setBarberoRecordId] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    password: '',
    foto_url: '',
    porcentaje_comision: 50,
    horario_inicio: '09:00',
    horario_fin: '20:00',
    dias_laborales: '1,2,3,4,5,6'
  });

  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState('');

  // Edición rápida de comisiones
  const [porcentajesEditables, setPorcentajesEditables] = useState({});
  const [guardandoComisionId, setGuardandoComisionId] = useState(null);

  // Edición rápida de Contraseña
  const [passwordsEditables, setPasswordsEditables] = useState({});
  const [guardandoPasswordId, setGuardandoPasswordId] = useState(null);
  const [mostrarPasswords, setMostrarPasswords] = useState({});

  async function handleGuardarComisionRapida(barberoId, nuevoPorcentaje) {
    const val = Number(nuevoPorcentaje);
    if (isNaN(val) || val < 0 || val > 100) return;

    setGuardandoComisionId(barberoId);
    try {
      const res = await fetch(`/api/barberos/${barberoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ porcentaje_comision: val })
      });
      if (res.ok) {
        if (onRecargar) onRecargar();
        setPorcentajesEditables(prev => {
          const copy = { ...prev };
          delete copy[barberoId];
          return copy;
        });
      }
    } catch (err) {
      console.error('Error guardando comisión:', err);
    } finally {
      setGuardandoComisionId(null);
    }
  }

  async function handleGuardarPasswordRapida(barberoId, nuevaPassword) {
    if (!nuevaPassword || nuevaPassword.trim().length < 4) return;

    setGuardandoPasswordId(barberoId);
    try {
      const res = await fetch(`/api/barberos/${barberoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nuevaPassword.trim() })
      });
      if (res.ok) {
        if (onRecargar) onRecargar();
        setPasswordsEditables(prev => {
          const copy = { ...prev };
          delete copy[barberoId];
          return copy;
        });
      }
    } catch (err) {
      console.error('Error actualizando contraseña:', err);
    } finally {
      setGuardandoPasswordId(null);
    }
  }

  async function handleSubirFotoBarbero(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFoto(true);
    setError('');

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al subir foto');
        return;
      }
      setForm(prev => ({ ...prev, foto_url: data.url }));
    } catch (err) {
      setError('Error de conexión al subir foto');
    } finally {
      setSubiendoFoto(false);
    }
  }

  function abrirModalNuevo() {
    setBarberoEditando(null);
    setForm({
      nombre: '',
      telefono: '',
      email: '',
      password: '123456',
      foto_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&h=300&fit=crop&crop=faces',
      porcentaje_comision: 50,
      horario_inicio: '09:00',
      horario_fin: '20:00',
      dias_laborales: '1,2,3,4,5,6'
    });
    setError('');
    setModalAbierto(true);
  }

  function abrirModalEditar(b) {
    setBarberoEditando(b);
    setForm({
      nombre: b.nombre,
      telefono: b.telefono || '',
      email: b.email || '',
      password: b.password || '123456',
      foto_url: b.foto_url || '',
      porcentaje_comision: b.porcentaje_comision || 50,
      horario_inicio: b.horario_inicio || '09:00',
      horario_fin: b.horario_fin || '20:00',
      dias_laborales: b.dias_laborales || '1,2,3,4,5,6'
    });
    setError('');
    setModalAbierto(true);
  }

  function toggleDia(id) {
    const seleccionados = form.dias_laborales ? form.dias_laborales.split(',').map(Number) : [];
    let nuevos;
    if (seleccionados.includes(id)) {
      nuevos = seleccionados.filter(d => d !== id);
    } else {
      nuevos = [...seleccionados, id].sort();
    }
    setForm({ ...form, dias_laborales: nuevos.join(',') });
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre del barbero es obligatorio');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const url = barberoEditando ? `/api/barberos/${barberoEditando.id}` : '/api/barberos';
      const method = barberoEditando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ocurrió un error al guardar');
        return;
      }

      setModalAbierto(false);
      if (onRecargar) onRecargar();
    } catch (err) {
      setError('Error de comunicación con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(b) {
    const nuevoEstado = b.activo ? 0 : 1;
    try {
      await fetch(`/api/barberos/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado })
      });
      if (onRecargar) onRecargar();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-sans">
            Equipo de Barberos & Usuarios
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra el equipo, asigna correos y contraseñas de acceso y consulta el récord individual de cada colaborador.
          </p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Barbero</span>
        </button>
      </div>

      {/* Tarjetas de Barberos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {barberos.map((b) => {
          const dias = b.dias_laborales ? b.dias_laborales.split(',').map(Number) : [];
          const passVisible = mostrarPasswords[b.id];
          const passActual = passwordsEditables[b.id] ?? (b.password || '123456');

          return (
            <div
              key={b.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                b.activo
                  ? 'bg-white border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={b.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&h=150&fit=crop&crop=faces'}
                    alt={b.nombre}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-base truncate font-sans">
                        {b.nombre}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {b.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Correo de usuario para iniciar sesión */}
                    <p className="text-xs text-blue-600 font-semibold flex items-center gap-1.5 mt-1 truncate">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{b.email || 'Sin correo asignado'}</span>
                    </p>

                    {b.telefono && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.telefono}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Detalles: Comisión, Contraseña y Horario */}
                <div className="space-y-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  
                  {/* Comisión Individual Editable */}
                  <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-blue-600" />
                      Comisión:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={porcentajesEditables[b.id] ?? b.porcentaje_comision}
                        onChange={(e) => setPorcentajesEditables(prev => ({ ...prev, [b.id]: e.target.value }))}
                        className="w-14 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg px-2 py-1 text-center font-extrabold text-blue-700 text-xs focus:outline-none"
                      />
                      <span className="text-blue-700 font-bold text-xs">%</span>
                      {porcentajesEditables[b.id] !== undefined && Number(porcentajesEditables[b.id]) !== b.porcentaje_comision && (
                        <button
                          type="button"
                          disabled={guardandoComisionId === b.id}
                          onClick={() => handleGuardarComisionRapida(b.id, porcentajesEditables[b.id])}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs"
                        >
                          {guardandoComisionId === b.id ? '...' : 'Guardar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contraseña de Acceso al Portal Personal */}
                  <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      Clave Acceso:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type={passVisible ? 'text' : 'password'}
                        value={passActual}
                        onChange={(e) => setPasswordsEditables(prev => ({ ...prev, [b.id]: e.target.value }))}
                        className="w-20 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1 text-center font-mono font-extrabold text-slate-800 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPasswords(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title={passVisible ? 'Ocultar clave' : 'Ver clave'}
                      >
                        {passVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      {passwordsEditables[b.id] !== undefined && passwordsEditables[b.id] !== b.password && (
                        <button
                          type="button"
                          disabled={guardandoPasswordId === b.id}
                          onClick={() => handleGuardarPasswordRapida(b.id, passwordsEditables[b.id])}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs"
                        >
                          {guardandoPasswordId === b.id ? '...' : 'Guardar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Horario */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Horario:
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatTime12(b.horario_inicio)} - {formatTime12(b.horario_fin)}
                    </span>
                  </div>

                  {/* Días laborales */}
                  <div className="pt-1 border-t border-slate-200 flex items-center gap-1">
                    <span className="text-slate-400 text-[10px] mr-1">Días:</span>
                    {DIAS_SEMANA.map((d) => (
                      <span
                        key={d.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          dias.includes(d.id)
                            ? 'bg-blue-100 text-blue-700 font-bold'
                            : 'bg-slate-100 text-slate-400 opacity-50'
                        }`}
                      >
                        {d.nombre}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Botón Ver Récord & Expediente */}
                <button
                  type="button"
                  onClick={() => setBarberoRecordId(b.id)}
                  className="w-full mt-3 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ver Récord Completo de {b.nombre}</span>
                  <ExternalLink className="w-3 h-3 text-blue-500" />
                </button>
              </div>

              {/* Botones de acción inferiores */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActivo(b)}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors ${
                    b.activo
                      ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                      : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {b.activo ? 'Desactivar' : 'Activar Barbero'}
                </button>

                <button
                  type="button"
                  onClick={() => abrirModalEditar(b)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Editar datos del barbero"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL CREAR / EDITAR BARBERO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-sans">
              {barberoEditando ? 'Editar Barbero' : 'Nuevo Barbero'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configura los datos del barbero y sus credenciales (correo y contraseña) para el portal de colaboradores.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGuardar} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mateo Gómez"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Correo y Contraseña de Acceso */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-blue-700 uppercase mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mateo@barberia.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-700 uppercase mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    Contraseña *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-slate-50 border border-emerald-200 rounded-xl px-3 py-2 text-emerald-800 font-bold focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 315 222 3344"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-700 uppercase mb-1 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    % Comisión *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    placeholder="Ej. 50"
                    value={form.porcentaje_comision}
                    onChange={(e) => setForm({ ...form, porcentaje_comision: e.target.value })}
                    className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-blue-700 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Foto de Perfil del Barbero
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {form.foto_url ? (
                      <img src={form.foto_url} alt="Barbero" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="foto-barbero-upload"
                      accept="image/*"
                      className="hidden"
                      disabled={subiendoFoto}
                      onChange={handleSubirFotoBarbero}
                    />
                    <label
                      htmlFor="foto-barbero-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
                    >
                      <Upload className={`w-3.5 h-3.5 ${subiendoFoto ? 'animate-bounce' : ''}`} />
                      <span>{subiendoFoto ? 'Subiendo...' : 'Subir foto'}</span>
                    </label>
                    <input
                      type="text"
                      placeholder="O pegar URL de imagen..."
                      value={form.foto_url}
                      onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
                      className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Hora Entrada
                  </label>
                  <input
                    type="time"
                    value={form.horario_inicio}
                    onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Hora Salida
                  </label>
                  <input
                    type="time"
                    value={form.horario_fin}
                    onChange={(e) => setForm({ ...form, horario_fin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Días laborales */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Días de la semana que atiende citas
                </label>
                <div className="flex gap-2">
                  {DIAS_SEMANA.map((d) => {
                    const activos = form.dias_laborales ? form.dias_laborales.split(',').map(Number) : [];
                    const isChecked = activos.includes(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => toggleDia(d.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isChecked
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {d.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50 shadow-md shadow-blue-500/20"
                >
                  {guardando ? 'Guardando...' : 'Guardar Barbero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Expediente y Récord Completo */}
      {barberoRecordId && (
        <BarberoRecordModal
          barberoId={barberoRecordId}
          esBarbero={false}
          onClose={() => setBarberoRecordId(null)}
        />
      )}

    </div>
  );
}
