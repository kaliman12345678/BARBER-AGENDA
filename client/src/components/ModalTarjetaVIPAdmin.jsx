import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Crown,
  Award,
  Plus,
  CheckCircle2,
  Gift,
  Share2,
  MessageCircle,
  X,
  History,
  Sparkles,
  Scissors,
  QrCode,
  Smartphone
} from 'lucide-react';
import QRCode from 'qrcode';

export default function ModalTarjetaVIPAdmin({
  cliente,
  shopConfig,
  barbero,
  onClose,
  onSuccess
}) {
  const [datosCard, setDatosCard] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const telefonoCliente = cliente?.cliente_telefono || cliente?.telefono || '';
  const nombreCliente = cliente?.cliente_nombre || cliente?.nombre || 'Cliente VIP';
  const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'principal';

  useEffect(() => {
    if (telefonoCliente) {
      cargarDatosTarjeta();
    }
  }, [telefonoCliente]);

  async function cargarDatosTarjeta() {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/tarjeta-vip/cliente/${encodeURIComponent(telefonoCliente)}?nombre=${encodeURIComponent(nombreCliente)}`);
      if (res.ok) {
        const data = await res.json();
        setDatosCard(data.cliente);
        setMovimientos(data.movimientos || []);

        // Generar QR para el cliente
        const qrCodeString = data.cliente?.codigo_qr_vip || `VIP-${slug}-${telefonoCliente}`;
        const urlQr = await QRCode.toDataURL(qrCodeString, {
          width: 200,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' }
        });
        setQrDataUrl(urlQr);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'No se pudo cargar la información de la tarjeta VIP');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  }

  async function handleSellarCorte(cantidad = 1) {
    setProcesando(true);
    setError('');
    setMensajeExito('');
    try {
      const res = await fetch('/api/tarjeta-vip/sellar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_telefono: telefonoCliente,
          cliente_nombre: nombreCliente,
          cantidad,
          barbero_nombre: barbero?.nombre || 'Administrador',
          notas: `Corte registrado por ${barbero?.nombre || 'Admin'}`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMensajeExito(data.message || `¡+${cantidad} corte sellado con éxito!`);
        cargarDatosTarjeta();
        if (onSuccess) onSuccess(data.cliente);
      } else {
        setError(data.error || 'Error al sellar corte');
      }
    } catch (err) {
      setError('Error de conexión al sellar corte');
    } finally {
      setProcesando(false);
    }
  }

  async function handleCanjearPremio() {
    if (!window.confirm('¿Confirmas que deseas canjear el premio VIP del cliente? Se descontarán los 10 cortes de la meta.')) {
      return;
    }

    setProcesando(true);
    setError('');
    setMensajeExito('');
    try {
      const res = await fetch('/api/tarjeta-vip/canjear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_telefono: telefonoCliente,
          barbero_nombre: barbero?.nombre || 'Administrador',
          premio_canjeado: datosCard?.premio_proximo || 'Corte o Barba Gratis',
          notas: `Premio canjeado en caja por ${barbero?.nombre || 'Admin'}`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMensajeExito('🎉 ¡Premio redimido exitosamente!');
        cargarDatosTarjeta();
        if (onSuccess) onSuccess(data.cliente);
      } else {
        setError(data.error || 'Error al canjear premio');
      }
    } catch (err) {
      setError('Error de conexión al canjear premio');
    } finally {
      setProcesando(false);
    }
  }

  function handleCompartirWhatsApp() {
    const origin = window.location.origin;
    const linkPase = `${origin}/?b=${slug}&vip=1&tel=${encodeURIComponent(telefonoCliente)}`;
    const nombreNegocio = shopConfig?.nombre_barberia || 'The Barber Club';
    const sellos = datosCard?.sellos_acumulados ?? 0;
    const meta = datosCard?.sellos_meta ?? 10;
    const faltan = Math.max(0, meta - sellos);

    let texto = `Hola *${nombreCliente}*! 💈 En *${nombreNegocio}* valoramos tu fidelidad.\n\n`;
    texto += `💳 *Tu Tarjeta VIP Digital:* Llevas *${sellos}/${meta} cortes* acumulados.\n`;
    if (sellos >= meta) {
      texto += `🎉 *¡Tienes 1 PREMIO GRATIS listo para reclamar en tu próxima visita!*\n\n`;
    } else {
      texto += `Te faltan solo *${faltan} corte(s)* para ganar tu *${datosCard?.premio_proximo || 'Corte o Barba Gratis'}*.\n\n`;
    }
    texto += `📲 *Consulta tu tarjeta y sellos en tiempo real aquí:*\n${linkPase}\n\n`;
    texto += `💡 _(Guárdala en la pantalla de inicio de tu celular tocando Compartir > Añadir a pantalla de inicio)_`;

    const cleanPhone = telefonoCliente.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(texto)}`;
    window.open(waUrl, '_blank');
  }

  const sellos = datosCard?.sellos_acumulados ?? 0;
  const meta = datosCard?.sellos_meta ?? 10;
  const puedeCanjear = sellos >= meta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slideIn my-auto">
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-600 shadow-xs">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  Tarjeta Digital VIP
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                  {datosCard?.nivel_vip || 'VIP Club'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {nombreCliente} • {telefonoCliente}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cargando ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
            <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2 animate-spin" />
            Cargando balance de sellos y nivel VIP...
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {mensajeExito && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{mensajeExito}</span>
              </div>
            )}

            {/* TARJETA VISUAL DECORATIVA ESTILO WALLET */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-4 text-white shadow-xl border border-amber-500/30">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                    {shopConfig?.nombre_barberia || 'The Barber Club'}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  {datosCard?.nivel_vip || 'Bronce VIP'}
                </span>
              </div>

              {/* CUADRÍCULA DE 10 SELLOS */}
              <div className="my-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-200">
                    Sellos de Cortes: <b className="text-amber-400">{sellos}</b> de {meta}
                  </span>
                  <span className="text-[10px] text-amber-300/80 font-mono">
                    {Math.round((sellos / meta) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: meta }).map((_, index) => {
                    const completado = index < sellos;
                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${
                          completado
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-200 text-slate-950 shadow-md shadow-amber-500/20 scale-102 font-black'
                            : 'bg-white/5 border-white/10 text-slate-500'
                        }`}
                      >
                        {completado ? (
                          <Scissors className="w-4 h-4 text-slate-950" />
                        ) : (
                          <span className="text-[10px] font-bold">{index + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BENEFICIO META */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-200">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-medium">
                    Premio: <b>{datosCard?.premio_proximo || 'Corte Gratis'}</b>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {datosCard?.premios_redimidos || 0} canjeados
                </span>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN PARA EL ADMINISTRADOR / BARBERO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={procesando}
                onClick={() => handleSellarCorte(1)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>+1 Sello (Corte Realizado)</span>
              </button>

              <button
                type="button"
                disabled={procesando || !puedeCanjear}
                onClick={handleCanjearPremio}
                className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  puedeCanjear
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-98 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                title={puedeCanjear ? 'Canjear premio ganado por el cliente' : 'Requiere completar los 10 cortes'}
              >
                <Gift className="w-4 h-4" />
                <span>{puedeCanjear ? '¡Canjear Premio VIP!' : `Faltan ${meta - sellos} sellos`}</span>
              </button>
            </div>

            {/* COMPARTIR PASE CON EL CLIENTE POR WHATSAPP */}
            <button
              type="button"
              onClick={handleCompartirWhatsApp}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-200 fill-emerald-200/20" />
              <span>Enviar Tarjeta VIP al WhatsApp del Cliente</span>
            </button>

            {/* HISTORIAL RECIENTE DE SELLOS */}
            {movimientos.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  Últimos Movimientos
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-[11px]">
                  {movimientos.map((m) => (
                    <div
                      key={m.id}
                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-700"
                    >
                      <span className="flex items-center gap-1">
                        {m.tipo === 'sello' ? (
                          <span className="text-blue-600 font-bold">+{m.cantidad} sello</span>
                        ) : (
                          <span className="text-amber-600 font-bold">🎁 Canje ({m.cantidad})</span>
                        )}
                        <span className="text-slate-400 text-[10px]">por {m.barbero_nombre}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.created_at).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
