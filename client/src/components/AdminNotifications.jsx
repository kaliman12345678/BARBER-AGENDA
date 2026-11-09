import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Calendar, Scissors, User, ExternalLink, Check } from 'lucide-react';
import { playNotificationSound } from '../utils/audioAlert';
import { formatTime12 } from '../utils/helpers';

export default function AdminNotifications({ onVerCitaEnAgenda }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [alertaFlotante, setAlertaFlotante] = useState(null);
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true);
  const [vistasIds, setVistasIds] = useState(new Set());
  const maxIdRef = useRef(0);
  const inicializadoRef = useRef(false);

  useEffect(() => {
    // Cargar inicial
    consultarNovedades();

    // Polling cada 8 segundos
    const interval = setInterval(() => {
      consultarNovedades();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  async function consultarNovedades() {
    try {
      const res = await fetch('/api/notificaciones/recientes');
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;

      if (!inicializadoRef.current) {
        // Primera carga: memorizamos el ID más alto sin sonar
        if (data.length > 0) {
          maxIdRef.current = Math.max(...data.map(c => c.id));
        }
        setNotificaciones(data);
        inicializadoRef.current = true;
        return;
      }

      // Si hay nuevas citas creadas posteriores al maxId
      const nuevas = data.filter(c => c.id > maxIdRef.current);

      if (nuevas.length > 0) {
        const masReciente = nuevas[0];
        maxIdRef.current = Math.max(...data.map(c => c.id));

        // Sonar alerta si está habilitado
        if (sonidoHabilitado) {
          playNotificationSound();
        }

        // Mostrar toast flotante emergente
        setAlertaFlotante(masReciente);

        // Ocultar toast automáticamente tras 6 segundos
        setTimeout(() => {
          setAlertaFlotante(prev => (prev?.id === masReciente.id ? null : prev));
        }, 6000);
      }

      setNotificaciones(data);
    } catch (err) {
      // Ignorar fallas transitorias de red
    }
  }

  const noVistasCount = notificaciones.filter(n => !vistasIds.has(n.id)).length;

  function handleMarcarVistas() {
    const nuevos = new Set(vistasIds);
    notificaciones.forEach(n => nuevos.add(n.id));
    setVistasIds(nuevos);
  }

  function handleIrACita(n) {
    if (onVerCitaEnAgenda) {
      onVerCitaEnAgenda(n);
    }
    setPanelAbierto(false);
    setAlertaFlotante(null);
  }

  return (
    <>
      {/* Botón Campana en la barra superior */}
      <div className="relative">
        <button
          onClick={() => {
            setPanelAbierto(!panelAbierto);
            if (!panelAbierto) {
              handleMarcarVistas();
            }
          }}
          title="Notificaciones de nuevas citas agendadas"
          className="relative p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all shadow-xs"
        >
          <Bell className="w-4 h-4" />
          {noVistasCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-bounce shadow-sm">
              {noVistasCount > 9 ? '9+' : noVistasCount}
            </span>
          )}
        </button>

        {/* Panel Desplegable de Notificaciones */}
        {panelAbierto && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  Turnos Agendados Recientemente
                </span>
              </div>
              <button
                onClick={() => setPanelAbierto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  No hay citas recientes registradas
                </p>
              ) : (
                notificaciones.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleIrACita(n)}
                    className="py-2.5 px-2 hover:bg-blue-50/60 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        {n.cliente_nombre}
                      </span>
                      <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                        {formatTime12(n.hora_inicio)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>✂️ {n.servicio_nombre}</span>
                      <span>•</span>
                      <span>💈 {n.barbero_nombre}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Fecha: {n.fecha}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sonidoHabilitado}
                  onChange={(e) => setSonidoHabilitado(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>Sonido de campana</span>
              </label>
              <button
                onClick={consultarNovedades}
                className="text-blue-600 hover:underline font-bold"
              >
                Verificar ahora
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOAST FLOTANTE EN VIVO CUANDO ALGUIEN AGENDA */}
      {alertaFlotante && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-white border border-blue-200 rounded-2xl p-4 shadow-2xl animate-bounceIn flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/25">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                ¡Nuevo Turno Agendado!
              </span>
              <button
                onClick={() => setAlertaFlotante(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {alertaFlotante.cliente_nombre}
            </h4>

            <p className="text-xs text-slate-600 mt-1">
              ✂️ {alertaFlotante.servicio_nombre} • 💈 {alertaFlotante.barbero_nombre}
            </p>

            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              📅 {alertaFlotante.fecha} a las {formatTime12(alertaFlotante.hora_inicio)}
            </p>

            <button
              onClick={() => handleIrACita(alertaFlotante)}
              className="mt-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Ver en Agenda</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
