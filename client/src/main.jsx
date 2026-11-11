import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Función para resolver el tenant activo de forma inmediata
function resolveActiveSlug() {
  if (typeof window === 'undefined') return 'the-barber-club';
  try {
    const params = new URLSearchParams(window.location.search);
    const urlSlug = params.get('b') || params.get('barberia');
    if (urlSlug) {
      window.__BARBERIA_SLUG = urlSlug;
      sessionStorage.setItem('current_barberia_slug', urlSlug);
      return urlSlug;
    }

    const match = window.location.pathname.match(/^\/b\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      window.__BARBERIA_SLUG = match[1];
      sessionStorage.setItem('current_barberia_slug', match[1]);
      return match[1];
    }

    if (window.__BARBERIA_SLUG) return window.__BARBERIA_SLUG;

    const saved = sessionStorage.getItem('current_barberia_slug');
    if (saved) {
      window.__BARBERIA_SLUG = saved;
      return saved;
    }
  } catch (_) {}

  return 'the-barber-club';
}

// Inicializar de inmediato al cargar el bundle
window.__BARBERIA_SLUG = resolveActiveSlug();

// Interceptor global robusto para inyectar x-barberia-slug y ?b= en todas las peticiones a la API
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  const currentSlug = resolveActiveSlug();
  const newInit = { ...init };
  newInit.credentials = 'same-origin';

  // Inyectar cabecera x-barberia-slug
  let headersObj = {};
  if (newInit.headers instanceof Headers) {
    newInit.headers.forEach((val, key) => { headersObj[key] = val; });
  } else if (typeof newInit.headers === 'object' && newInit.headers !== null) {
    headersObj = { ...newInit.headers };
  }
  headersObj['x-barberia-slug'] = currentSlug;

  // Inyectar cabeceras de autenticación automáticamente según la sesión activa
  try {
    const superToken = sessionStorage.getItem('barberia_superadmin_token');
    const adminToken = sessionStorage.getItem('barberia_admin_token');
    const barberoToken = sessionStorage.getItem('barberia_barbero_token');
    const barberoSession = sessionStorage.getItem('barberia_barbero_session');

    if (superToken) {
      headersObj['x-superadmin-token'] = superToken;
      if (!headersObj['authorization'] && !headersObj['Authorization']) {
        headersObj['authorization'] = `Bearer ${superToken}`;
      }
    } else if (adminToken) {
      headersObj['x-admin-token'] = adminToken;
      if (!headersObj['authorization'] && !headersObj['Authorization']) {
        headersObj['authorization'] = `Bearer ${adminToken}`;
      }
    } else if (barberoToken || barberoSession) {
      let bTok = barberoToken;
      if (!bTok && barberoSession) {
        try {
          const b = JSON.parse(barberoSession);
          bTok = b?.token || 'auth-barbero-session-token';
        } catch (_) {
          bTok = 'auth-barbero-session-token';
        }
      }
      if (bTok) {
        headersObj['x-barbero-token'] = bTok;
        if (!headersObj['authorization'] && !headersObj['Authorization']) {
          headersObj['authorization'] = `Bearer ${bTok}`;
        }
      }
    }
  } catch (_) {}

  newInit.headers = headersObj;

  // Si la petición es a /api/ (excepto superadmin o login), inyectar ?b= en la URL como salvaguarda
  let finalInput = input;
  if (typeof input === 'string' && input.startsWith('/api') && !input.includes('/api/superadmin')) {
    if (!input.includes('b=') && !input.includes('slug=') && !input.includes('barberia_id=')) {
      const sep = input.includes('?') ? '&' : '?';
      finalInput = `${input}${sep}b=${encodeURIComponent(currentSlug)}`;
    }
  }

  return originalFetch(finalInput, newInit);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
