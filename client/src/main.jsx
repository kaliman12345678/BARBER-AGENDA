import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Interceptor global para inyectar automáticamente el tenant (x-barberia-slug) en todas las peticiones
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  const currentSlug = window.__BARBERIA_SLUG || sessionStorage.getItem('current_barberia_slug') || 'the-barber-club';
  const newInit = { ...init };
  newInit.credentials = 'same-origin';
  newInit.headers = {
    ...newInit.headers,
    'x-barberia-slug': currentSlug,
  };
  return originalFetch(input, newInit);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
