import React, { useState } from 'react';

export default function FloatingWhatsApp({ phone, shopName = 'la barbería' }) {
  const [hovered, setHovered] = useState(false);

  if (!phone) return null;

  // Limpiar y formatear número de teléfono (Colombia 57 por defecto si tiene 10 dígitos)
  const cleanPhone = String(phone).replace(/\D/g, '');
  const finalPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;
  const mensaje = `¡Hola ${shopName}! Quisiera consultar sobre disponibilidad de turnos y servicios de barbería.`;
  const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(mensaje)}`;

  return (
    <aside 
      aria-label="Contacto por WhatsApp"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 select-none pointer-events-auto"
    >
      {/* Tooltip / Píldora animada con mensaje de bienvenida */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="hidden xs:flex items-center gap-2 bg-white/95 backdrop-blur-md text-slate-800 font-bold text-xs py-2 px-3.5 rounded-full shadow-lg border border-emerald-100 hover:border-emerald-300 hover:shadow-xl hover:text-emerald-700 transition-all duration-300 group cursor-pointer"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="font-extrabold text-[12px] tracking-tight">
          ¿Dudas? <span className="text-emerald-600 font-black">Escríbenos</span>
        </span>
      </a>

      {/* Botón Circular Oficial de WhatsApp con Efectos de Movimiento */}
      <div className="relative group">
        {/* Onda expansiva de radar (movimiento continuo) */}
        <span className="absolute -inset-1.5 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none"></span>

        {/* Segundo resplandor pulsante */}
        <span className="absolute -inset-0.5 rounded-full bg-emerald-400 opacity-60 blur-xs animate-pulse pointer-events-none"></span>

        {/* Botón flotante interactivo */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Chatear por WhatsApp con ${shopName}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#25D366] text-white shadow-2xl shadow-emerald-600/40 hover:shadow-emerald-500/60 transform hover:scale-110 active:scale-95 transition-all duration-300 animate-bounce hover:animate-none cursor-pointer"
          style={{ animationDuration: '3s' }}
        >
          {/* Logo Oficial Vectorial de WhatsApp */}
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 sm:w-9 sm:h-9 fill-white drop-shadow-md"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.176 8.176 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.62.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
          </svg>

          {/* Insignia Verde de "En Línea" */}
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white shadow-xs"></span>
          </span>
        </a>
      </div>
    </aside>
  );
}
