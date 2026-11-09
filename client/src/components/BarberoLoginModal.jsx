import React, { useState, useEffect } from 'react';
import { User, Lock, Scissors, AlertCircle, X, Check, ArrowRight } from 'lucide-react';

export default function BarberoLoginModal({ onAutenticado, onCancel }) {
  const [barberos, setBarberos] = useState([]);
  const [barberoSeleccionadoId, setBarberoSeleccionadoId] = useState('');
  const [pin, setPin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoBarberos, setCargandoBarberos] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarBarberos() {
      try {
        const res = await fetch('/api/barberos');
        if (res.ok) {
          const data = await res.json();
          setBarberos(data);
          if (data.length > 0) {
            setBarberoSeleccionadoId(String(data[0].id));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCargandoBarberos(false);
      }
    }
    cargarBarberos();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!barberoSeleccionadoId) {
      setError('Por favor selecciona tu nombre de barbero');
      return;
    }
    if (!pin || pin.length < 4) {
      setError('Por favor ingresa tu PIN de 4 dígitos');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const res = await fetch('/api/barberos/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbero_id: Number(barberoSeleccionadoId),
          pin: pin.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'PIN incorrecto');
        return;
      }

      onAutenticado(data.barbero);
    } catch (err) {
      setError('Error al comunicar con el servidor');
    } finally {
      setCargando(false);
    }
  }

  function handleDigitClick(digit) {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  }

  function handleBackspace() {
    setPin(prev => prev.slice(0, -1));
  }

  const barberoActual = barberos.find(b => String(b.id) === String(barberoSeleccionadoId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
        
        {/* Botón cerrar */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
            <Scissors className="w-7 h-7 transform -rotate-45" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 font-sans">
            Portal del Barbero
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa con tu usuario y PIN para consultar tus citas, ganancias y rentabilidad.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Selector de Barbero */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ¿Quién eres?
            </label>
            {cargandoBarberos ? (
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
            ) : (
              <select
                value={barberoSeleccionadoId}
                onChange={(e) => setBarberoSeleccionadoId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              >
                {barberos.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.porcentaje_comision || 50}% comisión)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Campo de PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Tu PIN de Seguridad</span>
              <span className="text-[10px] text-slate-400 font-normal">Por defecto: 1234</span>
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="••••"
                className="w-full tracking-[0.5em] text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                autoFocus
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Teclado numérico rápido táctil */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigitClick(String(num))}
                className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-blue-50 text-slate-700 font-bold text-sm border border-slate-200/60 transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200/60 transition-colors"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200/60 transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200/60 transition-colors"
            >
              ←
            </button>
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {cargando ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Ingresar al Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 mt-4">
          🔐 Tus datos y comisiones están protegidos y son privados.
        </p>
      </div>
    </div>
  );
}
