import React, { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Scissors,
  Gift,
  Share2,
  Calendar,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Award,
  Phone,
  MapPin,
  Check,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';

export default function TarjetaVIPPass({
  slug,
  telefono,
  onIrAgendar
}) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    cargarPass();
  }, [slug, telefono]);

  async function cargarPass() {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/tarjeta-vip/public/${encodeURIComponent(slug)}/${encodeURIComponent(telefono)}`);
      if (res.ok) {
        const json = await res.json();
        setDatos(json);

        // Generar Código QR de autenticación para el cajero/barbero
        const qrString = json.cliente?.codigo_qr_vip || `VIP-${slug}-${telefono}`;
        const qrUrl = await QRCode.toDataURL(qrString, {
          width: 260,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrDataUrl(qrUrl);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || 'No se pudo cargar la tarjeta de fidelización');
      }
    } catch (err) {
      setError('Error al consultar tu tarjeta VIP');
    } finally {
      setCargando(false);
    }
  }

  function handleCompartirEnlace() {
    if (navigator.share) {
      navigator.share({
        title: `Tarjeta VIP - ${datos?.barberia?.nombre || 'Barbería'}`,
        text: `Esta es mi tarjeta de cliente VIP en ${datos?.barberia?.nombre}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 animate-spin">
          <Sparkles className="w-7 h-7 text-amber-400" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Cargando tu Pase VIP...
        </p>
      </div>
    );
  }

  if (error || !datos) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
          <Crown className="w-10 h-10 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-white">Tarjeta No Disponible</h2>
          <p className="text-xs text-slate-400">{error || 'La tarjeta solicitada no existe o fue deshabilitada.'}</p>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('vip');
              url.searchParams.delete('tel');
              window.location.href = url.toString();
            }}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all cursor-pointer"
          >
            Ir a la Agenda Pública
          </button>
        </div>
      </div>
    );
  }

  const { barberia, cliente } = datos;
  const sellos = cliente.sellos_acumulados ?? 0;
  const meta = cliente.sellos_meta ?? 10;
  const faltan = Math.max(0, meta - sellos);
  const esGanador = sellos >= meta;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 pb-20 selection:bg-amber-500 selection:text-black">
      {/* CONTENEDOR CENTRAL PASAPORTE / WALLET */}
      <div className="w-full max-w-sm space-y-4 animate-fadeIn">

        {/* LOGO Y ENCABEZADO DE LA BARBERÍA */}
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-2.5">
            {barberia.logo_url ? (
              <img
                src={barberia.logo_url}
                alt={barberia.nombre}
                className="w-10 h-10 rounded-2xl object-cover border border-amber-500/40 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
                ✂️
              </div>
            )}
            <div>
              <h1 className="text-sm font-black text-white leading-tight flex items-center gap-1.5">
                <span>{barberia.nombre}</span>
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Pase Digital de Cliente VIP
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInstallGuide(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
            title="Añadir a la pantalla de inicio de tu celular"
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] hidden sm:inline">Instalar</span>
          </button>
        </div>

        {/* TARJETA PASS ESTILO APPLE WALLET */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-neutral-900 to-amber-950/90 border border-amber-500/40 p-5 shadow-2xl space-y-5">
          {/* Brillos decorativos */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Encabezado del Pass */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                TITULAR VIP
              </span>
              <h2 className="text-base font-black text-white tracking-wide">
                {cliente.nombre}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 block">
                NIVEL DE STATUS
              </span>
              <span className="inline-block text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 shadow-xs">
                {cliente.nivel_vip || 'VIP Club'}
              </span>
            </div>
          </div>

          {/* ESTADO DE LOS SELLOS & META */}
          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Sellos de Cortes Acumulados</span>
              </span>
              <span className="text-xs font-mono font-black text-amber-400">
                {sellos} / {meta}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 h-full rounded-full transition-all duration-700 shadow-xs"
                style={{ width: `${Math.min(100, Math.round((sellos / meta) * 100))}%` }}
              />
            </div>

            {/* CUADRÍCULA DE LOS 10 SELLOS */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {Array.from({ length: meta }).map((_, index) => {
                const marcado = index < sellos;
                return (
                  <div
                    key={index}
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all ${
                      marcado
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-200 text-slate-950 shadow-md shadow-amber-500/25 scale-102 font-black'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    {marcado ? (
                      <Scissors className="w-4 h-4 text-slate-950 rotate-45" />
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {index + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BANNER DE RECOMPENSA / PREMIO */}
          <div className={`p-3.5 rounded-2xl border transition-all relative z-10 ${
            esGanador 
              ? 'bg-gradient-to-r from-emerald-500/20 to-amber-500/20 border-emerald-400/60 text-emerald-100 animate-pulse'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded-xl shrink-0 ${esGanador ? 'bg-emerald-400 text-slate-950' : 'bg-amber-400/20 text-amber-400'}`}>
                <Gift className="w-4 h-4" />
              </div>
              <div className="text-xs">
                {esGanador ? (
                  <>
                    <span className="font-black text-emerald-300 uppercase tracking-wide block text-[11px]">
                      🎉 ¡PREMIO GANADO DISPONIBLE!
                    </span>
                    <p className="text-slate-200 text-[11px] mt-0.5 font-bold">
                      Reclama tu <b className="text-white underline">{cliente.premio_proximo || 'Corte o Barba Gratis'}</b> en caja en tu próxima visita.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-amber-300 uppercase tracking-wide block text-[10px]">
                      Próxima Recompensa VIP:
                    </span>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Te faltan solo <b className="text-amber-400 font-extrabold">{faltan} corte(s)</b> para ganar tu <b className="text-white">{cliente.premio_proximo || 'Corte Gratis'}</b>.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CÓDIGO QR DINÁMICO DE VALIDACIÓN */}
          <div className="bg-white rounded-2xl p-4 text-center shadow-inner relative z-10 space-y-2">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">
              Muestra este código al barbero al pagar
            </span>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Código QR VIP"
                className="w-44 h-44 mx-auto rounded-xl border border-slate-100 shadow-xs"
              />
            ) : (
              <div className="w-44 h-44 mx-auto bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">
                Generando QR...
              </div>
            )}
            <p className="text-[10px] font-mono text-slate-500 tracking-widest font-bold">
              {cliente.codigo_qr_vip || `VIP-${slug}-${cliente.telefono}`}
            </p>
          </div>
        </div>

        {/* BOTONES PRINCIPALES DE ACCIÓN */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              if (onIrAgendar) {
                onIrAgendar();
              } else {
                const url = new URL(window.location.href);
                url.searchParams.delete('vip');
                url.searchParams.delete('tel');
                window.location.href = url.toString();
              }
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Agendar Mi Próximo Corte</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>

          <button
            type="button"
            onClick={handleCompartirEnlace}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-slate-400" />}
            <span>{copiado ? '¡Enlace copiado al portapapeles!' : 'Guardar o Compartir Tarjeta'}</span>
          </button>
        </div>

        {/* PIE DE CONTACTO DE LA BARBERÍA */}
        <div className="pt-4 border-t border-slate-900 text-center text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-400">{barberia.nombre}</p>
          {barberia.direccion && (
            <p className="flex items-center justify-center gap-1 text-[11px]">
              <MapPin className="w-3 h-3 text-slate-600" />
              <span>{barberia.direccion}</span>
            </p>
          )}
          {barberia.telefono && (
            <p className="flex items-center justify-center gap-1 text-[11px]">
              <Phone className="w-3 h-3 text-slate-600" />
              <span>{barberia.telefono}</span>
            </p>
          )}
        </div>
      </div>

      {/* MODAL / GUÍA: CÓMO AÑADIR A PANTALLA DE INICIO */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-5 border border-slate-800 text-white shadow-2xl animate-slideIn space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold">Guardar en Pantalla de Inicio</h3>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
                <span className="font-extrabold text-amber-300 block text-[11px]">
                  🍏 Si usas iPhone (Safari):
                </span>
                <p className="text-[11px] leading-relaxed">
                  1. Toca el botón <b>Compartir</b> (el icono con una flecha hacia arriba en la barra inferior).<br />
                  2. Desliza hacia abajo y selecciona <b>"Añadir a pantalla de inicio"</b>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
                <span className="font-extrabold text-blue-300 block text-[11px]">
                  🤖 Si usas Android (Chrome):
                </span>
                <p className="text-[11px] leading-relaxed">
                  1. Toca los <b>tres puntos (⋮)</b> en la esquina superior derecha.<br />
                  2. Selecciona <b>"Añadir a pantalla principal"</b> o <b>"Instalar aplicación"</b>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition-all cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
