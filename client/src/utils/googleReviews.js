export const DEFAULT_GOOGLE_REVIEWS_MENSAJE = 
  '¡Hola {cliente}! 👋 Gracias por visitarnos en {barberia}. Nos alegró atenderte con {barbero}. ⭐ ¿Nos regalarías 1 minuto para dejarnos tu reseña de 5 estrellas en Google Maps? Nos ayuda muchísimo a seguir creciendo: {enlace_google} 🙏 ¡Muchas gracias!';

/**
 * Genera la URL de WhatsApp pre-redactada para solicitar una reseña en Google Maps.
 * @param {Object} params
 * @param {Object} params.cita - Objeto con datos de la cita (cliente_nombre, cliente_telefono, barbero_nombre)
 * @param {Object} params.shopConfig - Configuración de la barbería (google_reviews_url, google_reviews_mensaje, nombre_barberia)
 * @returns {string|null} URL lista para abrir en WhatsApp o null si no hay teléfono
 */
export function generarUrlWhatsAppResena({ cita, shopConfig }) {
  if (!cita) return null;

  const rawPhone = String(cita.cliente_telefono || '').replace(/\D/g, '');
  if (!rawPhone) return null;

  // Si tiene 10 dígitos y empieza por 3 (formato móvil colombiano), anteponer código de país 57
  let fullPhone = rawPhone;
  if (fullPhone.length === 10 && fullPhone.startsWith('3')) {
    fullPhone = `57${fullPhone}`;
  }

  const enlaceGoogle = (shopConfig?.google_reviews_url || '').trim();
  const nombreBarberia = (shopConfig?.nombre_barberia || shopConfig?.nombre || 'The Barber Club').trim();
  const nombreCliente = (cita.cliente_nombre || 'Cliente').trim();
  const nombreBarbero = (cita.barbero_nombre || 'nuestro barbero').trim();

  let plantilla = (shopConfig?.google_reviews_mensaje || '').trim();
  if (!plantilla) {
    plantilla = DEFAULT_GOOGLE_REVIEWS_MENSAJE;
  }

  const mensajeFinal = plantilla
    .replace(/\{cliente\}/g, nombreCliente)
    .replace(/\{barbero\}/g, nombreBarbero)
    .replace(/\{barberia\}/g, nombreBarberia)
    .replace(/\{enlace_google\}/g, enlaceGoogle || '[Enlace de Google no configurado aún]');

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(mensajeFinal)}`;
}
