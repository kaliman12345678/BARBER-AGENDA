import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  Send, 
  X, 
  Check, 
  CreditCard, 
  Wallet, 
  DollarSign, 
  QrCode, 
  Scissors, 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { formatCOP, formatTime12 } from '../utils/helpers';

const METODOS_PAGO = [
  { id: 'Efectivo', nombre: 'Efectivo', icon: DollarSign },
  { id: 'Nequi / Daviplata', nombre: 'Nequi / Daviplata', icon: Wallet },
  { id: 'Tarjeta Débito/Crédito', nombre: 'Tarjeta', icon: CreditCard },
  { id: 'Transferencia Bancaria', nombre: 'Transferencia', icon: Wallet }
];

export default function ModalTirillaPOS({ 
  cita, 
  shopConfig, 
  onClose,
  onActualizarCita = null
}) {
  const [metodoPago, setMetodoPago] = useState(cita?.metodo_pago || 'Efectivo');
  const [propina, setPropina] = useState(Number(cita?.propina || 0));
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const ticketRef = useRef(null);

  const slug = shopConfig?.slug || window.__BARBERIA_SLUG || 'the-barber-club';
  const urlPublica = `${window.location.origin}/?b=${slug}`;
  const nombreBarberia = shopConfig?.nombre_barberia || 'The Barber Club';
  const direccion = shopConfig?.direccion_barberia || shopConfig?.direccion || 'Sede Principal';
  const telefonoBarberia = shopConfig?.telefono_barberia || shopConfig?.telefono || '';

  const precioBase = Number(cita?.precio_cobrado || 0);
  const total = precioBase + Number(propina || 0);
  const numeroRecibo = `REC-${String(cita?.id || Date.now()).slice(-6)}`;

  // Generar Código QR de autenticidad en tiempo real
  useEffect(() => {
    QRCode.toDataURL(urlPublica, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generando QR:', err));
  }, [urlPublica]);

  async function handleCambiarMetodo(nuevoMetodo) {
    setMetodoPago(nuevoMetodo);
    await sincronizarCobro(nuevoMetodo, propina);
  }

  async function handleCambiarPropina(nuevaPropina) {
    const val = Math.max(0, Number(nuevaPropina) || 0);
    setPropina(val);
    await sincronizarCobro(metodoPago, val);
  }

  async function sincronizarCobro(metodo, propinaVal) {
    if (!cita?.id) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/citas/${cita.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'completada',
          precio_cobrado: precioBase,
          metodo_pago: metodo,
          propina: propinaVal
        })
      });
      if (res.ok) {
        setMensajeGuardado('Cobro actualizado');
        setTimeout(() => setMensajeGuardado(''), 2000);
        if (onActualizarCita) onActualizarCita();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  }

  function handleEnviarWhatsApp() {
    const rawPhone = String(cita?.cliente_telefono || '').replace(/\D/g, '');
    let fullPhone = rawPhone;
    if (fullPhone.length === 10 && fullPhone.startsWith('3')) {
      fullPhone = `57${fullPhone}`;
    }

    const mensaje = 
`💈 *RECIBO DE PAGO — ${nombreBarberia.toUpperCase()}* 💈
━━━━━━━━━━━━━━━━━━━━━━━━
📄 *Comprobante:* #${numeroRecibo}
📅 *Fecha:* ${cita?.fecha} (${formatTime12(cita?.hora_inicio)})
👤 *Cliente:* ${cita?.cliente_nombre || 'Cliente'}
✂️ *Atendido por:* ${cita?.barbero_nombre || 'Barbero'}
━━━━━━━━━━━━━━━━━━━━━━━━
🧾 *DESGLOSE DEL SERVICIO:*
• ${cita?.servicio_nombre || 'Servicio de Barbería'}: ${formatCOP(precioBase)}
${propina > 0 ? `• Propina voluntaria (100% Barbero): ${formatCOP(propina)}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL PAGADO:* ${formatCOP(total)} COP
💳 *Método de Pago:* ${metodoPago}

✨ *¡Muchas gracias por tu visita y preferencia!*
Puedes volver a agendar en línea o recomendar nuestra barbería aquí:
👉 ${urlPublica}`;

    const waUrl = fullPhone 
      ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

    window.open(waUrl, '_blank');
  }

  function handleImprimir() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      
      {/* ESTILOS CSS EXCLUSIVOS PARA IMPRESIÓN TÉRMICA DE RECIBOS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-pos-termico, #ticket-pos-termico * {
            visibility: visible;
          }
          #ticket-pos-termico {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full flex flex-col max-h-[94vh] shadow-2xl overflow-hidden animate-slideIn">
        
        {/* HEADER DEL MODAL (NO PRINT) */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Tirilla Digital / Recibo POS con QR</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full font-bold">
                  Auténtico
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Ticket térmico profesional listo para enviar a WhatsApp o imprimir
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CUERPO CON SCROLL (PANELES: TICKET A LA IZQUIERDA / CONTROLES A LA DERECHA) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* ======================================================== */}
            {/* TICKET TÉRMICO POS (SECCIÓN IMPRIMIBLE) */}
            {/* ======================================================== */}
            <div className="md:col-span-7 flex justify-center">
              <div 
                id="ticket-pos-termico"
                ref={ticketRef}
                className="w-full max-w-[340px] bg-white text-slate-900 p-5 rounded-2xl shadow-xl font-mono text-xs border border-slate-300 space-y-3 relative overflow-hidden"
              >
                {/* EFECTO BORDE DENTADO SUPERIOR E INFERIOR */}
                <div className="text-center space-y-1">
                  {shopConfig?.logo_url ? (
                    <img 
                      src={shopConfig.logo_url} 
                      alt="Logo" 
                      className="w-12 h-12 mx-auto rounded-xl object-cover border border-slate-200 mb-1" 
                    />
                  ) : (
                    <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 mb-1 border border-slate-200">
                      <Scissors className="w-5 h-5 text-slate-800" />
                    </div>
                  )}
                  <h4 className="font-black text-sm tracking-tight text-slate-950 uppercase leading-snug">
                    {nombreBarberia}
                  </h4>
                  {direccion && (
                    <p className="text-[10px] text-slate-600 leading-tight">
                      {direccion}
                    </p>
                  )}
                  {telefonoBarberia && (
                    <p className="text-[10px] text-slate-600 font-bold">
                      Tel: {telefonoBarberia}
                    </p>
                  )}
                </div>

                {/* LÍNEA SEPARADORA */}
                <div className="border-b border-dashed border-slate-400 my-1"></div>

                {/* METADATOS DEL TICKET */}
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">COMPROBANTE:</span>
                    <span className="font-black">#{numeroRecibo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">FECHA:</span>
                    <span className="font-bold">{cita?.fecha}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">HORA:</span>
                    <span className="font-bold">{formatTime12(cita?.hora_inicio)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CLIENTE:</span>
                    <span className="font-black truncate max-w-[170px]">{cita?.cliente_nombre || 'Cliente'}</span>
                  </div>
                  {cita?.cliente_telefono && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">TELÉFONO:</span>
                      <span>{cita.cliente_telefono}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">BARBERO:</span>
                    <span className="font-bold truncate max-w-[170px]">{cita?.barbero_nombre || 'Asignado'}</span>
                  </div>
                </div>

                {/* LÍNEA SEPARADORA */}
                <div className="border-b border-dashed border-slate-400 my-1"></div>

                {/* DESGLOSE DE PRODUCTOS Y SERVICIOS */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-start font-bold">
                    <span className="truncate pr-2">{cita?.servicio_nombre || 'Corte de Cabello'}</span>
                    <span className="shrink-0">{formatCOP(precioBase)}</span>
                  </div>

                  {propina > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Propina (100% Barbero):</span>
                      <span>{formatCOP(propina)}</span>
                    </div>
                  )}
                </div>

                {/* LÍNEA DOBLE */}
                <div className="border-b-2 border-slate-900 my-1.5"></div>

                {/* TOTAL Y MÉTODO */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm font-black text-slate-950">
                    <span>TOTAL PAGADO:</span>
                    <span className="text-base">{formatCOP(total)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
                    <span>Forma de Pago:</span>
                    <span className="font-bold text-slate-900 uppercase">{metodoPago}</span>
                  </div>
                </div>

                {/* LÍNEA SEPARADORA */}
                <div className="border-b border-dashed border-slate-400 my-1.5"></div>

                {/* CÓDIGO QR DE AUTENTICIDAD */}
                <div className="text-center pt-1 space-y-1">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Código QR de Autenticidad" 
                      className="w-24 h-24 mx-auto rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="w-24 h-24 mx-auto bg-slate-100 rounded-lg animate-pulse" />
                  )}
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    Escanea para verificar o agendar
                  </p>
                  <p className="text-[8px] text-slate-400 truncate">
                    {urlPublica}
                  </p>
                </div>

                {/* MENSAJE DE CIERRE */}
                <div className="text-center pt-1 border-t border-slate-200 text-[9px] text-slate-500 italic">
                  <p>¡Gracias por tu visita y preferencia!</p>
                  <p className="font-bold">EXAKTA Cloud POS • {new Date().getFullYear()}</p>
                </div>

              </div>
            </div>

            {/* ======================================================== */}
            {/* CONTROLES Y OPCIONES RÁPIDAS (NO PRINT) */}
            {/* ======================================================== */}
            <div className="md:col-span-5 space-y-4 no-print text-xs">
              
              {/* SELECTOR DE MÉTODO DE PAGO */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                <label className="block text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                  Método de Pago Utilizado:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {METODOS_PAGO.map(m => {
                    const Icon = m.icon;
                    const isSelected = metodoPago === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleCambiarMetodo(m.id)}
                        className={`p-2 rounded-xl border text-left font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate text-[11px]">{m.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PROPINA LIBRE / OPCIONAL */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                    Propina para el Barbero:
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    100% del Colaborador
                  </span>
                </div>

                {/* Input de monto libre */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-black text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={propina === 0 ? '' : propina}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setPropina(val);
                    }}
                    onBlur={() => sincronizarCobro(metodoPago, propina)}
                    placeholder="0 (Monto libre de propina)"
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-500"
                  />
                </div>

                {/* Botones de sugerencia rápida */}
                <div className="flex items-center gap-1.5">
                  {[0, 2000, 5000, 10000, 20000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleCambiarPropina(val)}
                      className={`flex-1 py-1 px-1 rounded-lg border text-center font-bold text-[10px] transition-all cursor-pointer ${
                        propina === val
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-xs'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {val === 0 ? '$0' : `+$${val >= 1000 ? `${val / 1000}k` : val}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTONES PRINCIPALES DE ACCIÓN */}
              <div className="space-y-2 pt-1">
                
                <button
                  type="button"
                  onClick={handleEnviarWhatsApp}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer text-xs"
                >
                  <Send className="w-4 h-4 text-emerald-200" />
                  <span>Enviar Recibo a su WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleImprimir}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Imprimir Tirilla (Térmica / PDF)</span>
                </button>

                {mensajeGuardado && (
                  <p className="text-[11px] text-emerald-400 text-center font-bold flex items-center justify-center gap-1 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{mensajeGuardado}</span>
                  </p>
                )}

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
